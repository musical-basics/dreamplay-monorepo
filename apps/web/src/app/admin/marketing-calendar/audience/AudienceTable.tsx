"use client";

import { useMemo, useState, useTransition } from "react";
import { saveAudienceRemovals } from "@/actions/marketing-calendar-actions";

export interface AudiencePerson {
    id: string;
    email: string;
    name: string;
    country: string;
    signals: string[];
    signedUp: string;
    removed: boolean;
}

export function AudienceTable({
    people,
    signalCounts,
}: {
    people: AudiencePerson[];
    signalCounts: [string, number][];
}) {
    const [removed, setRemoved] = useState<Set<string>>(new Set(people.filter((p) => p.removed).map((p) => p.id)));
    const [query, setQuery] = useState("");
    const [signalFilter, setSignalFilter] = useState<string | null>(null);
    const [dirty, setDirty] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    const included = people.length - removed.size;

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return people.filter((p) => {
            if (q && !p.email.toLowerCase().includes(q) && !p.name.toLowerCase().includes(q)) return false;
            if (signalFilter && !p.signals.includes(signalFilter)) return false;
            return true;
        });
    }, [people, query, signalFilter]);

    function toggle(id: string) {
        setRemoved((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
        setDirty(true);
        setSaved(false);
    }

    function save() {
        setError(null);
        startTransition(async () => {
            const result = await saveAudienceRemovals([...removed]);
            if (result.ok) {
                setDirty(false);
                setSaved(true);
            } else setError(result.error ?? "Save failed");
        });
    }

    return (
        <div>
            {/* Sticky save bar */}
            <div className="sticky top-0 z-10 flex flex-wrap items-center gap-4 bg-[#0b0b0d]/95 backdrop-blur border-b border-white/10 py-3 mb-6">
                <p className="font-sans text-sm text-white/60">
                    <span className="text-white font-bold">{included}</span> in audience ·{" "}
                    <span className="text-white/40">{removed.size} excluded</span>
                </p>
                <button
                    type="button"
                    onClick={save}
                    disabled={pending || !dirty}
                    className="border border-white bg-white px-5 py-2 font-sans text-[11px] font-bold uppercase tracking-widest text-black hover:bg-neutral-200 disabled:opacity-40"
                >
                    {pending ? "Saving..." : "Save audience"}
                </button>
                {dirty && !pending && <span className="font-sans text-xs text-amber-300">Unsaved changes</span>}
                {saved && !dirty && <span className="font-sans text-xs text-emerald-400">Audience saved.</span>}
                {error && <span className="font-sans text-xs text-red-400">{error}</span>}
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search email or name..."
                    className="ml-auto w-64 border border-white/15 bg-black/40 rounded px-3 py-2 font-sans text-sm text-white focus:border-amber-300 focus:outline-none"
                />
            </div>

            {/* Signal filter chips */}
            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    type="button"
                    onClick={() => setSignalFilter(null)}
                    className={`border px-3 py-1.5 font-sans text-[11px] uppercase tracking-widest ${
                        signalFilter === null ? "border-amber-300/70 text-amber-300" : "border-white/15 text-white/50 hover:border-white/40"
                    }`}
                >
                    All · {people.length}
                </button>
                {signalCounts.map(([signal, count]) => (
                    <button
                        key={signal}
                        type="button"
                        onClick={() => setSignalFilter((s) => (s === signal ? null : signal))}
                        className={`border px-3 py-1.5 font-sans text-[11px] tracking-wide ${
                            signalFilter === signal
                                ? "border-amber-300/70 text-amber-300"
                                : "border-white/15 text-white/50 hover:border-white/40"
                        }`}
                    >
                        {signal} · {count}
                    </button>
                ))}
            </div>

            <div className="overflow-x-auto border border-white/10">
                <table className="w-full font-sans text-sm">
                    <thead>
                        <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-[0.2em] text-white/40">
                            <th className="px-4 py-3">Person</th>
                            <th className="px-4 py-3">Intent signals</th>
                            <th className="px-4 py-3">Country</th>
                            <th className="px-4 py-3">Signed up</th>
                            <th className="px-4 py-3 text-right">In audience</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map((p) => {
                            const isRemoved = removed.has(p.id);
                            return (
                                <tr
                                    key={p.id}
                                    className={`border-b border-white/5 last:border-b-0 hover:bg-white/[0.03] ${
                                        isRemoved ? "opacity-40" : ""
                                    }`}
                                >
                                    <td className="px-4 py-3">
                                        <p className={`text-white/90 ${isRemoved ? "line-through" : ""}`}>{p.email}</p>
                                        {p.name && <p className="text-[12px] text-white/40">{p.name}</p>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {p.signals.map((s) => (
                                                <span
                                                    key={s}
                                                    className="border border-amber-300/25 text-amber-200/80 px-1.5 py-0.5 text-[10px] tracking-wide"
                                                >
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-white/50">{p.country || ""}</td>
                                    <td className="px-4 py-3 text-white/50">{p.signedUp}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            type="button"
                                            onClick={() => toggle(p.id)}
                                            className={`border px-3 py-1 font-sans text-[10px] uppercase tracking-widest ${
                                                isRemoved
                                                    ? "border-white/20 text-white/50 hover:border-emerald-400/60 hover:text-emerald-300"
                                                    : "border-white/20 text-white/70 hover:border-red-400/60 hover:text-red-300"
                                            }`}
                                        >
                                            {isRemoved ? "Restore" : "Exclude"}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {visible.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-white/30">
                                    Nobody matches this filter.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
