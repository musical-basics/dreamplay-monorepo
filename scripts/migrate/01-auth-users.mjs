/**
 * 01 — Auth users: legacy website project auth.users -> NEW project (GoTrue admin API).
 *
 * - Creates each old user in the new project with the same email,
 *   email_confirm: true, and user_metadata preserved.
 * - NO password migration is possible via the admin API (hashes are not
 *   exported). Users are created WITHOUT a password; see README for the two
 *   recovery paths (forgot-password reset, or import-password-hashes.mjs
 *   before cutover).
 * - Idempotent: users already present in the new project (by email) are
 *   skipped and still included in the id map.
 * - Persists old_id -> new_id map to output/user-id-map.json (gitignored).
 *
 * Usage: node 01-auth-users.mjs [--execute]   (default: dry-run)
 */

import {
  getProject, getMode, logMode, listAuthUsers, createAuthUser,
  normalizeEmail, writeOutputJson, logMigrationStep,
} from "./lib.mjs";

const mode = getMode();
logMode(mode);

const oldProject = getProject("website");
const newProject = getProject("new");

const oldUsers = await listAuthUsers(oldProject);
console.log(`Old project auth users: ${oldUsers.length}`);

const newUsers = await listAuthUsers(newProject);
console.log(`New project auth users (pre-existing): ${newUsers.length}`);
const newByEmail = new Map(
  newUsers.filter((u) => u.email).map((u) => [u.email.toLowerCase(), u]),
);

const plan = { create: [], skipExisting: [], noEmail: [] };
for (const u of oldUsers) {
  const email = normalizeEmail(u.email);
  if (!email) {
    plan.noEmail.push({ old_id: u.id, email: u.email ?? null });
    continue;
  }
  if (newByEmail.has(email)) plan.skipExisting.push({ old_id: u.id, email });
  else plan.create.push(u);
}

console.log(`Would create: ${plan.create.length}`);
console.log(`Already exist in new project (skip): ${plan.skipExisting.length}`);
console.log(`No/invalid email (skip): ${plan.noEmail.length}`);
if (plan.noEmail.length) console.log("  skipped ids:", plan.noEmail.map((x) => x.old_id).join(", "));

if (mode !== "execute") {
  console.log("\nDry-run only. Re-run with --execute to create users and write the id map.");
  process.exit(0);
}

const idMap = {}; // old auth user id -> new auth user id
const statuses = [];

for (const { old_id, email } of plan.skipExisting) {
  idMap[old_id] = newByEmail.get(email).id;
  statuses.push({ old_id, email, status: "already-existed", new_id: idMap[old_id] });
}
for (const { old_id, email } of plan.noEmail) {
  statuses.push({ old_id, email, status: "skipped-no-email" });
}

let created = 0, failed = 0;
for (const u of plan.create) {
  const email = normalizeEmail(u.email);
  try {
    const createdUser = await createAuthUser(newProject, {
      email,
      user_metadata: u.user_metadata ?? {},
    });
    idMap[u.id] = createdUser.id;
    statuses.push({ old_id: u.id, email, status: "created", new_id: createdUser.id });
    created++;
  } catch (err) {
    // 422 "already registered" race: resolve by re-listing
    if (err.status === 422 || err.status === 409) {
      const refreshed = (await listAuthUsers(newProject)).find(
        (x) => x.email && x.email.toLowerCase() === email,
      );
      if (refreshed) {
        idMap[u.id] = refreshed.id;
        statuses.push({ old_id: u.id, email, status: "already-existed", new_id: refreshed.id });
        continue;
      }
    }
    failed++;
    statuses.push({ old_id: u.id, email, status: "failed", error: String(err.message).slice(0, 300) });
    console.error(`FAILED to create ${email}: ${String(err.message).slice(0, 200)}`);
  }
  await new Promise((r) => setTimeout(r, 60)); // gentle on GoTrue rate limits
}

const mapPath = writeOutputJson("user-id-map.json", {
  generated_at: new Date().toISOString(),
  note: "old website-project auth.users.id -> new project auth.users.id",
  map: idMap,
});
writeOutputJson("user-migration-status.json", { generated_at: new Date().toISOString(), statuses });

logMigrationStep("01-auth-users", {
  old_count: oldUsers.length,
  created,
  already_existed: statuses.filter((s) => s.status === "already-existed").length,
  skipped_no_email: plan.noEmail.length,
  failed,
});

console.log(`\nDone. created=${created} already-existed=${statuses.filter((s) => s.status === "already-existed").length} failed=${failed}`);
console.log(`ID map written to ${mapPath}`);
if (failed > 0) process.exit(1);
