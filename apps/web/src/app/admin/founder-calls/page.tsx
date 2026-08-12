import Link from "next/link";
import { getAdminDb } from "@/lib/db";
import { loadArmOverrides, resolveArm } from "@/lib/buyer-research";
import {
    LIONEL_TZ,
    candidateSlots,
    suggestSchedule,
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
                <p className="font-sans text-sm text-white/40 mt-1 max-w-3xl leading-relaxed">
                    A suggested time for every buyer who asked for a call, inside your Friday and Saturday 2pm to 5pm ET
                    window where possible. Each card shows the time in your timezone and theirs. Move anyone you like,
                    then save. Nothing is emailed from this page.
                </p>
            </div>

            <CallScheduler requests={requests} slots={slotList} lionelTz={LIONEL_TZ} />
        </div>
    );
}
