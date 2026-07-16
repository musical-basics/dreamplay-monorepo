/**
 * Print the DreamPlay Website Admin app's current Admin API token scopes and
 * probe how many orders the API can see. Use this to confirm `read_all_orders`
 * has landed after the request is approved + the app reinstalled.
 *
 *   node scripts/shopify/shopify-token-scopes.mjs
 *
 * Reads SHOPIFY_ADMIN_CLIENT_ID / SHOPIFY_ADMIN_CLIENT_SECRET / SHOPIFY_STORE_DOMAIN
 * / SHOPIFY_API_VERSION from the monorepo-root .env.local (falls back to process.env).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

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

const tokenRes = await fetch(`https://${domain}/admin/oauth/access_token`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    client_id: env.SHOPIFY_ADMIN_CLIENT_ID,
    client_secret: env.SHOPIFY_ADMIN_CLIENT_SECRET,
    grant_type: "client_credentials",
  }),
});
const tokenJson = await tokenRes.json();
if (!tokenRes.ok) throw new Error(`token exchange failed: ${JSON.stringify(tokenJson)}`);

const scopes = (tokenJson.scope || "").split(",").map((s) => s.trim()).filter(Boolean);
console.log("Token scopes:", scopes.join(", "));
console.log("read_all_orders present:", scopes.includes("read_all_orders") ? "✅ YES" : "❌ NO");

const probeRes = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": tokenJson.access_token },
  body: JSON.stringify({
    query: `query { orders(first: 250, sortKey: CREATED_AT) { edges { node { name createdAt } } } }`,
  }),
});
const probe = await probeRes.json();
if (probe.errors) {
  console.log("orders probe error:", JSON.stringify(probe.errors));
} else {
  const edges = probe.data.orders.edges;
  console.log(`Orders visible (<=250 page): ${edges.length}`);
  if (edges.length) console.log(`Oldest visible: ${edges[0].node.name} @ ${edges[0].node.createdAt}`);
}
