import { describe, expect, it } from "vitest";
import { applyDoneMarkers, finalizeWaveSend } from "../send-wave/done-markers";
import { asAdminClient, FakeDb } from "./fake-db";

/**
 * Non-negotiable fix #3: done markers derive ONLY from sent_history. A
 * recipient who was merely SCHEDULED (but whose send never fired) must not
 * carry the done tag — the legacy race that excluded failed sends from
 * retries.
 */
describe("applyDoneMarkers", () => {
    it("tags only subscribers with a confirmed sent_history row", async () => {
        const db = new FakeDb();
        db.seed("subscribers", [
            { id: "sub-sent", email: "sent@example.com", tags: ["old"] },
            { id: "sub-scheduled-only", email: "scheduled@example.com", tags: [] },
        ]);
        // Both were scheduled, but only sub-sent actually fired.
        db.seed("sent_history", [{ id: "h1", campaign_id: "camp-1", subscriber_id: "sub-sent" }]);

        const result = await applyDoneMarkers(asAdminClient(db), { campaignId: "camp-1", doneTag: "done-x" });

        expect(result.confirmedSent).toBe(1);
        expect(result.newlyTagged).toBe(1);
        expect(db.rows("subscribers").find((s) => s.id === "sub-sent")!.tags).toEqual(["old", "done-x"]);
        expect(db.rows("subscribers").find((s) => s.id === "sub-scheduled-only")!.tags).toEqual([]);
    });

    it("is idempotent — re-running does not duplicate the tag", async () => {
        const db = new FakeDb();
        db.seed("subscribers", [{ id: "sub-1", email: "a@example.com", tags: [] }]);
        db.seed("sent_history", [{ id: "h1", campaign_id: "camp-1", subscriber_id: "sub-1" }]);

        await applyDoneMarkers(asAdminClient(db), { campaignId: "camp-1", doneTag: "done-x" });
        const second = await applyDoneMarkers(asAdminClient(db), { campaignId: "camp-1", doneTag: "done-x" });

        expect(second.newlyTagged).toBe(0);
        expect(db.rows("subscribers")[0]!.tags).toEqual(["done-x"]);
    });
});

describe("finalizeWaveSend", () => {
    it("finalizes every child in the doneTag send_key namespace", async () => {
        const db = new FakeDb();
        db.seed("campaigns", [
            { id: "child-1", send_key: "done-x:A:0" },
            { id: "child-2", send_key: "done-x:B:0" },
            { id: "other", send_key: "done-y:A:0" },
        ]);
        db.seed("subscribers", [
            { id: "sub-1", email: "a@example.com", tags: [] },
            { id: "sub-2", email: "b@example.com", tags: [] },
        ]);
        db.seed("sent_history", [
            { id: "h1", campaign_id: "child-1", subscriber_id: "sub-1" },
            { id: "h2", campaign_id: "child-2", subscriber_id: "sub-2" },
        ]);

        const results = await finalizeWaveSend(asAdminClient(db), { doneTag: "done-x" });

        expect(results).toHaveLength(2);
        expect(db.rows("subscribers").every((s) => (s.tags as string[]).includes("done-x"))).toBe(true);
    });
});
