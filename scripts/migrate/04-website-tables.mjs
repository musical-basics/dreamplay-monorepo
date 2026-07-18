/**
 * 04 — Straight ports from the old website project:
 *   "Customer"      -> customers      (camelCase -> snake_case; citext unique email)
 *   "Waitlist"      -> waitlist       (identical shape; upsert on id)
 *   admin_variables -> admin_variables (key/value/updated_at; legacy created_at dropped)
 *
 * Column notes:
 *   - Customer.shopifyCustomerId has NO target column in customers — dropped;
 *     non-null values are recorded in the summary output so nothing is lost
 *     silently (target subscribers carries shopify ids, customers does not).
 *   - Customer.createdAt -> created_at.
 *
 * Usage: node 04-website-tables.mjs [--execute]   (default: dry-run)
 */

import {
  getProject, getMode, logMode, countRows, readAllRows, upsertRows,
  normalizeEmail, writeOutputJson, logMigrationStep,
} from "./lib.mjs";

const mode = getMode();
logMode(mode);

const oldProject = getProject("website");
const newProject = getProject("new");
const summary = { generated_at: new Date().toISOString() };

// --- Customer -> customers ---------------------------------------------------

{
  const sourceCount = await countRows(oldProject, "Customer");
  const rows = await readAllRows(oldProject, "Customer", { order: "id" });
  console.log(`\nCustomer: source count ${sourceCount}`);

  const seen = new Map();
  const skippedInvalid = [];
  const dupes = [];
  const droppedShopifyIds = [];
  for (const r of rows) {
    const email = normalizeEmail(r.email);
    if (!email) { skippedInvalid.push(r.email); continue; }
    if (r.shopifyCustomerId) droppedShopifyIds.push({ email, shopifyCustomerId: r.shopifyCustomerId });
    if (seen.has(email)) dupes.push(email);
    seen.set(email, {
      id: r.id,
      email,
      name: r.name ?? "",
      tags: Array.isArray(r.tags) ? r.tags : [],
      created_at: r.createdAt ?? undefined,
    });
  }
  const targets = [...seen.values()];
  console.log(`  would upsert ${targets.length} (invalid skipped: ${skippedInvalid.length}, dupes merged: ${dupes.length}, shopifyCustomerId values dropped: ${droppedShopifyIds.length})`);

  if (mode === "execute") {
    await upsertRows(newProject, "customers", targets, { onConflict: "email" });
    const newCount = await countRows(newProject, "customers");
    console.log(`  done. customers new count: ${newCount}`);
    summary.customers = { source_count: sourceCount, upserted: targets.length, new_count: newCount, skipped_invalid: skippedInvalid, merged_dupes: dupes, dropped_shopify_customer_ids: droppedShopifyIds };
    logMigrationStep("04-customers", { old_count: sourceCount, upserted: targets.length, new_count: newCount });
  }
}

// --- Waitlist -> waitlist ----------------------------------------------------

{
  const sourceCount = await countRows(oldProject, "Waitlist");
  const rows = await readAllRows(oldProject, "Waitlist", { order: "id" });
  console.log(`\nWaitlist: source count ${sourceCount}`);

  const skippedInvalid = [];
  const targets = [];
  for (const r of rows) {
    const email = normalizeEmail(r.email);
    if (!email) { skippedInvalid.push(r.email); continue; }
    targets.push({
      id: r.id,
      full_name: r.full_name ?? "",
      email,
      created_at: r.created_at ?? undefined,
    });
  }
  console.log(`  would upsert ${targets.length} (invalid skipped: ${skippedInvalid.length})`);

  if (mode === "execute") {
    await upsertRows(newProject, "waitlist", targets, { onConflict: "id" });
    const newCount = await countRows(newProject, "waitlist");
    console.log(`  done. waitlist new count: ${newCount}`);
    summary.waitlist = { source_count: sourceCount, upserted: targets.length, new_count: newCount, skipped_invalid: skippedInvalid };
    logMigrationStep("04-waitlist", { old_count: sourceCount, upserted: targets.length, new_count: newCount });
  }
}

// --- admin_variables -> admin_variables --------------------------------------

{
  const sourceCount = await countRows(oldProject, "admin_variables");
  const rows = await readAllRows(oldProject, "admin_variables", { order: "key" });
  console.log(`\nadmin_variables: source count ${sourceCount}`);

  const targets = rows.map((r) => ({
    key: r.key,
    value: r.value ?? null,
    updated_at: r.updated_at ?? undefined,
  }));
  console.log(`  would upsert ${targets.length} (legacy created_at column dropped — no target column)`);
  for (const t of targets) console.log(`    ${t.key}`);

  if (mode === "execute") {
    await upsertRows(newProject, "admin_variables", targets, { onConflict: "key" });
    const newCount = await countRows(newProject, "admin_variables");
    console.log(`  done. admin_variables new count: ${newCount}`);
    summary.admin_variables = { source_count: sourceCount, upserted: targets.length, new_count: newCount };
    logMigrationStep("04-admin-variables", { old_count: sourceCount, upserted: targets.length, new_count: newCount });
  }
}

if (mode === "execute") {
  writeOutputJson("website-tables-summary.json", summary);
} else {
  console.log("\nDry-run only. Re-run with --execute to write.");
}
