import {
    appendUnsubscribeFooter,
    buildUnsubscribeUrls,
    createResendSender,
    injectOpenPixel,
    pickTrackingBaseUrl,
    rewriteLinks,
    unsubscribeHeaders,
} from "@dreamplay/email";
import { getAdminDb } from "@/lib/db";
import {
    buildReminderCopy,
    findCallsDueForReminder,
    reminderFirstName,
} from "@/lib/call-reminder";
import { inngest } from "./client";

/**
 * founder-call-reminder-sweep: every 15 minutes, email anyone whose
 * confirmed call starts in roughly the next hour.
 *
 * A sweep rather than a per-call sleeping workflow, for the same reason as
 * the coupon trigger: rescheduling and cancelling are ordinary events here,
 * and a sweep reads current state every time instead of holding a promise
 * made 3 days ago.
 *
 * Idempotency has two layers, so a retry (or the next tick 15 minutes
 * later) can never remind someone twice:
 *   1. reminder_sent_at is stamped immediately after a successful send, and
 *      findCallsDueForReminder() only returns rows where it is null
 *   2. sent_history UNIQUE (campaign_id, subscriber_id) is the backstop if
 *      the stamp write itself fails
 *
 * The email is built per buyer rather than from a template campaign: the
 * body carries their own clock time, their Zoom link or the number we will
 * ring, so there is no static HTML to store. Suppression, unsubscribe
 * headers and append-mode tracking are applied here explicitly to match
 * what sendCampaign would have done.
 */

const GLOBAL_SEND_LOCK = { key: "'global-send-lock'", limit: 1, scope: "account" as const };

const SEND_KEY = "founder-call-reminder-1";
const CAMPAIGN_NAME = "Founder Call 1 Hour Reminder (AB Test August 10)";
const FROM = "Lionel from DreamPlay <lionel@email.dreamplaypianos.com>";
const FROM_EMAIL = "lionel@email.dreamplaypianos.com";
const REPLY_TO = "support@dreamplaypianos.com";

/** Find (or create) the child campaign every reminder is recorded against. */
async function resolveCampaignId(): Promise<string> {
    const db = getAdminDb();
    const { data: existing } = await db
        .from("campaigns")
        .select("id")
        .eq("send_key", SEND_KEY)
        .maybeSingle();
    if (existing) return existing.id;

    const { data: created, error } = await db
        .from("campaigns")
        .insert({
            name: CAMPAIGN_NAME,
            subject_line: "Our call",
            html_content: "<p>per-buyer</p>",
            status: "sending",
            email_type: "automated",
            is_template: false,
            send_key: SEND_KEY,
            sent_from_email: FROM_EMAIL,
            category: "founder-call",
            workspace: "dreamplay_support",
        })
        .select("id")
        .single();
    if (error) throw new Error(`could not create reminder campaign: ${error.message}`);
    return created.id;
}

export const founderCallReminderSweep = inngest.createFunction(
    {
        id: "founder-call-reminder-sweep",
        concurrency: GLOBAL_SEND_LOCK,
        triggers: [{ cron: "*/15 * * * *" }],
    },
    async ({ step }) => {
        // Pin the evaluation instant so a step retry makes the same decisions
        // and renders the same "in about an hour" wording.
        const nowIso = await step.run("pin-now", async () => new Date().toISOString());
        const now = new Date(nowIso);

        const due = await step.run("find-due-calls", async () => {
            const rows = await findCallsDueForReminder(getAdminDb(), now);
            return rows.map((d) => ({
                callId: d.call.id,
                buyerId: d.buyerId,
                email: d.email,
                notes: d.notes,
                scheduledAt: d.call.scheduled_at,
                timezone: d.call.timezone,
                contactMethod: d.call.contact_method,
                contactValue: d.call.contact_value,
                meetingUrl: d.call.meeting_url,
            }));
        });

        if (due.length === 0) return { message: "No calls due for a reminder", sent: 0 };

        const campaignId = await step.run("resolve-campaign", resolveCampaignId);

        let sent = 0;
        let skipped = 0;
        for (const d of due) {
            const result = await step.run(`remind-${d.callId}`, async () => {
                const db = getAdminDb();

                const { data: sub } = await db
                    .from("subscribers")
                    .select("id, first_name, status")
                    .eq("email", d.email)
                    .maybeSingle();
                if (!sub) return { status: "skipped", reason: "no subscriber row" };
                if (sub.status !== "active") return { status: "skipped", reason: `status=${sub.status}` };

                const { data: suppressed } = await db
                    .from("suppressions")
                    .select("email")
                    .eq("email", d.email)
                    .maybeSingle();
                if (suppressed) return { status: "skipped", reason: "suppressed" };

                const { data: already } = await db
                    .from("sent_history")
                    .select("id")
                    .eq("campaign_id", campaignId)
                    .eq("subscriber_id", sub.id)
                    .maybeSingle();
                if (already) return { status: "skipped", reason: "already in sent_history" };

                const start = new Date(d.scheduledAt as string);
                const { subject, html: baseHtml } = buildReminderCopy({
                    firstName: reminderFirstName(sub.first_name, d.notes),
                    start,
                    now,
                    timezone: d.timezone,
                    contactMethod: d.contactMethod,
                    contactValue: d.contactValue,
                    meetingUrl: d.meetingUrl,
                });

                const baseUrl = pickTrackingBaseUrl(FROM_EMAIL);
                const unsubscribe = buildUnsubscribeUrls(baseUrl, sub.id, campaignId);
                let html = appendUnsubscribeFooter(baseHtml).replaceAll(
                    "{{unsubscribe_url}}",
                    unsubscribe.pageUrl,
                );
                html = rewriteLinks(html, {
                    baseUrl,
                    subscriberId: sub.id,
                    campaignId,
                    mode: "append",
                });
                html = injectOpenPixel(html, { baseUrl, subscriberId: sub.id, campaignId });

                const { id: resendId } = await createResendSender().send({
                    from: FROM,
                    to: d.email,
                    subject,
                    html,
                    headers: { ...unsubscribeHeaders(unsubscribe), "Reply-To": REPLY_TO },
                });

                await db.from("sent_history").insert({
                    campaign_id: campaignId,
                    subscriber_id: sub.id,
                    resend_email_id: resendId,
                });
                await db
                    .from("buyer_call_requests")
                    .update({ reminder_sent_at: new Date().toISOString() })
                    .eq("id", d.callId);

                return { status: "sent", reason: subject };
            });
            if (result.status === "sent") sent++;
            else skipped++;
        }

        return { message: `Sent ${sent} call reminder(s)`, sent, skipped, due: due.length };
    },
);

export const callFunctions = [founderCallReminderSweep];
