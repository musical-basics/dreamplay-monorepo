import { describe, expect, it } from "vitest";
import {
    easternOffset,
    easternToUtcIso,
    parseAudienceSetting,
    signalsForTags,
    utcIsoToEastern,
} from "../marketing-calendar";

describe("eastern time helpers", () => {
    it("uses EDT (-04:00) in August and EST (-05:00) in January", () => {
        expect(easternOffset("2026-08-13")).toBe("-04:00");
        expect(easternOffset("2026-01-15")).toBe("-05:00");
    });

    it("round-trips a wall-clock send time through UTC", () => {
        const utc = easternToUtcIso("2026-08-13", "09:00");
        expect(utc).toBe("2026-08-13T13:00:00.000Z");
        expect(utcIsoToEastern(utc)).toEqual({ date: "2026-08-13", time: "09:00" });
    });

    it("round-trips across the EST boundary", () => {
        const utc = easternToUtcIso("2026-12-01", "09:00");
        expect(utc).toBe("2026-12-01T14:00:00.000Z");
        expect(utcIsoToEastern(utc)).toEqual({ date: "2026-12-01", time: "09:00" });
    });
});

describe("signalsForTags", () => {
    it("maps only intent tags to labels", () => {
        expect(signalsForTags(["DPHI", "belgium-trailer-2026-05-30", "Hand Guide Download"])).toEqual([
            "High intent score",
            "Downloaded the hand guide",
        ]);
        expect(signalsForTags([])).toEqual([]);
        expect(signalsForTags(null)).toEqual([]);
    });
});

describe("parseAudienceSetting", () => {
    it("accepts a well-formed snapshot and defaults missing fields", () => {
        const parsed = parseAudienceSetting({ subscriberIds: ["a", "b"], builtAt: "2026-08-11T00:00:00Z" });
        expect(parsed).toEqual({
            builtAt: "2026-08-11T00:00:00Z",
            rules: [],
            subscriberIds: ["a", "b"],
            removedIds: [],
        });
    });

    it("rejects malformed values", () => {
        expect(parseAudienceSetting(null)).toBeNull();
        expect(parseAudienceSetting({ subscriberIds: "nope" })).toBeNull();
    });
});
