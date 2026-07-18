import { beforeEach, describe, expect, it } from "vitest";
import {
    appendUnsubscribeFooter,
    buildUnsubscribeUrls,
    processUnsubscribe,
    unsubscribeToken,
    verifyUnsubscribeToken,
} from "../unsubscribe";
import { asAdminClient, FakeDb } from "./fake-db";

process.env.EMAIL_UNSUBSCRIBE_SECRET = "test-secret";

describe("unsubscribe tokens", () => {
    it("round-trips sign + verify", () => {
        const t = unsubscribeToken("sub-1", "camp-1");
        expect(verifyUnsubscribeToken(t, "sub-1", "camp-1")).toBe(true);
    });

    it("rejects a token for a different subscriber/campaign", () => {
        const t = unsubscribeToken("sub-1", "camp-1");
        expect(verifyUnsubscribeToken(t, "sub-2", "camp-1")).toBe(false);
        expect(verifyUnsubscribeToken(t, "sub-1", "camp-2")).toBe(false);
        expect(verifyUnsubscribeToken("deadbeef", "sub-1", "camp-1")).toBe(false);
        expect(verifyUnsubscribeToken(null, "sub-1", "camp-1")).toBe(false);
    });

    it("puts the signed token into both URLs", () => {
        const urls = buildUnsubscribeUrls("https://link.test", "sub-1", "camp-1");
        const t = unsubscribeToken("sub-1", "camp-1");
        expect(urls.pageUrl).toBe(`https://link.test/unsubscribe?s=sub-1&c=camp-1&t=${t}`);
        expect(urls.oneClickUrl).toBe(`https://link.test/api/email/unsubscribe?s=sub-1&c=camp-1&t=${t}`);
    });
});

describe("appendUnsubscribeFooter", () => {
    it("appends the footer when no unsubscribe placeholder exists", () => {
        const out = appendUnsubscribeFooter("<body><p>hi</p></body>");
        expect(out).toContain("{{unsubscribe_url}}");
        expect(out.indexOf("</body>")).toBeGreaterThan(out.indexOf("{{unsubscribe_url}}"));
    });

    it("skips when the template already references unsubscribe", () => {
        const html = `<a href="{{unsubscribe_url}}">bye</a>`;
        expect(appendUnsubscribeFooter(html)).toBe(html);
    });
});

describe("processUnsubscribe (one-click writes suppression)", () => {
    let db: FakeDb;

    beforeEach(() => {
        db = new FakeDb();
        db.seed("subscribers", [{ id: "sub-1", email: "a@example.com", status: "active", tags: [] }]);
        db.seed("suppressions", []);
        db.seed("email_events", []);
    });

    it("writes suppressions + subscriber status + email_events", async () => {
        const result = await processUnsubscribe(asAdminClient(db), {
            subscriberId: "sub-1",
            campaignId: "camp-1",
            source: "one-click",
        });
        expect(result.ok).toBe(true);
        expect(result.email).toBe("a@example.com");

        expect(db.rows("suppressions")).toHaveLength(1);
        expect(db.rows("suppressions")[0]).toMatchObject({ email: "a@example.com", reason: "unsubscribe" });
        expect(db.rows("subscribers")[0]!.status).toBe("unsubscribed");
        expect(db.rows("email_events")).toHaveLength(1);
        expect(db.rows("email_events")[0]).toMatchObject({ subscriber_id: "sub-1", type: "unsubscribe" });
    });

    it("is idempotent — repeating stays ok with a single suppression row", async () => {
        await processUnsubscribe(asAdminClient(db), { subscriberId: "sub-1", source: "one-click" });
        const second = await processUnsubscribe(asAdminClient(db), { subscriberId: "sub-1", source: "one-click" });
        expect(second.ok).toBe(true);
        expect(db.rows("suppressions")).toHaveLength(1);
    });

    it("does not downgrade a bounced status", async () => {
        db.rows("subscribers")[0]!.status = "bounced";
        await processUnsubscribe(asAdminClient(db), { subscriberId: "sub-1", source: "one-click" });
        expect(db.rows("subscribers")[0]!.status).toBe("bounced");
        expect(db.rows("suppressions")).toHaveLength(1);
    });

    it("fails cleanly for an unknown subscriber", async () => {
        const result = await processUnsubscribe(asAdminClient(db), { subscriberId: "nope", source: "page" });
        expect(result.ok).toBe(false);
    });
});
