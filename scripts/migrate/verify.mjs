/**
 * Verification report for the Phase 6 migration (read-only; safe to run anytime).
 *
 * For every migrated table:
 *   - old count vs new count + delta explanation (from the step summaries in
 *     output/*.json where available)
 *   - 3 random spot-check rows compared field-by-field (old value vs new value)
 *
 * Plus the COMPLIANCE ASSERTION: every legacy unsubscribed/bounced subscriber
 * email exists in new `suppressions`.
 *
 * Auth users are verified by count + email set containment.
 *
 * Writes output/verification-report.json and prints a readable report.
 *
 * Usage: node verify.mjs
 */

import {
  getProject, countRows, readAllRows, listAuthUsers, normalizeEmail,
  readOutputJson, writeOutputJson,
} from "./lib.mjs";

const website = getProject("website");
const email = getProject("email");
const newer = getProject("new");

const report = { generated_at: new Date().toISOString(), tables: {}, auth: {}, compliance: {} };

function norm(v) {
  if (v == null) return null;
  if (Array.isArray(v)) return JSON.stringify([...v].sort());
  if (typeof v === "object") return JSON.stringify(v);
  if (typeof v === "string") {
    const t = Date.parse(v);
    if (!Number.isNaN(t) && /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(v)) return `ts:${t}`;
    return v;
  }
  return v;
}

function pickRandom(rows, n = 3) {
  const copy = [...rows];
  const out = [];
  while (copy.length && out.length < n) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

async function fetchNewRow(table, filterCol, filterVal) {
  const rows = await readAllRows(newer, table, {
    order: filterCol, filter: `${filterCol}=eq.${encodeURIComponent(filterVal)}`,
  });
  return rows[0] ?? null;
}

/**
 * cfg: { name, srcProject, srcTable, srcOrder, dstTable, key: [srcCol, dstCol],
 *        map(oldRow) -> expected dst fields, deltaNote }
 */
async function verifyTable(cfg) {
  const oldCount = await countRows(cfg.srcProject, cfg.srcTable, cfg.srcFilter ?? "");
  const newCount = await countRows(newer, cfg.dstTable);
  const srcRows = await readAllRows(cfg.srcProject, cfg.srcTable, {
    order: cfg.srcOrder, filter: cfg.srcFilter ?? "",
  });
  const samples = [];
  for (const oldRow of pickRandom(srcRows, 3)) {
    const expected = cfg.map(oldRow);
    const keyVal = expected[cfg.key[1]];
    const newRow = await fetchNewRow(cfg.dstTable, cfg.key[1], keyVal);
    const fields = {};
    let mismatches = 0;
    if (!newRow) {
      mismatches = -1;
    } else {
      for (const [k, v] of Object.entries(expected)) {
        if (v === undefined) continue;
        const ok = norm(v) === norm(newRow[k]);
        if (!ok) mismatches++;
        fields[k] = { old: v, new: newRow[k], match: ok };
      }
    }
    samples.push({ key: `${cfg.key[1]}=${keyVal}`, found: !!newRow, mismatched_fields: mismatches, fields });
  }
  report.tables[cfg.name] = {
    old_count: oldCount, new_count: newCount,
    delta: newCount - oldCount, delta_note: cfg.deltaNote,
    spot_checks: samples,
  };
  const sampleSummary = samples
    .map((s) => `${s.key} ${s.found ? (s.mismatched_fields === 0 ? "OK" : `${s.mismatched_fields} field diffs`) : "MISSING"}`)
    .join(" | ");
  console.log(`\n${cfg.name}: old=${oldCount} new=${newCount} (${cfg.deltaNote})`);
  console.log(`  spot-checks: ${sampleSummary}`);
  for (const s of samples) {
    for (const [k, f] of Object.entries(s.fields)) {
      if (!f.match) console.log(`    DIFF ${s.key} ${k}: old=${JSON.stringify(f.old)} new=${JSON.stringify(f.new)}`);
    }
  }
}

// summaries produced by the migration steps (for delta notes)
const buyersSum = readOutputJson("buyers-summary.json");
const subsSum = readOutputJson("subscribers-summary.json");
const emailSum = readOutputJson("email-content-summary.json");
const siteSum = readOutputJson("website-tables-summary.json");

const ORDER_RE = /auto-added from Shopify order #(\S+)/i;

await verifyTable({
  name: "buyer_emails -> buyers",
  srcProject: website, srcTable: "buyer_emails", srcOrder: "email",
  dstTable: "buyers", key: ["email", "email"],
  deltaNote: buyersSum
    ? `invalid skipped: ${buyersSum.skipped_invalid.length}, dupes merged: ${buyersSum.merged_dupes.length}`
    : "delta = invalid emails skipped + case-dupes merged",
  map: (r) => ({
    email: normalizeEmail(r.email),
    notes: r.notes ?? null,
    source: "backfill",
    shopify_order_number: (typeof r.notes === "string" && r.notes.match(ORDER_RE)) ? r.notes.match(ORDER_RE)[1] : null,
    created_at: r.added_at,
  }),
});

const userMap = readOutputJson("user-id-map.json")?.map ?? {};
await verifyTable({
  name: "reservation_decisions -> reservation_decisions",
  srcProject: website, srcTable: "reservation_decisions", srcOrder: "id",
  dstTable: "reservation_decisions", key: ["id", "id"],
  deltaNote: "1:1 port; user_id remapped via user-id-map.json",
  map: (r) => ({
    id: r.id,
    user_id: userMap[r.user_id] ?? `<unmapped:${r.user_id}>`,
    email: normalizeEmail(r.email) ?? r.email,
    decision: r.decision,
    selected_at: r.selected_at,
    order_metadata: r.order_metadata ?? {},
    created_at: r.created_at,
  }),
});

await verifyTable({
  name: "Customer -> customers",
  srcProject: website, srcTable: "Customer", srcOrder: "id",
  dstTable: "customers", key: ["email", "email"],
  deltaNote: siteSum?.customers
    ? `invalid skipped: ${siteSum.customers.skipped_invalid.length}, dupes merged: ${siteSum.customers.merged_dupes.length}; shopifyCustomerId dropped (${siteSum.customers.dropped_shopify_customer_ids.length} non-null)`
    : "delta = invalid/dupes; shopifyCustomerId has no target column",
  map: (r) => ({
    id: r.id,
    email: normalizeEmail(r.email),
    name: r.name ?? "",
    tags: Array.isArray(r.tags) ? r.tags : [],
    created_at: r.createdAt,
  }),
});

await verifyTable({
  name: "Waitlist -> waitlist",
  srcProject: website, srcTable: "Waitlist", srcOrder: "id",
  dstTable: "waitlist", key: ["id", "id"],
  deltaNote: "1:1 port (emails normalized)",
  map: (r) => ({
    id: r.id, full_name: r.full_name ?? "", email: normalizeEmail(r.email), created_at: r.created_at,
  }),
});

await verifyTable({
  name: "admin_variables -> admin_variables",
  srcProject: website, srcTable: "admin_variables", srcOrder: "key",
  dstTable: "admin_variables", key: ["key", "key"],
  deltaNote: "1:1 port; legacy created_at column dropped",
  map: (r) => ({ key: r.key, value: r.value ?? null }),
});

await verifyTable({
  name: "subscribers -> subscribers",
  srcProject: email, srcTable: "subscribers", srcOrder: "id",
  dstTable: "subscribers", key: ["email", "email"],
  deltaNote: subsSum
    ? `invalid skipped: ${subsSum.skipped_invalid.length}, cross-workspace dupes merged: ${subsSum.merged_dupes_count}; dropped cols: ${subsSum.dropped_columns.join("/")}`
    : "delta = invalid emails + cross-workspace dupes merged; legacy-only cols dropped",
  map: (r) => ({
    email: normalizeEmail(r.email),
    first_name: r.first_name ?? "",
    last_name: r.last_name ?? "",
    // NOTE: for the ~6k emails that existed in two legacy workspaces, status/
    // tags/workspace/created_at were MERGED (most-restrictive status, union
    // tags, priority workspace, earliest created_at) — a spot-check diff on
    // those fields for a dupe email is expected, not a bug.
    status: r.status,
    tags: Array.isArray(r.tags) ? r.tags : [],
    country: r.country ?? null,
    created_at: r.created_at,
  }),
});

// tag_definitions / merge_tags / rotations / campaigns / sent_history
await verifyTable({
  name: "tag_definitions -> tag_definitions",
  srcProject: email, srcTable: "tag_definitions", srcOrder: "id",
  dstTable: "tag_definitions", key: ["id", "id"],
  deltaNote: emailSum?.tag_definitions
    ? `(workspace,name) dupes skipped: ${emailSum.tag_definitions.deduped.length}; is_starred dropped`
    : "delta = (workspace,name) dupes; is_starred dropped",
  map: (r) => ({ id: r.id, name: r.name, color: r.color ?? "#6b7280", workspace: r.workspace ?? "dreamplay", created_at: r.created_at }),
});

await verifyTable({
  name: "merge_tags -> merge_tags",
  srcProject: email, srcTable: "merge_tags", srcOrder: "id",
  dstTable: "merge_tags", key: ["id", "id"],
  deltaNote: "name<-tag; description<-field_label/subscriber_field/category; workspace='dreamplay'",
  map: (r) => {
    const descParts = [];
    if (r.field_label) descParts.push(r.field_label);
    if (r.subscriber_field) descParts.push(`field: ${r.subscriber_field}`);
    if (r.category) descParts.push(`category: ${r.category}`);
    return {
      id: r.id, name: r.tag, default_value: r.default_value ?? "",
      description: descParts.length ? descParts.join(" | ") : null,
      workspace: "dreamplay", created_at: r.created_at,
    };
  },
});

await verifyTable({
  name: "rotations -> rotations",
  srcProject: email, srcTable: "rotations", srcOrder: "id",
  dstTable: "rotations", key: ["id", "id"],
  deltaNote: "1:1 port; campaign_ids kept (legacy campaign uuids preserved)",
  map: (r) => ({
    id: r.id, name: r.name, campaign_ids: r.campaign_ids ?? [],
    cursor_position: r.cursor_position ?? 0, workspace: r.workspace ?? "dreamplay",
  }),
});

// campaigns: only templates + sent_history-referenced were ported — spot-check templates
await verifyTable({
  name: "campaigns (templates) -> campaigns",
  srcProject: email, srcTable: "campaigns", srcOrder: "id", srcFilter: "is_template=eq.true",
  dstTable: "campaigns", key: ["id", "id"],
  deltaNote: emailSum?.campaigns
    ? `new = ${emailSum.campaigns.templates} templates + ${emailSum.campaigns.referenced_children} sent_history-referenced children; rest intentionally not ported; status remaps ${JSON.stringify(emailSum.campaigns.status_remaps)}`
    : "new count = templates + sent_history-referenced children only (by design)",
  map: (r) => ({
    id: r.id, name: r.name, subject_line: r.subject_line ?? null,
    html_content: r.html_content ?? null, is_template: true,
    email_type: r.email_type === "automated" ? "automated" : "campaign",
    workspace: r.workspace ?? "dreamplay", created_at: r.created_at,
  }),
});

// sent_history: subscriber_id was remapped by email in 06 (cross-workspace
// dupe rows merged in 05), so rebuild the same remap for comparison.
{
  const legacySubs = await readAllRows(email, "subscribers", { select: "id,email", order: "id" });
  const legacyIdToEmail = new Map(legacySubs.map((s) => [s.id, (s.email ?? "").trim().toLowerCase()]));
  const newSubs = await readAllRows(newer, "subscribers", { select: "id,email", order: "id" });
  const emailToNewId = new Map(newSubs.map((s) => [s.email.toLowerCase(), s.id]));
  await verifyTable({
    name: "sent_history -> sent_history",
    srcProject: email, srcTable: "sent_history", srcOrder: "id",
    dstTable: "sent_history", key: ["id", "id"],
    deltaNote: emailSum?.sent_history
      ? `skipped: campaign-missing ${emailSum.sent_history.skipped_campaign_missing}, subscriber-missing ${emailSum.sent_history.skipped_subscriber_missing}, dup pairs collapsed ${emailSum.sent_history.duplicate_pairs_collapsed} (subscriber ids remapped by email: ${emailSum.sent_history.subscriber_ids_remapped_by_email}); a random source row that was a collapsed dup pair will show as MISSING by id — its pair exists under another id`
      : "delta = rows whose campaign/subscriber didn't migrate + duplicate (campaign,subscriber) pairs collapsed",
    map: (r) => ({
      id: r.id,
      campaign_id: r.campaign_id,
      subscriber_id: emailToNewId.get(legacyIdToEmail.get(r.subscriber_id)) ?? r.subscriber_id,
      sent_at: r.sent_at,
    }),
  });
}

// --- auth users ---------------------------------------------------------------

{
  const oldUsers = await listAuthUsers(website);
  const newUsers = await listAuthUsers(newer);
  const oldEmails = new Set(oldUsers.map((u) => normalizeEmail(u.email)).filter(Boolean));
  const newEmails = new Set(newUsers.map((u) => normalizeEmail(u.email)).filter(Boolean));
  const missing = [...oldEmails].filter((e) => !newEmails.has(e));
  report.auth = {
    old_count: oldUsers.length, new_count: newUsers.length,
    old_emails_missing_in_new: missing,
    ok: missing.length === 0,
  };
  console.log(`\nauth.users: old=${oldUsers.length} new=${newUsers.length} missing-in-new=${missing.length} ${missing.length ? "FAIL " + JSON.stringify(missing) : "OK"}`);
}

// --- COMPLIANCE ASSERTION -----------------------------------------------------

{
  const optedOut = await readAllRows(email, "subscribers", {
    select: "email,status", order: "id", filter: "status=in.(unsubscribed,bounced)",
  });
  const optedOutEmails = new Set(optedOut.map((r) => normalizeEmail(r.email)).filter(Boolean));
  const suppressions = await readAllRows(newer, "suppressions", { select: "email,reason", order: "email" });
  const suppressed = new Set(suppressions.map((s) => s.email.toLowerCase()));
  const missing = [...optedOutEmails].filter((e) => !suppressed.has(e));
  report.compliance = {
    legacy_opted_out_rows: optedOut.length,
    legacy_opted_out_unique_emails: optedOutEmails.size,
    new_suppressions: suppressions.length,
    missing_from_suppressions: missing,
    ok: missing.length === 0,
  };
  console.log(`\nCOMPLIANCE: legacy unsub/bounced rows=${optedOut.length} (unique emails=${optedOutEmails.size}); new suppressions=${suppressions.length}`);
  console.log(missing.length === 0
    ? "COMPLIANCE ASSERTION PASSED: every legacy unsubscribed/bounced email exists in suppressions."
    : `COMPLIANCE ASSERTION FAILED: ${missing.length} emails missing: ${JSON.stringify(missing.slice(0, 50))}`);
}

const path = writeOutputJson("verification-report.json", report);
console.log(`\nFull report written to ${path}`);
if (!report.compliance.ok || !report.auth.ok) process.exit(1);
