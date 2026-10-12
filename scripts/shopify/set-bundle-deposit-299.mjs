/**
 * set-bundle-deposit-299.mjs — reprice the Premium Bundle deposit product
 * from $249 to $299 (decision D18, 2026-10-12).
 *
 * Lionel: with both deposit cards at $249 the /customize page read oddly; the
 * bundle's reservation fee becomes $299 (total still $1,099, so the balance
 * at ship drops from $850 to $800). Same product and variant ids, so
 * apps/web/src/config/deposit249-variant-map.ts does not change. Orders
 * already placed keep the price they paid (Shopify line items are frozen at
 * checkout): #1136 paid $249 and still owes the $850 balance.
 *
 * Changes on product 10398999675194: title "($249 Deposit)" -> "($299
 * Deposit)", description amounts, and all variant prices -> 299.00. Handle
 * and SKUs (DPB-249-...) stay as they are. No market price lists exist, so
 * foreign-currency prices follow the USD price automatically.
 *
 * Idempotent; reads everything back and fails loudly on any mismatch.
 *
 * Usage:
 *   node scripts/shopify/set-bundle-deposit-299.mjs            dry run
 *   node scripts/shopify/set-bundle-deposit-299.mjs --execute  apply
 *   node scripts/shopify/set-bundle-deposit-299.mjs --revert --execute   back to $249
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const EXECUTE = process.argv.includes("--execute");
const REVERT = process.argv.includes("--revert");
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
for (const f of [join(repoRoot, ".env.local"), join(repoRoot, "apps/web/.env.local")]) {
  try {
    for (const line of readFileSync(f, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
    }
  } catch {}
}

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || "dreamplay-pianos.myshopify.com";
const VERSION = process.env.SHOPIFY_API_VERSION || "2025-10";
const PRODUCT_ID = "gid://shopify/Product/10398999675194";

const TARGET = REVERT
  ? {
      price: "249.00",
      title: "DreamPlay Premium Bundle ($249 Deposit)",
      descriptionHtml:
        "<p>Reserve the DreamPlay Premium Bundle (keyboard, stand, sustain pedal, and padded bench) with a $249 deposit. Total price $1,099 at the Founder's rate: the remaining $850 plus shipping and applicable taxes is charged only when your piano is boxed and ready to ship. Fully refundable before your piano ships.</p>",
    }
  : {
      price: "299.00",
      title: "DreamPlay Premium Bundle ($299 Deposit)",
      descriptionHtml:
        "<p>Reserve the DreamPlay Premium Bundle (keyboard, stand, sustain pedal, and padded bench) with a $299 deposit. Total price $1,099 at the Founder's rate: the remaining $800 plus shipping and applicable taxes is charged only when your piano is boxed and ready to ship. Fully refundable before your piano ships.</p>",
    };

async function token() {
  const res = await fetch(`https://${DOMAIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_ADMIN_CLIENT_ID,
      client_secret: process.env.SHOPIFY_ADMIN_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });
  if (!res.ok) throw new Error(`Shopify token failed: ${res.status}`);
  return (await res.json()).access_token;
}

const accessToken = await token();
async function gql(query, variables = {}) {
  const res = await fetch(`https://${DOMAIN}/admin/api/${VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": accessToken },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function read() {
  const d = await gql(
    `query($id: ID!) { product(id: $id) { id title status descriptionHtml variants(first: 20) { nodes { id title sku price } } } }`,
    { id: PRODUCT_ID }
  );
  if (!d.product) throw new Error(`product ${PRODUCT_ID} not found`);
  return d.product;
}

const before = await read();
console.log(`>>> MODE: ${EXECUTE ? "EXECUTE" : "DRY-RUN"}${REVERT ? " (REVERT to $249)" : ""}`);
console.log(`product: ${before.title} [${before.status}]`);
for (const v of before.variants.nodes) console.log(`  ${v.title.padEnd(16)} ${v.sku.padEnd(18)} ${v.price} -> ${TARGET.price}`);
console.log(`title: "${before.title}" -> "${TARGET.title}"`);
console.log(`description changes: ${before.descriptionHtml !== TARGET.descriptionHtml}`);

if (!EXECUTE) {
  console.log("\nDry run only. Re-run with --execute to apply.");
  process.exit(0);
}

const up = await gql(
  `mutation($product: ProductUpdateInput!) { productUpdate(product: $product) { product { id title } userErrors { field message } } }`,
  { product: { id: PRODUCT_ID, title: TARGET.title, descriptionHtml: TARGET.descriptionHtml } }
);
if (up.productUpdate.userErrors.length) throw new Error(`productUpdate: ${JSON.stringify(up.productUpdate.userErrors)}`);

const bulk = await gql(
  `mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
     productVariantsBulkUpdate(productId: $productId, variants: $variants) { productVariants { id price } userErrors { field message } }
   }`,
  { productId: PRODUCT_ID, variants: before.variants.nodes.map((v) => ({ id: v.id, price: TARGET.price })) }
);
if (bulk.productVariantsBulkUpdate.userErrors.length) throw new Error(`variantsBulkUpdate: ${JSON.stringify(bulk.productVariantsBulkUpdate.userErrors)}`);

const after = await read();
const bad = after.variants.nodes.filter((v) => Number(v.price) !== Number(TARGET.price));
if (after.title !== TARGET.title || bad.length) {
  throw new Error(`readback mismatch: title="${after.title}", wrong prices: ${JSON.stringify(bad)}`);
}
console.log(`\nDONE: "${after.title}", ${after.variants.nodes.length} variants @ ${TARGET.price} (read back from Shopify).`);
