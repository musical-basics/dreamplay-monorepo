"use client";

import { useMemo, useState, useTransition } from "react";
import { saveCallSchedules } from "@/actions/buyer-research-actions";
import { formatIn, hourIn, partOfDay, tzAbbrev, weekdayIn, LIONEL_AVAILABILITY } from "@/lib/call-scheduling";

export interface SchedulerRequest {
    id: string;
    buyerId: string;
    email: string;
    name: string;
    arm: string;
    contactMethod: string;
    contactValue: string | null;
    timezone: string;
    preferredDays: string[];
    dayParts: string[];
    notes: string | null;
    status: string;
    scheduledAt: string | null;
    isSaved: boolean;
    inviteSentAt: string | null;
    suggestionReasons: string[];
    suggestionOutside: boolean;
}

export interface SchedulerSlot {
    iso: string;
}

const METHOD_LABEL: Record<string, string> = {
    zoom: "Zoom",
    phone: "Phone",
    whatsapp: "WhatsApp",
};

/** Does this slot match what the buyer asked for? Mirrors scoreSlot(). */
function fitFor(iso: string, r: SchedulerRequest): { fits: boolean; why: string[] } {
    const d = new Date(iso);
    const why: string[] = [];
    const day = weekdayIn(d, r.timezone);
    const hour = hourIn(d, r.timezone);
    const part = partOfDay(hour);
    const dayOk = r.preferredDays.length === 0 || r.preferredDays.includes(day);
    const partOk = r.dayParts.length === 0 || r.dayParts.includes(part);
    if (!dayOk) why.push(`${day} is not one of their days`);
    if (!partOk) why.push(`their ${part.toLowerCase()}, they asked for ${r.dayParts.join("/").toLowerCase()}`);
    return { fits: dayOk && partOk, why };
}

export function CallScheduler({
    requests,
    slots,
    lionelTz,
}: {
    requests: SchedulerRequest[];
    slots: SchedulerSlot[];
    lionelTz: string;
}) {
    const [assign, setAssign] = useState<Record<string, string | null>>(
        Object.fromEntries(requests.map((r) => [r.id, r.scheduledAt])),
    );
    const [dirty, setDirty] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    /** Slot -> buyer, so a double-booking is visible immediately. */
    const clashes = useMemo(() => {
        const seen = new Map<string, string[]>();
        for (const [id, iso] of Object.entries(assign)) {
            if (!iso) continue;
            seen.set(iso, [...(seen.get(iso) ?? []), id]);
        }
        return new Set([...seen.entries()].filter(([, ids]) => ids.length > 1).flatMap(([, ids]) => ids));
    }, [assign]);

    function setSlot(id: string, iso: string | null) {
        setAssign((a) => ({ ...a, [id]: iso }));
        setDirty(true);
        setSaved(false);
    }

    function save() {
        setError(null);
        startTransition(async () => {
            const result = await saveCallSchedules(assign);
            if (result.ok) {
                setDirty(false);
                setSaved(true);
            } else setError(result.error ?? "Save failed");
        });
    }

    const scheduledCount = Object.values(assign).filter(Boolean).length;

    return (
        <div>
            <div className="sticky top-0 z-10 flex flex-wrap items-center gap-4 bg-[#0b0b0d]/95 backdrop-blur border-b border-white/10 py-3 mb-6">
                <p className="font-sans text-sm text-white/60">
                    {scheduledCount} of {requests.length} scheduled
                </p>
                <button
                    type="button"
                    onClick={save}
                    disabled={pending || !dirty || clashes.size > 0}
                    className="border border-white bg-white px-5 py-2 font-sans text-[11px] font-bold uppercase tracking-widest text-black hover:bg-neutral-200 disabled:opacity-40"
                >
                    {pending ? "Saving..." : "Save schedule"}
                </button>
                {dirty && clashes.size === 0 && <span className="font-sans text-xs text-amber-300">Unsaved changes</span>}
                {clashes.size > 0 && (
                    <span className="font-sans text-xs text-red-400">Two buyers share a slot. Move one to save.</span>
                )}
                {saved && !dirty && <span className="font-sans text-xs text-emerald-400">Saved.</span>}
                {error && <span className="font-sans text-xs text-red-400">{error}</span>}
                <span className="font-sans text-xs text-white/35 ml-auto">
                    Your window: Fri &amp; Sat, {LIONEL_AVAILABILITY.startHour - 12}pm to{" "}
                    {LIONEL_AVAILABILITY.endHour - 12}pm ET
                </span>
            </div>

            <div className="space-y-4">
                {requests.map((r) => {
                    const iso = assign[r.id] ?? null;
                    const when = iso ? new Date(iso) : null;
                    const fit = iso ? fitFor(iso, r) : null;
                    const outsideWindow = when ? hourIn(when, lionelTz) >= LIONEL_AVAILABILITY.endHour : false;
                    const clash = clashes.has(r.id);

                    return (
                        <div
                            key={r.id}
                            className={`border ${clash ? "border-red-400/60" : "border-white/10"} bg-white/[0.02] p-5`}
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                <div className="min-w-0">
                                    <p className="font-sans text-sm text-white font-bold">
                                        {r.name || r.email}
                                        <span className="ml-2 font-normal text-white/40">{r.arm}</span>
                                        {r.inviteSentAt && (
                                            <span className="ml-2 font-normal text-emerald-400 text-xs">invite sent</span>
                                        )}
                                    </p>
                                    <p className="font-sans text-xs text-white/45 mt-0.5">{r.email}</p>
                                    <p className="font-sans text-xs text-white/45 mt-1">
                                        {METHOD_LABEL[r.contactMethod] ?? r.contactMethod}
                                        {r.contactValue ? ` · ${r.contactValue}` : ""} · {r.timezone}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-sans text-[10px] uppercase tracking-widest text-white/35">
                                        They asked for
                                    </p>
                                    <p className="font-sans text-xs text-white/70 mt-1 max-w-xs">
                                        {r.preferredDays.length ? r.preferredDays.join(", ") : "any day"}
                                    </p>
                                    <p className="font-sans text-xs text-white/70">
                                        {r.dayParts.length ? r.dayParts.join(" / ") : "any time"}
                                    </p>
                                </div>
                            </div>

                            {r.notes && (
                                <p className="font-sans text-xs text-amber-200/80 bg-amber-400/[0.06] border border-amber-400/20 px-3 py-2 mb-4">
                                    Their note: {r.notes}
                                </p>
                            )}

                            <div className="flex flex-wrap items-center gap-3">
                                <select
                                    value={iso ?? ""}
                                    onChange={(e) => setSlot(r.id, e.target.value || null)}
                                    className="border border-white/15 bg-black/40 rounded px-3 py-2 font-sans text-sm text-white focus:border-blue-400 focus:outline-none"
                                >
                                    <option value="">Not scheduled</option>
                                    {slots.map((s) => {
                                        const d = new Date(s.iso);
                                        const f = fitFor(s.iso, r);
                                        const past = hourIn(d, lionelTz) >= LIONEL_AVAILABILITY.endHour;
                                        return (
                                            <option key={s.iso} value={s.iso}>
                                                {formatIn(d, lionelTz)} ET → {formatIn(d, r.timezone)}{" "}
                                                {tzAbbrev(d, r.timezone)}
                                                {f.fits ? "" : "  (not their time)"}
                                                {past ? "  (past your 5pm)" : ""}
                                            </option>
                                        );
                                    })}
                                </select>

                                {when && (
                                    <div className="font-sans text-xs">
                                        <p className="text-white/80">
                                            You: {formatIn(when, lionelTz)} {tzAbbrev(when, lionelTz)}
                                        </p>
                                        <p className="text-white/60">
                                            Them: {formatIn(when, r.timezone)} {tzAbbrev(when, r.timezone)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-3 space-y-1">
                                {clash && (
                                    <p className="font-sans text-xs text-red-400">
                                        Another buyer is already on this slot.
                                    </p>
                                )}
                                {fit && !fit.fits && (
                                    <p className="font-sans text-xs text-amber-300">
                                        Outside what they asked for: {fit.why.join("; ")}.
                                    </p>
                                )}
                                {outsideWindow && (
                                    <p className="font-sans text-xs text-amber-300">
                                        This is past your 5pm ET cutoff. It is the only way to reach them in their
                                        evening.
                                    </p>
                                )}
                                {fit?.fits && !outsideWindow && !clash && (
                                    <p className="font-sans text-xs text-emerald-400/80">Fits both of you.</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
