"use client";

import { useMemo, useState } from "react";

export interface SurveyRow {
    id: string;
    buyerId: string;
    email: string;
    name: string;
    product: string;
    arm: string;
    rewardUsd: number;
    createdAt: string;
    answers: Record<string, string>;
}

export interface QuestionDef {
    id: string;
    label: string;
    kind: "radio" | "text";
    options: string[];
    optional: boolean;
}

const ARM_TINT: Record<string, string> = {
    A1: "text-blue-300",
    A2: "text-blue-400/70",
    B1: "text-purple-300",
    B2: "text-purple-400/70",
};

function fmtDate(iso: string): string {
    return new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

/** One horizontal distribution bar, clickable to filter. */
function Bar({
    label,
    count,
    total,
    active,
    onClick,
}: {
    label: string;
    count: number;
    total: number;
    active: boolean;
    onClick: () => void;
}) {
    const pct = total ? Math.round((count / total) * 100) : 0;
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full text-left group ${count === 0 ? "opacity-35" : ""}`}
            disabled={count === 0}
        >
            <div className="flex items-baseline justify-between gap-3 mb-1">
                <span
                    className={`font-sans text-xs ${active ? "text-amber-300 font-bold" : "text-white/70 group-hover:text-white"}`}
                >
                    {label}
                </span>
                <span className="font-sans text-xs text-white/45 tabular-nums shrink-0">
                    {count} · {pct}%
                </span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${active ? "bg-amber-400" : "bg-white/30 group-hover:bg-white/50"}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </button>
    );
}

export function SurveyResults({ rows, questions }: { rows: SurveyRow[]; questions: QuestionDef[] }) {
    /** questionId -> selected option. Multiple questions AND together. */
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [search, setSearch] = useState("");
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const radioQuestions = questions.filter((q) => q.kind === "radio");
    const textQuestions = questions.filter((q) => q.kind === "text");

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return rows.filter((r) => {
            for (const [qid, val] of Object.entries(filters)) {
                if ((r.answers[qid] ?? "") !== val) return false;
            }
            if (!term) return true;
            const haystack = [r.email, r.name, r.arm, ...Object.values(r.answers)].join(" ").toLowerCase();
            return haystack.includes(term);
        });
    }, [rows, filters, search]);

    /** Distributions always reflect the CURRENT filter, so they drill down. */
    const counts = useMemo(() => {
        const out: Record<string, Record<string, number>> = {};
        for (const q of radioQuestions) {
            const tally: Record<string, number> = {};
            for (const opt of q.options) tally[opt] = 0;
            for (const r of filtered) {
                const a = r.answers[q.id];
                if (!a) continue;
                tally[a] = (tally[a] ?? 0) + 1;
            }
            out[q.id] = tally;
        }
        return out;
    }, [filtered, radioQuestions]);

    const armCounts = useMemo(() => {
        const t: Record<string, number> = {};
        for (const r of filtered) t[r.arm] = (t[r.arm] ?? 0) + 1;
        return t;
    }, [filtered]);

    function toggleFilter(qid: string, value: string) {
        setFilters((f) => {
            const next = { ...f };
            if (next[qid] === value) delete next[qid];
            else next[qid] = value;
            return next;
        });
    }

    const activeFilters = Object.entries(filters);

    return (
        <div>
            {/* Filter bar */}
            <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 bg-[#0b0b0d]/95 backdrop-blur border-b border-white/10 py-3 mb-6">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search answers, names, emails..."
                    className="border border-white/15 bg-black/40 rounded px-3 py-2 font-sans text-sm text-white placeholder-white/30 focus:border-blue-400 focus:outline-none min-w-[260px]"
                />
                <p className="font-sans text-sm text-white/60">
                    {filtered.length} of {rows.length} shown
                </p>
                {(["A1", "A2", "B1", "B2"] as const).map((a) =>
                    armCounts[a] ? (
                        <span key={a} className={`font-sans text-xs ${ARM_TINT[a]}`}>
                            {a} {armCounts[a]}
                        </span>
                    ) : null,
                )}
                {activeFilters.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setFilters({})}
                        className="ml-auto border border-white/20 px-3 py-1.5 font-sans text-[11px] uppercase tracking-widest text-white/70 hover:border-white/50"
                    >
                        Clear {activeFilters.length} filter{activeFilters.length === 1 ? "" : "s"}
                    </button>
                )}
            </div>

            {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    {activeFilters.map(([qid, val]) => {
                        const q = questions.find((x) => x.id === qid);
                        return (
                            <button
                                key={qid}
                                type="button"
                                onClick={() => toggleFilter(qid, val)}
                                className="border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 font-sans text-xs text-amber-200 hover:border-amber-300"
                            >
                                {q?.label.replace(/\?$/, "")}: <strong>{val}</strong> ×
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Distributions */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-7 mb-12">
                {radioQuestions.map((q) => (
                    <div key={q.id}>
                        <h2 className="font-sans text-xs font-bold text-white mb-3 leading-snug">{q.label}</h2>
                        <div className="space-y-2.5">
                            {q.options.map((opt) => (
                                <Bar
                                    key={opt}
                                    label={opt}
                                    count={counts[q.id]?.[opt] ?? 0}
                                    total={filtered.length}
                                    active={filters[q.id] === opt}
                                    onClick={() => toggleFilter(q.id, opt)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Individual responses */}
            <h2 className="font-serif text-2xl mb-4">
                Responses <span className="text-white/40 text-lg">({filtered.length})</span>
            </h2>

            <div className="space-y-4">
                {filtered.map((r) => {
                    const isOpen = expanded[r.id] ?? false;
                    return (
                        <div key={r.id} className="border border-white/10 bg-white/[0.02] p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                                <div className="min-w-0">
                                    <p className="font-sans text-sm text-white font-bold">
                                        {r.name || r.email}
                                        <span className={`ml-2 font-normal ${ARM_TINT[r.arm] ?? "text-white/40"}`}>
                                            {r.arm}
                                        </span>
                                        {r.rewardUsd > 0 && (
                                            <span className="ml-2 font-normal text-emerald-400/80 text-xs">
                                                ${r.rewardUsd} credit
                                            </span>
                                        )}
                                    </p>
                                    <p className="font-sans text-xs text-white/45 mt-0.5">
                                        {r.email}
                                        {r.product ? ` · ${r.product}` : ""}
                                    </p>
                                </div>
                                <p className="font-sans text-xs text-white/35 shrink-0">{fmtDate(r.createdAt)}</p>
                            </div>

                            {/* The two open-text answers are the point of the survey, so
                                they are always visible; the multiple choice folds away. */}
                            {textQuestions.map((q) => {
                                const val = (r.answers[q.id] ?? "").trim();
                                if (!val) return null;
                                return (
                                    <div key={q.id} className="mb-3">
                                        <p className="font-sans text-[10px] uppercase tracking-widest text-white/35 mb-1">
                                            {q.label.replace(/\s*\(optional\)$/i, "")}
                                        </p>
                                        <p className="font-sans text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                                            {val}
                                        </p>
                                    </div>
                                );
                            })}

                            <button
                                type="button"
                                onClick={() => setExpanded((e) => ({ ...e, [r.id]: !isOpen }))}
                                className="font-sans text-[11px] uppercase tracking-widest text-white/45 hover:text-white mt-1"
                            >
                                {isOpen ? "Hide answers" : "All answers"}
                            </button>

                            {isOpen && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-4 pt-4 border-t border-white/10">
                                    {radioQuestions.map((q) => (
                                        <div key={q.id}>
                                            <p className="font-sans text-[10px] uppercase tracking-widest text-white/35">
                                                {q.label.replace(/\?$/, "")}
                                            </p>
                                            <p className="font-sans text-sm text-white/80">
                                                {r.answers[q.id] || "—"}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {filtered.length === 0 && (
                    <p className="font-sans text-sm text-white/40 py-12 text-center">
                        No responses match those filters.
                    </p>
                )}
            </div>
        </div>
    );
}
