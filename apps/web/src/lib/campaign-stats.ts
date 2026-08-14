/**
 * Per-campaign performance for the marketing calendar.
 *
 * Deliberately computed from `email_events` and `sent_history` rather than
 * `campaigns.total_opens` / `total_clicks`. Those counters are a non-atomic
 * read-modify-write (apps/web/src/app/api/email/lib/tracking.ts), so under the
 * burst of pixel fetches that follows a send they lose increments and
 * systematically undercount. They are fine as a rough signal; they are not
 * fine as the denominator of a rate someone makes decisions on.
 *
 * Counting rules, all of which change the number materially:
 *
 *   - UNIQUE opens and clicks (distinct subscriber), not raw rows. The open
 *     pixel has no dedup, so one person reopening an email five times is five
 *     rows. Open RATE only means anything per person.
 *   - Bot/scanner user agents are dropped, reusing the same matcher the
 *     coupon trigger uses. Gmail's image proxy is deliberately NOT treated as
 *     a bot: it fetches because a human opened the message.
 *   - The denominator is `sent_history` rows, the authoritative record of who
 *     was actually handed to Resend.
 *
 * Attributed revenue comes from purchase events carrying the campaign id in
 * metadata.email_campaign_id, planted in the Shopify order note at checkout
 * (see lib/ab-checkout.ts). Purchases before that mechanism existed simply
 * have no campaign id and are invisible here, which is honest: they were
 * genuinely unattributable.
 */

import type { AdminClient } from "@dreamplay/db";
import { isBotOpen } from "./coupon-trigger";

export interface CampaignStats {
    campaignId: string;
    /** Recipients handed to Resend (sent_history rows). */
    sent: number;
    /** Distinct subscribers who opened at least once, bots excluded. */
    uniqueOpens: number;
    /** Distinct subscribers who clicked through, bots excluded. */
    uniqueClicks: number;
    openRate: number | null;
    clickRate: number | null;
    /** Clicks as a share of openers: did the copy earn the click? */
    clickToOpenRate: number | null;
    /** Orders attributed to this campaign via the checkout note. */
    attributedOrders: number;
    /** Revenue of those orders, USD. */
    attributedRevenue: number;
}

export function emptyStats(campaignId: string): CampaignStats {
    return {
        campaignId,
        sent: 0,
        uniqueOpens: 0,
        uniqueClicks: 0,
        openRate: null,
        clickRate: null,
        clickToOpenRate: null,
        attributedOrders: 0,
        attributedRevenue: 0,
    };
}

function rate(numerator: number, denominator: number): number | null {
    return denominator > 0 ? numerator / denominator : null;
}

/**
 * Build stats for a set of campaigns in one pass.
 *
 * `campaignIds` should include child campaigns: sends and their events are
 * recorded against the child, not the template. Pass a map of child -> parent
 * to roll a template's children up into one row.
 */
export async function loadCampaignStats(
    db: AdminClient,
    campaignIds: string[],
    rollUpTo: Map<string, string> = new Map(),
): Promise<Map<string, CampaignStats>> {
    const out = new Map<string, CampaignStats>();
    if (campaignIds.length === 0) return out;

    const key = (id: string) => rollUpTo.get(id) ?? id;
    for (const id of campaignIds) {
        if (!out.has(key(id))) out.set(key(id), emptyStats(key(id)));
    }

    // Denominator: who was actually sent to.
    for (let i = 0; i < campaignIds.length; i += 100) {
        const chunk = campaignIds.slice(i, i + 100);
        const { data, error } = await db
            .from("sent_history")
            .select("campaign_id")
            .in("campaign_id", chunk);
        if (error) throw new Error(`sent_history fetch failed: ${error.message}`);
        for (const row of data ?? []) {
            const stats = out.get(key(row.campaign_id));
            if (stats) stats.sent++;
        }
    }

    // Opens and clicks, deduped per subscriber and filtered for bots.
    const seenOpens = new Map<string, Set<string>>();
    const seenClicks = new Map<string, Set<string>>();
    for (let i = 0; i < campaignIds.length; i += 100) {
        const chunk = campaignIds.slice(i, i + 100);
        const { data, error } = await db
            .from("email_events")
            .select("campaign_id, subscriber_id, type, user_agent")
            .in("campaign_id", chunk)
            .in("type", ["open", "click"]);
        if (error) throw new Error(`email_events fetch failed: ${error.message}`);
        for (const row of data ?? []) {
            if (!row.campaign_id || !row.subscriber_id) continue;
            if (isBotOpen(row.user_agent)) continue;
            const bucket = row.type === "open" ? seenOpens : seenClicks;
            const k = key(row.campaign_id);
            let set = bucket.get(k);
            if (!set) {
                set = new Set();
                bucket.set(k, set);
            }
            set.add(row.subscriber_id);
        }
    }

    // Attributed purchases. The campaign id lives in metadata, so this is a
    // JSON containment filter rather than a column match.
    for (const id of new Set(campaignIds.map(key))) {
        const { data, error } = await db
            .from("events")
            .select("metadata")
            .eq("event_name", "purchase")
            .eq("metadata->>email_campaign_id", id);
        if (error) throw new Error(`purchase fetch failed: ${error.message}`);
        const stats = out.get(id);
        if (!stats) continue;
        for (const row of data ?? []) {
            const meta = (row.metadata ?? {}) as Record<string, unknown>;
            stats.attributedOrders++;
            const price = Number(meta.total_price);
            if (Number.isFinite(price)) stats.attributedRevenue += price;
        }
    }

    for (const [id, stats] of out) {
        stats.uniqueOpens = seenOpens.get(id)?.size ?? 0;
        stats.uniqueClicks = seenClicks.get(id)?.size ?? 0;
        stats.openRate = rate(stats.uniqueOpens, stats.sent);
        stats.clickRate = rate(stats.uniqueClicks, stats.sent);
        stats.clickToOpenRate = rate(stats.uniqueClicks, stats.uniqueOpens);
    }

    return out;
}

/** "42%" / "-" when there is no denominator yet. */
export function formatRate(value: number | null): string {
    return value === null ? "-" : `${Math.round(value * 100)}%`;
}
