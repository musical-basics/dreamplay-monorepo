import type { AdminClient, Tables } from "@dreamplay/db";
import { formatIn, localeForZone, LIONEL_TZ } from "@/lib/call-scheduling";

/**
 * One-hour-before reminders for confirmed founder calls.
 *
 * Shared by the cron (inngest/call-functions.ts) and
 * scripts/email/send-call-reminders.mjs so both pick the same calls and
 * send the same words.
 *
 * A call is due for a reminder when ALL of these hold:
 *   - status 'scheduled' and confirmed_at set: never nag someone who has
 *     not agreed to the time
 *   - it starts within the window and has not already started
 *   - reminder_sent_at is null: the stamp is what makes a frequent cron safe
 *   - a Zoom call has a meeting_url: otherwise the reminder would point at a
 *     link the buyer was never sent
 */

export type CallRequest = Tables<"buyer_call_requests">;

/** Default lookahead. A 15-minute cron then fires each reminder 60-75 min out. */
export const REMINDER_WINDOW_MINUTES = 75;

export interface DueCall {
    call: CallRequest;
    buyerId: string;
    email: string;
    notes: string | null;
}

export async function findCallsDueForReminder(
    db: AdminClient,
    now: Date,
    windowMinutes = REMINDER_WINDOW_MINUTES,
): Promise<DueCall[]> {
    const ceiling = new Date(now.getTime() + windowMinutes * 60000);
    const { data: calls } = await db
        .from("buyer_call_requests")
        .select("*")
        .eq("status", "scheduled")
        .not("scheduled_at", "is", null)
        .is("reminder_sent_at", null)
        .gte("scheduled_at", now.toISOString())
        .lte("scheduled_at", ceiling.toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(100);

    const due: DueCall[] = [];
    for (const call of calls ?? []) {
        if (!call.confirmed_at) continue;
        if (call.contact_method === "zoom" && !call.meeting_url) continue;
        const { data: buyer } = await db
            .from("buyers")
            .select("id, email, notes")
            .eq("id", call.buyer_id)
            .maybeSingle();
        if (!buyer || buyer.email.endsWith("@no-email.invalid")) continue;
        due.push({ call, buyerId: buyer.id, email: buyer.email, notes: buyer.notes });
    }
    return due;
}

/** "1:00 PM EDT" in the buyer's own zone, which is the only time they care about. */
export function clockOnlyIn(date: Date, zone: string): string {
    const options: Intl.DateTimeFormatOptions = {
        timeZone: zone,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    };
    const time = new Intl.DateTimeFormat("en-US", options).format(date);
    const labelParts = new Intl.DateTimeFormat(localeForZone(zone), {
        timeZone: zone,
        timeZoneName: "short",
    }).formatToParts(date);
    const label = labelParts.find((p) => p.type === "timeZoneName")?.value ?? "";
    return `${time} ${label}`.trim();
}

/**
 * Human distance to the call. Phrased loosely so the wording stays true even
 * if the cron fires a few minutes early or late.
 */
export function minutesAwayPhrase(start: Date, now: Date): string {
    const mins = Math.round((start.getTime() - now.getTime()) / 60000);
    if (mins <= 45) return "in about half an hour";
    if (mins <= 75) return "in about an hour";
    if (mins <= 105) return "in about an hour and a half";
    return `in about ${Math.round(mins / 60)} hours`;
}

const ESC = (s: unknown) =>
    String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export interface ReminderCopy {
    subject: string;
    html: string;
}

/**
 * Short on purpose: they already confirmed and have the details, so this
 * exists to put the call top of mind and make backing out feel easy.
 */
export function buildReminderCopy(params: {
    firstName: string;
    start: Date;
    now: Date;
    timezone: string | null;
    contactMethod: string;
    contactValue: string | null;
    meetingUrl: string | null;
}): ReminderCopy {
    const zone = params.timezone || LIONEL_TZ;
    const theirClock = clockOnlyIn(params.start, zone);
    const away = minutesAwayPhrase(params.start, params.now);

    const how =
        params.contactMethod === "zoom"
            ? `Here is the Zoom link again: <a href="${params.meetingUrl ?? ""}">${ESC(params.meetingUrl ?? "")}</a>`
            : params.contactMethod === "whatsapp"
              ? `I will reach you on WhatsApp at ${ESC(params.contactValue ?? "the number you gave me")}.`
              : `I will call you at ${ESC(params.contactValue ?? "the number you gave me")}.`;

    const lines = [
        `${ESC(params.firstName)}, we are on ${ESC(away)}.`,
        "",
        `Your time: <b>${ESC(theirClock)}</b>`,
        "",
        how,
        "",
        "It is only 15 minutes and there is nothing to prepare. I mostly want to hear what made you order and what you are hoping for.",
        "",
        "If something has come up, just reply and we will find another time. No problem at all.",
        "",
        "Talk soon.",
        "",
        "Lionel Yu",
        "Founder, DreamPlay Pianos",
    ];
    const body = lines.map((l) => (l === "" ? "<div><br></div>" : `<div>${l}</div>`)).join("\n");

    return {
        subject: `${params.firstName}, our call is ${away}`,
        html: `<!DOCTYPE html>
<html><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body>
<div style="font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:1.5; color:#222222;">
${body}
</div>
</body></html>`,
    };
}

/** First name for the greeting: subscriber record first, buyer notes second. */
export function reminderFirstName(subFirstName: string | null, notes: string | null): string {
    const fromSub = subFirstName?.trim();
    if (fromSub) return fromSub;
    const raw = (notes ?? "").split(/[|—]/)[0]?.trim() ?? "";
    if (!raw || /^csv import/i.test(raw)) return "there";
    return raw.split(/\s+/)[0] ?? "there";
}

/** Long form used in logs and admin views: "Fri, Aug 14, 2:00 PM". */
export function describeCall(call: CallRequest): string {
    if (!call.scheduled_at) return "unscheduled";
    return formatIn(new Date(call.scheduled_at), call.timezone || LIONEL_TZ);
}
