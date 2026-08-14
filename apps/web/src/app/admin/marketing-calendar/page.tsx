import Link from "next/link";
import { loadCampaignStats } from "@/lib/campaign-stats";
import { COUPON_AMOUNT_USD, COUPON_TEMPLATE_NAME } from "@/lib/coupon-trigger";
import { getAdminDb } from "@/lib/db";
import {
    AUDIENCE_SETTING,
    MARKETING_CALENDAR_CATEGORY,
    parseAudienceSetting,
    utcIsoToEastern,
} from "@/lib/marketing-calendar";
import { CalendarBoard, type CalendarEmail } from "./CalendarBoard";
import { CampaignPerformance } from "./CampaignPerformance";

/**
 * /admin/marketing-calendar — the August 2026 nurture calendar.
 *
 * Eight draft emails on a Tue/Thu/Sun cadence, drawn from `campaigns` rows
 * with category "marketing-calendar". Everything is editable here (subject,
 * copy, preview text, send date + time in ET). Drafts stay inert until Lionel
 * approves and the send script goes out; this page never sends anything.
 *
 * Once they do send, the performance table below the calendar shows unique
 * open and click rates computed from email_events, plus any revenue
 * attributed back through the checkout note.
 */

export const dynamic = "force-dynamic";

export default async function MarketingCalendarPage() {
    const db = getAdminDb();
    const [{ data: campaigns }, { data: audienceRow }] = await Promise.all([
        db
            .from("campaigns")
            .select(
                "id, name, subject_line, html_content, scheduled_at, status, variable_values, is_template, parent_template_id",
            )
            .eq("category", MARKETING_CALENDAR_CATEGORY)
            .order("scheduled_at", { ascending: true }),
        db.from("app_settings").select("value").eq("key", AUDIENCE_SETTING).maybeSingle(),
    ]);

    const allRows = campaigns ?? [];

    // The calendar shows the eight scheduled nurture drafts. The coupon
    // template and the per-recipient children its sends mint are excluded:
    // the coupon has no date and belongs on its own page.
    const couponTemplateId = allRows.find(
        (c) => c.is_template && c.name === COUPON_TEMPLATE_NAME,
    )?.id;
    const isCouponRow = (c: (typeof allRows)[number]) =>
        c.id === couponTemplateId ||
        c.parent_template_id === couponTemplateId ||
        c.name.startsWith(COUPON_TEMPLATE_NAME);

    const scheduled = allRows.filter((c) => !isCouponRow(c) && !c.is_template);

    // Sends and their events are recorded against the CHILD campaign, so roll
    // each child up into the draft it came from before computing rates.
    const rollUp = new Map<string, string>();
    for (const c of allRows) {
        if (c.parent_template_id) rollUp.set(c.id, c.parent_template_id);
    }
    const statsIds = allRows.filter((c) => !isCouponRow(c)).map((c) => c.id);
    const stats = await loadCampaignStats(db, statsIds, rollUp);

    const emails: CalendarEmail[] = scheduled.map((c) => {
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

    const performance = emails.map((e) => ({
        id: e.id,
        topic: e.topic,
        subject: e.subject,
        date: e.date,
        stats: stats.get(e.id) ?? null,
    }));

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
                {emails.length} high-intent nurture emails, Tuesdays, Thursdays and Sundays. Click a card to edit its
                subject, copy and send time (Eastern Time). All emails are drafts: nothing sends until you give the
                word, and the send script will test to musicalbasics@gmail.com first as always.
            </p>
            {emails.length === 0 ? (
                <p className="font-sans text-sm text-white/40 border border-white/10 bg-white/[0.02] p-6">
                    No drafts found. Run <code className="text-emerald-300">node scripts/email/setup-marketing-calendar.mjs</code> to seed them.
                </p>
            ) : (
                <>
                    <CalendarBoard initialEmails={emails} />
                    <CampaignPerformance rows={performance} />
                </>
            )}
        </div>
    );
}
