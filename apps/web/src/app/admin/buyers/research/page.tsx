import Link from "next/link";
import type { Tables } from "@dreamplay/db";
import { getAdminDb } from "@/lib/db";
import { CallStatusButtons } from "./CallStatusButtons";
import {
    CALL_REWARD_USD,
    SURVEY_QUESTIONS,
    SURVEY_REWARD_USD,
    researchVariant,
} from "@/lib/buyer-research";

/**
 * /admin/buyers/research: the buyer research A/B test scoreboard.
 *
 * Variant A (survey, $5) vs variant B (founder call, $10): funnel per
 * variant (assigned → email sent/opened/clicked → page visited → completed),
 * survey answer distributions, open-text answers, and the call request
 * queue with status controls. Goals: which collection method wins, and what
 * actually motivates DreamPlay buyers.
 */

export const dynamic = "force-dynamic";

const SEND_KEYS = { survey: "buyer-research-2026-a", call: "buyer-research-2026-b" } as const;

function fmtWhen(iso: string | null): string {
    if (!iso) return "";
    return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function BuyerResearchPage() {
    const db = getAdminDb();

    const [{ data: buyers }, { data: campaigns }, { data: surveyRows }, { data: callRows }] = await Promise.all([
        db.from("buyers").select("*").eq("kind", "buyer").limit(1000),
        db.from("campaigns").select("id, send_key, total_recipients").in("send_key", Object.values(SEND_KEYS)),
        db.from("buyer_survey_responses").select("*").order("created_at", { ascending: false }).limit(1000),
        db.from("buyer_call_requests").select("*").order("created_at", { ascending: false }).limit(1000),
    ]);

    const emailable = (buyers ?? []).filter((b) => !b.email.endsWith("@no-email.invalid"));
    const assigned = { survey: 0, call: 0 };
    for (const b of emailable) assigned[researchVariant(b.id)]++;

    const buyerById = new Map((buyers ?? []).map((b) => [b.id, b]));

    // Email funnel per variant (zeros until the research emails are sent).
    const campaignByKey = new Map((campaigns ?? []).map((c) => [c.send_key, c]));
    const emailStats: Record<"survey" | "call", { sent: number; opened: number; clicked: number }> = {
        survey: { sent: 0, opened: 0, clicked: 0 },
        call: { sent: 0, opened: 0, clicked: 0 },
    };
    for (const variant of ["survey", "call"] as const) {
        const c = campaignByKey.get(SEND_KEYS[variant]);
        if (!c) continue;
        const [{ count: sent }, { data: events }] = await Promise.all([
            db.from("sent_history").select("id", { count: "exact", head: true }).eq("campaign_id", c.id),
            db.from("email_events").select("subscriber_id, type").eq("campaign_id", c.id).limit(10000),
        ]);
        emailStats[variant].sent = sent ?? 0;
        emailStats[variant].opened = new Set((events ?? []).filter((e) => e.type === "open").map((e) => e.subscriber_id)).size;
        emailStats[variant].clicked = new Set((events ?? []).filter((e) => e.type === "click").map((e) => e.subscriber_id)).size;
    }

    // Page visits (distinct identified buyers on each research page).
    const buyerEmails = emailable.map((b) => b.email.toLowerCase());
    const visits: Record<"survey" | "call", number> = { survey: 0, call: 0 };
    for (const [variant, path] of [["survey", "/buyer-survey"], ["call", "/founder-call"]] as const) {
        const { data } = await db
            .from("events")
            .select("email")
            .like("path", `${path}%`)
            .in("email", buyerEmails)
            .limit(10000);
        visits[variant] = new Set((data ?? []).map((e) => e.email?.toLowerCase()).filter(Boolean)).size;
    }

    const surveyDone = (surveyRows ?? []).length;
    const callsRequested = (callRows ?? []).length;
    const callsCompleted = (callRows ?? []).filter((c) => c.status === "completed").length;
    const rewardsOwed = surveyDone * SURVEY_REWARD_USD + callsCompleted * CALL_REWARD_USD;

    // Survey answer aggregation.
    const answerCounts = new Map<string, Map<string, number>>();
    const openAnswers: { question: string; buyer: string; text: string; at: string }[] = [];
    for (const r of surveyRows ?? []) {
        const answers = (r.answers ?? {}) as Record<string, string>;
        for (const q of SURVEY_QUESTIONS) {
            const v = answers[q.id];
            if (!v) continue;
            if (q.kind === "radio") {
                if (!answerCounts.has(q.id)) answerCounts.set(q.id, new Map());
                const m = answerCounts.get(q.id)!;
                m.set(v, (m.get(v) ?? 0) + 1);
            } else {
                openAnswers.push({
                    question: q.label,
                    buyer: buyerById.get(r.buyer_id)?.email ?? r.buyer_id,
                    text: v,
                    at: r.created_at,
                });
            }
        }
    }

    const funnelRows: { label: string; survey: number; call: number }[] = [
        { label: "Assigned", survey: assigned.survey, call: assigned.call },
        { label: "Email sent", survey: emailStats.survey.sent, call: emailStats.call.sent },
        { label: "Opened", survey: emailStats.survey.opened, call: emailStats.call.opened },
        { label: "Clicked", survey: emailStats.survey.clicked, call: emailStats.call.clicked },
        { label: "Visited page", survey: visits.survey, call: visits.call },
        { label: "Completed", survey: surveyDone, call: callsRequested },
    ];

    return (
        <div>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                <div>
                    <Link href="/admin/buyers" className="font-sans text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors">
                        &larr; All buyers
                    </Link>
                    <h1 className="font-serif text-3xl tracking-tight mt-2">Buyer research A/B</h1>
                    <p className="font-sans text-sm text-white/40 mt-1">
                        A = survey ($5) · B = 15-minute founder call ($10) · deterministic split by buyer id
                    </p>
                </div>
                <div className="border border-amber-400/40 bg-amber-400/[0.06] px-4 py-3">
                    <p className="font-sans text-xl text-amber-300">${rewardsOwed}</p>
                    <p className="font-sans text-[10px] uppercase tracking-widest text-amber-300/70 mt-0.5">Rewards owed</p>
                </div>
            </div>

            {/* FUNNEL */}
            <div className="overflow-x-auto border border-white/10 mb-10">
                <table className="w-full font-sans text-sm">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/[0.03] text-left">
                            <th className="px-4 py-2.5 font-sans text-[11px] uppercase tracking-widest text-white/40">Funnel step</th>
                            <th className="px-4 py-2.5 font-sans text-[11px] uppercase tracking-widest text-blue-300">A · Survey ($5)</th>
                            <th className="px-4 py-2.5 font-sans text-[11px] uppercase tracking-widest text-purple-300">B · Founder call ($10)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {funnelRows.map((r) => (
                            <tr key={r.label} className="border-b border-white/5">
                                <td className="px-4 py-2.5 text-white/70">{r.label}</td>
                                <td className="px-4 py-2.5 text-white/90">
                                    {r.survey}
                                    {r.label !== "Assigned" && assigned.survey > 0 && (
                                        <span className="text-white/35 text-xs ml-2">{Math.round((r.survey / assigned.survey) * 100)}%</span>
                                    )}
                                </td>
                                <td className="px-4 py-2.5 text-white/90">
                                    {r.call}
                                    {r.label !== "Assigned" && assigned.call > 0 && (
                                        <span className="text-white/35 text-xs ml-2">{Math.round((r.call / assigned.call) * 100)}%</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        <tr>
                            <td className="px-4 py-2.5 text-white/70">Calls actually completed</td>
                            <td className="px-4 py-2.5 text-white/30">n/a</td>
                            <td className="px-4 py-2.5 text-white/90">{callsCompleted}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* SURVEY ANSWERS */}
            <h2 className="font-serif text-2xl tracking-tight mb-4">Survey answers ({surveyDone})</h2>
            {surveyDone === 0 ? (
                <p className="font-sans text-sm text-white/40 mb-10">No survey responses yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    {SURVEY_QUESTIONS.filter((q) => q.kind === "radio").map((q) => {
                        const counts = answerCounts.get(q.id) ?? new Map<string, number>();
                        const max = Math.max(1, ...counts.values());
                        return (
                            <div key={q.id} className="border border-white/10 bg-white/[0.03] p-5">
                                <p className="font-sans text-sm font-bold text-white/90 mb-3">{q.label}</p>
                                <div className="space-y-1.5">
                                    {q.options!.map((opt) => {
                                        const n = counts.get(opt) ?? 0;
                                        return (
                                            <div key={opt} className="flex items-center gap-2">
                                                <div className="w-40 shrink-0 font-sans text-xs text-white/60 truncate" title={opt}>{opt}</div>
                                                <div className="flex-1 bg-white/[0.05] h-4">
                                                    <div className="h-4 bg-blue-400/60" style={{ width: `${(n / max) * 100}%` }} />
                                                </div>
                                                <div className="w-6 text-right font-sans text-xs text-white/70">{n}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* OPEN TEXT */}
            {openAnswers.length > 0 && (
                <div className="mb-10">
                    <h2 className="font-serif text-2xl tracking-tight mb-4">In their own words</h2>
                    <div className="space-y-3">
                        {openAnswers.map((a, i) => (
                            <div key={i} className="border border-white/10 bg-white/[0.03] p-4">
                                <p className="font-sans text-sm text-white/85 leading-relaxed">&ldquo;{a.text}&rdquo;</p>
                                <p className="font-sans text-xs text-white/35 mt-2">
                                    {a.buyer} · {a.question} · {fmtWhen(a.at)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CALL QUEUE */}
            <h2 className="font-serif text-2xl tracking-tight mb-4">Founder call queue ({callsRequested})</h2>
            {callsRequested === 0 ? (
                <p className="font-sans text-sm text-white/40">No call requests yet.</p>
            ) : (
                <div className="overflow-x-auto border border-white/10">
                    <table className="w-full font-sans text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.03] text-left">
                                {["Buyer", "Contact", "Preferred times", "Timezone", "Notes", "Status", "Actions"].map((h) => (
                                    <th key={h} className="px-3 py-2.5 font-sans text-[11px] uppercase tracking-widest text-white/40 whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(callRows ?? []).map((c: Tables<"buyer_call_requests">) => (
                                <tr key={c.id} className="border-b border-white/5">
                                    <td className="px-3 py-2.5 text-white/90">{buyerById.get(c.buyer_id)?.email ?? c.buyer_id}</td>
                                    <td className="px-3 py-2.5 text-white/70 whitespace-nowrap">
                                        {c.contact_method}
                                        {c.contact_value && <span className="text-white/50"> · {c.contact_value}</span>}
                                    </td>
                                    <td className="px-3 py-2.5 text-white/70">{c.preferred_times.join(", ")}</td>
                                    <td className="px-3 py-2.5 text-white/70">{c.timezone ?? ""}</td>
                                    <td className="px-3 py-2.5 text-white/50 max-w-[220px] truncate" title={c.notes ?? ""}>{c.notes ?? ""}</td>
                                    <td className="px-3 py-2.5">
                                        <span className={`inline-block border px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                                            c.status === "completed" ? "border-emerald-400/50 text-emerald-300"
                                            : c.status === "cancelled" ? "border-white/20 text-white/40"
                                            : "border-sky-400/40 text-sky-300"
                                        }`}>{c.status}</span>
                                    </td>
                                    <td className="px-3 py-2.5"><CallStatusButtonsWrapper id={c.id} status={c.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <p className="font-sans text-xs text-white/35 mt-6 leading-relaxed">
                Completion for A = survey submitted ($5 owed immediately). Completion for B = call requested; the $10
                is owed only after you mark the call completed. Funnel email rows populate once the research emails go
                out (send keys {SEND_KEYS.survey} / {SEND_KEYS.call}).
            </p>
        </div>
    );
}

function CallStatusButtonsWrapper({ id, status }: { id: string; status: Tables<"buyer_call_requests">["status"] }) {
    return <CallStatusButtons requestId={id} status={status} />;
}
