import { describe, expect, it } from "vitest";
import {
    hasProWaitlistTag,
    parseProWaitlistSetting,
    proWaitlistSendKey,
    PRO_WAITLIST_TEMPLATE_KEY,
} from "../pro-waitlist-email";

describe("parseProWaitlistSetting", () => {
    it("is OFF unless enabled is exactly true", () => {
        expect(parseProWaitlistSetting(null).enabled).toBe(false);
        expect(parseProWaitlistSetting(undefined).enabled).toBe(false);
        expect(parseProWaitlistSetting({}).enabled).toBe(false);
        expect(parseProWaitlistSetting({ enabled: "true" }).enabled).toBe(false);
        expect(parseProWaitlistSetting({ enabled: 1 }).enabled).toBe(false);
        expect(parseProWaitlistSetting({ enabled: true }).enabled).toBe(true);
    });
});

describe("hasProWaitlistTag", () => {
    it("matches the waitlist card's tag only", () => {
        expect(hasProWaitlistTag(["Pro Waitlist"])).toBe(true);
        expect(hasProWaitlistTag([" Pro Waitlist "])).toBe(true);
        expect(hasProWaitlistTag(["Website Waitlist", "Footer Form"])).toBe(false);
        expect(hasProWaitlistTag(undefined)).toBe(false);
    });
});

describe("proWaitlistSendKey", () => {
    it("is stable per subscriber and distinct from the template's own key", () => {
        expect(proWaitlistSendKey("sub-1")).toBe(proWaitlistSendKey("sub-1"));
        expect(proWaitlistSendKey("sub-1")).not.toBe(proWaitlistSendKey("sub-2"));
        expect(proWaitlistSendKey("sub-1")).not.toBe(PRO_WAITLIST_TEMPLATE_KEY);
    });
});
