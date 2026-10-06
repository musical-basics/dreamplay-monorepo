/**
 * Pure rules for the BACKUP payment capture job (auto-capture-backup.mjs).
 *
 * The primary is the hourly Inngest sweep in apps/web (decision D14), which
 * captures 72 hours after checkout. This backup runs on different
 * infrastructure (GitHub Actions, not Vercel/Inngest) with a separate,
 * plain-JS implementation, so neither an outage nor a bug in the primary can
 * also silence it (decision D15).
 *
 * It is never more aggressive than the primary:
 *   - it acts 48 hours after the primary would (day 5 at the default 72-hour
 *     hold), capped at 12 hours before the authorization expires;
 *   - it captures only an untouched, unflagged authorization the primary
 *     would itself have captured; everything else is handed to a human with
 *     the same `capture-manually` tag the primary uses;
 *   - it honours the same kill switch and hold setting.
 * apps/web/src/lib/__tests__/auto-capture-backup.test.ts checks that parity
 * against the primary's decideCapture().
 *
 * Every function takes raw Admin GraphQL order nodes (fields: ORDER_FIELDS)
 * and works in the buyer's presentment currency.
 */

export const SETTING_KEY = "shopify:auto-capture";
export const PRIMARY_STATUS_KEY = "shopify:auto-capture:status";
export const BACKUP_STATUS_KEY = "shopify:auto-capture:backup-status";

export const MANUAL_CAPTURE_TAG = "capture-manually";
export const DEADLINE_WARNED_TAG = "capture-deadline-warned";

/** The backup acts this long after the primary's hold (72h + 48h = day 5). */
export const BACKUP_DELAY_HOURS = 48;
/** ...but never later than this long before the authorization expires. */
export const BACKUP_SAFETY_HOURS = 12;
export const DEADLINE_WARNING_HOURS = 24;
/** The primary runs hourly; this much silence means it is down. */
export const PRIMARY_STALE_HOURS = 3;
const DEFAULT_HOLD_HOURS = 72;
const MAX_HOLD_HOURS = 168;
const DEFAULT_AUTH_WINDOW_HOURS = 168;
const HOUR_MS = 3_600_000;

const IN_FLIGHT = new Set(["PENDING", "AWAITING_RESPONSE", "UNKNOWN"]);
const FAILED = new Set(["FAILURE", "ERROR"]);

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

/** Same semantics as the primary: no row = on at 72h; a row needs a literal true. */
export function parseSetting(value) {
    if (!value || typeof value !== "object") return { enabled: true, holdHours: DEFAULT_HOLD_HOURS };
    const hours =
        typeof value.holdHours === "number" && Number.isFinite(value.holdHours)
            ? Math.round(value.holdHours)
            : DEFAULT_HOLD_HOURS;
    return {
        enabled: value.enabled === undefined ? true : value.enabled === true,
        holdHours: Math.min(MAX_HOLD_HOURS, Math.max(0, hours)),
    };
}

function minor(amount) {
    const n = Number(amount);
    return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function hasTag(tags, tag) {
    return (tags ?? []).some((t) => t.trim().toLowerCase() === tag);
}

function money(bag) {
    return bag?.presentmentMoney ?? null;
}

function expiryOf(t) {
    return (
        t.authorizationExpiresAt ??
        new Date(new Date(t.createdAt).getTime() + DEFAULT_AUTH_WINDOW_HOURS * HOUR_MS).toISOString()
    );
}

function openAuthorizations(node) {
    return (node.transactions ?? []).filter(
        (t) => t.kind === "AUTHORIZATION" && t.status === "SUCCESS" && minor(money(t.totalUnsettledSet)?.amount) > 0,
    );
}

/** Why this order is not a plain capture, or null if it is. */
function irregularity(node, open) {
    const risk = node.risk ?? { recommendation: "NONE", assessments: [] };
    if (risk.recommendation === "CANCEL") return { reason: "risk_high", detail: "Shopify rates this order HIGH risk" };
    if (risk.recommendation === "INVESTIGATE") {
        return { reason: "risk_medium", detail: "Shopify rates this order MEDIUM risk" };
    }
    if ((risk.assessments ?? []).some((a) => a.riskLevel === "PENDING")) {
        return { reason: "risk_pending", detail: "Shopify's fraud analysis has not finished" };
    }
    const captures = (node.transactions ?? []).filter((t) => t.kind === "CAPTURE");
    if (captures.some((t) => FAILED.has(t.status))) {
        return { reason: "capture_failed", detail: "An earlier capture attempt failed" };
    }
    if (open.length !== 1) {
        return { reason: "authorizations", detail: `${open.length} open authorizations on the order` };
    }
    const [auth] = open;
    const unsettled = money(auth.totalUnsettledSet);
    const authorized = money(auth.amountSet);
    const total = money(node.currentTotalPriceSet);
    const currency = node.presentmentCurrencyCode;
    if (unsettled?.currencyCode !== currency || authorized?.currencyCode !== currency || total?.currencyCode !== currency) {
        return { reason: "currency_mismatch", detail: `Authorization is not in the order currency (${currency})` };
    }
    if (minor(unsettled.amount) !== minor(authorized.amount)) {
        return { reason: "partially_captured", detail: "Part of the authorization was already captured" };
    }
    if (minor(total.amount) < minor(unsettled.amount)) {
        return { reason: "total_below_authorization", detail: "The order total was reduced below the authorization" };
    }
    return null;
}

/**
 * What the backup does with one authorized order now:
 *   skip      nothing to do (closed, test, capture already in flight)
 *   human     tagged capture-manually: a human owns it
 *   wait      not yet at the backup time
 *   hand-over irregular or flagged, and the primary never handed it over
 *   capture   the primary should have captured this and did not
 */
export function decideBackup(node, setting, now) {
    if (!node.capturable) return { action: "skip", reason: "not_capturable" };
    if (node.cancelledAt) return { action: "skip", reason: "cancelled" };
    if (node.test) return { action: "skip", reason: "test" };
    const transactions = node.transactions ?? [];
    if (transactions.some((t) => t.kind === "CAPTURE" && IN_FLIGHT.has(t.status))) {
        return { action: "skip", reason: "capture_in_flight" };
    }

    const open = openAuthorizations(node);
    const expiresAt = open.map(expiryOf).sort()[0] ?? null;
    if (hasTag(node.tags, MANUAL_CAPTURE_TAG)) return { action: "human", expiresAt };

    const authorizedAt = open.map((t) => t.createdAt).sort()[0] ?? node.createdAt;
    const backupMs = Math.min(
        new Date(authorizedAt).getTime() + (setting.holdHours + BACKUP_DELAY_HOURS) * HOUR_MS,
        expiresAt ? new Date(expiresAt).getTime() - BACKUP_SAFETY_HOURS * HOUR_MS : Infinity,
    );
    const backupAt = new Date(backupMs).toISOString();
    if (now.getTime() < backupMs) return { action: "wait", backupAt, expiresAt };

    const problem = irregularity(node, open);
    if (problem) return { action: "hand-over", ...problem, expiresAt };

    const [auth] = open;
    const unsettled = money(auth.totalUnsettledSet);
    return {
        action: "capture",
        authorizationId: auth.id,
        amount: unsettled.amount,
        currencyCode: unsettled.currencyCode,
        authorizedAt: auth.createdAt,
        expiresAt,
    };
}

/** One-time "expires within 24 hours" warning, shared with the primary via the tag. */
export function needsDeadlineWarning(node, expiresAt, now) {
    if (!expiresAt || hasTag(node.tags, DEADLINE_WARNED_TAG)) return false;
    return new Date(expiresAt).getTime() - now.getTime() <= DEADLINE_WARNING_HOURS * HOUR_MS;
}

/** True when a heartbeat is missing or older than `hours`. */
export function isStale(lastRunAt, hours, now) {
    if (!lastRunAt) return true;
    return now.getTime() - new Date(lastRunAt).getTime() > hours * HOUR_MS;
}

/** Alert at most once a day per outage. */
export function alertDue(lastAlertedAt, now) {
    return !lastAlertedAt || now.getTime() - new Date(lastAlertedAt).getTime() >= 24 * HOUR_MS;
}
