import { describe, expect, it } from "vitest";
import {
    CAPTURE_WORKSPACE,
    captureTags,
    normalizeCaptureEmail,
    planSubscriberCapture,
    type ExistingSubscriber,
} from "../subscriber-capture";

function existing(overrides: Partial<ExistingSubscriber> = {}): ExistingSubscriber {
    return {
        id: "sub-1",
        tags: ["Hand Guide Download"],
        status: "active",
        first_name: "Manny",
        workspace: "musicalbasics",
        ...overrides,
    };
}

describe("captureTags", () => {
    it("trims and de-duplicates", () => {
        expect(captureTags([" Pro Waitlist ", "Pro Waitlist", ""])).toEqual(["Pro Waitlist"]);
    });

    it("falls back to the legacy default when a form sends none", () => {
        expect(captureTags(undefined)).toEqual(["Website Import"]);
        expect(captureTags([])).toEqual(["Website Import"]);
    });
});

describe("planSubscriberCapture", () => {
    it("inserts a new subscriber into the capture workspace", () => {
        const plan = planSubscriberCapture(null, {
            email: "  New@Example.com ",
            firstName: " Ana ",
            tags: ["Pro Waitlist"],
            countryCode: "US",
        });
        expect(plan).toEqual({
            kind: "insert",
            row: {
                email: "new@example.com",
                first_name: "Ana",
                tags: ["Pro Waitlist"],
                status: "active",
                workspace: CAPTURE_WORKSPACE,
                country_code: "US",
            },
        });
    });

    it("drops the Unknown country placeholder", () => {
        const plan = planSubscriberCapture(null, { email: "a@b.co", countryCode: "Unknown" });
        expect(plan.kind === "insert" && "country_code" in plan.row).toBe(false);
    });

    it("merges tags into an existing row in any workspace without moving it", () => {
        const plan = planSubscriberCapture(existing(), { email: "manny@example.com", tags: ["Pro Waitlist"] });
        expect(plan).toEqual({
            kind: "update",
            id: "sub-1",
            patch: { tags: ["Hand Guide Download", "Pro Waitlist"] },
        });
    });

    it("fills a missing first name but never overwrites one", () => {
        const blank = planSubscriberCapture(existing({ first_name: "" }), { email: "x@y.z", firstName: "Manny" });
        expect(blank.kind === "update" && blank.patch.first_name).toBe("Manny");

        const named = planSubscriberCapture(existing(), { email: "x@y.z", firstName: "Someone Else" });
        expect(named.kind === "update" && "first_name" in named.patch).toBe(false);
    });

    it("never re-activates an unsubscribed, bounced or complained address", () => {
        for (const status of ["unsubscribed", "bounced", "complained"]) {
            const plan = planSubscriberCapture(existing({ status }), { email: "x@y.z", tags: ["Pro Waitlist"] });
            expect(plan.kind === "update" && "status" in plan.patch).toBe(false);
        }
    });

    it("re-activates an inactive or deleted row on a fresh signup", () => {
        for (const status of ["inactive", "deleted"]) {
            const plan = planSubscriberCapture(existing({ status }), { email: "x@y.z" });
            expect(plan.kind === "update" && plan.patch.status).toBe("active");
        }
    });

    it("handles a row with null tags", () => {
        const plan = planSubscriberCapture(existing({ tags: null }), { email: "x@y.z", tags: ["Footer Form"] });
        expect(plan.kind === "update" && plan.patch.tags).toEqual(["Footer Form"]);
    });
});

describe("normalizeCaptureEmail", () => {
    it("lowercases and trims", () => {
        expect(normalizeCaptureEmail("  Nandez@Hotmail.COM ")).toBe("nandez@hotmail.com");
    });
});
