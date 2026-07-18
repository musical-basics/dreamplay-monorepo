/**
 * 03 — reservation_decisions (old website) -> reservation_decisions (new).
 *
 * Same shape old->new; legacy row ids (uuid) are preserved so the upsert is
 * idempotent on_conflict=id.
 *
 * user_id remapping: target user_id is uuid NOT NULL (no FK to auth.users).
 * We remap through output/user-id-map.json built by 01-auth-users.mjs
 * (old auth id -> new auth id). If a decision's user is not in the map
 * (e.g. the old auth user was deleted), we create a new auth user from the
 * decision's email on the fly (target column is NOT NULL, so a null is not an
 * option) and record it.
 *
 * Requires 01-auth-users.mjs --execute to have run first.
 *
 * Usage: node 03-reservation-decisions.mjs [--execute]   (default: dry-run)
 */

import {
  getProject, getMode, logMode, countRows, readAllRows, upsertRows,
  listAuthUsers, createAuthUser, normalizeEmail, readOutputJson,
  writeOutputJson, logMigrationStep,
} from "./lib.mjs";

const mode = getMode();
logMode(mode);

const oldProject = getProject("website");
const newProject = getProject("new");

const sourceCount = await countRows(oldProject, "reservation_decisions");
console.log(`Source reservation_decisions count: ${sourceCount}`);

const rows = await readAllRows(oldProject, "reservation_decisions", { order: "id" });

const mapFile = readOutputJson("user-id-map.json");
const idMap = mapFile?.map ?? {};
console.log(`user-id-map entries available: ${Object.keys(idMap).length}`);

const mapped = rows.filter((r) => idMap[r.user_id]);
const unmapped = rows.filter((r) => !idMap[r.user_id]);
console.log(`Decisions with mapped user: ${mapped.length}`);
console.log(`Decisions with UNMAPPED user (auth user will be created from decision email): ${unmapped.length}`);
for (const r of unmapped) console.log(`  unmapped: decision ${r.id} email=${r.email} old_user=${r.user_id}`);

if (mode !== "execute") {
  if (!mapFile) {
    console.log("\nNOTE: output/user-id-map.json not found — run 01-auth-users.mjs --execute first.");
  }
  console.log("\nDry-run only. Re-run with --execute to write.");
  process.exit(0);
}

if (!mapFile) {
  console.error("output/user-id-map.json missing. Run 01-auth-users.mjs --execute first.");
  process.exit(1);
}

// Resolve unmapped users: reuse an existing new-project user with the same
// email, else create one.
const createdForDecisions = [];
if (unmapped.length) {
  const newUsers = await listAuthUsers(newProject);
  const newByEmail = new Map(newUsers.filter((u) => u.email).map((u) => [u.email.toLowerCase(), u]));
  for (const r of unmapped) {
    const email = normalizeEmail(r.email);
    if (!email) {
      console.error(`Decision ${r.id} has invalid email "${r.email}" and no mapped user — SKIPPING row.`);
      continue;
    }
    let user = newByEmail.get(email);
    if (!user) {
      user = await createAuthUser(newProject, { email, user_metadata: { migrated_from: "reservation_decisions" } });
      newByEmail.set(email, user);
      createdForDecisions.push({ email, new_id: user.id, decision_id: r.id });
    }
    idMap[r.user_id] = user.id;
  }
  if (createdForDecisions.length) {
    // keep the persisted map in sync
    writeOutputJson("user-id-map.json", { ...mapFile, updated_at: new Date().toISOString(), map: idMap });
  }
}

const targets = rows
  .filter((r) => idMap[r.user_id])
  .map((r) => ({
    id: r.id,
    user_id: idMap[r.user_id],
    email: normalizeEmail(r.email) ?? r.email,
    decision: r.decision,
    selected_at: r.selected_at,
    order_metadata: r.order_metadata ?? {},
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));

await upsertRows(newProject, "reservation_decisions", targets, { onConflict: "id" });
const newCount = await countRows(newProject, "reservation_decisions");
console.log(`Done. reservation_decisions count in new project: ${newCount}`);

writeOutputJson("reservation-decisions-summary.json", {
  generated_at: new Date().toISOString(),
  source_count: sourceCount,
  upserted: targets.length,
  users_created_for_decisions: createdForDecisions,
  new_count: newCount,
});
logMigrationStep("03-reservation-decisions", {
  old_count: sourceCount, upserted: targets.length, new_count: newCount,
  users_created_for_decisions: createdForDecisions.length,
});
