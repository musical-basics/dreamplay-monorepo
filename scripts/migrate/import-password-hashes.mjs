/**
 * import-password-hashes.mjs — OPTIONAL, run BEFORE cutover if password
 * continuity is wanted.
 *
 * The GoTrue admin API cannot export password hashes, so 01-auth-users.mjs
 * created users WITHOUT passwords. This script copies bcrypt hashes directly
 * between the two projects' Postgres databases (auth.users.encrypted_password),
 * remapping ids via output/user-id-map.json.
 *
 * Requirements:
 *   - `psql` on PATH (present via Homebrew).
 *   - OLD_DB_URL — old website project's Postgres connection string
 *   - NEW_DB_URL — new project's Postgres connection string
 *     (both from Supabase dashboard → Project Settings → Database →
 *      Connection string; use the "direct" URI with the database password)
 *   - output/user-id-map.json (written by 01-auth-users.mjs --execute)
 *
 * Safety:
 *   - Old DB is only read (SELECT).
 *   - New DB updates ONLY rows whose encrypted_password is still empty/null,
 *     so a user who already did a forgot-password reset is never clobbered.
 *   - Hashes are never printed and never written to disk.
 *
 * Usage:
 *   OLD_DB_URL='postgresql://...' NEW_DB_URL='postgresql://...' \
 *     node import-password-hashes.mjs [--execute]     (default: dry-run)
 */

import { spawnSync } from "node:child_process";
import { getMode, logMode, readOutputJson, logMigrationStep } from "./lib.mjs";

const mode = getMode();
logMode(mode);

const OLD_DB_URL = process.env.OLD_DB_URL;
const NEW_DB_URL = process.env.NEW_DB_URL;
if (!OLD_DB_URL || !NEW_DB_URL) {
  console.error(
    "OLD_DB_URL and NEW_DB_URL env vars are required.\n" +
    "Get them from Supabase dashboard → Project Settings → Database → Connection string.",
  );
  process.exit(1);
}

const mapFile = readOutputJson("user-id-map.json");
if (!mapFile?.map) {
  console.error("output/user-id-map.json missing — run 01-auth-users.mjs --execute first.");
  process.exit(1);
}
const idMap = mapFile.map;

const SEP = "\x1f";

function psql(dbUrl, sql, { input } = {}) {
  const res = spawnSync(
    "psql",
    [dbUrl, "-v", "ON_ERROR_STOP=1", "-X", "-q", "-A", "-t", "-F", SEP, ...(input ? ["-f", "-"] : ["-c", sql])],
    { encoding: "utf8", input: input ?? undefined, maxBuffer: 64 * 1024 * 1024 },
  );
  if (res.status !== 0) {
    // stderr may echo SQL; strip anything that looks like a hash before logging
    const err = (res.stderr || "").replace(/\$2[aby]\$\S+/g, "<redacted-hash>");
    throw new Error(`psql failed (exit ${res.status}): ${err.slice(0, 500)}`);
  }
  return res.stdout;
}

console.log("Reading password hashes from OLD project (read-only)...");
const out = psql(
  OLD_DB_URL,
  "select id, coalesce(email,''), encrypted_password from auth.users " +
  "where encrypted_password is not null and encrypted_password <> ''",
);
const oldRows = out
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const [id, email, hash] = line.split(SEP);
    return { id, email, hash };
  });
console.log(`Old users with a password hash: ${oldRows.length}`);

const mapped = oldRows.filter((r) => idMap[r.id]);
const unmapped = oldRows.filter((r) => !idMap[r.id]);
console.log(`  mapped to a new-project user: ${mapped.length}`);
console.log(`  not in user-id-map (skipped): ${unmapped.length}`);
for (const u of unmapped) console.log(`    skipped: ${u.email || u.id}`);

if (mode !== "execute") {
  console.log(`\nDry-run: would import ${mapped.length} hashes (only where the new user has not set a password). Re-run with --execute.`);
  process.exit(0);
}

const esc = (s) => s.replace(/'/g, "''");
const statements = mapped
  .map(
    (r) =>
      `update auth.users set encrypted_password = '${esc(r.hash)}' ` +
      `where id = '${esc(idMap[r.id])}' ` +
      `and (encrypted_password is null or encrypted_password = '');`,
  )
  .join("\n");

console.log(`Applying ${mapped.length} hash imports to NEW project...`);
psql(NEW_DB_URL, null, { input: `begin;\n${statements}\ncommit;\n` });

const check = psql(
  NEW_DB_URL,
  "select count(*) from auth.users where encrypted_password is not null and encrypted_password <> ''",
).trim();
console.log(`Done. New-project users with a password hash: ${check}`);
logMigrationStep("import-password-hashes", { imported_for: mapped.length, skipped_unmapped: unmapped.length });
