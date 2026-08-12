/**
 * Data access for the $50 coupon trigger. Shared by the Inngest cron
 * (send path) and /admin/marketing-calendar/coupon (review path) so both
 * always agree about who is eligible.
 *
 * Pure decision logic lives in ./coupon-trigger; this module only fetches.
 */

import type { AdminClient } from "@dreamplay/db";
import {
    COUPON_OPEN_LOOKBACK_DAYS,
    COUPON_SEND_KEY_PREFIX,
    COUPON_SETTING,
    COUPON_TEMPLATE_NAME,
    type CouponCandidate,
    type CouponTriggerSetting,
    evaluateCouponCandidates,
    parseCouponSetting,
    summarizeOpens,
} from "./coupon-trigger";
import { AUDIENCE_SETTING, MARKETING_CALENDAR_CATEGORY, parseAudienceSetting } from "./marketing-calendar";

export interface CouponPipeline {
    setting: CouponTriggerSetting;
    /** The coupon template campaign, or null if the seed script never ran. */
    templateId: string | null;
    /** Marketing campaigns whose opens count (parents + sent children). */
    trackedCampaignIds: string[];
    candidates: CouponCandidate[];
    /** Subscriber ids that already received the coupon. */
    sentCount: number;
    evaluatedAt: string;
}

async function fetchAll<T>(
    run: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
    page = 1000,
): Promise<T[]> {
    const out: T[] = [];
    for (let from = 0; ; from += page) {
        const { data, error } = await run(from, from + page - 1);
        if (error) throw new Error(error.message);
        const rows = data ?? [];
        out.push(...rows);
        if (rows.length < page) return out;
    }
}

/**
 * Build the full coupon pipeline: who is engaged, who is ready, who is held
 * and why. Read-only; sends nothing.
 */
export async function loadCouponPipeline(db: AdminClient, now = new Date()): Promise<CouponPipeline> {
    const [settingRow, audienceRow, templateRow] = await Promise.all([
        db.from("app_settings").select("value").eq("key", COUPON_SETTING).maybeSingle(),
        db.from("app_settings").select("value").eq("key", AUDIENCE_SETTING).maybeSingle(),
        db.from("campaigns").select("id").eq("name", COUPON_TEMPLATE_NAME).eq("is_template", true).maybeSingle(),
    ]);

    const setting = parseCouponSetting(settingRow.data?.value);
    const audience = parseAudienceSetting(audienceRow.data?.value);
    const removed = new Set(audience?.removedIds ?? []);
    const audienceIds = new Set((audience?.subscriberIds ?? []).filter((id) => !removed.has(id)));
    const templateId = templateRow.data?.id ?? null;

    // Campaigns whose opens count toward the threshold: every
    // marketing-calendar campaign (the nurture drafts and any child campaigns
    // their sends mint), MINUS the coupon email itself in every form, so
    // opening a coupon can never re-qualify someone for another coupon.
    //
    // The coupon is excluded three ways because each alone is fragile:
    // by id (the template), by parent_template_id (its per-recipient
    // children, which inherit the marketing-calendar category) and by name
    // prefix (a belt-and-braces catch if a child is ever minted without the
    // parent link).
    const { data: marketingCampaigns, error: campaignErr } = await db
        .from("campaigns")
        .select("id, name, parent_template_id")
        .eq("category", MARKETING_CALENDAR_CATEGORY);
    if (campaignErr) throw new Error(`campaign fetch failed: ${campaignErr.message}`);
    const trackedCampaignIds = (marketingCampaigns ?? [])
        .filter(
            (c) =>
                c.id !== templateId &&
                c.parent_template_id !== templateId &&
                !c.name.startsWith(COUPON_TEMPLATE_NAME),
        )
        .map((c) => c.id);
    const trackedSet = new Set(trackedCampaignIds);

    if (trackedCampaignIds.length === 0) {
        return { setting, templateId, trackedCampaignIds, candidates: [], sentCount: 0, evaluatedAt: now.toISOString() };
    }

    // Opens on those campaigns inside the lookback window.
    const openCutoff = new Date(now.getTime() - COUPON_OPEN_LOOKBACK_DAYS * 864e5).toISOString();
    const openRows = await fetchAll<{
        subscriber_id: string | null;
        campaign_id: string | null;
        created_at: string;
        user_agent: string | null;
    }>((from, to) =>
        db
            .from("email_events")
            .select("subscriber_id, campaign_id, created_at, user_agent")
            .eq("type", "open")
            .gte("created_at", openCutoff)
            .in("campaign_id", trackedCampaignIds)
            .order("created_at", { ascending: true })
            .range(from, to),
    );

    const engagement = summarizeOpens(openRows, trackedSet);
    if (engagement.size === 0) {
        return { setting, templateId, trackedCampaignIds, candidates: [], sentCount: 0, evaluatedAt: now.toISOString() };
    }

    // Resolve the engaged subscribers (active only).
    const engagedIds = [...engagement.keys()];
    const subscribers = new Map<string, { email: string; firstName: string }>();
    for (let i = 0; i < engagedIds.length; i += 200) {
        const chunk = engagedIds.slice(i, i + 200);
        const { data, error } = await db
            .from("subscribers")
            .select("id, email, first_name")
            .eq("status", "active")
            .in("id", chunk);
        if (error) throw new Error(`subscriber fetch failed: ${error.message}`);
        for (const s of data ?? []) {
            subscribers.set(s.id, { email: s.email, firstName: s.first_name ?? "" });
        }
    }

    const emails = [...subscribers.values()].map((s) => s.email.toLowerCase());

    // Purchases: `events` is authoritative. buyers.purchase_date is NULL for
    // webhook-created rows (the webhook upserts with ignoreDuplicates), so we
    // also treat any buyers row as purchased.
    const purchasedEmails = new Set<string>();
    const suppressedEmails = new Set<string>();
    for (let i = 0; i < emails.length; i += 100) {
        const chunk = emails.slice(i, i + 100);
        const [purchases, buyers, suppressions] = await Promise.all([
            db.from("events").select("email").eq("event_name", "purchase").in("email", chunk),
            db.from("buyers").select("email").in("email", chunk),
            db.from("suppressions").select("email").in("email", chunk),
        ]);
        for (const r of purchases.data ?? []) if (r.email) purchasedEmails.add(r.email.toLowerCase());
        for (const r of buyers.data ?? []) if (r.email) purchasedEmails.add(r.email.toLowerCase());
        for (const r of suppressions.data ?? []) suppressedEmails.add(r.email.toLowerCase());
    }

    // Already sent: the coupon's child campaigns carry send_key
    // "<prefix>:<subscriberId>", so the keys alone tell us who got one.
    const { data: sentChildren, error: sentErr } = await db
        .from("campaigns")
        .select("send_key")
        .like("send_key", `${COUPON_SEND_KEY_PREFIX}:%`);
    if (sentErr) throw new Error(`sent-coupon fetch failed: ${sentErr.message}`);
    const alreadySentIds = new Set(
        (sentChildren ?? [])
            .map((c) => c.send_key?.slice(COUPON_SEND_KEY_PREFIX.length + 1))
            .filter((id): id is string => Boolean(id)),
    );

    const candidates = evaluateCouponCandidates({
        engagement,
        subscribers,
        purchasedEmails,
        suppressedEmails,
        alreadySentIds,
        audienceIds,
        now,
    });

    return {
        setting,
        templateId,
        trackedCampaignIds,
        candidates,
        sentCount: alreadySentIds.size,
        evaluatedAt: now.toISOString(),
    };
}
