/**
 * SERVER-ONLY MODULE — never import from client components.
 * (Legacy used `import "server-only"`; the package isn't installed in this
 * workspace, so the guard is documented here instead. Add the `server-only`
 * dep and restore the import if desired.)
 *
 * Server-side Shopify Admin API helper for the "DreamPlay Website Admin" app.
 *
 * Uses client-credentials to mint a short-lived Admin API token (cached in
 * module scope) and run GraphQL. Used by the buyer portal to show each buyer the
 * actual configuration (size / finish) on their order, pulled live from Shopify.
 *
 * Requires (set in .env.local locally AND in Vercel for production):
 *   - SHOPIFY_ADMIN_CLIENT_ID / SHOPIFY_ADMIN_CLIENT_SECRET
 *   - SHOPIFY_STORE_DOMAIN (default dreamplay-pianos.myshopify.com)
 *   - SHOPIFY_API_VERSION (default 2025-10)
 *   - read_all_orders scope (orders >60 days old)
 *
 * All functions fail soft (return null / []) so a Shopify hiccup never breaks
 * the portal: the order card simply doesn't render. The one exception is
 * `adminGraphql`, which throws: background jobs that move money (the payment
 * auto-capture sweep) must not mistake "Shopify was unreachable" for "nothing
 * to do".
 */

const domain = process.env.SHOPIFY_STORE_DOMAIN || "dreamplay-pianos.myshopify.com";
const version = process.env.SHOPIFY_API_VERSION || "2025-10";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAdminToken(): Promise<string | null> {
    const id = process.env.SHOPIFY_ADMIN_CLIENT_ID;
    const secret = process.env.SHOPIFY_ADMIN_CLIENT_SECRET;
    if (!id || !secret) {
        console.warn("[shopify-admin] missing SHOPIFY_ADMIN_CLIENT_ID/SECRET");
        return null;
    }
    if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;

    try {
        const res = await fetch(`https://${domain}/admin/oauth/access_token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ client_id: id, client_secret: secret, grant_type: "client_credentials" }),
            cache: "no-store",
        });
        if (!res.ok) {
            console.error("[shopify-admin] token exchange failed", res.status);
            return null;
        }
        const json = await res.json();
        cachedToken = { token: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 };
        return cachedToken.token;
    } catch (err) {
        console.error("[shopify-admin] token exchange error", err);
        return null;
    }
}

/**
 * Strict Admin GraphQL call: throws on missing credentials, HTTP errors and
 * GraphQL `errors` instead of returning null. Mutation `userErrors` are part
 * of `data` and are left for the caller to inspect.
 */
export async function adminGraphql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const token = await getAdminToken();
    if (!token) throw new Error("Shopify Admin token unavailable (check SHOPIFY_ADMIN_CLIENT_ID/SECRET)");
    const res = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
        body: JSON.stringify({ query, variables }),
        cache: "no-store",
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Shopify Admin API responded ${res.status}: ${text.slice(0, 300)}`);
    }
    const json = await res.json();
    if (json.errors) throw new Error(`Shopify GraphQL errors: ${JSON.stringify(json.errors).slice(0, 500)}`);
    return json.data as T;
}

/** Shopify admin URL for an order, from its GraphQL id. */
export function shopifyAdminOrderUrl(orderGid: string): string {
    const store = domain.replace(/\.myshopify\.com$/, "");
    const numericId = orderGid.split("/").pop() ?? orderGid;
    return `https://admin.shopify.com/store/${store}/orders/${numericId}`;
}

async function adminGql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T | null> {
    try {
        return await adminGraphql<T>(query, variables);
    } catch (err) {
        console.error("[shopify-admin] gql error", err instanceof Error ? err.message : err);
        return null;
    }
}

export type BuyerOrderItem = {
    title: string;
    size: string | null;
    finish: string | null;
    quantity: number;
};

export type BuyerOrderSummary = {
    orderName: string;
    createdAt: string;
    items: BuyerOrderItem[];
};

const attr = (list: { key: string; value: string }[] | undefined, name: string) =>
    list?.find((a) => a.key.toLowerCase() === name)?.value ?? null;

const optByNames = (
    opts: { name: string; value: string }[] | undefined,
    names: string[]
) => opts?.find((o) => names.includes(o.name.toLowerCase()))?.value ?? null;

/**
 * Most-recent order for a buyer email, normalized to product + size + finish.
 * Reads size/finish from line-item properties first (how our bundle lines store
 * them), falling back to the variant's selected options.
 */
export async function getLatestOrderForEmail(email: string): Promise<BuyerOrderSummary | null> {
    const e = email.toLowerCase().trim();
    if (!e) return null;

    const data = await adminGql<{
        orders: { edges: { node: {
            name: string;
            createdAt: string;
            lineItems: { edges: { node: {
                title: string;
                quantity: number;
                customAttributes: { key: string; value: string }[];
                variant: { selectedOptions: { name: string; value: string }[] } | null;
            } }[] };
        } }[] };
    }>(
        `query($q: String!) {
            orders(first: 1, query: $q, sortKey: CREATED_AT, reverse: true) {
                edges { node {
                    name createdAt
                    lineItems(first: 20) { edges { node {
                        title quantity
                        customAttributes { key value }
                        variant { selectedOptions { name value } }
                    } } }
                } }
            }
        }`,
        { q: `email:${e}` }
    );

    const node = data?.orders?.edges?.[0]?.node;
    if (!node) return null;

    const items: BuyerOrderItem[] = node.lineItems.edges.map(({ node: n }) => ({
        title: n.title,
        size: attr(n.customAttributes, "size") ?? optByNames(n.variant?.selectedOptions, ["size"]),
        finish:
            attr(n.customAttributes, "finish") ??
            attr(n.customAttributes, "color") ??
            optByNames(n.variant?.selectedOptions, ["finish", "color", "colour"]),
        quantity: n.quantity,
    }));

    return { orderName: node.name, createdAt: node.createdAt, items };
}

/** Human-readable size note. DS5.5 = 7/8ths, DS6.0 = 15/16ths, DS6.5 = full size. */
export function sizeLabel(size: string | null): string | null {
    if (!size) return null;
    const map: Record<string, string> = {
        "DS5.5": "7/8ths size",
        "DS6.0": "15/16ths size",
        "DS6.5": "Full size",
    };
    return map[size] ?? null;
}
