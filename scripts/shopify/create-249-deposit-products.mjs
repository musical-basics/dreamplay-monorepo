/**
 * create-249-deposit-products.mjs — Shopify products for the $249-deposit
 * offer (variants 6b/7b of the Love-vs-Spec 2x2, docs/plan/AB-TEST-LOVE-VS-SPEC.md).
 *
 * Creates two products, each with Size x Finish variants priced $249.00:
 *   - "DreamPlay One ($249 Deposit)"            balance $750 at ship ($999 total)
 *   - "DreamPlay Premium Bundle ($249 Deposit)" balance $850 at ship ($1,099 total)
 *
 * Deposits are not themselves shipped: requiresShipping=false so checkout
 * charges no freight (shipping + taxes ride the balance invoice, exactly like
 * the 50% flow's second half). Inventory untracked (preorder).
 *
 * Published to the Online Store channel because cart permalinks require it —
 * same accepted trade-off as the $200 Pro upgrade product (2026-08-06).
 *
 * Idempotent: existing products are found by title and reused; variants are
 * read back rather than recreated. After --execute it rewrites
 * apps/web/src/config/deposit249-variant-map.ts with the real variant ids.
 *
 * Usage:
 *   node scripts/shopify/create-249-deposit-products.mjs            dry run
 *   node scripts/shopify/create-249-deposit-products.mjs --execute  create + write map
 */

import { readFileSync, writeFileSync } from "node:fs";
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

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || "dreamplay-pianos.myshopify.com";
const VERSION = process.env.SHOPIFY_API_VERSION || "2025-10";
const CLIENT_ID = process.env.SHOPIFY_ADMIN_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_ADMIN_CLIENT_SECRET;
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing env SHOPIFY_ADMIN_CLIENT_ID / SHOPIFY_ADMIN_CLIENT_SECRET");
  process.exit(1);
}

const SIZES = ["DS5.5", "DS6.0", "DS6.5"];
const FINISHES = ["Black", "White"];

const PRODUCTS = [
  {
    tier: "solo",
    title: "DreamPlay One ($249 Deposit)",
    skuPrefix: "DP1-249",
    descriptionHtml:
      "<p>Reserve your DreamPlay One with a $249 deposit. Total price $999 at the Founder's rate: the remaining $750 plus shipping and applicable taxes is charged only when your piano is boxed and ready to ship. Fully refundable before your piano ships. Choose your key size (DS5.5, DS6.0, DS6.5) and finish.</p>",
  },
  {
    tier: "full",
    title: "DreamPlay Premium Bundle ($249 Deposit)",
    skuPrefix: "DPB-249",
    descriptionHtml:
      "<p>Reserve the DreamPlay Premium Bundle (keyboard, stand, sustain pedal, and padded bench) with a $249 deposit. Total price $1,099 at the Founder's rate: the remaining $850 plus shipping and applicable taxes is charged only when your piano is boxed and ready to ship. Fully refundable before your piano ships.</p>",
  },
];

console.log(`>>> MODE: ${EXECUTE ? "EXECUTE (creates products)" : "DRY-RUN"}`);

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

async function gql(query, variables) {
  const res = await fetch(`https://${DOMAIN}/admin/api/${VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL: ${JSON.stringify(json.errors).slice(0, 500)}`);
  return json.data;
}

const bare = (gid) => String(gid).split("/").pop();

async function findProductByTitle(title) {
  const data = await gql(
    `query($q: String!) { products(first: 5, query: $q) { edges { node {
        id title
        variants(first: 20) { edges { node { id price selectedOptions { name value } } } }
      } } } }`,
    { q: `title:'${title.replace(/'/g, "\\'")}'` },
  );
  return data.products.edges.map((e) => e.node).find((p) => p.title === title);
}

async function onlineStorePublicationId() {
  const data = await gql(`{ publications(first: 20) { edges { node { id name } } } }`);
  const pub = data.publications.edges.map((e) => e.node).find((p) => p.name === "Online Store");
  if (!pub) throw new Error("Online Store publication not found");
  return pub.id;
}

function variantMapFromProduct(product) {
  const map = {};
  for (const size of SIZES) { map[size] = {}; for (const f of FINISHES) map[size][f] = ""; }
  for (const edge of product.variants.edges) {
    const v = edge.node;
    const size = v.selectedOptions.find((o) => o.name === "Size")?.value;
    const finish = v.selectedOptions.find((o) => o.name === "Finish")?.value;
    if (size && finish && map[size]) map[size][finish] = bare(v.id);
  }
  return map;
}

const resultMap = {};

for (const spec of PRODUCTS) {
  let product = await findProductByTitle(spec.title);
  if (product) {
    console.log(`= exists: ${spec.title} (${bare(product.id)}), reusing`);
  } else if (!EXECUTE) {
    console.log(`+ would create: ${spec.title} with ${SIZES.length * FINISHES.length} variants @ $249.00`);
    continue;
  } else {
    const created = await gql(
      `mutation($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product { id title options { id name } }
          userErrors { field message }
        }
      }`,
      {
        product: {
          title: spec.title,
          descriptionHtml: spec.descriptionHtml,
          status: "ACTIVE",
          productOptions: [
            { name: "Size", values: SIZES.map((name) => ({ name })) },
            { name: "Finish", values: FINISHES.map((name) => ({ name })) },
          ],
        },
      },
    );
    const errs = created.productCreate.userErrors;
    if (errs?.length) throw new Error(`productCreate ${spec.title}: ${JSON.stringify(errs)}`);
    const productId = created.productCreate.product.id;
    console.log(`+ created: ${spec.title} (${bare(productId)})`);

    const variantInputs = [];
    for (const size of SIZES) {
      for (const finish of FINISHES) {
        variantInputs.push({
          price: "249.00",
          optionValues: [
            { optionName: "Size", name: size },
            { optionName: "Finish", name: finish },
          ],
          inventoryItem: {
            sku: `${spec.skuPrefix}-${size.replace(/\./g, "")}-${finish.slice(0, 3).toUpperCase()}`,
            tracked: false,
            requiresShipping: false,
          },
        });
      }
    }
    const bulk = await gql(
      `mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkCreate(productId: $productId, variants: $variants, strategy: REMOVE_STANDALONE_VARIANT) {
          productVariants { id price selectedOptions { name value } }
          userErrors { field message }
        }
      }`,
      { productId, variants: variantInputs },
    );
    const bulkErrs = bulk.productVariantsBulkCreate.userErrors;
    if (bulkErrs?.length) throw new Error(`variantsBulkCreate ${spec.title}: ${JSON.stringify(bulkErrs)}`);
    console.log(`  + ${bulk.productVariantsBulkCreate.productVariants.length} variants @ $249.00`);

    const pubId = await onlineStorePublicationId();
    const pub = await gql(
      `mutation($id: ID!, $input: [PublicationInput!]!) {
        publishablePublish(id: $id, input: $input) { userErrors { field message } }
      }`,
      { id: productId, input: [{ publicationId: pubId }] },
    );
    if (pub.publishablePublish.userErrors?.length) {
      throw new Error(`publish ${spec.title}: ${JSON.stringify(pub.publishablePublish.userErrors)}`);
    }
    console.log(`  + published to Online Store`);
    product = await findProductByTitle(spec.title);
  }

  if (product) {
    const map = variantMapFromProduct(product);
    resultMap[spec.tier] = map;
    for (const size of SIZES) {
      for (const finish of FINISHES) {
        const id = map[size][finish];
        console.log(`  ${spec.tier} ${size} ${finish}: ${id || "(missing!)"}`);
        const price = product.variants.edges.find((e) => bare(e.node.id) === id)?.node.price;
        if (id && Number(price) !== 249) {
          throw new Error(`${spec.title} ${size}/${finish} priced ${price}, expected 249.00 — refusing to write map`);
        }
      }
    }
  }
}

if (EXECUTE && resultMap.solo && resultMap.full) {
  const mapPath = join(repoRoot, "apps/web/src/config/deposit249-variant-map.ts");
  const rows = (tier) =>
    SIZES.map(
      (s) =>
        `        '${s}': { ${FINISHES.map((f) => `'${f}': '${resultMap[tier][s][f]}'`).join(", ")} },`,
    ).join("\n");
  writeFileSync(
    mapPath,
    `/**
 * Shopify variant IDs for the $249-deposit offer (variants 6b/7b of the
 * Love-vs-Spec 2x2 — docs/plan/AB-TEST-LOVE-VS-SPEC.md).
 *
 * These are SEPARATE Shopify products from the standard $499/$549 deposit
 * products: same configurations, priced $249, with the balance ($750 for the
 * One, $850 for the Premium Bundle) invoiced when the piano ships, exactly
 * like the 50% flow's second half.
 *
 * AUTO-GENERATED by scripts/shopify/create-249-deposit-products.mjs — do not
 * edit by hand. An empty string means "not available": /customize refuses
 * checkout for it rather than silently falling back to a full-price variant.
 */
export const DEPOSIT249_VARIANT_MAP: Record<string, Record<string, Record<string, string>>> = {
    solo: {
${rows("solo")}
    },
    full: {
${rows("full")}
    },
};
`,
  );
  console.log(`>>> wrote ${mapPath}`);
}
console.log(">>> done");
