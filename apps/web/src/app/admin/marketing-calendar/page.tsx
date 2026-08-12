import Link from "next/link";
import { COUPON_AMOUNT_USD } from "@/lib/coupon-trigger";
import { getAdminDb } from "@/lib/db";
import {
    AUDIENCE_SETTING,
    MARKETING_CALENDAR_CATEGORY,
    parseAudienceSetting,
    utcIsoToEastern,
} from "@/lib/marketing-calendar";
import { CalendarBoard, type CalendarEmail } from "./CalendarBoard";

/**
 * /admin/marketing-calendar — the August 2026 nurture calendar.
 *
 * 10 draft emails on a Tue/Thu/Sun cadence, drawn from `campaigns` rows with
 * category "marketing-calendar". Everything is editable here (subject, copy,
 * preview text, send date + time in ET). Drafts stay inert until Lionel
 * approves and the send script goes out; this page never sends anything.
 */

export const dynamic = "force-dynamic";

export default async function MarketingCalendarPage() {
    const db = getAdminDb();
    const [{ data: campaigns }, { data: audienceRow }] = await Promise.all([
        db
            .from("campaigns")
            .select("id, name, subject_line, html_content, scheduled_at, status, variable_values")
            .eq("category", MARKETING_CALENDAR_CATEGORY)
            .order("scheduled_at", { ascending: true }),
        db.from("app_settings").select("value").eq("key", AUDIENCE_SETTING).maybeSingle(),
    ]);

    const emails: CalendarEmail[] = (campaigns ?? []).map((c) => {
        const vv = (typeof c.variable_values === "object" && c.variable_values !== null
            ? c.variable_values
            : {}) as Record<string, unknown>;
        const et = c.scheduled_at ? utcIsoToEastern(c.scheduled_at) : { date: "2026-08-13", time: "09:00" };
        return {
            id: c.id,
            topic: typeof vv.topic === "string" ? vv.topic : c.name,
            subject: c.subject_line ?? "",
            previewText: typeof vv.preview_text === "string" ? vv.preview_text : "",
            html: c.html_content ?? "",
            status: c.status,
            date: et.date,
            time: et.time,
        };
    });

    const audience = parseAudienceSetting(audienceRow?.value);
    const audienceCount = audience ? audience.subscriberIds.length - audience.removedIds.length : 0;

    return (
        <div>
            <div className="flex items-end justify-between gap-6 mb-2">
                <h1 className="font-serif text-3xl tracking-tight">Marketing Calendar</h1>
                <div className="flex items-center gap-5">
                    <Link
                        href="/admin/marketing-calendar/coupon"
                        className="font-sans text-xs uppercase tracking-widest text-amber-300 underline hover:text-amber-200"
                    >
                        ${COUPON_AMOUNT_USD} coupon trigger
                    </Link>
                    <Link
                        href="/admin/marketing-calendar/audience"
                        className="font-sans text-xs uppercase tracking-widest text-amber-300 underline hover:text-amber-200"
                    >
                        Review audience · {audienceCount} people
                    </Link>
                </div>
            </div>
            <p className="font-sans text-sm text-white/40 mb-8 max-w-3xl">
                Ten high-intent nurture emails, Tuesdays, Thursdays and Sundays. Click a card to edit its subject,
                copy and send time (Eastern Time). All emails are drafts: nothing sends until you give the word,
                and the send script will test to musicalbasics@gmail.com first as always.
            </p>
            {emails.length === 0 ? (
                <p className="font-sans text-sm text-white/40 border border-white/10 bg-white/[0.02] p-6">
                    No drafts found. Run <code className="text-emerald-300">node scripts/email/setup-marketing-calendar.mjs</code> to seed them.
                </p>
            ) : (
                <CalendarBoard initialEmails={emails} />
            )}
        </div>
    );
}
