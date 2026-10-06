import { describe, expect, it } from "vitest";
import {
    alertDue,
    decideBackup,
    isStale,
    needsDeadlineWarning,
    parseSetting,
} from "../../../../../scripts/shopify/auto-capture-backup-rules.mjs";
import {
    type GqlOrderNode,
    backupHeartbeatAction,
    decideCapture,
    normalizeOrder,
    parseAutoCaptureSetting,
} from "../auto-capture";

/**
 * The backup job (D15) is a separate implementation of the capture rules on
 * purpose. These tests pin its own behaviour and, above all, prove it is
 * never more aggressive than the primary sweep (D14).
 */

const H = 3_600_000;
const AUTHORIZED_AT = "2026-10-02T20:05:24Z";
const EXPIRES_AT = "2026-10-09T20:05:24Z";
const at = (hoursAfterAuth: number) => new Date(new Date(AUTHORIZED_AT).getTime() + hoursAfterAuth * H);
const DEFAULT = { enabled: true, holdHours: 72 };

type Tx = GqlOrderNode["transactions"][number];
const gbp = (amount: string) => ({ presentmentMoney: { amount, currencyCode: "GBP" } });

function authTx(overrides: Partial<Tx> = {}): Tx {
    return {
        id: "gid://shopify/OrderTransaction/1",
        kind: "AUTHORIZATION",
        status: "SUCCESS",
        createdAt: AUTHORIZED_AT,
        authorizationExpiresAt: EXPIRES_AT,
        amountSet: gbp("191.0"),
        totalUnsettledSet: gbp("191.0"),
        ...overrides,
    };
}

function node(overrides: Partial<GqlOrderNode> = {}): GqlOrderNode {
    return {
        id: "gid://shopify/Order/18921919119674",
        name: "#1136",
        createdAt: "2026-10-02T20:05:27Z",
        cancelledAt: null,
        test: false,
        capturable: true,
        tags: [],
        presentmentCurrencyCode: "GBP",
        currentTotalPriceSet: gbp("191.0"),
        risk: { recommendation: "ACCEPT", assessments: [{ riskLevel: "LOW", facts: [] }] },
        transactions: [authTx()],
        ...overrides,
    };
}

const capture = (status: string): Tx =>
    authTx({ id: "gid://shopify/OrderTransaction/2", kind: "CAPTURE", status, totalUnsettledSet: null });

describe("decideBackup timing", () => {
    it("waits for day 5 (72h hold + 48h), then captures in the buyer's currency", () => {
        expect(decideBackup(node(), DEFAULT, at(119))).toMatchObject({
            action: "wait",
            backupAt: "2026-10-07T20:05:24.000Z",
        });
        expect(decideBackup(node(), DEFAULT, at(120))).toMatchObject({
            action: "capture",
            authorizationId: "gid://shopify/OrderTransaction/1",
            amount: "191.0",
            currencyCode: "GBP",
        });
    });

    it("follows a longer hold, but never acts later than 12 hours before expiry", () => {
        expect(decideBackup(node(), { enabled: true, holdHours: 96 }, at(143)).action).toBe("wait");
        expect(decideBackup(node(), { enabled: true, holdHours: 96 }, at(144)).action).toBe("capture");
        expect(decideBackup(node(), { enabled: true, holdHours: 168 }, at(155)).action).toBe("wait");
        expect(decideBackup(node(), { enabled: true, holdHours: 168 }, at(156)).action).toBe("capture");
    });
});

describe("decideBackup safety", () => {
    it("leaves human-owned orders alone, whatever their state", () => {
        expect(decideBackup(node({ tags: ["capture-manually"] }), DEFAULT, at(160))).toEqual({
            action: "human",
            expiresAt: EXPIRES_AT,
        });
    });

    it.each([
        ["not_capturable", { capturable: false }],
        ["cancelled", { cancelledAt: "2026-10-03T00:00:00Z" }],
        ["test", { test: true }],
        ["capture_in_flight", { transactions: [authTx(), capture("PENDING")] }],
    ] as const)("skips %s orders", (reason, overrides) => {
        expect(decideBackup(node(overrides as Partial<GqlOrderNode>), DEFAULT, at(160))).toEqual({
            action: "skip",
            reason,
        });
    });

    it("does not race the primary: a flagged order is only handed over once day 5 passes untagged", () => {
        const risky = node({ risk: { recommendation: "CANCEL", assessments: [{ riskLevel: "HIGH", facts: [] }] } });
        expect(decideBackup(risky, DEFAULT, at(1)).action).toBe("wait");
        expect(decideBackup(risky, DEFAULT, at(120))).toMatchObject({ action: "hand-over", reason: "risk_high" });
    });

    it.each([
        ["risk_medium", node({ risk: { recommendation: "INVESTIGATE", assessments: [] } })],
        ["risk_pending", node({ risk: { recommendation: "NONE", assessments: [{ riskLevel: "PENDING", facts: [] }] } })],
        ["capture_failed", node({ transactions: [authTx(), capture("FAILURE")] })],
        ["authorizations", node({ transactions: [authTx(), authTx({ id: "gid://shopify/OrderTransaction/3" })] })],
        ["currency_mismatch", node({ currentTotalPriceSet: { presentmentMoney: { amount: "191.0", currencyCode: "USD" } } })],
        ["partially_captured", node({ transactions: [authTx({ totalUnsettledSet: gbp("100.0") })] })],
        ["total_below_authorization", node({ currentTotalPriceSet: gbp("150.0") })],
    ] as const)("hands over %s instead of capturing", (reason, n) => {
        expect(decideBackup(n, DEFAULT, at(130))).toMatchObject({ action: "hand-over", reason });
    });
});

describe("backup helpers", () => {
    it("shares the deadline-warning tag with the primary", () => {
        expect(needsDeadlineWarning(node(), EXPIRES_AT, at(145))).toBe(true);
        expect(needsDeadlineWarning(node({ tags: ["capture-deadline-warned"] }), EXPIRES_AT, at(145))).toBe(false);
        expect(needsDeadlineWarning(node(), EXPIRES_AT, at(140))).toBe(false);
    });

    it("judges heartbeats and spaces alerts a day apart", () => {
        expect(isStale(null, 3, at(0))).toBe(true);
        expect(isStale(at(0).toISOString(), 3, at(2))).toBe(false);
        expect(isStale(at(0).toISOString(), 3, at(4))).toBe(true);
        expect(alertDue(null, at(0))).toBe(true);
        expect(alertDue(at(0).toISOString(), at(23))).toBe(false);
        expect(alertDue(at(0).toISOString(), at(24))).toBe(true);
    });

    it("reads the shared setting exactly as the primary does", () => {
        for (const value of [null, {}, { enabled: false }, { enabled: "false" }, { holdHours: 500 }, { holdHours: -1 }, { holdHours: "48" }, { enabled: true, holdHours: 96 }]) {
            expect(parseSetting(value)).toEqual(parseAutoCaptureSetting(value));
        }
    });
});

describe("parity with the primary sweep", () => {
    const shapes: GqlOrderNode[] = [
        node(),
        node({ risk: { recommendation: "NONE", assessments: [] } }),
        node({ risk: { recommendation: "INVESTIGATE", assessments: [] } }),
        node({ risk: { recommendation: "CANCEL", assessments: [] } }),
        node({ risk: { recommendation: "ACCEPT", assessments: [{ riskLevel: "PENDING", facts: [] }] } }),
        node({ tags: ["Capture-Manually"] }),
        node({ cancelledAt: "2026-10-03T00:00:00Z" }),
        node({ test: true }),
        node({ capturable: false }),
        node({ transactions: [authTx(), capture("FAILURE")] }),
        node({ transactions: [authTx(), capture("PENDING")] }),
        node({ transactions: [authTx(), authTx({ id: "gid://shopify/OrderTransaction/3" })] }),
        node({ transactions: [authTx({ totalUnsettledSet: gbp("100.0") })] }),
        node({ transactions: [authTx({ totalUnsettledSet: null })] }),
        node({ transactions: [authTx({ status: "FAILURE", totalUnsettledSet: null }), authTx()] }),
        node({ currentTotalPriceSet: gbp("150.0") }),
        node({ currentTotalPriceSet: gbp("250.0") }),
        node({ currentTotalPriceSet: { presentmentMoney: { amount: "191.0", currencyCode: "USD" } } }),
        node({ transactions: [authTx({ authorizationExpiresAt: null })] }),
        node({ transactions: [authTx({ authorizationExpiresAt: "2026-10-04T20:05:24Z" })] }), // 48h window
    ];
    const hours = [0, 1, 24, 36, 47, 71, 72, 73, 100, 119, 120, 121, 143, 144, 150, 155, 156, 160, 167];
    const settings = [0, 24, 72, 96, 120, 168].map((holdHours) => ({ enabled: true, holdHours }));

    it("never captures or hands over anything the primary would treat differently", () => {
        let backupCaptures = 0;
        for (const shape of shapes) {
            for (const setting of settings) {
                for (const h of hours) {
                    const now = at(h);
                    const backup = decideBackup(shape, setting, now);
                    const primary = decideCapture(normalizeOrder(shape), setting, now);
                    const where = `${JSON.stringify(shape.tags)} risk=${shape.risk?.recommendation} hold=${setting.holdHours} t=${h}h`;
                    if (backup.action === "capture") {
                        backupCaptures++;
                        expect(primary, where).toMatchObject({
                            action: "capture",
                            authorizationId: backup.authorizationId,
                            amount: backup.amount,
                            currencyCode: backup.currencyCode,
                        });
                    }
                    if (backup.action === "hand-over") expect(primary.action, where).toBe("hold");
                }
            }
        }
        // Guard against a vacuous pass.
        expect(backupCaptures).toBeGreaterThan(50);
    });

    it("always acts after the primary would have", () => {
        for (const setting of settings) {
            const primary = decideCapture(normalizeOrder(node()), setting, at(0));
            const backup = decideBackup(node(), setting, at(0));
            expect(primary.action).toBe(setting.holdHours === 0 ? "capture" : "wait");
            expect(backup.action).toBe("wait");
            // The plain-JS rules carry no literal types, so read the field defensively.
            const backupAt = String(backup.backupAt);
            if (primary.action === "wait") {
                expect(new Date(backupAt).getTime()).toBeGreaterThan(new Date(primary.captureAt).getTime());
            }
        }
    });
});

describe("backupHeartbeatAction (the primary watching the backup)", () => {
    const ran = at(0).toISOString();

    it("does nothing before the backup has ever run, or while it is healthy", () => {
        expect(backupHeartbeatAction(null, null, at(100))).toBe("none");
        expect(backupHeartbeatAction(ran, null, at(5))).toBe("none");
    });

    it("alerts once the backup is 6 hours quiet, then at most daily", () => {
        expect(backupHeartbeatAction(ran, null, at(7))).toBe("alert");
        expect(backupHeartbeatAction(ran, at(7).toISOString(), at(20))).toBe("none");
        expect(backupHeartbeatAction(ran, at(7).toISOString(), at(31))).toBe("alert");
    });

    it("clears the alert stamp once the backup is back", () => {
        expect(backupHeartbeatAction(at(30).toISOString(), at(7).toISOString(), at(31))).toBe("clear");
    });
});
