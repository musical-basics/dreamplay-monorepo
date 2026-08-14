/**
 * backfill-pro-upgrades.mjs — reconcile paid $200 Pro upgrades from Shopify.
 *
 * The orders webhook upserts buyers with ignoreDuplicates, so the upgrade
 * order (a SECOND order on an email already in `buyers`) never touched the
 * buyer row. Six buyers paid on 2026-08-06 and the only in-app trace was
 * pro_upgrade_requested, which records intent rather than money.
 *
 * This reads every order containing the upgrade variant straight from
 * Shopify and writes it into pro_upgrade_payments, setting
 * buyers.pro_upgrade_paid_at. Safe to re-run: the table is keyed on the
 * Shopify order id, so repeats are no-ops.
 *
 * Usage:
 *   node backfill-pro-upgrades.mjs            dry run
 *   node backfill-pro-upgrades.mjs --execute  write
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const EXECUTE = process.argv.includes("--execute");
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

for (const f of [join(repoRoot, ".env.local"), join(repoRoot, "apps/web/.env.local")]) {
  try {
    for (const line of readFileSync(f, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
    }
  } catch {}
}

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || "dreamplay-pianos.myshopify.com";
const VERSION = process.env.SHOPIFY_API_VERSION || "2025-10";
const CLIENT_ID = process.env.SHOPIFY_ADMIN_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_ADMIN_CLIENT_SECRET;
if (!SUPA_URL || !SVC || !CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing env (SUPABASE / SHOPIFY_ADMIN_CLIENT_ID / SHOPIFY_ADMIN_CLIENT_SECRET)");
  process.exit(1);
}

/** Must match PRO_UPGRADE_VARIANT_ID in apps/web/src/lib/pro-upgrade-email.ts. */
const UPGRADE_VARIANT_ID = "53858415739194";

console.log(`>>> MODE: ${EXECUTE ? "EXECUTE (writes)" : "DRY-RUN"}`);

const H = { apikey: SVC, Authorization: `Bearer ${SVC}`, "Content-Type": "application/json" };
async function rest(path, init) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, { headers: H, ...init });
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function shopifyToken() {
  const res = await fetch(`https://${DOMAIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: "client_credentials" }),
  });
  if (!res.ok) throw new Error(`Shopify token failed: ${res.status}`);
  return (await res.json()).access_token;
}

const token = await shopifyToken();

/** Every order carrying the upgrade variant, oldest first. */
const query = `{
  orders(first: 250, query: "created_at:>=2026-01-01", sortKey: CREATED_AT) {
    edges { node {
      id name createdAt displayFinancialStatus
      totalPriceSet { shopMoney { amount currencyCode } }
      customer { email }
      email
      lineItems(first: 20) { edges { node { title variant { id } } } }
    } }
  }
}`;

const res = await fetch(`https://${DOMAIN}/admin/api/${VERSION}/graphql.json`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
  body: JSON.stringify({ query }),
});
const json = await res.json();
if (json.errors) {
  console.error("Shopify GraphQL error:", JSON.stringify(json.errors).slice(0, 400));
  process.exit(1);
}

const upgrades = json.data.orders.edges
  .map((e) => e.node)
  .filter((o) =>
    o.lineItems.edges.some((li) => String(li.node.variant?.id ?? "").endsWith(`/${UPGRADE_VARIANT_ID}`)),
  );

console.log(`found ${upgrades.length} upgrade order(s) in Shopify`);

let written = 0, skipped = 0, unmatched = 0;
for (const o of upgrades) {
  const email = (o.customer?.email || o.email || "").toLowerCase().trim();
  // GraphQL ids look like gid://shopify/Order/7442283626810; the webhook
  // stores the bare numeric id, so normalise to match.
  const orderId = String(o.id).split("/").pop();
  const amount = Number(o.totalPriceSet.shopMoney.amount);

  const existing = await rest(`pro_upgrade_payments?select=id&shopify_order_id=eq.${encodeURIComponent(orderId)}`);
  if (existing?.length) {
    console.log(`  SKIP ${o.name} ${email} (already recorded)`);
    skipped++;
    continue;
  }

  const buyer = (await rest(`buyers?select=id&email=eq.${encodeURIComponent(email)}`))?.[0] ?? null;
  if (!buyer) {
    console.log(`  WARN ${o.name} ${email} has no buyers row; recording payment without a link`);
    unmatched++;
  }

  if (!EXECUTE) {
    console.log(`  WOULD RECORD ${o.name} ${email.padEnd(30)} $${amount} ${o.displayFinancialStatus}`);
    written++;
    continue;
  }

  await rest("pro_upgrade_payments?on_conflict=shopify_order_id", {
    method: "POST",
    headers: { ...H, Prefer: "resolution=ignore-duplicates" },
    body: JSON.stringify([{
      buyer_id: buyer?.id ?? null,
      email,
      shopify_order_id: orderId,
      shopify_order_name: o.name,
      amount_usd: amount,
      currency: o.totalPriceSet.shopMoney.currencyCode || "USD",
      financial_status: String(o.displayFinancialStatus || "paid").toLowerCase(),
      paid_at: o.createdAt,
      source: "backfill",
      raw: { order_name: o.name, backfilled_at: new Date().toISOString() },
    }]),
  });

  if (buyer?.id) {
    await rest(`buyers?id=eq.${buyer.id}&pro_upgrade_paid_at=is.null`, {
      method: "PATCH",
      body: JSON.stringify({ pro_upgrade_paid_at: o.createdAt }),
    });
  }
  console.log(`  RECORDED ${o.name} ${email} $${amount}`);
  written++;
}

console.log(`\nsummary: ${EXECUTE ? "written" : "would write"}=${written} skipped=${skipped} unmatched=${unmatched}`);
