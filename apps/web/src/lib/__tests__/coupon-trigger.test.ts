import { describe, expect, it } from "vitest";
import {
    COUPON_MIN_OPENS,
    COUPON_WAIT_DAYS,
    couponSendKey,
    evaluateCouponCandidates,
    isBotOpen,
    parseCouponSetting,
    summarizeOpens,
    type OpenEventRow,
} from "../coupon-trigger";

const CAMPAIGNS = new Set(["c1", "c2", "c3", "c4"]);

function open(subscriber: string, campaign: string, created_at: string, user_agent: string | null = "Mozilla/5.0"): OpenEventRow {
    return { subscriber_id: subscriber, campaign_id: campaign, created_at, user_agent };
}

describe("summarizeOpens", () => {
    it("counts distinct campaigns, not raw pixel hits", () => {
        // Same campaign opened 5 times must NOT qualify anyone.
        const rows = Array.from({ length: 5 }, (_, i) =>
            open("s1", "c1", `2026-08-1${i}T10:00:00.000Z`),
        );
        expect(summarizeOpens(rows, CAMPAIGNS).size).toBe(0);
    });

    it("qualifies at the third distinct campaign and pins that timestamp", () => {
        const rows = [
            open("s1", "c1", "2026-08-13T10:00:00.000Z"),
            open("s1", "c1", "2026-08-13T18:00:00.000Z"), // repeat, ignored
            open("s1", "c2", "2026-08-16T10:00:00.000Z"),
            open("s1", "c3", "2026-08-18T10:00:00.000Z"), // the qualifying open
            open("s1", "c4", "2026-08-20T10:00:00.000Z"),
        ];
        const summary = summarizeOpens(rows, CAMPAIGNS).get("s1");
        expect(summary).toBeDefined();
        expect(summary?.distinctOpens).toBe(4);
        expect(summary?.qualifiedAt).toBe("2026-08-18T10:00:00.000Z");
        expect(summary?.lastOpenAt).toBe("2026-08-20T10:00:00.000Z");
    });

    it("uses the earliest open of each campaign when rows arrive out of order", () => {
        const rows = [
            open("s1", "c3", "2026-08-18T10:00:00.000Z"),
            open("s1", "c1", "2026-08-13T10:00:00.000Z"),
            open("s1", "c2", "2026-08-16T10:00:00.000Z"),
            open("s1", "c2", "2026-08-14T10:00:00.000Z"), // earlier hit for c2
        ];
        // Sorted first-opens are 08-13 (c1), 08-14 (c2), 08-18 (c3).
        expect(summarizeOpens(rows, CAMPAIGNS).get("s1")?.qualifiedAt).toBe("2026-08-18T10:00:00.000Z");
    });

    it("ignores campaigns outside the tracked set", () => {
        const rows = [
            open("s1", "c1", "2026-08-13T10:00:00.000Z"),
            open("s1", "c2", "2026-08-16T10:00:00.000Z"),
            open("s1", "other", "2026-08-18T10:00:00.000Z"),
        ];
        expect(summarizeOpens(rows, CAMPAIGNS).size).toBe(0);
    });

    it("drops bot opens and unattributable rows", () => {
        const rows: OpenEventRow[] = [
            open("s1", "c1", "2026-08-13T10:00:00.000Z"),
            open("s1", "c2", "2026-08-16T10:00:00.000Z"),
            open("s1", "c3", "2026-08-18T10:00:00.000Z", "Mimecast-Scanner/1.0"),
            { subscriber_id: null, campaign_id: "c4", created_at: "2026-08-19T10:00:00.000Z", user_agent: null },
            { subscriber_id: "s1", campaign_id: null, created_at: "2026-08-19T10:00:00.000Z", user_agent: null },
        ];
        expect(summarizeOpens(rows, CAMPAIGNS).size).toBe(0);
    });

    it("requires exactly COUPON_MIN_OPENS distinct campaigns", () => {
        const rows = Array.from({ length: COUPON_MIN_OPENS - 1 }, (_, i) =>
            open("s1", `c${i + 1}`, `2026-08-1${i}T10:00:00.000Z`),
        );
        expect(summarizeOpens(rows, CAMPAIGNS).size).toBe(0);
        rows.push(open("s1", `c${COUPON_MIN_OPENS}`, "2026-08-19T10:00:00.000Z"));
        expect(summarizeOpens(rows, CAMPAIGNS).size).toBe(1);
    });
});

describe("isBotOpen", () => {
    it("flags scanners but not Gmail's image proxy", () => {
        expect(isBotOpen("Mimecast-Scanner")).toBe(true);
        expect(isBotOpen("Barracuda-Sentinel")).toBe(true);
        expect(isBotOpen("SomeBot/2.0")).toBe(true);
        // Gmail proxies because a human opened the message.
        expect(isBotOpen("Mozilla/5.0 (Windows NT 10.0) GoogleImageProxy")).toBe(false);
        expect(isBotOpen("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe(false);
        expect(isBotOpen(null)).toBe(false);
    });
});

describe("evaluateCouponCandidates", () => {
    const qualifiedAt = "2026-08-18T10:00:00.000Z";
    const baseEngagement = new Map([
        ["s1", { subscriberId: "s1", distinctOpens: 3, qualifiedAt, lastOpenAt: qualifiedAt }],
    ]);
    const baseInput = {
        engagement: baseEngagement,
        subscribers: new Map([["s1", { email: "Reader@example.com", firstName: "Reader" }]]),
        purchasedEmails: new Set<string>(),
        suppressedEmails: new Set<string>(),
        alreadySentIds: new Set<string>(),
        audienceIds: new Set(["s1"]),
        now: new Date("2026-08-22T10:00:00.000Z"), // 4 days after qualifying
    };

    it("sends once the wait has elapsed", () => {
        const [c] = evaluateCouponCandidates(baseInput);
        expect(c?.hold).toBeNull();
        expect(c?.eligibleAt).toBe("2026-08-21T10:00:00.000Z");
        expect(c?.email).toBe("Reader@example.com");
    });

    it("holds until exactly COUPON_WAIT_DAYS have passed", () => {
        const oneMinuteEarly = new Date(
            new Date(qualifiedAt).getTime() + COUPON_WAIT_DAYS * 864e5 - 60_000,
        );
        expect(evaluateCouponCandidates({ ...baseInput, now: oneMinuteEarly })[0]?.hold).toBe("waiting");

        const oneMinuteLate = new Date(new Date(qualifiedAt).getTime() + COUPON_WAIT_DAYS * 864e5 + 60_000);
        expect(evaluateCouponCandidates({ ...baseInput, now: oneMinuteLate })[0]?.hold).toBeNull();
    });

    it("never coupons someone who purchased, matching case-insensitively", () => {
        const result = evaluateCouponCandidates({
            ...baseInput,
            purchasedEmails: new Set(["reader@example.com"]),
        });
        expect(result[0]?.hold).toBe("purchased");
    });

    it("never sends twice", () => {
        expect(evaluateCouponCandidates({ ...baseInput, alreadySentIds: new Set(["s1"]) })[0]?.hold).toBe(
            "already_sent",
        );
    });

    it("respects suppression and audience exclusions", () => {
        expect(
            evaluateCouponCandidates({ ...baseInput, suppressedEmails: new Set(["reader@example.com"]) })[0]?.hold,
        ).toBe("suppressed");
        expect(evaluateCouponCandidates({ ...baseInput, audienceIds: new Set<string>() })[0]?.hold).toBe(
            "not_in_audience",
        );
    });

    it("skips subscribers that are not active (absent from the map)", () => {
        expect(evaluateCouponCandidates({ ...baseInput, subscribers: new Map() })).toEqual([]);
    });

    it("puts sendable candidates first", () => {
        const engagement = new Map([
            ["s1", { subscriberId: "s1", distinctOpens: 3, qualifiedAt, lastOpenAt: qualifiedAt }],
            [
                "s2",
                {
                    subscriberId: "s2",
                    distinctOpens: 5,
                    qualifiedAt: "2026-08-21T23:00:00.000Z",
                    lastOpenAt: "2026-08-21T23:00:00.000Z",
                },
            ],
        ]);
        const result = evaluateCouponCandidates({
            ...baseInput,
            engagement,
            subscribers: new Map([
                ["s1", { email: "a@example.com", firstName: "A" }],
                ["s2", { email: "b@example.com", firstName: "B" }],
            ]),
            audienceIds: new Set(["s1", "s2"]),
        });
        expect(result.map((c) => c.hold)).toEqual([null, "waiting"]);
    });
});

describe("parseCouponSetting", () => {
    it("defaults to disabled with no code", () => {
        expect(parseCouponSetting(null)).toEqual({ enabled: false, discountCode: "", codeNote: "" });
        expect(parseCouponSetting({ enabled: "yes" })).toEqual({ enabled: false, discountCode: "", codeNote: "" });
    });

    it("reads a configured setting and trims the code", () => {
        expect(parseCouponSetting({ enabled: true, discountCode: "  DREAMPLAY50 ", codeNote: "one use" })).toEqual({
            enabled: true,
            discountCode: "DREAMPLAY50",
            codeNote: "one use",
        });
    });
});

describe("couponSendKey", () => {
    it("is stable and per-subscriber", () => {
        expect(couponSendKey("abc")).toBe("marketing-coupon-offer:abc");
        expect(couponSendKey("abc")).toBe(couponSendKey("abc"));
        expect(couponSendKey("abc")).not.toBe(couponSendKey("abd"));
    });
});
