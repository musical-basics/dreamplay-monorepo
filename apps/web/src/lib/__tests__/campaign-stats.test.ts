import { describe, expect, it } from "vitest";
import type { AdminClient } from "@dreamplay/db";
import { formatRate, loadCampaignStats } from "../campaign-stats";

/**
 * Minimal stand-in for the two query shapes loadCampaignStats uses:
 *   .from(t).select(cols).in(col, ids)[.in(col, vals)]
 *   .from("events").select(cols).eq(...).eq(...)
 */
function fakeDb(data: {
    sent_history?: { campaign_id: string }[];
    email_events?: {
        campaign_id: string | null;
        subscriber_id: string | null;
        type: string;
        user_agent: string | null;
    }[];
    events?: { metadata: Record<string, unknown> }[];
}): AdminClient {
    return {
        from(table: string) {
            if (table === "events") {
                // .select().eq(event_name).eq(metadata->>email_campaign_id)
                return {
                    select: () => ({
                        eq: () => ({
                            eq: (_col: string, campaignId: string) =>
                                Promise.resolve({
                                    data: (data.events ?? []).filter(
                                        (e) => e.metadata.email_campaign_id === campaignId,
                                    ),
                                    error: null,
                                }),
                        }),
                    }),
                };
            }
            return {
                select: () => ({
                    in: (_col: string, ids: string[]) => {
                        if (table === "sent_history") {
                            return Promise.resolve({
                                data: (data.sent_history ?? []).filter((r) => ids.includes(r.campaign_id)),
                                error: null,
                            });
                        }
                        // email_events: .in(campaign_id).in(type)
                        return {
                            in: (_c2: string, types: string[]) =>
                                Promise.resolve({
                                    data: (data.email_events ?? []).filter(
                                        (r) =>
                                            r.campaign_id !== null &&
                                            ids.includes(r.campaign_id) &&
                                            types.includes(r.type),
                                    ),
                                    error: null,
                                }),
                        };
                    },
                }),
            };
        },
    } as unknown as AdminClient;
}

describe("loadCampaignStats", () => {
    it("counts unique people, not raw pixel hits", async () => {
        const stats = await loadCampaignStats(
            fakeDb({
                sent_history: [{ campaign_id: "c1" }, { campaign_id: "c1" }, { campaign_id: "c1" }, { campaign_id: "c1" }],
                email_events: [
                    // One person opening four times is ONE opener.
                    { campaign_id: "c1", subscriber_id: "s1", type: "open", user_agent: "Mozilla/5.0" },
                    { campaign_id: "c1", subscriber_id: "s1", type: "open", user_agent: "Mozilla/5.0" },
                    { campaign_id: "c1", subscriber_id: "s1", type: "open", user_agent: "Mozilla/5.0" },
                    { campaign_id: "c1", subscriber_id: "s1", type: "open", user_agent: "Mozilla/5.0" },
                    { campaign_id: "c1", subscriber_id: "s2", type: "open", user_agent: "Mozilla/5.0" },
                    { campaign_id: "c1", subscriber_id: "s1", type: "click", user_agent: "Mozilla/5.0" },
                ],
            }),
            ["c1"],
        );

        const c1 = stats.get("c1")!;
        expect(c1.sent).toBe(4);
        expect(c1.uniqueOpens).toBe(2);
        expect(c1.uniqueClicks).toBe(1);
        expect(c1.openRate).toBe(0.5);
        expect(c1.clickRate).toBe(0.25);
        expect(c1.clickToOpenRate).toBe(0.5);
    });

    it("drops scanner opens but keeps Gmail's proxy", async () => {
        const stats = await loadCampaignStats(
            fakeDb({
                sent_history: [{ campaign_id: "c1" }, { campaign_id: "c1" }],
                email_events: [
                    { campaign_id: "c1", subscriber_id: "s1", type: "open", user_agent: "Mimecast-Scanner/1.0" },
                    {
                        campaign_id: "c1",
                        subscriber_id: "s2",
                        type: "open",
                        user_agent: "Mozilla/5.0 GoogleImageProxy",
                    },
                ],
            }),
            ["c1"],
        );

        expect(stats.get("c1")!.uniqueOpens).toBe(1);
    });

    it("rolls child campaigns up into the draft they came from", async () => {
        // Sends and events are recorded against the child, so a parent with no
        // direct rows must still report its children's numbers.
        const stats = await loadCampaignStats(
            fakeDb({
                sent_history: [{ campaign_id: "child" }, { campaign_id: "child" }],
                email_events: [
                    { campaign_id: "child", subscriber_id: "s1", type: "open", user_agent: null },
                    { campaign_id: "child", subscriber_id: "s1", type: "click", user_agent: null },
                ],
            }),
            ["parent", "child"],
            new Map([["child", "parent"]]),
        );

        expect(stats.has("child")).toBe(false);
        const parent = stats.get("parent")!;
        expect(parent.sent).toBe(2);
        expect(parent.uniqueOpens).toBe(1);
        expect(parent.openRate).toBe(0.5);
    });

    it("sums attributed revenue from purchase metadata", async () => {
        const stats = await loadCampaignStats(
            fakeDb({
                sent_history: [{ campaign_id: "c1" }],
                events: [
                    { metadata: { email_campaign_id: "c1", total_price: "999.00" } },
                    { metadata: { email_campaign_id: "c1", total_price: "549.00" } },
                    { metadata: { email_campaign_id: "other", total_price: "100.00" } },
                ],
            }),
            ["c1"],
        );

        const c1 = stats.get("c1")!;
        expect(c1.attributedOrders).toBe(2);
        expect(c1.attributedRevenue).toBe(1548);
    });

    it("reports null rates rather than dividing by zero before a send", async () => {
        const stats = await loadCampaignStats(fakeDb({}), ["c1"]);
        const c1 = stats.get("c1")!;
        expect(c1.sent).toBe(0);
        expect(c1.openRate).toBeNull();
        expect(c1.clickToOpenRate).toBeNull();
    });

    it("returns an empty map when asked for nothing", async () => {
        expect((await loadCampaignStats(fakeDb({}), [])).size).toBe(0);
    });
});

describe("formatRate", () => {
    it("renders a percentage, and a dash when undefined", () => {
        expect(formatRate(0.42)).toBe("42%");
        expect(formatRate(1)).toBe("100%");
        expect(formatRate(null)).toBe("-");
    });
});
