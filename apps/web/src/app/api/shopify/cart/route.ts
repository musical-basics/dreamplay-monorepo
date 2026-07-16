import { NextRequest, NextResponse } from "next/server";

type ShopifyCartLine = {
    variantId: string;
    quantity: number;
    attributes?: Array<{ key: string; value: string }>;
};

type ShopifyCartRequest = {
    lines?: ShopifyCartLine[];
    note?: string;
    attributes?: Array<{ key: string; value: string }>;
    discountCodes?: string[];
};

const SHOPIFY_API_VERSION = process.env.SHOPIFY_STOREFRONT_API_VERSION || "2025-01";
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN
    || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
    || "dreamplay-pianos.myshopify.com";
const SHOPIFY_STOREFRONT_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
    || process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

function toVariantGid(variantId: string) {
    if (variantId.startsWith("gid://")) return variantId;
    return `gid://shopify/ProductVariant/${variantId}`;
}

function sanitizeLines(lines: ShopifyCartLine[] = []) {
    return lines
        .map((line) => ({
            ...line,
            variantId: String(line.variantId || "").trim(),
            quantity: Math.max(1, Number(line.quantity) || 1),
            attributes: (line.attributes || []).filter((attribute) => attribute.key && attribute.value),
        }))
        .filter((line) => /^\d+$/.test(line.variantId) || line.variantId.startsWith("gid://shopify/ProductVariant/"));
}

function buildFallbackCheckoutUrl(lines: ShopifyCartLine[], body: ShopifyCartRequest) {
    const linePath = lines.map((line) => {
        const variantId = line.variantId.replace("gid://shopify/ProductVariant/", "");
        return `${variantId}:${line.quantity}`;
    }).join(",");

    const params = new URLSearchParams();
    if (body.note) params.set("note", body.note);
    if (body.discountCodes?.length) params.set("discount", body.discountCodes.join(","));
    body.attributes?.forEach((attribute) => {
        if (attribute.key && attribute.value) {
            params.append(`attributes[${attribute.key}]`, attribute.value);
        }
    });

    const permalink = `/cart/${linePath}${params.toString() ? `?${params.toString()}` : ""}`;
    return `https://${SHOPIFY_STORE_DOMAIN}/cart/clear?return_to=${encodeURIComponent(permalink)}`;
}

async function createStorefrontCart(lines: ShopifyCartLine[], body: ShopifyCartRequest) {
    const endpoint = `https://${SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
    const mutation = `
        mutation DreamPlayCartCreate($input: CartInput!) {
            cartCreate(input: $input) {
                cart {
                    id
                    checkoutUrl
                    totalQuantity
                    cost {
                        subtotalAmount { amount currencyCode }
                        totalAmount { amount currencyCode }
                    }
                }
                userErrors {
                    field
                    message
                }
            }
        }
    `;

    const input = {
        lines: lines.map((line) => ({
            merchandiseId: toVariantGid(line.variantId),
            quantity: line.quantity,
            attributes: line.attributes,
        })),
        note: body.note,
        attributes: body.attributes,
        discountCodes: body.discountCodes,
    };

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
        },
        body: JSON.stringify({
            query: mutation,
            variables: { input },
        }),
    });

    const payload = await response.json();

    if (!response.ok) {
        throw new Error(`Shopify Storefront API returned ${response.status}`);
    }

    const userErrors = payload?.data?.cartCreate?.userErrors || [];
    if (userErrors.length) {
        throw new Error(userErrors.map((error: { message: string }) => error.message).join(" "));
    }

    const cart = payload?.data?.cartCreate?.cart;
    if (!cart?.checkoutUrl) {
        throw new Error("Shopify did not return a checkout URL.");
    }

    return cart;
}

export async function POST(request: NextRequest) {
    let body: ShopifyCartRequest;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid cart request." }, { status: 400 });
    }

    const lines = sanitizeLines(body.lines);

    if (!lines.length) {
        return NextResponse.json({ error: "Cart is empty or contains unavailable products." }, { status: 400 });
    }

    if (!SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
        return NextResponse.json({
            checkoutUrl: buildFallbackCheckoutUrl(lines, body),
            mode: "permalink",
            warning: "SHOPIFY_STOREFRONT_ACCESS_TOKEN is not configured; using Shopify cart permalink fallback.",
        });
    }

    try {
        const cart = await createStorefrontCart(lines, body);
        return NextResponse.json({
            checkoutUrl: cart.checkoutUrl,
            cart,
            mode: "storefront-api",
        });
    } catch (error) {
        return NextResponse.json({
            checkoutUrl: buildFallbackCheckoutUrl(lines, body),
            mode: "permalink",
            warning: error instanceof Error ? error.message : "Storefront cart failed; using fallback.",
        });
    }
}
