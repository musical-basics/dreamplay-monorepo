/**
 * Swap one size variant for another on a customer's order (e.g. DS6.0 -> DS5.5).
 *
 * REQUIRES the `read_all_orders` scope if the order is older than ~60 days — see
 * scripts/shopify/READ-ALL-ORDERS-SETUP.md. `write_orders` is already granted.
 *
 * Dry run (default — reads only, writes nothing):
 *   node scripts/shopify/shopify-edit-order-variant.mjs --email junklavier257@gmail.com --from DS6.0 --to DS5.5
 *
 * Apply:
 *   node scripts/shopify/shopify-edit-order-variant.mjs --email junklavier257@gmail.com --from DS6.0 --to DS5.5 --commit
 *
 * You can target by --order "#1042" instead of --email. Use --notify to email
 * the customer the edited confirmation (default: no notification).
 *
 * Strategy: from the matched line item, read its product + color option, then
 * find the SAME product's variant whose size option == --to and color matches.
 * This keeps tier/color identical and only changes size. Then it uses the Order
 * Editing API: orderEditBegin -> set old line qty 0 -> add new variant -> commit.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// ---- args ----
const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const EMAIL = getArg("--email");
const ORDER_NAME = getArg("--order");
const FROM = getArg("--from");
const TO = getArg("--to");
const COMMIT = args.includes("--commit");
const NOTIFY = args.includes("--notify");

if ((!EMAIL && !ORDER_NAME) || !FROM || !TO) {
  console.error("Usage: --email <addr>|--order <#name> --from <SIZE> --to <SIZE> [--commit] [--notify]");
  process.exit(1);
}

// ---- env (monorepo-root .env.local, falls back to process.env) ----
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const env = { ...process.env };
try {
  for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch { /* fall back to process.env */ }
const domain = env.SHOPIFY_STORE_DOMAIN || "dreamplay-pianos.myshopify.com";
const version = env.SHOPIFY_API_VERSION || "2025-10";

async function getToken() {
  const res = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: env.SHOPIFY_ADMIN_CLIENT_ID, client_secret: env.SHOPIFY_ADMIN_CLIENT_SECRET, grant_type: "client_credentials" }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`token exchange failed: ${JSON.stringify(json)}`);
  return json.access_token;
}
let TOKEN;
async function gql(query, variables = {}) {
  const res = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: "POST", headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL: ${JSON.stringify(json.errors)}`);
  return json.data;
}
const opt = (sel, name) => (sel || []).find((o) => o.name.toLowerCase() === name)?.value;

TOKEN = await getToken();

// ---- 1. find the order ----
const q = ORDER_NAME ? `name:${ORDER_NAME.replace(/^#/, "")}` : `email:${EMAIL}`;
const found = await gql(`
  query($q: String!) {
    orders(first: 10, query: $q, sortKey: CREATED_AT, reverse: true) {
      edges { node {
        id name createdAt displayFinancialStatus displayFulfillmentStatus
        lineItems(first: 50) { edges { node {
          id title quantity
          variant { id title selectedOptions { name value } product { id title } }
        } } }
      } }
    }
  }`, { q });

const orders = found.orders.edges.map((e) => e.node);
if (!orders.length) {
  console.error(`No order found for ${q}. If the order is >60 days old, you need read_all_orders (see READ-ALL-ORDERS-SETUP.md).`);
  process.exit(2);
}

// pick the order that actually has a FROM-size line item
let order, line;
for (const o of orders) {
  const l = o.lineItems.edges.map((e) => e.node).find((n) => opt(n.variant?.selectedOptions, "size") === FROM || (n.variant?.title || "").includes(FROM));
  if (l) { order = o; line = l; break; }
}
if (!order) {
  console.error(`Found ${orders.length} order(s) but none with a ${FROM} line item. Line items seen:`);
  for (const o of orders) for (const e of o.lineItems.edges) console.error(`  ${o.name}: ${e.node.title} / ${e.node.variant?.title}`);
  process.exit(3);
}

const color = opt(line.variant?.selectedOptions, "color") || opt(line.variant?.selectedOptions, "colour");
console.log(`\nOrder ${order.name} (${order.id})  ${order.displayFinancialStatus}/${order.displayFulfillmentStatus}`);
console.log(`Matched line: "${line.title}"  variant="${line.variant?.title}"  qty=${line.quantity}  color=${color}`);

// ---- 2. resolve TO variant on the same product, same color ----
const prod = await gql(`
  query($id: ID!) {
    product(id: $id) {
      title
      variants(first: 100) { edges { node { id title availableForSale selectedOptions { name value } } } }
    }
  }`, { id: line.variant.product.id });

const target = prod.product.variants.edges.map((e) => e.node).find((v) => {
  const size = opt(v.selectedOptions, "size");
  const c = opt(v.selectedOptions, "color") || opt(v.selectedOptions, "colour");
  return size === TO && (!color || c === color);
});
if (!target) {
  console.error(`No ${TO} variant (color=${color}) found on product "${prod.product.title}". Available:`);
  for (const e of prod.product.variants.edges) console.error(`  ${e.node.title}`);
  process.exit(4);
}
console.log(`Target variant: "${target.title}"  ${target.id}  availableForSale=${target.availableForSale}`);

console.log(`\nPLAN: on ${order.name}, set "${line.variant?.title}" qty -> 0 and add "${target.title}" qty ${line.quantity}.`);

if (!COMMIT) {
  console.log("\n[dry run] No changes written. Re-run with --commit to apply.");
  process.exit(0);
}

// ---- 3. apply via Order Editing API ----
const begin = await gql(`
  mutation($id: ID!) {
    orderEditBegin(id: $id) {
      calculatedOrder { id lineItems(first: 50) { edges { node { id quantity variant { id title } } } } }
      userErrors { field message }
    }
  }`, { id: order.id });
if (begin.orderEditBegin.userErrors?.length) throw new Error(JSON.stringify(begin.orderEditBegin.userErrors));
const calc = begin.orderEditBegin.calculatedOrder;
const calcLine = calc.lineItems.edges.map((e) => e.node).find((n) => n.variant?.id === line.variant.id);
if (!calcLine) throw new Error("could not match the FROM line item in the calculated order");

const zero = await gql(`
  mutation($id: ID!, $lineItemId: ID!, $qty: Int!) {
    orderEditSetQuantity(id: $id, lineItemId: $lineItemId, quantity: $qty, restock: true) {
      userErrors { field message }
    }
  }`, { id: calc.id, lineItemId: calcLine.id, qty: 0 });
if (zero.orderEditSetQuantity.userErrors?.length) throw new Error(JSON.stringify(zero.orderEditSetQuantity.userErrors));

const add = await gql(`
  mutation($id: ID!, $variantId: ID!, $qty: Int!) {
    orderEditAddVariant(id: $id, variantId: $variantId, quantity: $qty, allowDuplicates: true) {
      calculatedOrder { id }
      userErrors { field message }
    }
  }`, { id: calc.id, variantId: target.id, qty: line.quantity });
if (add.orderEditAddVariant.userErrors?.length) throw new Error(JSON.stringify(add.orderEditAddVariant.userErrors));

const commit = await gql(`
  mutation($id: ID!, $notify: Boolean!, $note: String!) {
    orderEditCommit(id: $id, notifyCustomer: $notify, staffNote: $note) {
      order { id name }
      userErrors { field message }
    }
  }`, { id: calc.id, notify: NOTIFY, note: `Size corrected ${FROM} -> ${TO} per customer request` });
if (commit.orderEditCommit.userErrors?.length) throw new Error(JSON.stringify(commit.orderEditCommit.userErrors));

console.log(`\n✅ Committed. Order ${commit.orderEditCommit.order?.name} now has ${TO} (${color}). Customer notified: ${NOTIFY}`);

// Verify against CURRENT quantities/totals. Note: Order.lineItems[].quantity is
// the immutable *originally-ordered* qty — after an edit the old line still shows
// there at its original qty (and the raw total looks doubled). The truth is in
// `currentQuantity` and `currentTotalPriceSet`. Always confirm with those.
const verify = await gql(`
  query($id: ID!) {
    order(id: $id) {
      displayFinancialStatus
      currentTotalPriceSet { shopMoney { amount currencyCode } }
      totalOutstandingSet { shopMoney { amount } }
      totalRefundedSet { shopMoney { amount } }
      lineItems(first: 20) { edges { node { variantTitle currentQuantity } } }
    }
  }`, { id: order.id });
const vo = verify.order;
const active = vo.lineItems.edges.map((e) => e.node).filter((n) => n.currentQuantity > 0);
console.log(`   current state: ${vo.displayFinancialStatus}  total $${vo.currentTotalPriceSet.shopMoney.amount}  outstanding $${vo.totalOutstandingSet.shopMoney.amount}  refunded $${vo.totalRefundedSet.shopMoney.amount}`);
console.log(`   active line(s): ${active.map((n) => `${n.variantTitle} x${n.currentQuantity}`).join(", ") || "(none)"}`);
