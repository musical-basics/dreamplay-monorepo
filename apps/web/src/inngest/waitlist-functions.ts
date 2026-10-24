/**
 * Pro waitlist confirmation (Lionel, 2026-10-24; decision D21): everyone who
 * joins the DreamPlay One Pro waitlist gets one automatic email confirming
 * their place and pointing at the DreamPlay One, which ships now.
 *
 * Event-driven rather than a sweep: the email is a receipt, so it should land
 * while the visitor still remembers signing up. subscribeToNewsletter emits
 * PRO_WAITLIST_EVENT after a successful "Pro Waitlist" capture.
 *
 * Safety, in layers (mirrors coupon-functions.ts):
 *   1. Kill switch: app_settings[PRO_WAITLIST_SETTING].enabled must be true.
 *      Ships OFF. Signups while it is off never get the email later.
 *   2. Per-subscriber send_key (proWaitlistSendKey) + sent_history's UNIQUE
 *      (campaign_id, subscriber_id): one confirmation per person, forever,
 *      however many times they submit the form.
 *   3. rateLimit bounds the blast radius of scripted signups: past the cap,
 *      events are dropped (the capture itself is still saved).
 *   4. Every send runs through sendCampaign, so suppression checks,
 *      unsubscribe footer, RFC 8058 headers and append-mode tracking are all
 *      inherited from the normal pipeline.
 */

import { sendCampaign } from "@dreamplay/email";
import { getAdminDb } from "@/lib/db";
import {
    parseProWaitlistSetting,
    proWaitlistSendKey,
    PRO_WAITLIST_EVENT,
    PRO_WAITLIST_SETTING,
    PRO_WAITLIST_TEMPLATE_KEY,
} from "@/lib/pro-waitlist-email";
import { inngest } from "./client";
import { createSendDeps } from "./deps";

/** Shared with functions.ts: Resend allows 5 req/s account-wide. */
const GLOBAL_SEND_LOCK = { key: "'global-send-lock'", limit: 1, scope: "account" as const };

/** A handful of waitlist signups a week is normal; 50 in a day is not. */
const DAILY_SEND_CAP = 50;

const FROM_NAME = "Lionel from DreamPlay";
const FROM_EMAIL = "lionel@email.dreamplaypianos.com";
const REPLY_TO = "support@dreamplaypianos.com";

export const proWaitlistConfirmation = inngest.createFunction(
    {
        id: "pro-waitlist-confirmation",
        concurrency: GLOBAL_SEND_LOCK,
        rateLimit: { limit: DAILY_SEND_CAP, period: "1d" },
        triggers: [{ event: PRO_WAITLIST_EVENT }],
    },
    async ({ event, step }) => {
        const subscriberId = (event.data as { subscriberId?: unknown }).subscriberId;
        if (typeof subscriberId !== "string" || !subscriberId) {
            return { message: "No subscriberId on the event; nothing sent" };
        }

        const plan = await step.run("check", async () => {
            const db = getAdminDb();
            const [setting, template] = await Promise.all([
                db.from("app_settings").select("value").eq("key", PRO_WAITLIST_SETTING).maybeSingle(),
                db
                    .from("campaigns")
                    .select("id")
                    .eq("send_key", PRO_WAITLIST_TEMPLATE_KEY)
                    .eq("is_template", true)
                    .maybeSingle(),
            ]);
            if (setting.error) throw new Error(`setting read failed: ${setting.error.message}`);
            if (template.error) throw new Error(`template read failed: ${template.error.message}`);
            return {
                enabled: parseProWaitlistSetting(setting.data?.value).enabled,
                templateId: template.data?.id ?? null,
            };
        });

        if (!plan.enabled) return { message: "Pro waitlist confirmation is disabled; nothing sent" };
        if (!plan.templateId) return { message: "Pro waitlist template campaign not found; nothing sent" };

        const result = await step.run("send", async () => {
            return sendCampaign(createSendDeps(), {
                campaignId: plan.templateId as string,
                sendKey: proWaitlistSendKey(subscriberId),
                overrideSubscriberIds: [subscriberId],
                fromName: FROM_NAME,
                fromEmail: FROM_EMAIL,
                replyTo: REPLY_TO,
                clickTracking: true,
                clickTrackingMode: "append",
                openTracking: true,
                triggeredBy: "pro-waitlist-confirmation",
            });
        });

        return {
            message: result.sent ? "Pro waitlist confirmation sent" : "Already sent or suppressed; nothing sent",
            ...result,
        };
    }
);

export const waitlistFunctions = [proWaitlistConfirmation];
