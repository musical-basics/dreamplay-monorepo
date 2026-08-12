/**
 * $50 coupon trigger — the behavioral follow-up for engaged non-buyers.
 *
 * Rule (Lionel, 2026-08-11, amount reduced to $50 on 2026-08-12): a
 * subscriber who opened 3 or more DreamPlay marketing emails but has not
 * purchased gets a one-time $50-off email,
 * sent no earlier than 3 days after the open that crossed the threshold.
 * This is IN ADDITION to the marketing calendar: it never replaces or
 * cancels a scheduled nurture email.
 *
 * Design notes that matter:
 *
 * - "Opened 3 emails" counts DISTINCT campaigns, not raw pixel hits.
 *   /api/email/open writes one row per hit with no dedup, so Gmail's image
 *   proxy and repeat inbox views inflate raw counts badly.
 * - Opens from known bot/scanner user agents are dropped. Security scanners
 *   fetch every pixel in a message and would otherwise manufacture opens.
 * - The 3-day clock starts at the THIRD distinct-campaign open (the moment
 *   the subscriber became "engaged"), not at the first email.
 * - Purchase is read from `events` (event_name='purchase'), never from
 *   buyers.purchase_date: the Shopify webhook upserts buyers with
 *   ignoreDuplicates, so purchase_date is NULL for webhook-created rows.
 * - One coupon per person, ever. Enforced by campaigns.send_key +
 *   sent_history's unique (campaign_id, subscriber_id).
 *
 * The evaluation is a pure function over already-fetched rows so it is
 * testable without a database.
 */

export const COUPON_TEMPLATE_NAME = "Marketing Calendar 2026 - Engaged Non-Buyer $50 Coupon";
/**
 * Per-subscriber idempotency prefix. Deliberately amount-agnostic: if the
 * offer amount changes again, this must NOT change with it, or everyone who
 * already received a coupon becomes eligible for another one (the
 * already-sent check reads these keys). Renamed once, on 2026-08-12, while
 * nothing had been sent; it is frozen from here.
 */
export const COUPON_SEND_KEY_PREFIX = "marketing-coupon-offer";
export const COUPON_SETTING = "marketing-calendar:coupon-trigger";
export const COUPON_AMOUNT_USD = 50;

/** Distinct marketing emails a subscriber must open to qualify. */
export const COUPON_MIN_OPENS = 3;
/** Days to wait after the qualifying open before sending the coupon. */
export const COUPON_WAIT_DAYS = 3;
/**
 * Only opens this recent count toward the threshold. Someone who opened 3
 * emails last winter and went quiet is not a live opportunity.
 */
export const COUPON_OPEN_LOOKBACK_DAYS = 45;

/**
 * Config stored in app_settings under COUPON_SETTING. The discount code is
 * created BY HAND in the Shopify admin: this app's Admin API token has no
 * write_discounts scope (scopes verified 2026-08-11: read_all_orders,
 * read_customers, write_order_edits, write_orders, write_products,
 * write_publications), so nothing here can mint codes. The trigger refuses
 * to send while `discountCode` is empty.
 */
export interface CouponTriggerSetting {
    /** Master switch. Off until Lionel turns it on in the admin GUI. */
    enabled: boolean;
    /** The Shopify discount code, e.g. "DREAMPLAY50". Empty = not ready. */
    discountCode: string;
    /** Optional human note about the code (expiry, usage limits). */
    codeNote: string;
}

export const DEFAULT_COUPON_SETTING: CouponTriggerSetting = {
    enabled: false,
    discountCode: "",
    codeNote: "",
};

export function parseCouponSetting(value: unknown): CouponTriggerSetting {
    if (!value || typeof value !== "object") return { ...DEFAULT_COUPON_SETTING };
    const v = value as Record<string, unknown>;
    return {
        enabled: v.enabled === true,
        discountCode: typeof v.discountCode === "string" ? v.discountCode.trim() : "",
        codeNote: typeof v.codeNote === "string" ? v.codeNote : "",
    };
}

/**
 * User agents that fetch tracking pixels without a human reading the email:
 * security scanners, link expanders, monitoring. Gmail's own image proxy
 * (GoogleImageProxy) is deliberately NOT here: it fetches because a human
 * opened the message. Deduping by campaign already handles its prefetching.
 */
const BOT_OPEN_UA = /bot\b|crawler|spider|scanner|proofpoint|barracuda|mimecast|symantec|forcepoint|trendmicro|virustotal|urlscan|monitoring|pingdom|slackbot|discordbot|whatsapp|telegrambot|preview/i;

export function isBotOpen(userAgent: string | null | undefined): boolean {
    if (!userAgent) return false;
    return BOT_OPEN_UA.test(userAgent);
}

export interface OpenEventRow {
    subscriber_id: string | null;
    campaign_id: string | null;
    created_at: string;
    user_agent: string | null;
}

export interface EngagementSummary {
    subscriberId: string;
    /** Distinct marketing campaigns opened inside the lookback window. */
    distinctOpens: number;
    /** ISO timestamp of the open that crossed COUPON_MIN_OPENS. */
    qualifiedAt: string;
    /** Most recent open, for display. */
    lastOpenAt: string;
}

/**
 * Roll raw open rows up per subscriber, counting distinct campaigns and
 * pinning the moment each subscriber crossed the threshold.
 *
 * `campaignIds` restricts which campaigns count (the marketing calendar's
 * child campaigns). Rows with a null subscriber_id or campaign_id cannot be
 * attributed and are ignored.
 */
export function summarizeOpens(
    rows: OpenEventRow[],
    campaignIds: Set<string>,
): Map<string, EngagementSummary> {
    // subscriber -> campaign -> earliest open of that campaign
    const perSubscriber = new Map<string, Map<string, string>>();

    for (const row of rows) {
        if (!row.subscriber_id || !row.campaign_id) continue;
        if (!campaignIds.has(row.campaign_id)) continue;
        if (isBotOpen(row.user_agent)) continue;

        let campaigns = perSubscriber.get(row.subscriber_id);
        if (!campaigns) {
            campaigns = new Map();
            perSubscriber.set(row.subscriber_id, campaigns);
        }
        const existing = campaigns.get(row.campaign_id);
        if (!existing || row.created_at < existing) campaigns.set(row.campaign_id, row.created_at);
    }

    const out = new Map<string, EngagementSummary>();
    for (const [subscriberId, campaigns] of perSubscriber) {
        const firstOpens = [...campaigns.values()].sort();
        if (firstOpens.length < COUPON_MIN_OPENS) continue;
        out.set(subscriberId, {
            subscriberId,
            distinctOpens: firstOpens.length,
            // The Nth distinct-campaign open is when they became engaged.
            qualifiedAt: firstOpens[COUPON_MIN_OPENS - 1] as string,
            lastOpenAt: firstOpens[firstOpens.length - 1] as string,
        });
    }
    return out;
}

export type CouponHoldReason = "waiting" | "purchased" | "already_sent" | "suppressed" | "not_in_audience";

export interface CouponCandidate extends EngagementSummary {
    email: string;
    firstName: string;
    /** ISO timestamp the coupon becomes sendable (qualifiedAt + wait). */
    eligibleAt: string;
    /** Null when the candidate is ready to send right now. */
    hold: CouponHoldReason | null;
}

export interface EvaluateInput {
    /** Engagement rollup from summarizeOpens. */
    engagement: Map<string, EngagementSummary>;
    /** Subscriber id -> email/name, active subscribers only. */
    subscribers: Map<string, { email: string; firstName: string }>;
    /** Lowercased emails known to have purchased. */
    purchasedEmails: Set<string>;
    /** Lowercased suppressed emails. */
    suppressedEmails: Set<string>;
    /** Subscriber ids already sent a coupon. */
    alreadySentIds: Set<string>;
    /** Subscriber ids in the reviewed marketing audience (post-exclusions). */
    audienceIds: Set<string>;
    /** Evaluation time. */
    now: Date;
}

/**
 * Decide, for every engaged subscriber, whether the coupon should go out now
 * and if not, why not. Returns every candidate (including held ones) so the
 * admin page can show the full pipeline, newest qualifiers first.
 */
export function evaluateCouponCandidates(input: EvaluateInput): CouponCandidate[] {
    const out: CouponCandidate[] = [];

    for (const summary of input.engagement.values()) {
        const subscriber = input.subscribers.get(summary.subscriberId);
        // Unknown or non-active subscriber: nothing we can send to.
        if (!subscriber) continue;

        const email = subscriber.email.toLowerCase();
        const eligibleAt = new Date(
            new Date(summary.qualifiedAt).getTime() + COUPON_WAIT_DAYS * 864e5,
        ).toISOString();

        let hold: CouponHoldReason | null = null;
        if (input.alreadySentIds.has(summary.subscriberId)) hold = "already_sent";
        else if (input.purchasedEmails.has(email)) hold = "purchased";
        else if (input.suppressedEmails.has(email)) hold = "suppressed";
        else if (!input.audienceIds.has(summary.subscriberId)) hold = "not_in_audience";
        else if (input.now.toISOString() < eligibleAt) hold = "waiting";

        out.push({ ...summary, email: subscriber.email, firstName: subscriber.firstName, eligibleAt, hold });
    }

    out.sort((a, b) => {
        // Sendable first, then soonest-eligible, then most engaged.
        if ((a.hold === null) !== (b.hold === null)) return a.hold === null ? -1 : 1;
        if (a.eligibleAt !== b.eligibleAt) return a.eligibleAt.localeCompare(b.eligibleAt);
        return b.distinctOpens - a.distinctOpens;
    });
    return out;
}

/** Per-subscriber idempotency key: one coupon per person, forever. */
export function couponSendKey(subscriberId: string): string {
    return `${COUPON_SEND_KEY_PREFIX}:${subscriberId}`;
}
