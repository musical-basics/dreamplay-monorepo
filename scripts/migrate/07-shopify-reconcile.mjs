/**
 * 07-shopify-reconcile.mjs — reconcile the `buyers` table against Shopify
 * (the source of truth), catching webhook-coverage gaps.
 *
 * - Fetches ALL orders via the Admin API (client-credentials app, read_all_orders).
 * - "Paying" = PAID | PARTIALLY_REFUNDED | AUTHORIZED and not cancelled.
 *   ($0 Founders and ~$1 Waitlist reservations count — confirmed 2026-07-18:
 *    both types already had members in the legacy allowlist, so their absence
 *    was a gap, not policy.)
 * - Inserts missing paying customers (source='backfill', order # in notes),
 *   backfills shopify_order_number where null. Additive only — never deletes;
 *   cancelled/refunded/expired orders are reported, never acted on.
 *
 * Env (root .env.local): SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_CLIENT_ID/SECRET,
 * NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 *
 * Usage: node --env-file=../../.env.local 07-shopify-reconcile.mjs [--execute]
 * Re-run before Phase 7 cutover as part of the delta sync.
 */

const EXECUTE = process.argv.includes("--execute");
const store = process.env.SHOPIFY_STORE_DOMAIN;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!store || !url || !svc) {
  console.error("Missing env — run with: node --env-file=../../.env.local 07-shopify-reconcile.mjs");
  process.exit(1);
}
console.log(`>>> MODE: ${EXECUTE ? "EXECUTE" : "DRY-RUN (pass --execute to write)"}`);

const tr = await fetch(`https://${store}/admin/oauth/access_token`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    client_id: process.env.SHOPIFY_ADMIN_CLIENT_ID,
    client_secret: process.env.SHOPIFY_ADMIN_CLIENT_SECRET,
    grant_type: "client_credentials",
  }),
});
const token = (await tr.json()).access_token;
if (!token) { console.error("Shopify token failed"); process.exit(1); }

const orders = [];
let cursor = null;
for (;;) {
  const q = `{ orders(first: 100, sortKey: CREATED_AT${cursor ? `, after: "${cursor}"` : ""}) {
    pageInfo { hasNextPage endCursor }
    nodes { name email createdAt cancelledAt displayFinancialStatus
      totalPriceSet { shopMoney { amount currencyCode } }
      customer { email displayName } lineItems(first: 5) { nodes { title quantity } } } } }`;
  const r = await fetch(`https://${store}/admin/api/2025-10/graphql.json`, {
    method: "POST",
    headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
    body: JSON.stringify({ query: q }),
  });
  const j = await r.json();
  if (j.errors) { console.error("GraphQL errors:", JSON.stringify(j.errors)); process.exit(1); }
  orders.push(...j.data.orders.nodes);
  if (!j.data.orders.pageInfo.hasNextPage) break;
  cursor = j.data.orders.pageInfo.endCursor;
}
console.log(`Shopify orders: ${orders.length}`);

const H = { apikey: svc, Authorization: `Bearer ${svc}`, "Content-Type": "application/json" };
const buyers = await (await fetch(`${url}/rest/v1/buyers?select=email,shopify_order_number&limit=2000`, { headers: H })).json();
const buyerMap = new Map(buyers.map((b) => [b.email.toLowerCase().trim(), b]));

const paying = new Map();
const excluded = [];
for (const o of orders) {
  const email = (o.email || o.customer?.email || "").toLowerCase().trim();
  const status = o.cancelledAt ? "CANCELLED" : o.displayFinancialStatus;
  if (!email || !["PAID", "PARTIALLY_REFUNDED", "AUTHORIZED"].includes(status)) {
    excluded.push(`${o.name} ${status} ${email || "(no email)"}`);
    continue;
  }
  if (!paying.has(email)) paying.set(email, []);
  paying.get(email).push(o);
}

let inserted = 0, updated = 0;
for (const [email, os] of paying.entries()) {
  const latest = os[os.length - 1];
  const existing = buyerMap.get(email);
  if (!existing) {
    const name = latest.customer?.displayName || "";
    const notes = `${name ? name + " — " : ""}reconciliation backfill from Shopify order ${latest.name} (${latest.lineItems.nodes[0]?.title ?? "?"}, ${latest.totalPriceSet.shopMoney.amount} ${latest.totalPriceSet.shopMoney.currencyCode})`;
    console.log(`  MISSING: ${email} <- ${latest.name}`);
    if (EXECUTE) {
      const r = await fetch(`${url}/rest/v1/buyers`, {
        method: "POST",
        headers: { ...H, Prefer: "resolution=ignore-duplicates" },
        body: JSON.stringify({ email, notes, source: "backfill", shopify_order_number: latest.name }),
      });
      if (!r.ok) console.error(`  insert FAILED ${email}: ${r.status}`);
      else inserted++;
    }
  } else if (!existing.shopify_order_number) {
    if (EXECUTE) {
      const r = await fetch(`${url}/rest/v1/buyers?email=eq.${encodeURIComponent(email)}&shopify_order_number=is.null`, {
        method: "PATCH", headers: H, body: JSON.stringify({ shopify_order_number: latest.name }),
      });
      if (!r.ok) console.error(`  order# patch FAILED ${email}: ${r.status}`);
      else updated++;
    } else console.log(`  order# missing: ${email} <- ${latest.name}`);
  }
}
const missingCount = [...paying.keys()].filter((e) => !buyerMap.has(e)).length;
console.log(`\npaying customers: ${paying.size} | missing from buyers: ${missingCount}${EXECUTE ? ` | inserted: ${inserted} | order# backfilled: ${updated}` : ""}`);
console.log(`excluded (cancelled/refunded/expired/no-email): ${excluded.length}`);
for (const x of excluded) console.log(`  ${x}`);
