/**
 * The $50 coupon trigger (Lionel, 2026-08-11): subscribers who opened 3 or
 * more marketing-calendar emails but have not purchased get a one-time
 * $50-off email, 3 days after the open that qualified them. It is additive:
 * they keep receiving every scheduled nurture email as well.
 *
 * Runs as a daily cron rather than reacting to each open, because the rule is
 * inherently time-delayed ("...and still has not bought 3 days later") and a
 * daily sweep is far easier to reason about and audit than 500 sleeping
 * workflows.
 *
 * Safety, in layers:
 *   1. Kill switch: app_settings["marketing-calendar:coupon-trigger"].enabled
 *      must be true. Ships OFF.
 *   2. A discount code must be configured. No code, no send.
 *   3. Per-subscriber send_key "marketing-coupon-offer:<id>" means a retry (or
 *      tomorrow's run) reuses the same child campaign, and sent_history's
 *      UNIQUE (campaign_id, subscriber_id) turns any double attempt into a
 *      no-op. One coupon per person, forever.
 *   4. DAILY_SEND_CAP bounds the blast radius of a logic bug: if the rule
 *      somehow matches everyone, at most this many go out per day, and the
 *      overflow is logged.
 *   5. Every send runs through sendCampaign, so suppression checks,
 *      unsubscribe footer, RFC 8058 headers and append-mode tracking are all
 *      inherited from the normal pipeline.
 */

import { sendCampaign } from "@dreamplay/email";
import { loadCouponPipeline } from "@/lib/coupon-trigger-data";
import { couponSendKey } from "@/lib/coupon-trigger";
import { getAdminDb } from "@/lib/db";
import { inngest } from "./client";
import { createSendDeps } from "./deps";

/** Shared with functions.ts: Resend allows 5 req/s account-wide. */
const GLOBAL_SEND_LOCK = { key: "'global-send-lock'", limit: 1, scope: "account" as const };

/** Blast-radius cap. Overflow simply waits for tomorrow's run. */
const DAILY_SEND_CAP = 40;

const FROM_NAME = "Lionel from DreamPlay";
const FROM_EMAIL = "lionel@email.dreamplaypianos.com";

/**
 * coupon-trigger-sweep — every day at 10:00 AM America/New_York, one hour
 * after the calendar's usual 9:00 AM send slot so the day's opens have had
 * time to land.
 */
export const couponTriggerSweep = inngest.createFunction(
    {
        id: "coupon-trigger-sweep",
        concurrency: GLOBAL_SEND_LOCK,
        triggers: [{ cron: "TZ=America/New_York 0 10 * * *" }],
    },
    async ({ step }) => {
        // Pin evaluation time so a step retry makes the same decisions.
        const nowIso = await step.run("pin-now", async () => new Date().toISOString());

        const plan = await step.run("evaluate", async () => {
            const pipeline = await loadCouponPipeline(getAdminDb(), new Date(nowIso));
            const ready = pipeline.candidates.filter((c) => c.hold === null);
            return {
                enabled: pipeline.setting.enabled,
                hasCode: pipeline.setting.discountCode.length > 0,
                templateId: pipeline.templateId,
                readyIds: ready.slice(0, DAILY_SEND_CAP).map((c) => c.subscriberId),
                deferred: Math.max(0, ready.length - DAILY_SEND_CAP),
                totalCandidates: pipeline.candidates.length,
            };
        });

        if (!plan.enabled) {
            return { message: "Coupon trigger is disabled; nothing sent", candidates: plan.totalCandidates };
        }
        if (!plan.hasCode) {
            return { message: "No discount code configured; nothing sent", candidates: plan.totalCandidates };
        }
        if (!plan.templateId) {
            return { message: "Coupon template campaign not found; nothing sent" };
        }
        if (plan.readyIds.length === 0) {
            return { message: "No subscribers eligible today", candidates: plan.totalCandidates };
        }

        // One step per recipient: each is independently retryable, and the
        // send_key makes a retry a no-op for anyone already sent.
        let sent = 0;
        let skipped = 0;
        for (const subscriberId of plan.readyIds) {
            const result = await step.run(`send-coupon-${subscriberId}`, async () => {
                return sendCampaign(createSendDeps(), {
                    campaignId: plan.templateId as string,
                    sendKey: couponSendKey(subscriberId),
                    overrideSubscriberIds: [subscriberId],
                    fromName: FROM_NAME,
                    fromEmail: FROM_EMAIL,
                    clickTracking: true,
                    clickTrackingMode: "append",
                    openTracking: true,
                    triggeredBy: "coupon-trigger-sweep",
                });
            });
            sent += result.sent;
            skipped += result.skippedAlreadySent + result.skippedSuppressed;
        }

        return {
            message: `Coupon trigger sent ${sent} email(s)`,
            sent,
            skipped,
            deferredToTomorrow: plan.deferred,
            candidates: plan.totalCandidates,
        };
    }
);

export const couponFunctions = [couponTriggerSweep];
