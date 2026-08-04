/**
 * 05 — subscribers (old email project) -> subscribers (new), then seed
 *      suppressions from unsubscribed/bounced legacy subscribers.
 *      THIS IS THE COMPLIANCE GATE: every legacy unsubscribed/bounced email
 *      must exist in new suppressions before any real campaign is sent.
 *
 * Legacy ids are uuids and are preserved (sent_history references them).
 * Column adaptation:
 *   kept: id, email, first_name, last_name, status, tags, smart_tags, country,
 *         country_code, phone_code, phone_number, shipping_*, workspace, created_at
 *   dropped (no target column): location_city, location_country, ip_address,
 *         gdpr_consent, consent_timestamp  (still queryable in the old project;
 *         drop is recorded in the summary)
 *   new-only (left null/default): shopify_customer_id, klaviyo_profile_id, updated_at
 *
 * Duplicate emails (target email is citext UNIQUE; legacy allowed the same
 * email once per workspace — ~6k emails exist in both `musicalbasics` and
 * `dreamplay_marketing`) are merged into ONE row:
 *   - status: most-restrictive wins (complained > bounced > unsubscribed >
 *     deleted > inactive > active) so no opt-out is ever lost
 *   - workspace: deterministic priority dreamplay_marketing >
 *     dreamplay_support > concert_marketing > musicalbasics (this monorepo is
 *     the DreamPlay system); the losing row's workspace is recorded in the
 *     summary aggregate and remains queryable in the old project
 *   - tags: union;  earliest created_at;  first non-empty value per field
 *   - id: the kept row keeps the id of the highest-priority-workspace row;
 *     06-email-content remaps sent_history.subscriber_id by email, so the
 *     dropped ids do not lose ledger rows
 *
 * Suppressions seeding (from the FULL legacy row set, before dedupe):
 *   status unsubscribed -> reason 'unsubscribe';  bounced -> 'bounce'
 *   (bounce wins if both appear for one email);  source 'legacy-migration'.
 *
 * Usage: node 05-subscribers.mjs [--execute]   (default: dry-run)
 */

import {
  getProject, getMode, logMode, countRows, readAllRows, upsertRows,
  normalizeEmail, writeOutputJson, logMigrationStep,
} from "./lib.mjs";

const mode = getMode();
logMode(mode);

const oldProject = getProject("email");
const newProject = getProject("new");

const sourceCount = await countRows(oldProject, "subscribers");
console.log(`Source subscribers count: ${sourceCount}`);
const rows = await readAllRows(oldProject, "subscribers", { order: "id" });
console.log(`Fetched ${rows.length} legacy subscriber rows`);

const SEVERITY = { complained: 6, bounced: 5, unsubscribed: 4, deleted: 3, inactive: 2, active: 1 };
const VALID_STATUSES = new Set(Object.keys(SEVERITY));
// higher number wins when merging cross-workspace duplicate rows
const WS_PRIORITY = { dreamplay_marketing: 4, dreamplay_support: 3, concert_marketing: 2, musicalbasics: 1 };
const wsPrio = (ws) => WS_PRIORITY[ws] ?? 0;

const byEmail = new Map();
const skippedInvalid = [];
const mergedDupes = [];
const mergedWorkspacePairs = {};
const unknownStatuses = new Map();

for (const r of rows) {
  const email = normalizeEmail(r.email);
  if (!email) { skippedInvalid.push(r.email); continue; }
  let status = r.status;
  if (!VALID_STATUSES.has(status)) {
    unknownStatuses.set(status, (unknownStatuses.get(status) || 0) + 1);
    status = "inactive"; // conservative: never promote unknown to active
  }
  const candidate = {
    id: r.id,
    email,
    first_name: r.first_name ?? "",
    last_name: r.last_name ?? "",
    status,
    tags: Array.isArray(r.tags) ? r.tags : [],
    smart_tags: r.smart_tags ?? {},
    country: r.country ?? null,
    country_code: r.country_code ?? null,
    phone_code: r.phone_code ?? null,
    phone_number: r.phone_number ?? null,
    shipping_address1: r.shipping_address1 ?? null,
    shipping_address2: r.shipping_address2 ?? null,
    shipping_city: r.shipping_city ?? null,
    shipping_zip: r.shipping_zip ?? null,
    shipping_province: r.shipping_province ?? null,
    workspace: r.workspace ?? "dreamplay",
    created_at: r.created_at ?? undefined,
  };
  const existing = byEmail.get(email);
  if (!existing) {
    byEmail.set(email, candidate);
  } else {
    mergedDupes.push(email);
    // merge: highest-priority workspace's row wins as the base (keeps its id +
    // workspace); most-restrictive status; union tags; earliest created_at;
    // first non-empty value per field
    const [base, other] = wsPrio(candidate.workspace) > wsPrio(existing.workspace)
      ? [candidate, existing] : [existing, candidate];
    const merged = { ...base };
    if (SEVERITY[other.status] > SEVERITY[base.status]) merged.status = other.status;
    merged.tags = [...new Set([...base.tags, ...other.tags])];
    if (other.created_at && base.created_at && other.created_at < base.created_at) {
      merged.created_at = other.created_at;
    }
    for (const k of ["first_name", "last_name", "country", "country_code", "phone_code", "phone_number",
      "shipping_address1", "shipping_address2", "shipping_city", "shipping_zip", "shipping_province"]) {
      if (!merged[k] && other[k]) merged[k] = other[k];
    }
    mergedWorkspacePairs[`${base.workspace}+${other.workspace}`] =
      (mergedWorkspacePairs[`${base.workspace}+${other.workspace}`] || 0) + 1;
    byEmail.set(email, merged);
  }
}
const targets = [...byEmail.values()];

// --- suppressions plan (from FULL legacy set, before dedupe) -----------------
const suppress = new Map(); // email -> reason
for (const r of rows) {
  const email = normalizeEmail(r.email);
  if (!email) continue;
  if (r.status === "bounced") suppress.set(email, "bounce"); // bounce wins
  else if (r.status === "unsubscribed" && !suppress.has(email)) suppress.set(email, "unsubscribe");
}
const suppressionTargets = [...suppress.entries()].map(([email, reason]) => ({
  email, reason, source: "legacy-migration",
}));

console.log(`\nWould upsert subscribers: ${targets.length}`);
console.log(`  invalid emails skipped: ${skippedInvalid.length}${skippedInvalid.length ? " -> " + JSON.stringify(skippedInvalid.slice(0, 20)) : ""}`);
console.log(`  duplicate emails merged (legacy multi-workspace rows): ${mergedDupes.length}`);
if (Object.keys(mergedWorkspacePairs).length) console.log(`  merged workspace pairs (kept+dropped):`, JSON.stringify(mergedWorkspacePairs));
if (unknownStatuses.size) console.log(`  UNKNOWN legacy statuses coerced to 'inactive':`, Object.fromEntries(unknownStatuses));
const statusDist = {};
for (const t of targets) statusDist[t.status] = (statusDist[t.status] || 0) + 1;
console.log(`  target status distribution:`, JSON.stringify(statusDist));
console.log(`\nWould upsert suppressions: ${suppressionTargets.length}`);
const reasonDist = {};
for (const s of suppressionTargets) reasonDist[s.reason] = (reasonDist[s.reason] || 0) + 1;
console.log(`  reason distribution:`, JSON.stringify(reasonDist));

if (mode !== "execute") {
  console.log("\nDry-run only. Re-run with --execute to write.");
  process.exit(0);
}

// Re-run stability: an email already in the new DB must keep its existing id —
// the dedup-merge can pick a different legacy row as canonical between runs,
// and changing the PK on upsert violates the sent_history FK.
{
  const existing = await readAllRows(newProject, "subscribers", "id,email");
  const existingIdByEmail = new Map(existing.map((s) => [s.email.toLowerCase(), s.id]));
  for (const t of targets) {
    const keep = existingIdByEmail.get(t.email.toLowerCase());
    if (keep) t.id = keep;
  }
}
await upsertRows(newProject, "subscribers", targets, { onConflict: "email" });
const newSubCount = await countRows(newProject, "subscribers");
console.log(`Done. subscribers new count: ${newSubCount}`);

await upsertRows(newProject, "suppressions", suppressionTargets, { onConflict: "email" });
const newSupCount = await countRows(newProject, "suppressions");
console.log(`Done. suppressions new count: ${newSupCount}`);

// --- COMPLIANCE ASSERTION -----------------------------------------------------
// every legacy unsubscribed/bounced email must exist in new suppressions
const newSuppressions = await readAllRows(newProject, "suppressions", { select: "email", order: "email" });
const newSuppressionSet = new Set(newSuppressions.map((s) => s.email.toLowerCase()));
const missing = [...suppress.keys()].filter((e) => !newSuppressionSet.has(e));
if (missing.length) {
  console.error(`COMPLIANCE FAILURE: ${missing.length} legacy opted-out emails missing from suppressions:`, missing.slice(0, 50));
} else {
  console.log(`COMPLIANCE OK: all ${suppress.size} legacy unsubscribed/bounced emails exist in new suppressions.`);
}

writeOutputJson("subscribers-summary.json", {
  generated_at: new Date().toISOString(),
  source_count: sourceCount,
  upserted: targets.length,
  new_count: newSubCount,
  skipped_invalid: skippedInvalid,
  merged_dupes_count: mergedDupes.length,
  merged_workspace_pairs: mergedWorkspacePairs,
  unknown_statuses: Object.fromEntries(unknownStatuses),
  dropped_columns: ["location_city", "location_country", "ip_address", "gdpr_consent", "consent_timestamp"],
  status_distribution: statusDist,
  suppressions: {
    planned: suppressionTargets.length,
    new_count: newSupCount,
    reason_distribution: reasonDist,
    compliance_ok: missing.length === 0,
    missing,
  },
});
logMigrationStep("05-subscribers", {
  old_count: sourceCount, upserted: targets.length, new_count: newSubCount,
  suppressions_planned: suppressionTargets.length, suppressions_new_count: newSupCount,
  compliance_ok: missing.length === 0,
});
if (missing.length) process.exit(1);
