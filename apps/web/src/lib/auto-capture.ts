/**
 * Shopify payment auto-capture: the 3-day capture rule.
 *
 * Since 2026-01-01 the store authorizes cards at checkout and captures them
 * by hand (manual capture was switched on to stop card-testing fraud). A
 * Shopify Payments authorization lapses after 7 days, and by 2026-10-05 four
 * real orders had lapsed uncaptured (#1115, #1132, #1133, #1135, about
 * $1,600): those buyers believe they paid, and DreamPlay never got the money.
 *
 * Rule (Lionel, 2026-10-05): capture automatically about 3 days after
 * checkout. The store STAYS on manual capture, so the first 3 days remain a
 * review window in which an order can be cancelled (a void, no fees) rather
 * than refunded. After that an hourly sweep captures it.
 *
 * Design notes that matter:
 *
 * - Shopify's own fraud call decides what is safe to automate. ACCEPT and
 *   NONE are captured; INVESTIGATE (medium risk) and CANCEL (high risk) are
 *   handed to a human straight away, so the whole authorization window is
 *   available for review. Manual capture exists for fraud review, so the
 *   robot never overrules Shopify's fraud signal.
 * - Amounts are compared and captured in the customer's (presentment)
 *   currency. orderCapture requires it for multi-currency orders, and shop
 *   currency amounts drift with FX between authorization and capture (#1134:
 *   authorized $253.33, captured $253.04, the same AUD amount).
 * - Only an untouched authorization is captured: exactly one open
 *   authorization, none of it captured yet, and an order total that still
 *   covers it. Anything else (an edit that lowered the total, a partial or
 *   failed capture) goes to a human, because the right amount is a judgement.
 *   Note `totalOutstandingSet` reads 0 on an authorized order (Shopify counts
 *   the authorization as transacted), so it cannot size the capture.
 * - State lives on the Shopify order as tags, where Lionel already works.
 *   MANUAL_CAPTURE_TAG means "a human owns this capture": the sweep adds it
 *   when it hands an order over, and Lionel can add it to opt an order out.
 *   DEADLINE_WARNED_TAG dedupes the final pre-expiry warning.
 * - Safety net: ANY order still capturable within DEADLINE_WARNING_HOURS of
 *   its authorization expiring gets one warning, whatever the reason it is
 *   still open. Expiry is the failure this whole module exists to prevent.
 *
 * Every decision is a pure function over an already-fetched order so it is
 * testable without Shopify. I/O lives in ./auto-capture-data.
 */

export const AUTO_CAPTURE_SETTING = "shopify:auto-capture";
/** Sweep heartbeat + last error, written every run (shown on /admin/auto-capture). */
export const AUTO_CAPTURE_STATUS = "shopify:auto-capture:status";
/** Event that triggers an extra sweep; `data.dryRun: true` evaluates without acting. */
export const AUTO_CAPTURE_EVENT = "shopify/auto-capture.run";
/**
 * Heartbeat of the independent backup job (D15: GitHub Actions,
 * scripts/shopify/auto-capture-backup.mjs), which captures on day 5 whatever
 * this sweep missed. The two watch each other's heartbeats.
 */
export const AUTO_CAPTURE_BACKUP_STATUS = "shopify:auto-capture:backup-status";
/** The backup runs hourly on GitHub cron, which can lag; this much silence means it is down. */
export const BACKUP_STALE_HOURS = 6;

/** "A human owns this capture." Added by the sweep on hand-over, or by hand to opt out. */
export const MANUAL_CAPTURE_TAG = "capture-manually";
/** Marks an order whose one pre-expiry warning has been sent. */
export const DEADLINE_WARNED_TAG = "capture-deadline-warned";

export const DEFAULT_HOLD_HOURS = 72;
export const MAX_HOLD_HOURS = 168;
/** Capture no later than this long before the authorization expires, whatever the hold says. */
export const CAPTURE_SAFETY_HOURS = 24;
/** Warn when a still-open authorization is this close to expiring. */
export const DEADLINE_WARNING_HOURS = 24;
/**
 * Fallback authorization window when Shopify omits authorizationExpiresAt
 * (the API documents the field as Plus-only, although this store gets it).
 * 7 days is the usual Shopify Payments card window.
 */
export const DEFAULT_AUTH_WINDOW_HOURS = 168;

const HOUR_MS = 3_600_000;

// --- Setting -------------------------------------------------------------------

export interface AutoCaptureSetting {
    /** Master switch. On unless explicitly switched off: Lionel asked for this. */
    enabled: boolean;
    /** Hours after authorization before the sweep captures. */
    holdHours: number;
}

export const DEFAULT_AUTO_CAPTURE_SETTING: AutoCaptureSetting = {
    enabled: true,
    holdHours: DEFAULT_HOLD_HOURS,
};

/**
 * A missing row means "on, 72 hours". Once a row exists, only a literal
 * `true` keeps the sweep on, so any hand-written off value (false, "false",
 * 0) stops it.
 */
export function parseAutoCaptureSetting(value: unknown): AutoCaptureSetting {
    if (!value || typeof value !== "object") return { ...DEFAULT_AUTO_CAPTURE_SETTING };
    const v = value as Record<string, unknown>;
    const hours =
        typeof v.holdHours === "number" && Number.isFinite(v.holdHours) ? Math.round(v.holdHours) : DEFAULT_HOLD_HOURS;
    return {
        enabled: v.enabled === undefined ? true : v.enabled === true,
        holdHours: Math.min(MAX_HOLD_HOURS, Math.max(0, hours)),
    };
}

// --- Normalized order ----------------------------------------------------------

export interface Money {
    amount: string;
    currencyCode: string;
}

export interface CaptureTransaction {
    id: string;
    /** AUTHORIZATION, CAPTURE, SALE, VOID, REFUND, ... */
    kind: string;
    /** SUCCESS, FAILURE, PENDING, ERROR, AWAITING_RESPONSE, UNKNOWN */
    status: string;
    createdAt: string;
    authorizationExpiresAt: string | null;
    /** Presentment-currency amount. */
    amount: Money;
    /** Presentment-currency amount still capturable (authorizations only), else null. */
    unsettled: Money | null;
}

export interface CaptureOrder {
    /** GraphQL id, gid://shopify/Order/... */
    id: string;
    /** "#1136" */
    name: string;
    createdAt: string;
    cancelledAt: string | null;
    test: boolean;
    capturable: boolean;
    tags: string[];
    presentmentCurrency: string;
    /** Order total after edits, presentment currency. */
    currentTotal: Money;
    /** ACCEPT, INVESTIGATE, CANCEL or NONE */
    riskRecommendation: string;
    /** True while any risk assessment is still PENDING. */
    riskPending: boolean;
    /** Shopify's negative risk facts, for the hand-over email. */
    riskFacts: string[];
    transactions: CaptureTransaction[];
}

// --- Decision ------------------------------------------------------------------

export type HoldReason =
    | "tagged"
    | "risk_high"
    | "risk_medium"
    | "risk_pending"
    | "capture_failed"
    | "multiple_authorizations"
    | "no_open_authorization"
    | "currency_mismatch"
    | "partially_captured"
    | "total_below_authorization";

export type IgnoreReason = "not_capturable" | "cancelled" | "test" | "capture_in_flight";

export interface CapturePlan {
    authorizationId: string;
    /** Exact Shopify decimal string, presentment currency. */
    amount: string;
    currencyCode: string;
    authorizedAt: string;
    /** When the sweep captures: authorizedAt + holdHours, capped at expiry minus the safety margin. */
    captureAt: string;
    expiresAt: string;
}

export type CaptureDecision =
    | ({ action: "capture" } & CapturePlan)
    | ({ action: "wait" } & CapturePlan)
    | { action: "hold"; reason: HoldReason; detail: string; expiresAt: string | null }
    | { action: "ignore"; reason: IgnoreReason };

const IN_FLIGHT = new Set(["PENDING", "AWAITING_RESPONSE", "UNKNOWN"]);
const FAILED = new Set(["FAILURE", "ERROR"]);

/** Exact comparison in minor units. Every amount compared is in one currency. */
function toMinor(amount: string): number {
    return Math.round(Number(amount) * 100);
}

export function hasTag(tags: string[], tag: string): boolean {
    const want = tag.toLowerCase();
    return tags.some((t) => t.trim().toLowerCase() === want);
}

function expiryOf(t: CaptureTransaction): string {
    return (
        t.authorizationExpiresAt ??
        new Date(new Date(t.createdAt).getTime() + DEFAULT_AUTH_WINDOW_HOURS * HOUR_MS).toISOString()
    );
}

type OpenAuthorization = CaptureTransaction & { unsettled: Money };

function openAuthorizations(order: CaptureOrder): OpenAuthorization[] {
    return order.transactions.filter(
        (t): t is OpenAuthorization =>
            t.kind === "AUTHORIZATION" &&
            t.status === "SUCCESS" &&
            t.unsettled !== null &&
            toMinor(t.unsettled.amount) > 0,
    );
}

/** Earliest expiry across the order's open authorizations, or null if none. */
export function earliestExpiry(order: CaptureOrder): string | null {
    const expiries = openAuthorizations(order).map(expiryOf).sort();
    return expiries[0] ?? null;
}

function riskDetail(order: CaptureOrder, label: string): string {
    return order.riskFacts.length ? `${label}: ${order.riskFacts.join("; ")}` : label;
}

/**
 * What the sweep should do with one order right now. Checks run in order of
 * authority: nothing-to-do first, then a human's explicit opt-out, then
 * fraud, then anything irregular about the money, and only then the clock.
 */
export function decideCapture(order: CaptureOrder, setting: AutoCaptureSetting, now: Date): CaptureDecision {
    if (!order.capturable) return { action: "ignore", reason: "not_capturable" };
    if (order.cancelledAt) return { action: "ignore", reason: "cancelled" };
    if (order.test) return { action: "ignore", reason: "test" };

    const captures = order.transactions.filter((t) => t.kind === "CAPTURE");
    // A capture is already on its way; acting again could only fail or confuse.
    if (captures.some((t) => IN_FLIGHT.has(t.status))) return { action: "ignore", reason: "capture_in_flight" };

    const open = openAuthorizations(order);
    const expiresAt = earliestExpiry(order);
    const hold = (reason: HoldReason, detail: string): CaptureDecision => ({
        action: "hold",
        reason,
        detail,
        expiresAt,
    });

    if (hasTag(order.tags, MANUAL_CAPTURE_TAG)) {
        return hold("tagged", `Tagged ${MANUAL_CAPTURE_TAG}, so it is left for a human`);
    }
    if (order.riskRecommendation === "CANCEL") {
        return hold("risk_high", riskDetail(order, "Shopify rates this order HIGH risk and recommends cancelling"));
    }
    if (order.riskRecommendation === "INVESTIGATE") {
        return hold("risk_medium", riskDetail(order, "Shopify rates this order MEDIUM risk and recommends investigating"));
    }
    if (captures.some((t) => FAILED.has(t.status))) {
        return hold("capture_failed", "An earlier capture attempt on this order failed");
    }
    if (open.length > 1) {
        return hold("multiple_authorizations", `${open.length} open authorizations on one order`);
    }
    const [auth] = open;
    if (!auth) {
        return hold("no_open_authorization", "Shopify says it is capturable but no open authorization was found");
    }

    const { unsettled } = auth;
    const currency = order.presentmentCurrency;
    if (
        unsettled.currencyCode !== currency ||
        auth.amount.currencyCode !== currency ||
        order.currentTotal.currencyCode !== currency
    ) {
        return hold("currency_mismatch", `Authorization is not in the order currency (${currency})`);
    }
    if (toMinor(unsettled.amount) !== toMinor(auth.amount.amount)) {
        return hold(
            "partially_captured",
            `Only ${unsettled.amount} of the ${auth.amount.amount} ${currency} authorization is left to capture`,
        );
    }
    if (toMinor(order.currentTotal.amount) < toMinor(unsettled.amount)) {
        return hold(
            "total_below_authorization",
            `Order total is now ${order.currentTotal.amount} ${currency}, below the ${unsettled.amount} ${currency} authorized`,
        );
    }

    const authorizedMs = new Date(auth.createdAt).getTime();
    const authExpiresAt = expiryOf(auth);
    const captureMs = Math.min(
        authorizedMs + setting.holdHours * HOUR_MS,
        new Date(authExpiresAt).getTime() - CAPTURE_SAFETY_HOURS * HOUR_MS,
    );
    const plan: CapturePlan = {
        authorizationId: auth.id,
        amount: unsettled.amount,
        currencyCode: unsettled.currencyCode,
        authorizedAt: auth.createdAt,
        captureAt: new Date(captureMs).toISOString(),
        expiresAt: authExpiresAt,
    };

    if (now.getTime() < captureMs) return { action: "wait", ...plan };
    // Normal right after checkout; still unresolved at capture time is not.
    if (order.riskPending) {
        return hold("risk_pending", "Shopify's fraud analysis had not finished by capture time");
    }
    return { action: "capture", ...plan };
}

/**
 * The one-time "expires within 24 hours" warning. The caller passes only
 * orders that are still open after this run's captures.
 */
export function needsDeadlineWarning(order: CaptureOrder, expiresAt: string | null, now: Date): boolean {
    if (!expiresAt || hasTag(order.tags, DEADLINE_WARNED_TAG)) return false;
    return new Date(expiresAt).getTime() - now.getTime() <= DEADLINE_WARNING_HOURS * HOUR_MS;
}

/**
 * The backup job's health, judged by the primary each run. A backup that has
 * never run is "none" (not set up yet), not an outage. Alerts repeat at most
 * daily while it stays down; "clear" resets that once it is back, so the
 * next outage alerts at once.
 */
export function backupHeartbeatAction(
    backupLastRunAt: string | null,
    lastAlertedAt: string | null,
    now: Date,
): "alert" | "clear" | "none" {
    if (!backupLastRunAt) return "none";
    const stale = now.getTime() - new Date(backupLastRunAt).getTime() > BACKUP_STALE_HOURS * HOUR_MS;
    if (!stale) return lastAlertedAt ? "clear" : "none";
    const due = !lastAlertedAt || now.getTime() - new Date(lastAlertedAt).getTime() >= 24 * HOUR_MS;
    return due ? "alert" : "none";
}

export type CaptureResult = { ok: true; transactionId: string; status: string } | { ok: false; error: string };

export interface FollowUp {
    order: CaptureOrder;
    /** Why it is not (being) captured automatically, for the email. */
    why: string;
    expiresAt: string | null;
}

/**
 * After this run's captures, which orders a human now owns (tag + email) and
 * which get the one-time pre-expiry warning. `results` is keyed by order id.
 *
 * - Hand-over: every hold except "tagged" (a human already owns those), plus
 *   every capture that failed this run.
 * - Warning: anything still open within DEADLINE_WARNING_HOURS of expiry,
 *   tagged or not, including a capture stuck in flight. Only orders that are
 *   not capturable, cancelled or test are exempt.
 */
export function planFollowUps(
    items: { order: CaptureOrder; decision: CaptureDecision }[],
    results: Record<string, CaptureResult>,
    now: Date,
): { handOver: FollowUp[]; expiring: FollowUp[] } {
    const handOver: FollowUp[] = [];
    const expiring: FollowUp[] = [];
    for (const { order, decision } of items) {
        const result = results[order.id];
        if (result?.ok) continue;

        let why: string;
        let expiresAt: string | null;
        if (decision.action === "ignore") {
            if (decision.reason !== "capture_in_flight") continue;
            why = "A capture is still pending at the payment gateway";
            expiresAt = earliestExpiry(order);
        } else if (decision.action === "hold") {
            why = decision.detail;
            expiresAt = decision.expiresAt;
            if (decision.reason !== "tagged") handOver.push({ order, why, expiresAt });
        } else if (decision.action === "capture" && result && !result.ok) {
            why = `The automatic capture failed: ${result.error}`;
            expiresAt = decision.expiresAt;
            handOver.push({ order, why, expiresAt });
        } else {
            why = "Not captured yet";
            expiresAt = decision.expiresAt;
        }

        if (needsDeadlineWarning(order, expiresAt, now)) expiring.push({ order, why, expiresAt });
    }
    return { handOver, expiring };
}

// --- Shopify GraphQL normalization ----------------------------------------------

type GqlMoneyBag = { presentmentMoney: { amount: string; currencyCode: string } } | null;

export interface GqlOrderNode {
    id: string;
    name: string;
    createdAt: string;
    cancelledAt: string | null;
    test: boolean;
    capturable: boolean;
    tags: string[];
    presentmentCurrencyCode: string;
    currentTotalPriceSet: GqlMoneyBag;
    risk: {
        recommendation: string;
        assessments: { riskLevel: string; facts: { description: string; sentiment: string }[] }[];
    } | null;
    transactions: {
        id: string;
        kind: string;
        status: string;
        createdAt: string;
        authorizationExpiresAt: string | null;
        amountSet: GqlMoneyBag;
        totalUnsettledSet: GqlMoneyBag;
    }[];
}

/** The fields decideCapture needs, for the orders query. */
export const ORDER_FIELDS = `
    id name createdAt cancelledAt test capturable tags presentmentCurrencyCode
    currentTotalPriceSet { presentmentMoney { amount currencyCode } }
    risk { recommendation assessments { riskLevel facts { description sentiment } } }
    transactions {
        id kind status createdAt authorizationExpiresAt
        amountSet { presentmentMoney { amount currencyCode } }
        totalUnsettledSet { presentmentMoney { amount currencyCode } }
    }
`;

function money(bag: GqlMoneyBag, fallbackCurrency: string): Money {
    return bag?.presentmentMoney
        ? { amount: bag.presentmentMoney.amount, currencyCode: bag.presentmentMoney.currencyCode }
        : { amount: "0", currencyCode: fallbackCurrency };
}

export function normalizeOrder(node: GqlOrderNode): CaptureOrder {
    const currency = node.presentmentCurrencyCode;
    const assessments = node.risk?.assessments ?? [];
    return {
        id: node.id,
        name: node.name,
        createdAt: node.createdAt,
        cancelledAt: node.cancelledAt,
        test: node.test,
        capturable: node.capturable,
        tags: node.tags ?? [],
        presentmentCurrency: currency,
        currentTotal: money(node.currentTotalPriceSet, currency),
        riskRecommendation: node.risk?.recommendation ?? "NONE",
        riskPending: assessments.some((a) => a.riskLevel === "PENDING"),
        riskFacts: assessments.flatMap((a) =>
            a.facts.filter((f) => f.sentiment === "NEGATIVE").map((f) => f.description),
        ),
        transactions: (node.transactions ?? []).map((t) => ({
            id: t.id,
            kind: t.kind,
            status: t.status,
            createdAt: t.createdAt,
            authorizationExpiresAt: t.authorizationExpiresAt,
            amount: money(t.amountSet, currency),
            unsettled: t.totalUnsettledSet?.presentmentMoney
                ? {
                      amount: t.totalUnsettledSet.presentmentMoney.amount,
                      currencyCode: t.totalUnsettledSet.presentmentMoney.currencyCode,
                  }
                : null,
        })),
    };
}

// --- Display -------------------------------------------------------------------

export const HOLD_REASON_LABEL: Record<HoldReason, string> = {
    tagged: "Tagged capture-manually",
    risk_high: "High fraud risk",
    risk_medium: "Medium fraud risk",
    risk_pending: "Fraud check unfinished",
    capture_failed: "Capture failed",
    multiple_authorizations: "Several authorizations",
    no_open_authorization: "No open authorization",
    currency_mismatch: "Currency mismatch",
    partially_captured: "Partly captured already",
    total_below_authorization: "Total reduced after checkout",
};

/** "GBP 191.00" (JPY and other zero-decimal currencies keep Shopify's digits). */
export function formatMoney(amount: string, currencyCode: string): string {
    const n = Number(amount);
    const zeroDecimal = currencyCode === "JPY" || currencyCode === "KRW";
    return `${currencyCode} ${Number.isFinite(n) ? n.toFixed(zeroDecimal ? 0 : 2) : amount}`;
}

/** "Fri, Oct 9, 4:05 PM ET" */
export function formatEastern(iso: string): string {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(iso));
    return `${parts} ET`;
}
