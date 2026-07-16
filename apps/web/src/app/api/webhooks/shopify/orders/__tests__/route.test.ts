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

    it("skips the duplicate purchase event on a webhook re-fire", async () => {
        eventsLimit.mockResolvedValueOnce({ data: [{ id: 1 }] as never, error: null });

        const body = JSON.stringify({ id: 987654321, email: "buyer@example.com" });
        const res = await POST(makeRequest(body, sign(body)));

        expect(res.status).toBe(200);
        expect(eventsInsert).not.toHaveBeenCalled();
    });
});
