import { describe, expect, it } from "vitest";
import { applyMergeTags } from "../merge-tags";

describe("applyMergeTags", () => {
    it("uses subscriber values first", () => {
        const out = applyMergeTags("Hi {{first_name}}", {
            subscriber: { first_name: "Lionel" },
            defaults: { first_name: "Musical Family" },
        });
        expect(out).toBe("Hi Lionel");
    });

    it("falls back to defaults when the subscriber field is empty", () => {
        const out = applyMergeTags("Hi {{first_name}}", {
            subscriber: { first_name: "" },
            defaults: { first_name: "Musical Family" },
        });
        expect(out).toBe("Hi Musical Family");
    });

    it("prefers a campaign defaultsOverride over the table default", () => {
        const out = applyMergeTags("Hi {{first_name}}", {
            subscriber: {},
            defaults: { first_name: "Musical Family" },
            defaultsOverride: { first_name: "Muzikale familie" },
        });
        expect(out).toBe("Hi Muzikale familie");
    });

    it("resolves unsubscribe aliases from dynamicVars", () => {
        const out = applyMergeTags(`<a href="{{unsubscribe_url}}">a</a><a href="{{unsubscribe_link_url}}">b</a>`, {
            dynamicVars: { unsubscribe_url: "https://x/unsubscribe?s=1" },
        });
        expect(out).toBe(`<a href="https://x/unsubscribe?s=1">a</a><a href="https://x/unsubscribe?s=1">b</a>`);
    });

    it("applies dynamic vars like discount_code", () => {
        expect(applyMergeTags("Code: {{discount_code}}", { dynamicVars: { discount_code: "SAVE10" } })).toBe(
            "Code: SAVE10"
        );
    });

    it("leaves unknown tags untouched so bugs stay visible", () => {
        expect(applyMergeTags("{{totally_unknown}}", {})).toBe("{{totally_unknown}}");
    });
});
