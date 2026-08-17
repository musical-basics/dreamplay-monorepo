import Link from "next/link";
import { getAdminDb } from "@/lib/db";
import { loadArmOverrides, resolveArm } from "@/lib/buyer-research";
import {
    LIONEL_TZ,
    candidateSlots,
    formatIn,
    suggestSchedule,
    tzAbbrev,
    type CallPreference,
} from "@/lib/call-scheduling";
import { CallScheduler, type SchedulerRequest, type SchedulerSlot } from "./CallScheduler";

/**
 * /admin/founder-calls: turn call requests into actual booked times.
 *
 * Buyers gave preferred DAYS and PARTS OF DAY in their own timezone, never
 * an exact time. This page proposes a slot for each of them inside Lionel's
 * availability, shows the time in both timezones plus every reason the slot
 * does or does not work, and lets him move anyone before confirming. It
 * drafts only: the invite email is a separate, explicit send.
 */

export const dynamic = "force-dynamic";

/** Lionel already speaks to these buyers directly; no invite needed. */
const EXCLUDED_EMAILS = new Set(["jaydeireland@gmail.com"]);

function displayName(notes: string | null): string {
    const n = (notes ?? "").split(/[|]/)[0]?.trim() ?? "";
    return n.length > 1 && !/^csv import/i.test(n) ? n : "";
}

export default async function FounderCallsPage() {
    const db = getAdminDb();

    const [{ data: rows }, overrides] = await Promise.all([
        db.from("buyer_call_requests").select("*").order("created_at", { ascending: true }).limit(200),
        loadArmOverrides(db),
    ]);

    const buyerIds = (rows ?? []).map((r) => r.buyer_id);
    const { data: buyers } = buyerIds.length
        ? await db.from("buyers").select("id, email, notes, product_line").in("id", buyerIds)
        : { data: [] as { id: string; email: string; notes: string | null; product_line: string | null }[] };
    const buyerById = new Map((buyers ?? []).map((b) => [b.id, b]));

    const active = (rows ?? []).filter((r) => {
        const b = buyerById.get(r.buyer_id);
        return b && !EXCLUDED_EMAILS.has(b.email.toLowerCase()) && r.status !== "cancelled";
    });

    const now = new Date();
    const slots = candidateSlots(now, 21);

    const prefs: { id: string; email: string; pref: CallPreference }[] = active.map((r) => ({
        id: r.id,
        email: buyerById.get(r.buyer_id)?.email ?? "",
        pref: {
            timezone: r.timezone,
            preferredDays: r.preferred_days ?? [],
            dayParts: r.day_parts ?? [],
            notes: r.notes,
        },
    }));
    const suggested = suggestSchedule(prefs, slots);

    const requests: SchedulerRequest[] = active.map((r) => {
        const b = buyerById.get(r.buyer_id)!;
        const s = suggested.get(r.id) ?? null;
        return {
            id: r.id,
            buyerId: r.buyer_id,
            email: b.email,
            name: displayName(b.notes),
            arm: resolveArm(r.buyer_id, overrides),
            contactMethod: r.contact_method,
            contactValue: r.contact_value,
            timezone: r.timezone ?? LIONEL_TZ,
            preferredDays: r.preferred_days ?? [],
            dayParts: r.day_parts ?? [],
            notes: r.notes,
            status: r.status,
            // A slot already saved in the DB always wins over a fresh suggestion.
            scheduledAt: r.scheduled_at ?? s?.start.toISOString() ?? null,
            isSaved: Boolean(r.scheduled_at),
            inviteSentAt: r.invite_sent_at ?? null,
            suggestionReasons: s?.reasons ?? [],
            suggestionOutside: s?.outsidePreferred ?? false,
        };
    });

    const slotList: SchedulerSlot[] = slots.map((s) => ({ iso: s.toISOString() }));

    // The agenda: every booked call that has not finished yet (small grace
    // window so an in-progress call stays visible), regardless of the
    // scheduler's exclusions. This is the "what is on my calendar" view.
    const agenda = (rows ?? [])
        .filter((r) => r.scheduled_at && r.status !== "cancelled" && r.status !== "completed")
        .filter((r) => new Date(r.scheduled_at!).getTime() > now.getTime() - 30 * 60000)
        .sort((a, b) => a.scheduled_at!.localeCompare(b.scheduled_at!));

    return (
        <div>
            <div className="mb-6">
                <Link
                    href="/admin/buyers/research"
                    className="font-sans text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors"
                >
                    &larr; Research dashboard
                </Link>
                <h1 className="font-serif text-3xl tracking-tight mt-2">Founder calls</h1>
            </div>

            {/* ── UPCOMING AGENDA ── */}
            <div className="mb-10">
                <h2 className="font-sans text-xs uppercase tracking-[0.25em] text-blue-400 font-bold mb-3">
                    Upcoming calls · your time ({tzAbbrev(now, LIONEL_TZ)})
                </h2>
                {agenda.length === 0 ? (
                    <p className="font-sans text-sm text-white/40">Nothing on the calendar.</p>
                ) : (
                    <div className="space-y-2">
                        {agenda.map((r) => {
                            const b = buyerById.get(r.buyer_id);
                            const start = new Date(r.scheduled_at!);
                            const theirZone = r.timezone || LIONEL_TZ;
                            return (
                                <div
                                    key={r.id}
                                    className={`flex flex-wrap items-center gap-x-6 gap-y-2 border px-5 py-3.5 ${
                                        r.confirmed_at ? "border-emerald-400/30 bg-emerald-400/[0.04]" : "border-amber-400/30 bg-amber-400/[0.04]"
                                    }`}
                                >
                                    <div className="w-56">
                                        <p className="font-sans text-sm font-bold text-white">{formatIn(start, LIONEL_TZ)}</p>
                                        <p className="font-sans text-xs text-white/40">
                                            {formatIn(start, theirZone)} {tzAbbrev(start, theirZone)} for them
                                        </p>
                                    </div>
                                    <div className="min-w-[200px]">
                                        <p className="font-sans text-sm text-white/90">{displayName(b?.notes ?? null) || b?.email}</p>
                                        <p className="font-sans text-xs text-white/40">{b?.email}</p>
                                    </div>
                                    <div className="font-sans text-sm text-white/70">
                                        {r.contact_method === "zoom" && r.meeting_url ? (
                                            <a href={r.meeting_url} target="_blank" rel="noreferrer" className="text-blue-300 underline hover:text-blue-200">
                                                Zoom link
                                            </a>
                                        ) : (
                                            <span>
                                                {r.contact_method}
                                                {r.contact_value && <span className="text-white/50"> · {r.contact_value}</span>}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-1.5 ml-auto">
                                        <span
                                            className={`border px-2 py-0.5 font-sans text-[10px] uppercase tracking-widest ${
                                                r.confirmed_at ? "border-emerald-400/50 text-emerald-300" : "border-amber-400/50 text-amber-300"
                                            }`}
                                        >
                                            {r.confirmed_at ? "confirmed" : "awaiting reply"}
                                        </span>
                                        {r.reminder_sent_at && (
                                            <span className="border border-white/20 px-2 py-0.5 font-sans text-[10px] uppercase tracking-widest text-white/50">
                                                reminded
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="mb-6">
                <h2 className="font-sans text-xs uppercase tracking-[0.25em] text-blue-400 font-bold mb-2">
                    Scheduler
                </h2>
                <p className="font-sans text-sm text-white/40 max-w-3xl leading-relaxed">
                    A suggested time for every buyer who asked for a call, inside your availability where possible.
                    Each card shows the time in your timezone and theirs. Move anyone you like, then save. Nothing is
                    emailed from this page.
                </p>
            </div>

            <CallScheduler requests={requests} slots={slotList} lionelTz={LIONEL_TZ} />
        </div>
    );
}
