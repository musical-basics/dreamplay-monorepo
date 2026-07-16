/**
 * Register the orders/create + orders/paid webhooks on the DreamPlay Shopify
 * store so new orders auto-add the buyer to the `buyers` allowlist (and emit a
 * `purchase` analytics event).
 *
 * ⚠️ PHASE 7 ONLY: registering against the LIVE store points production order
 * traffic at the monorepo deployment. Per docs/plan/phase-7-cutover.md (step 1)
 * this happens at cutover, runs in parallel with the legacy webhook for a day,
 * and requires HUMAN approval. Do not run this against dreamplay-pianos
 * during earlier phases except with a dev store / preview URL.
 *
 * Run (from the monorepo root):
 *   SHOPIFY_STORE_DOMAIN=dreamplay-pianos.myshopify.com \
 *   SHOPIFY_CLIENT_ID=... SHOPIFY_CLIENT_SECRET=... \
 *   WEBHOOK_URL=https://www.dreamplaypianos.com/api/webhooks/shopify/orders \
 *   node scripts/shopify/shopify-register-order-webhook.mjs
 *
 * PREREQUISITE: the app used must have the `read_orders` access scope —
 * managed-install tokens only carry the scopes consented at install time, so
 * adding a scope requires uninstall + reinstall on the store. See
 * scripts/shopify/AUTO-ALLOWLIST-SETUP.md.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Load monorepo-root .env.local as a fallback for unset env vars.
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
const webhookUrl = env.WEBHOOK_URL || "https://www.dreamplaypianos.com/api/webhooks/shopify/orders";

async function getToken() {
    const res = await fetch(`https://${domain}/admin/oauth/access_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            client_id: env.SHOPIFY_CLIENT_ID,
            client_secret: env.SHOPIFY_CLIENT_SECRET,
            grant_type: "client_credentials",
        }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`token exchange failed: ${JSON.stringify(json)}`);
    console.log("token scopes:", json.scope);
    return json.access_token;
}

async function gql(token, query, variables = {}) {
    const res = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
        body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors) throw new Error(`GraphQL: ${JSON.stringify(json.errors)}`);
    return json.data;
}

const MUTATION = `
  mutation register($topic: WebhookSubscriptionTopic!, $url: URL!) {
    webhookSubscriptionCreate(topic: $topic, webhookSubscription: { callbackUrl: $url, format: JSON }) {
      webhookSubscription { id topic }
      userErrors { field message }
    }
  }`;

const token = await getToken();
for (const topic of ["ORDERS_CREATE", "ORDERS_PAID"]) {
    try {
        const data = await gql(token, MUTATION, { topic, url: webhookUrl });
        const r = data.webhookSubscriptionCreate;
        if (r.userErrors?.length) console.log(`${topic}: userErrors`, r.userErrors);
        else console.log(`${topic}: registered`, r.webhookSubscription?.id);
    } catch (e) {
        console.error(`${topic}: FAILED -`, e.message);
    }
}
