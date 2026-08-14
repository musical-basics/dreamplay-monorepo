import { NextResponse } from "next/server";

import { getAdminDb } from "@/lib/db";
import { verifyShopifyWebhook } from "@/lib/shopify/verify-webhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Shopify order webhook -> buyers allowlist + purchase analytics event.
 *
 * Registered for topics `orders/create` and `orders/paid` on the DreamPlay
 * Shopify store (registration against the LIVE store happens at Phase 7
 * cutover — see docs/plan/phase-7-cutover.md). Every new order:
 *
 *   1. Upserts the buyer's email into `buyers` — the allowlist that gates the
 *      /my-reservation buyer portal. This is how a new customer can log in and
 *      manage their reservation without a manual CSV import.
 *   2. Emits a `purchase` event into `events` (phase-3 task 4) with order
 *      metadata + `checkout_source` parsed from the order note — the
 *      attribution join point the legacy stack never had. An analytics failure
 *      NEVER fails the webhook response.
 *
 * Idempotent: re-fires (orders/create followed by orders/paid, or Shopify
 * retries) upsert on the email and are harmless; the purchase event insert is
 * deduped on the Shopify order id.
 *
 * Requires:
 *   - SHOPIFY_WEBHOOK_SECRET (HMAC signing secret for the registered webhook)
 *   - NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */

type ShopifyLineItem = {
    title?: string | null;
    quantity?: number | null;
};

type ShopifyOrder = {
    id?: number | string;
    order_number?: number | string;
    name?: string;
    note?: string | null;
    email?: string | null;
    contact_email?: string | null;
    total_price?: string | null;
    currency?: string | null;
    line_items?: ShopifyLineItem[] | null;
    customer?: {
        email?: string | null;
        first_name?: string | null;
        last_name?: string | null;
    } | null;
};

export async function POST(req: Request) {
    const raw = await req.text();
    const hmac = req.headers.get("x-shopify-hmac-sha256");
    const topic = req.headers.get("x-shopify-topic") || "unknown";

    if (!verifyShopifyWebhook(raw, hmac)) {
        console.warn("[shopify-orders-webhook] signature failed", { topic, hasHmac: Boolean(hmac) });
        return new NextResponse("invalid signature", { status: 401 });
    }

    let order: ShopifyOrder;
    try {
        order = JSON.parse(raw);
    } catch {
        return new NextResponse("invalid json", { status: 400 });
    }

    const email = (order.email || order.contact_email || order.customer?.email || "")
        .toLowerCase()
        .trim();

    const name = [order.customer?.first_name, order.customer?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();
    const orderRef = String(order.name ?? order.order_number ?? order.id ?? "unknown");
    const notes = `${name || "DreamPlay buyer"} — auto-added from Shopify order ${orderRef}`;

    const db = getAdminDb();

    if (email) {
        // Idempotent: don't overwrite an existing allowlist entry's notes on re-fire.
        const { error } = await db.from("buyers").upsert(
            {
                email,
                notes,
                source: "shopify_webhook",
                shopify_order_number: orderRef === "unknown" ? null : orderRef,
            },
            { onConflict: "email", ignoreDuplicates: true }
        );

        if (error) {
            console.error("[shopify-orders-webhook] upsert failed", {
                topic,
                email,
                code: error.code,
                message: error.message,
            });
            // 500 so Shopify retries (e.g. transient DB error).
            return new NextResponse("db error", { status: 500 });
        }
    }

    // Phase-3 task 4: emit a `purchase` analytics event. Isolated in its own
    // try/catch — an analytics failure must NEVER fail the webhook response
    // (Shopify would retry and the buyers upsert already succeeded).
    try {
        const note = order.note || "";
        // Legacy dreamplay-analytics parsing: order.note carries a
        // "checkout_source:pdp" / "checkout_source:customize" marker.
        const sourceMatch = note.match(/checkout_source:(\w+)/);
        const checkoutSource = sourceMatch ? sourceMatch[1] : "unknown";
        // D11: the checkout handoff also plants "ab_variant:<key>" and
        // "dp_session:<id>" in the note — the only way variant/session survive
        // into a cookie-less webhook. Parsing them makes purchases scoreable.
        const abVariant = note.match(/ab_variant:(\d+[a-z])/)?.[1] ?? null;
        const dpSession = note.match(/dp_session:([A-Za-z0-9_-]{8,64})/)?.[1] ?? null;
        // Email attribution: the subscriber and campaign whose link brought
        // this buyer to the site. Strictly UUID-shaped so a malformed or
        // hand-edited note can never write junk into a foreign key.
        const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
        const emailSubscriberId = note.match(new RegExp(`dp_sid:(${UUID})`))?.[1] ?? null;
        const emailCampaignId = note.match(new RegExp(`dp_cid:(${UUID})`))?.[1] ?? null;
        const orderId = order.id != null ? String(order.id) : null;

        // Dedupe: this endpoint receives both orders/create and orders/paid
        // (plus Shopify retries) — only log one purchase per order.
        let alreadyLogged = false;
        if (orderId) {
            const { data: existing, error: lookupError } = await db
                .from("events")
                .select("id")
                .eq("event_name", "purchase")
                .eq("metadata->>order_id", orderId)
                .limit(1);
            if (lookupError) throw lookupError;
            alreadyLogged = Boolean(existing?.length);
        }

        // events.subscriber_id is a real FK, so a stale cookie pointing at a
        // deleted subscriber would abort the insert and lose the purchase
        // event entirely. Verify it resolves first; the raw ids go into
        // metadata either way, so attribution survives even when the FK does
        // not.
        let resolvedSubscriberId: string | null = null;
        if (emailSubscriberId) {
            const { data: sub } = await db
                .from("subscribers")
                .select("id")
                .eq("id", emailSubscriberId)
                .maybeSingle();
            resolvedSubscriberId = sub?.id ?? null;
        }

        if (!alreadyLogged) {
            const { error: eventError } = await db.from("events").insert({
                event_name: "purchase",
                path: "/webhook/shopify",
                email: email || null,
                subscriber_id: resolvedSubscriberId,
                session_id: dpSession,
                ip_address:
                    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "shopify-webhook",
                user_agent: "Shopify-Webhook",
                metadata: {
                    ...(abVariant
                        ? { ab_variant: abVariant, ab_experiments: { funnel: abVariant } }
                        : {}),
                    // Email attribution, kept in metadata even when the
                    // subscriber FK did not resolve, so a campaign can still
                    // be credited for the sale.
                    ...(emailCampaignId ? { email_campaign_id: emailCampaignId } : {}),
                    ...(emailSubscriberId ? { email_subscriber_id: emailSubscriberId } : {}),
                    topic,
                    order_id: orderId,
                    order_number:
                        order.order_number != null ? String(order.order_number) : order.name ?? null,
                    order_name: order.name ?? null,
                    total_price: order.total_price ?? null,
                    currency: order.currency ?? null,
                    line_items: (order.line_items ?? []).map((li) => ({
                        title: li.title ?? null,
                        quantity: li.quantity ?? null,
                    })),
                    customer_email: email || null,
                    checkout_source: checkoutSource,
                    note,
                },
            });
            if (eventError) throw eventError;
        }
    } catch (err) {
        console.error("[shopify-orders-webhook] purchase event insert failed (non-fatal)", {
            topic,
            orderRef,
            error: err instanceof Error ? err.message : err,
        });
    }

    if (!email) {
        // Acknowledge so Shopify stops retrying; nothing to allowlist.
        return NextResponse.json({ ok: true, skipped: "no_email" });
    }

    return NextResponse.json({ ok: true, topic, email });
}
