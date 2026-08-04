import { createHmac } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Unit tests for the Shopify orders webhook:
 *   - bad / missing HMAC signature -> 401, no DB writes
 *   - valid signature -> buyers upsert + purchase event insert
 */

const SECRET = "shpss_test_secret";

const buyersUpsert = vi.fn<(row: unknown, opts: unknown) => Promise<{ error: null }>>(
    async () => ({ error: null })
);
const eventsInsert = vi.fn<(row: unknown) => Promise<{ error: null }>>(async () => ({
    error: null,
}));
const eventsLimit = vi.fn(async () => ({ data: [], error: null }));

const eventsTable = {
    insert: eventsInsert,
    select: () => ({
        eq: () => ({
            eq: () => ({ limit: eventsLimit }),
        }),
    }),
};

vi.mock("@/lib/db", () => ({
    getAdminDb: () => ({
        from: (table: string) => (table === "buyers" ? { upsert: buyersUpsert } : eventsTable),
    }),
}));

import { POST } from "../route";

function sign(body: string): string {
    return createHmac("sha256", SECRET).update(body, "utf8").digest("base64");
}

function makeRequest(body: string, hmac?: string): Request {
    const headers = new Headers({ "x-shopify-topic": "orders/create" });
    if (hmac !== undefined) headers.set("x-shopify-hmac-sha256", hmac);
    return new Request("https://www.dreamplaypianos.com/api/webhooks/shopify/orders", {
        method: "POST",
        headers,
        body,
    });
}

beforeEach(() => {
    process.env.SHOPIFY_WEBHOOK_SECRET = SECRET;
    vi.clearAllMocks();
});

describe("POST /api/webhooks/shopify/orders", () => {
    it("rejects a bad HMAC signature with 401 and writes nothing", async () => {
        const body = JSON.stringify({ id: 1, email: "buyer@example.com" });
        const res = await POST(makeRequest(body, "not-the-right-signature"));

        expect(res.status).toBe(401);
        expect(buyersUpsert).not.toHaveBeenCalled();
        expect(eventsInsert).not.toHaveBeenCalled();
    });

    it("rejects a missing HMAC header with 401", async () => {
        const body = JSON.stringify({ id: 1, email: "buyer@example.com" });
        const res = await POST(makeRequest(body));

        expect(res.status).toBe(401);
        expect(buyersUpsert).not.toHaveBeenCalled();
    });

    it("upserts the buyer and logs a purchase event on a valid signature", async () => {
        const order = {
            id: 987654321,
            order_number: 1042,
            name: "#1042",
            email: "Buyer@Example.com",
            note: "checkout_source:customize",
            total_price: "1499.00",
            currency: "USD",
            line_items: [{ title: "DreamPlay One DS6.0 Black", quantity: 1 }],
            customer: { first_name: "Ada", last_name: "Lovelace" },
        };
        const body = JSON.stringify(order);
        const res = await POST(makeRequest(body, sign(body)));

        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toMatchObject({ ok: true, email: "buyer@example.com" });

        expect(buyersUpsert).toHaveBeenCalledTimes(1);
        expect(buyersUpsert).toHaveBeenCalledWith(
            {
                email: "buyer@example.com",
                notes: "Ada Lovelace — auto-added from Shopify order #1042",
                source: "shopify_webhook",
                shopify_order_number: "#1042",
            },
            { onConflict: "email", ignoreDuplicates: true }
        );

        expect(eventsInsert).toHaveBeenCalledTimes(1);
        const event = eventsInsert.mock.calls[0]![0] as Record<string, unknown>;
        expect(event).toMatchObject({
            event_name: "purchase",
            path: "/webhook/shopify",
            email: "buyer@example.com",
        });
        expect(event.metadata).toMatchObject({
            order_id: "987654321",
            order_number: "1042",
            total_price: "1499.00",
            currency: "USD",
            checkout_source: "customize",
            line_items: [{ title: "DreamPlay One DS6.0 Black", quantity: 1 }],
        });
    });

    it("attributes the purchase to the A/B variant + session planted in the order note (D11)", async () => {
        const order = {
            id: 111222333,
            email: "buyer@example.com",
            note: "checkout_source:pdp | ab_variant:2b | dp_session:123e4567-e89b-42d3-a456-426614174000",
        };
        const body = JSON.stringify(order);
        const res = await POST(makeRequest(body, sign(body)));

        expect(res.status).toBe(200);
        expect(eventsInsert).toHaveBeenCalledTimes(1);
        const event = eventsInsert.mock.calls[0]![0] as Record<string, unknown>;
        expect(event.session_id).toBe("123e4567-e89b-42d3-a456-426614174000");
        expect(event.metadata).toMatchObject({
            checkout_source: "pdp",
            ab_variant: "2b",
            ab_experiments: { funnel: "2b" },
        });
    });

    it("leaves purchases unattributed when the note has no A/B markers", async () => {
        const body = JSON.stringify({ id: 444, email: "buyer@example.com", note: "checkout_source:shop" });
        const res = await POST(makeRequest(body, sign(body)));

        expect(res.status).toBe(200);
        const event = eventsInsert.mock.calls[0]![0] as Record<string, unknown>;
        expect(event.session_id).toBeNull();
        expect((event.metadata as Record<string, unknown>).ab_variant).toBeUndefined();
    });

    it("skips the duplicate purchase event on a webhook re-fire", async () => {
        eventsLimit.mockResolvedValueOnce({ data: [{ id: 1 }] as never, error: null });

        const body = JSON.stringify({ id: 987654321, email: "buyer@example.com" });
        const res = await POST(makeRequest(body, sign(body)));

        expect(res.status).toBe(200);
        expect(eventsInsert).not.toHaveBeenCalled();
    });
});
