/**
 * 02 — buyer_emails (old website) -> buyers (new).
 *
 * Legacy columns: email, added_at, notes  (no id / source / order number).
 * Mapping:
 *   email  -> email (lowercased/trimmed; citext unique in target)
 *   notes  -> notes (kept verbatim)
 *   added_at -> created_at
 *   source -> 'backfill'
 *   shopify_order_number -> parsed from notes when the legacy
 *     "auto-added from Shopify order #N" pattern matches, else null.
 *
 * Upsert on_conflict=email (idempotent, delta-sync friendly).
 *
 * Usage: node 02-buyers.mjs [--execute]   (default: dry-run)
 */

import {
  getProject, getMode, logMode, countRows, readAllRows, upsertRows,
  normalizeEmail, writeOutputJson, logMigrationStep,
} from "./lib.mjs";

const mode = getMode();
logMode(mode);

const oldProject = getProject("website");
const newProject = getProject("new");

const sourceCount = await countRows(oldProject, "buyer_emails");
console.log(`Source buyer_emails count: ${sourceCount}`);

const rows = await readAllRows(oldProject, "buyer_emails", { order: "email" });

const ORDER_RE = /auto-added from Shopify order #(\S+)/i;

const seen = new Map();
const skippedInvalid = [];
const dupes = [];
for (const r of rows) {
  const email = normalizeEmail(r.email);
  if (!email) {
    skippedInvalid.push(r.email);
    continue;
  }
  const m = typeof r.notes === "string" ? r.notes.match(ORDER_RE) : null;
  const target = {
    email,
    notes: r.notes ?? null,
    source: "backfill",
    shopify_order_number: m ? m[1] : null,
    created_at: r.added_at ?? undefined,
  };
  if (seen.has(email)) dupes.push(email);
  seen.set(email, target); // last one wins on case-duplicates
}
const targets = [...seen.values()];

const withOrder = targets.filter((t) => t.shopify_order_number).length;
console.log(`Would upsert into buyers: ${targets.length}`);
console.log(`  with parsed shopify_order_number: ${withOrder}`);
console.log(`  invalid emails skipped: ${skippedInvalid.length}${skippedInvalid.length ? " -> " + JSON.stringify(skippedInvalid) : ""}`);
console.log(`  case/dupe emails merged: ${dupes.length}${dupes.length ? " -> " + JSON.stringify(dupes) : ""}`);

if (mode !== "execute") {
  console.log("\nDry-run only. Re-run with --execute to write.");
  process.exit(0);
}

await upsertRows(newProject, "buyers", targets, { onConflict: "email" });
const newCount = await countRows(newProject, "buyers");
console.log(`Done. buyers count in new project: ${newCount}`);

writeOutputJson("buyers-summary.json", {
  generated_at: new Date().toISOString(),
  source_count: sourceCount,
  upserted: targets.length,
  with_order_number: withOrder,
  skipped_invalid: skippedInvalid,
  merged_dupes: dupes,
  new_count: newCount,
});
logMigrationStep("02-buyers", {
  old_count: sourceCount, upserted: targets.length, new_count: newCount,
  skipped_invalid: skippedInvalid.length, merged_dupes: dupes.length,
});
