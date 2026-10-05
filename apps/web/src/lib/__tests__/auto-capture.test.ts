import { describe, expect, it } from "vitest";
import {
    type CaptureOrder,
    type CaptureTransaction,
    DEADLINE_WARNED_TAG,
    DEFAULT_AUTO_CAPTURE_SETTING,
    type GqlOrderNode,
    MANUAL_CAPTURE_TAG,
    decideCapture,
    formatMoney,
    needsDeadlineWarning,
    normalizeOrder,
    parseAutoCaptureSetting,
    planFollowUps,
} from "../auto-capture";
import { buildAutoCaptureEmail, buildSweepFailureEmail } from "../auto-capture-email";

const SETTING = DEFAULT_AUTO_CAPTURE_SETTING; // on, 72 hours
const AUTHORIZED_AT = "2026-10-02T20:05:24Z";
const EXPIRES_AT = "2026-10-09T20:05:24Z";
const BEFORE_DUE = new Date("2026-10-05T20:00:00Z");
const AFTER_DUE = new Date("2026-10-05T21:00:00Z");

function auth(overrides: Partial<CaptureTransaction> = {}): CaptureTransaction {
    return {
        id: "gid://shopify/OrderTransaction/1",
        kind: "AUTHORIZATION",
        status: "SUCCESS",
        createdAt: AUTHORIZED_AT,
        authorizationExpiresAt: EXPIRES_AT,
        amount: { amount: "249.0", currencyCode: "USD" },
        unsettled: { amount: "249.0", currencyCode: "USD" },
        ...overrides,
    };
}

function order(overrides: Partial<CaptureOrder> = {}): CaptureOrder {
    return {
        id: "gid://shopify/Order/100",
        name: "#2000",
        createdAt: "2026-10-02T20:05:27Z",
        cancelledAt: null,
        test: false,
        capturable: true,
        tags: [],
        presentmentCurrency: "USD",
        currentTotal: { amount: "249.0", currencyCode: "USD" },
        riskRecommendation: "ACCEPT",
        riskPending: false,
        riskFacts: [],
        transactions: [auth()],
        ...overrides,
    };
}

const AUTH_1136: GqlOrderNode["transactions"][number] = {
    id: "gid://shopify/OrderTransaction/20785636802874",
    kind: "AUTHORIZATION",
    status: "SUCCESS",
    createdAt: "2026-10-02T20:05:24Z",
    authorizationExpiresAt: "2026-10-09T20:05:24Z",
    amountSet: { presentmentMoney: { amount: "191.0", currencyCode: "GBP" } },
    totalUnsettledSet: { presentmentMoney: { amount: "191.0", currencyCode: "GBP" } },
};

/** Shaped exactly like the live Admin API response for #1136 (2026-10-05). */
const NODE_1136: GqlOrderNode = {
    id: "gid://shopify/Order/18921919119674",
    name: "#1136",
    createdAt: "2026-10-02T20:05:27Z",
    cancelledAt: null,
    test: false,
    capturable: true,
    tags: [],
    presentmentCurrencyCode: "GBP",
    currentTotalPriceSet: { presentmentMoney: { amount: "191.0", currencyCode: "GBP" } },
    risk: {
        recommendation: "ACCEPT",
        assessments: [
            {
                riskLevel: "LOW",
                facts: [
                    { description: "Billing address matches the card", sentiment: "POSITIVE" },
                    { description: "Shipping address is 410 miles from location of IP address", sentiment: "NEGATIVE" },
                ],
            },
        ],
    },
    transactions: [AUTH_1136],
};

describe("parseAutoCaptureSetting", () => {
    it("defaults to on at 72 hours when no row exists", () => {
        expect(parseAutoCaptureSetting(null)).toEqual({ enabled: true, holdHours: 72 });
        expect(parseAutoCaptureSetting(undefined)).toEqual({ enabled: true, holdHours: 72 });
    });

    it("treats a row without an enabled flag as on", () => {
        expect(parseAutoCaptureSetting({ holdHours: 48 })).toEqual({ enabled: true, holdHours: 48 });
    });

    it("switches off on any hand-written off value, not just false", () => {
        expect(parseAutoCaptureSetting({ enabled: false }).enabled).toBe(false);
        expect(parseAutoCaptureSetting({ enabled: "false" }).enabled).toBe(false);
        expect(parseAutoCaptureSetting({ enabled: 0 }).enabled).toBe(false);
        expect(parseAutoCaptureSetting({ enabled: true }).enabled).toBe(true);
    });

    it("clamps the hold period to 0..168 and rejects junk", () => {
        expect(parseAutoCaptureSetting({ holdHours: 500 }).holdHours).toBe(168);
        expect(parseAutoCaptureSetting({ holdHours: -5 }).holdHours).toBe(0);
        expect(parseAutoCaptureSetting({ holdHours: "48" }).holdHours).toBe(72);
        expect(parseAutoCaptureSetting({ holdHours: Number.NaN }).holdHours).toBe(72);
    });
});

describe("decideCapture timing", () => {
    it("waits until 72 hours after authorization, then captures", () => {
        const before = decideCapture(order(), SETTING, BEFORE_DUE);
        expect(before.action).toBe("wait");
        if (before.action === "wait") expect(before.captureAt).toBe("2026-10-05T20:05:24.000Z");

        const after = decideCapture(order(), SETTING, AFTER_DUE);
        expect(after).toMatchObject({
            action: "capture",
            authorizationId: "gid://shopify/OrderTransaction/1",
            amount: "249.0",
            currencyCode: "USD",
            expiresAt: EXPIRES_AT,
        });
    });

    it("never plans a capture later than 24 hours before expiry", () => {
        const decision = decideCapture(order(), { enabled: true, holdHours: 160 }, BEFORE_DUE);
        expect(decision.action).toBe("wait");
        if (decision.action === "wait") expect(decision.captureAt).toBe("2026-10-08T20:05:24.000Z");
    });

    it("assumes a 7-day window when Shopify omits the expiry", () => {
        const decision = decideCapture(
            order({ transactions: [auth({ authorizationExpiresAt: null })] }),
            SETTING,
            BEFORE_DUE,
        );
        expect(decision.action).toBe("wait");
        if (decision.action === "wait") expect(decision.expiresAt).toBe("2026-10-09T20:05:24.000Z");
    });

    it("captures immediately with a zero-hour hold", () => {
        expect(decideCapture(order(), { enabled: true, holdHours: 0 }, new Date("2026-10-02T21:00:00Z")).action).toBe(
            "capture",
        );
    });
});

describe("decideCapture currency", () => {
    it("captures #1136 in the buyer's GBP, never the shop's USD figure", () => {
        const decision = decideCapture(normalizeOrder(NODE_1136), SETTING, AFTER_DUE);
        expect(decision).toMatchObject({ action: "capture", amount: "191.0", currencyCode: "GBP" });
    });

    it("hands over an authorization in a different currency from the order", () => {
        const decision = decideCapture(
            order({ transactions: [auth({ unsettled: { amount: "249.0", currencyCode: "EUR" } })] }),
            SETTING,
            AFTER_DUE,
        );
        expect(decision).toMatchObject({ action: "hold", reason: "currency_mismatch" });
    });
});

describe("decideCapture ignores", () => {
    it.each([
        ["not_capturable", { capturable: false }],
        ["cancelled", { cancelledAt: "2026-10-03T10:00:00Z" }],
        ["test", { test: true }],
    ] as const)("ignores %s orders", (reason, overrides) => {
        expect(decideCapture(order(overrides), SETTING, AFTER_DUE)).toEqual({ action: "ignore", reason });
    });

    it("leaves a capture that is already in flight alone", () => {
        const pending: CaptureTransaction = auth({ id: "cap", kind: "CAPTURE", status: "PENDING", unsettled: null });
        expect(decideCapture(order({ transactions: [auth(), pending] }), SETTING, AFTER_DUE)).toEqual({
            action: "ignore",
            reason: "capture_in_flight",
        });
    });
});

describe("decideCapture hand-overs", () => {
    it("respects the capture-manually tag, case-insensitively, before anything else", () => {
        const decision = decideCapture(
            order({ tags: ["VIP", "Capture-Manually"], riskRecommendation: "CANCEL" }),
            SETTING,
            AFTER_DUE,
        );
        expect(decision).toMatchObject({ action: "hold", reason: "tagged", expiresAt: EXPIRES_AT });
    });

    it("hands over high and medium risk at once, without waiting out the hold", () => {
        const high = decideCapture(
            order({ riskRecommendation: "CANCEL", riskFacts: ["Characteristics similar to fraudulent orders"] }),
            SETTING,
            BEFORE_DUE,
        );
        expect(high).toMatchObject({ action: "hold", reason: "risk_high" });
        if (high.action === "hold") expect(high.detail).toContain("Characteristics similar to fraudulent orders");

        expect(decideCapture(order({ riskRecommendation: "INVESTIGATE" }), SETTING, BEFORE_DUE)).toMatchObject({
            action: "hold",
            reason: "risk_medium",
        });
    });

    it("captures orders Shopify gives no recommendation for", () => {
        expect(decideCapture(order({ riskRecommendation: "NONE" }), SETTING, AFTER_DUE).action).toBe("capture");
    });

    it("waits through a pending fraud check, but hands over if it is still pending at capture time", () => {
        expect(decideCapture(order({ riskPending: true }), SETTING, BEFORE_DUE).action).toBe("wait");
        expect(decideCapture(order({ riskPending: true }), SETTING, AFTER_DUE)).toMatchObject({
            action: "hold",
            reason: "risk_pending",
        });
    });

    it("hands over after a failed capture instead of retrying it", () => {
        const failed = auth({ id: "cap", kind: "CAPTURE", status: "FAILURE", unsettled: null });
        expect(decideCapture(order({ transactions: [auth(), failed] }), SETTING, AFTER_DUE)).toMatchObject({
            action: "hold",
            reason: "capture_failed",
        });
    });

    it("skips failed authorization attempts and captures the one that succeeded (#1099 pattern)", () => {
        const declined = auth({ id: "a0", status: "FAILURE", unsettled: null, authorizationExpiresAt: null });
        const decision = decideCapture(order({ transactions: [declined, declined, auth()] }), SETTING, AFTER_DUE);
        expect(decision).toMatchObject({ action: "capture", authorizationId: "gid://shopify/OrderTransaction/1" });
    });

    it("hands over when there is no open authorization, or more than one", () => {
        expect(
            decideCapture(order({ transactions: [auth({ unsettled: null })] }), SETTING, AFTER_DUE),
        ).toMatchObject({ action: "hold", reason: "no_open_authorization", expiresAt: null });
        expect(
            decideCapture(order({ transactions: [auth(), auth({ id: "second" })] }), SETTING, AFTER_DUE),
        ).toMatchObject({ action: "hold", reason: "multiple_authorizations" });
    });

    it("hands over a partly captured authorization", () => {
        const decision = decideCapture(
            order({ transactions: [auth({ unsettled: { amount: "100.0", currencyCode: "USD" } })] }),
            SETTING,
            AFTER_DUE,
        );
        expect(decision).toMatchObject({ action: "hold", reason: "partially_captured" });
    });

    it("hands over when an edit pushed the order total below the authorization", () => {
        const decision = decideCapture(
            order({ currentTotal: { amount: "199.0", currencyCode: "USD" } }),
            SETTING,
            AFTER_DUE,
        );
        expect(decision).toMatchObject({ action: "hold", reason: "total_below_authorization" });
    });

    it("still captures the authorized amount when an edit raised the total", () => {
        const decision = decideCapture(
            order({ currentTotal: { amount: "299.0", currencyCode: "USD" } }),
            SETTING,
            AFTER_DUE,
        );
        expect(decision).toMatchObject({ action: "capture", amount: "249.0" });
    });
});

describe("needsDeadlineWarning", () => {
    const within = new Date("2026-10-08T21:00:00Z"); // 23h05m before expiry

    it("warns once inside the final 24 hours", () => {
        expect(needsDeadlineWarning(order(), EXPIRES_AT, within)).toBe(true);
        expect(needsDeadlineWarning(order({ tags: [DEADLINE_WARNED_TAG] }), EXPIRES_AT, within)).toBe(false);
    });

    it("stays quiet earlier, or without a known expiry", () => {
        expect(needsDeadlineWarning(order(), EXPIRES_AT, AFTER_DUE)).toBe(false);
        expect(needsDeadlineWarning(order(), null, within)).toBe(false);
    });
});

describe("planFollowUps", () => {
    const within = new Date("2026-10-08T21:00:00Z");

    it("does nothing more for an order captured this run", () => {
        const o = order();
        const decision = decideCapture(o, SETTING, within);
        const out = planFollowUps([{ order: o, decision }], { [o.id]: { ok: true, transactionId: "t", status: "SUCCESS" } }, within);
        expect(out).toEqual({ handOver: [], expiring: [] });
    });

    it("hands over a failed capture, and also warns when it is close to expiry", () => {
        const o = order();
        const decision = decideCapture(o, SETTING, within);
        const out = planFollowUps([{ order: o, decision }], { [o.id]: { ok: false, error: "card declined" } }, within);
        expect(out.handOver).toHaveLength(1);
        expect(out.handOver[0]?.why).toContain("card declined");
        expect(out.expiring).toHaveLength(1);
    });

    it("hands over new holds but not orders a human already owns, though both get the deadline warning", () => {
        const risky = order({ id: "gid://shopify/Order/1", riskRecommendation: "CANCEL" });
        const tagged = order({ id: "gid://shopify/Order/2", tags: [MANUAL_CAPTURE_TAG] });
        const items = [risky, tagged].map((o) => ({ order: o, decision: decideCapture(o, SETTING, within) }));

        const early = planFollowUps(items, {}, BEFORE_DUE);
        expect(early.handOver.map((f) => f.order.id)).toEqual(["gid://shopify/Order/1"]);
        expect(early.expiring).toEqual([]);

        const late = planFollowUps(items, {}, within);
        expect(late.expiring.map((f) => f.order.id)).toEqual(["gid://shopify/Order/1", "gid://shopify/Order/2"]);
    });

    it("warns about a capture stuck in flight, and ignores closed orders entirely", () => {
        const stuck = order({
            id: "gid://shopify/Order/3",
            transactions: [auth(), auth({ id: "cap", kind: "CAPTURE", status: "PENDING", unsettled: null })],
        });
        const cancelled = order({ id: "gid://shopify/Order/4", cancelledAt: "2026-10-03T00:00:00Z" });
        const items = [stuck, cancelled].map((o) => ({ order: o, decision: decideCapture(o, SETTING, within) }));
        const out = planFollowUps(items, {}, within);
        expect(out.handOver).toEqual([]);
        expect(out.expiring.map((f) => f.order.id)).toEqual(["gid://shopify/Order/3"]);
    });
});

describe("normalizeOrder", () => {
    it("reads presentment money and keeps only negative risk facts", () => {
        const o = normalizeOrder(NODE_1136);
        expect(o.presentmentCurrency).toBe("GBP");
        expect(o.currentTotal).toEqual({ amount: "191.0", currencyCode: "GBP" });
        expect(o.transactions[0]?.unsettled).toEqual({ amount: "191.0", currencyCode: "GBP" });
        expect(o.riskFacts).toEqual(["Shipping address is 410 miles from location of IP address"]);
        expect(o.riskPending).toBe(false);
    });

    it("treats a missing unsettled amount as nothing left to capture", () => {
        const node: GqlOrderNode = { ...NODE_1136, transactions: [{ ...AUTH_1136, totalUnsettledSet: null }] };
        expect(normalizeOrder(node).transactions[0]?.unsettled).toBeNull();
    });
});

describe("formatMoney", () => {
    it("formats two-decimal and zero-decimal currencies", () => {
        expect(formatMoney("191.0", "GBP")).toBe("GBP 191.00");
        expect(formatMoney("30000.0", "JPY")).toBe("JPY 30000");
    });
});

describe("auto-capture emails", () => {
    const EM_DASH = String.fromCharCode(0x2014);
    const ref = {
        name: "#1136",
        adminUrl: "https://admin.shopify.com/store/dreamplay-pianos/orders/18921919119674",
        amount: "191.0",
        currencyCode: "GBP",
    };

    it("sends nothing when the run did nothing", () => {
        expect(buildAutoCaptureEmail({ holdHours: 72, captured: [], handedOver: [], expiring: [] })).toBeNull();
    });

    it("reports a routine capture", () => {
        const email = buildAutoCaptureEmail({
            holdHours: 72,
            captured: [{ ...ref, authorizedAt: AUTHORIZED_AT, status: "SUCCESS" }],
            handedOver: [],
            expiring: [],
        });
        expect(email?.subject).toBe("Payment captured: #1136, GBP 191.00");
        expect(email?.html).toContain("Captured automatically");
        expect(email?.html).toContain(ref.adminUrl);
    });

    it("leads with action items and lists an order in only its most urgent section", () => {
        const action = { ...ref, why: "Shopify rates this order HIGH risk", expiresAt: EXPIRES_AT };
        const email = buildAutoCaptureEmail({
            holdHours: 72,
            captured: [],
            handedOver: [action],
            expiring: [action],
        });
        expect(email?.subject).toMatch(/^Action needed: capture #1136 by hand before /);
        expect(email?.html).toContain("Expiring within 24 hours");
        expect(email?.html).not.toContain("Needs you");
    });

    it("escapes Shopify-supplied text", () => {
        const email = buildAutoCaptureEmail({
            holdHours: 72,
            captured: [],
            handedOver: [{ ...ref, why: "<script>alert(1)</script>", expiresAt: null }],
            expiring: [],
        });
        expect(email?.html).not.toContain("<script>");
        expect(email?.html).toContain("&lt;script&gt;");
    });

    it("never uses em dashes", () => {
        const action = { ...ref, why: "x", expiresAt: EXPIRES_AT };
        const report = buildAutoCaptureEmail({
            holdHours: 72,
            captured: [{ ...ref, authorizedAt: AUTHORIZED_AT, status: "PENDING" }],
            handedOver: [action],
            expiring: [{ ...action, name: "#1137" }],
        });
        const failure = buildSweepFailureEmail("token exchange failed", AUTHORIZED_AT);
        for (const text of [report?.subject, report?.html, failure.subject, failure.html]) {
            expect(text).not.toContain(EM_DASH);
        }
    });
});
