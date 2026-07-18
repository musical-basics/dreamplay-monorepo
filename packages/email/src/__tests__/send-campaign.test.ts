import { beforeEach, describe, expect, it } from "vitest";
import { clearMergeTagCache } from "../merge-tags";
import { HttpStatusError } from "../retry";
import { sendCampaign, type SendCampaignOptions } from "../send-campaign";
import type { EmailSender, SendEmailPayload } from "../sender";
import { asAdminClient, FakeDb } from "./fake-db";

process.env.EMAIL_UNSUBSCRIBE_SECRET = "test-secret";

/** Recording sender with optional scripted failures per attempt. */
function makeSender(script: Record<string, Array<number | null>> = {}) {
    const calls: SendEmailPayload[] = [];
    const attemptCount: Record<string, number> = {};
    const sender: EmailSender = {
        async send(payload) {
            calls.push(payload);
            const attempts = (attemptCount[payload.to] = (attemptCount[payload.to] ?? 0) + 1);
            const plan = script[payload.to];
            const failure = plan?.[attempts - 1];
            if (failure) throw new HttpStatusError(failure, `scripted ${failure}`);
            return { id: `resend-${payload.to}-${attempts}` };
        },
    };
    return { sender, calls };
}

const noSleep = async () => {};

function baseOptions(overrides: Partial<SendCampaignOptions> = {}): SendCampaignOptions {
    return {
        campaignId: "camp-1",
        sleep: noSleep,
        retry: { sleep: noSleep, baseDelayMs: 1 },
        trackingBaseUrl: "https://link.test",
        ...overrides,
    };
}

function makeDb(): FakeDb {
    const db = new FakeDb();
    db.seed("campaigns", [
        {
            id: "camp-1",
            name: "Test campaign",
            subject_line: "Hello {{first_name}}",
            html_content: "<body><p>Hi {{first_name}}</p><a href='https://example.com/x'>go</a></body>",
            variable_values: { subscriber_ids: ["sub-1", "sub-2", "sub-3"] },
            status: "draft",
            is_template: false,
            workspace: "dreamplay",
            email_type: "campaign",
            send_key: null,
            total_recipients: 0,
        },
    ]);
    db.seed("subscribers", [
        { id: "sub-1", email: "one@example.com", first_name: "One", last_name: "", status: "active", tags: [], workspace: "dreamplay" },
        { id: "sub-2", email: "two@example.com", first_name: "Two", last_name: "", status: "active", tags: [], workspace: "dreamplay" },
        { id: "sub-3", email: "three@example.com", first_name: "Three", last_name: "", status: "active", tags: [], workspace: "dreamplay" },
    ]);
    db.seed("sent_history", []);
    db.seed("suppressions", []);
    db.seed("send_logs", []);
    db.seed("merge_tags", []);
    db.seed("email_events", []);
    return db;
}

beforeEach(() => {
    clearMergeTagCache();
});

describe("sendCampaign idempotency (the 2026-05-12 double-send scenario)", () => {
    it("sends once per recipient and records sent_history immediately", async () => {
        const db = makeDb();
        const { sender, calls } = makeSender();

        const result = await sendCampaign({ db: asAdminClient(db), sender }, baseOptions());

        expect(result.sent).toBe(3);
        expect(result.failed).toBe(0);
        expect(result.completed).toBe(true);
        expect(result.sentHistoryCount).toBe(3);
        expect(calls).toHaveLength(3);
        expect(db.rows("sent_history")).toHaveLength(3);
        // Completion derived from sent_history: total_recipients mirrors it.
        expect(db.rows("campaigns")[0]).toMatchObject({ status: "completed", total_recipients: 3 });
    });

    it("re-running a completed send produces ZERO duplicate emails", async () => {
        const db = makeDb();
        const { sender, calls } = makeSender();
        const deps = { db: asAdminClient(db), sender };

        await sendCampaign(deps, baseOptions());
        expect(calls).toHaveLength(3);

        // Deliberate re-trigger (Inngest step retry / operator re-run).
        const second = await sendCampaign(deps, baseOptions());

        expect(calls).toHaveLength(3); // NOT 6 — no email left the building
        expect(second.sent).toBe(0);
        expect(second.skippedAlreadySent).toBe(3);
        expect(db.rows("sent_history")).toHaveLength(3);
        expect(second.completed).toBe(true);
    });

    it("resumes a partially-completed send without re-sending the done portion", async () => {
        const db = makeDb();
        // sub-1 was already sent by a previous crashed run.
        db.seed("sent_history", [{ id: "h1", campaign_id: "camp-1", subscriber_id: "sub-1", sent_at: new Date().toISOString() }]);
        const { sender, calls } = makeSender();

        const result = await sendCampaign({ db: asAdminClient(db), sender }, baseOptions());

        expect(result.sent).toBe(2);
        expect(result.skippedAlreadySent).toBe(1);
        expect(calls.map((c) => c.to).sort()).toEqual(["three@example.com", "two@example.com"]);
        expect(db.rows("sent_history")).toHaveLength(3);
    });

    it("treats a sent_history unique-violation as a SKIP, not an error", async () => {
        const db = makeDb();
        // The row exists (another invocation won the race)...
        db.seed("sent_history", [{ id: "h1", campaign_id: "camp-1", subscriber_id: "sub-1", sent_at: new Date().toISOString() }]);
        // ...but this invocation's pre-query missed it (simulated race).
        db.queueResult("sent_history", "select", { data: [], error: null, status: 200 });

        const { sender } = makeSender();
        const result = await sendCampaign({ db: asAdminClient(db), sender }, baseOptions());

        expect(result.failed).toBe(0);
        expect(result.skippedAlreadySent).toBe(1); // the 23505 skip
        expect(result.sent).toBe(2);
        // The unique constraint held: still exactly one row for sub-1.
        expect(db.rows("sent_history").filter((r) => r.subscriber_id === "sub-1")).toHaveLength(1);
        expect(db.rows("sent_history")).toHaveLength(3);
    });

    it("template sends with the same sendKey reuse one child campaign (retry-safe)", async () => {
        const db = makeDb();
        db.rows("campaigns")[0]!.is_template = true;
        const { sender, calls } = makeSender();
        const deps = { db: asAdminClient(db), sender };

        const first = await sendCampaign(deps, baseOptions({ sendKey: "key-1" }));
        expect(first.sent).toBe(3);
        expect(first.campaignId).not.toBe("camp-1"); // child, not the template

        const second = await sendCampaign(deps, baseOptions({ sendKey: "key-1" }));
        expect(second.campaignId).toBe(first.campaignId); // SAME child reused
        expect(second.sent).toBe(0);
        expect(second.skippedAlreadySent).toBe(3);
        expect(calls).toHaveLength(3);
        // Exactly one child was created for the key.
        expect(db.rows("campaigns").filter((c) => c.send_key === "key-1")).toHaveLength(1);
    });
});

describe("sendCampaign retry policy", () => {
    it("retries a recipient on 5xx and succeeds without aborting the run", async () => {
        const db = makeDb();
        const { sender, calls } = makeSender({ "two@example.com": [500, 503, null] });

        const result = await sendCampaign({ db: asAdminClient(db), sender }, baseOptions());

        expect(result.sent).toBe(3);
        expect(result.failed).toBe(0);
        // two@example.com took 3 attempts; others 1 each.
        expect(calls.filter((c) => c.to === "two@example.com")).toHaveLength(3);
        expect(calls).toHaveLength(5);
        expect(db.rows("sent_history")).toHaveLength(3);
    });

    it("retries on 429 (rate limit)", async () => {
        const db = makeDb();
        const { sender, calls } = makeSender({ "one@example.com": [429, null] });
        const result = await sendCampaign({ db: asAdminClient(db), sender }, baseOptions());
        expect(result.sent).toBe(3);
        expect(calls.filter((c) => c.to === "one@example.com")).toHaveLength(2);
    });

    it("a permanently failing recipient is counted failed but doesn't sink the others", async () => {
        const db = makeDb();
        const { sender } = makeSender({ "one@example.com": [400] }); // permanent, no retry

        const result = await sendCampaign({ db: asAdminClient(db), sender }, baseOptions());

        expect(result.sent).toBe(2);
        expect(result.failed).toBe(1);
        expect(result.completed).toBe(false);
        expect(db.rows("sent_history")).toHaveLength(2);
        // Campaign NOT marked completed — sent_history doesn't cover the audience.
        expect(db.rows("campaigns")[0]!.status).toBe("sending");
    });
});

describe("sendCampaign suppression enforcement", () => {
    it("skips a suppressed recipient at send time", async () => {
        const db = makeDb();
        db.seed("suppressions", [{ id: "s1", email: "two@example.com", reason: "unsubscribe", source: "test" }]);
        const { sender, calls } = makeSender();

        const result = await sendCampaign({ db: asAdminClient(db), sender }, baseOptions());

        expect(result.sent).toBe(2);
        expect(result.skippedSuppressed).toBe(1);
        expect(calls.map((c) => c.to)).not.toContain("two@example.com");
        expect(db.rows("sent_history")).toHaveLength(2);
    });

    it("excludes non-active subscribers from the audience", async () => {
        const db = makeDb();
        db.rows("subscribers").find((s) => s.id === "sub-3")!.status = "unsubscribed";
        const { sender, calls } = makeSender();

        const result = await sendCampaign({ db: asAdminClient(db), sender }, baseOptions());

        expect(result.sent).toBe(2);
        expect(calls.map((c) => c.to)).not.toContain("three@example.com");
    });

    it("skips a recipient suppressed mid-run (per-recipient check at send time)", async () => {
        const db = makeDb();
        const { calls } = makeSender();
        // Sender that simulates an unsubscribe landing right after the first send.
        const sender: EmailSender = {
            async send(payload) {
                calls.push(payload);
                if (calls.length === 1) {
                    db.rows("suppressions").push({ id: "s1", email: "three@example.com", reason: "complaint", source: "webhook" });
                }
                return { id: `r-${calls.length}` };
            },
        };

        const result = await sendCampaign({ db: asAdminClient(db), sender }, baseOptions());

        expect(calls.map((c) => c.to)).not.toContain("three@example.com");
        expect(result.sent).toBe(2);
        expect(result.skippedSuppressed).toBe(1);
    });
});

describe("sendCampaign rendering", () => {
    it("personalizes merge tags, injects unsubscribe link + headers + pixel + sid/cid", async () => {
        const db = makeDb();
        const { sender, calls } = makeSender();

        await sendCampaign({ db: asAdminClient(db), sender }, baseOptions());

        const one = calls.find((c) => c.to === "one@example.com")!;
        expect(one.subject).toBe("Hello One");
        expect(one.html).toContain("Hi One");
        expect(one.html).toContain("https://link.test/unsubscribe?s=sub-1&c=camp-1&t=");
        expect(one.html).toContain("/api/email/open?c=camp-1&s=sub-1");
        expect(one.html).toContain("sid=sub-1");
        expect(one.html).toContain("cid=camp-1");
        expect(one.headers?.["List-Unsubscribe"]).toContain("/api/email/unsubscribe?s=sub-1");
        expect(one.headers?.["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    });

    it("evaluates {{#if tag_X}} conditionals per recipient", async () => {
        const db = makeDb();
        db.rows("campaigns")[0]!.html_content = "<body>{{#if tag_vip}}VIP-CONTENT{{/endif}}<p>base</p></body>";
        db.rows("subscribers").find((s) => s.id === "sub-1")!.tags = ["vip"];
        const { sender, calls } = makeSender();

        await sendCampaign({ db: asAdminClient(db), sender }, baseOptions());

        expect(calls.find((c) => c.to === "one@example.com")!.html).toContain("VIP-CONTENT");
        expect(calls.find((c) => c.to === "two@example.com")!.html).not.toContain("VIP-CONTENT");
    });
});
