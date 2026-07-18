import { beforeEach, describe, expect, it, vi } from "vitest";
import { Webhook } from "svix";

// ── Tiny in-memory stand-in for the admin Supabase client ──────────────────
type Row = Record<string, unknown>;
const tables: Record<string, Row[]> = {};

function fakeFrom(table: string) {
    tables[table] ??= [];
    const filters: Array<(r: Row) => boolean> = [];
    const chain = {
        select: () => chain,
        eq: (col: string, val: unknown) => {
            filters.push((r) => String(r[col]).toLowerCase() === String(val).toLowerCase());
            return chain;
        },
        maybeSingle: async () => ({ data: tables[table]!.filter((r) => filters.every((f) => f(r)))[0] ?? null, error: null }),
        insert: (row: Row) => {
            tables[table]!.push({ ...row });
            return Promise.resolve({ data: null, error: null });
        },
        upsert: (row: Row, opts?: { onConflict?: string; ignoreDuplicates?: boolean }) => {
            const key = opts?.onConflict ?? "id";
            const existing = tables[table]!.find((r) => String(r[key]).toLowerCase() === String(row[key]).toLowerCase());
            if (existing) {
                if (!opts?.ignoreDuplicates) Object.assign(existing, row);
            } else {
                tables[table]!.push({ ...row });
            }
            return Promise.resolve({ data: null, error: null });
        },
        update: (patch: Row) => ({
            eq: async (col: string, val: unknown) => {
                for (const r of tables[table]!) {
                    if (String(r[col]) === String(val)) Object.assign(r, patch);
                }
                return { data: null, error: null };
            },
        }),
    };
    return chain;
}

vi.mock("@/lib/db", () => ({
    getAdminDb: () => ({ from: fakeFrom }),
}));

import { POST } from "../route";

const SECRET = "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw";

function signedRequest(payload: unknown, secret = SECRET, tamper = false): Request {
    const body = JSON.stringify(payload);
    const msgId = "msg_test_1";
    const timestamp = new Date();
    const signature = new Webhook(secret).sign(msgId, timestamp, body);
    return new Request("https://app.test/api/webhooks/resend", {
        method: "POST",
        headers: {
            "svix-id": msgId,
            "svix-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
            "svix-signature": tamper ? "v1,dGFtcGVyZWRzaWduYXR1cmVpbnZhbGlk" : signature,
            "content-type": "application/json",
        },
        body,
    });
}

const bounceEvent = {
    type: "email.bounced",
    created_at: new Date().toISOString(),
    data: {
        email_id: "re_123",
        to: ["bouncy@example.com"],
        subject: "Test",
        bounce: { type: "hard", message: "mailbox does not exist" },
    },
};

beforeEach(() => {
    for (const key of Object.keys(tables)) delete tables[key];
    tables.subscribers = [{ id: "sub-1", email: "bouncy@example.com", status: "active" }];
    tables.email_events = [];
    tables.suppressions = [];
    process.env.RESEND_WEBHOOK_SECRET = SECRET;
});

describe("POST /api/webhooks/resend", () => {
    it("returns 500 loudly when RESEND_WEBHOOK_SECRET is missing (never skips verification)", async () => {
        delete process.env.RESEND_WEBHOOK_SECRET;
        const res = await POST(signedRequest(bounceEvent));
        expect(res.status).toBe(500);
        expect(tables.email_events).toHaveLength(0);
        expect(tables.suppressions).toHaveLength(0);
    });

    it("rejects an invalid svix signature with 401 and writes nothing", async () => {
        const res = await POST(signedRequest(bounceEvent, SECRET, true));
        expect(res.status).toBe(401);
        expect(tables.email_events).toHaveLength(0);
        expect(tables.suppressions).toHaveLength(0);
    });

    it("rejects a payload signed with the wrong secret", async () => {
        const res = await POST(signedRequest(bounceEvent, "whsec_d3JvbmdzZWNyZXR3cm9uZ3NlY3JldA=="));
        expect(res.status).toBe(401);
    });

    it("bounce: writes email_events + suppressions + subscriber status", async () => {
        const res = await POST(signedRequest(bounceEvent));
        expect(res.status).toBe(200);
        expect(tables.email_events).toHaveLength(1);
        expect(tables.email_events![0]).toMatchObject({ subscriber_id: "sub-1", type: "bounce" });
        expect(tables.suppressions).toHaveLength(1);
        expect(tables.suppressions![0]).toMatchObject({ email: "bouncy@example.com", reason: "bounce" });
        expect(tables.subscribers![0]!.status).toBe("bounced");
    });

    it("complaint: suppresses with reason complaint and status complained", async () => {
        const res = await POST(signedRequest({ ...bounceEvent, type: "email.complained" }));
        expect(res.status).toBe(200);
        expect(tables.suppressions![0]).toMatchObject({ reason: "complaint" });
        expect(tables.subscribers![0]!.status).toBe("complained");
    });

    it("delivery: records the event but does NOT suppress", async () => {
        const res = await POST(signedRequest({ ...bounceEvent, type: "email.delivered" }));
        expect(res.status).toBe(200);
        expect(tables.email_events![0]).toMatchObject({ type: "delivery" });
        expect(tables.suppressions).toHaveLength(0);
        expect(tables.subscribers![0]!.status).toBe("active");
    });

    it("acknowledges and ignores unrelated event types", async () => {
        const res = await POST(signedRequest({ ...bounceEvent, type: "email.opened" }));
        expect(res.status).toBe(200);
        expect(tables.email_events).toHaveLength(0);
    });
});
