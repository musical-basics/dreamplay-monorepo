import Link from "next/link";
import type { Tables } from "@dreamplay/db";
import { getAdminDb } from "@/lib/db";
import { CallStatusButtons } from "./CallStatusButtons";
import {
    SURVEY_QUESTIONS,
    armMethod,
    researchArm,
    type ResearchArm,
} from "@/lib/buyer-research";

/**
 * /admin/buyers/research: the buyer research 2x2 test scoreboard.
 *
 *   A1 survey + $5 credit   A2 survey, no incentive
 *   B1 call + $10 credit    B2 call, no incentive
 *
 * Per-arm funnel (assigned → sent/opened/clicked → visited → completed),
 * survey answer distributions, open-text quotes, the call queue with
 * status controls, and store credit granted. Goals: which method and
 * incentive level converts best, and what actually motivates buyers.
 */

export const dynamic = "force-dynamic";

const ARMS: readonly ResearchArm[] = ["A1", "A2", "B1", "B2"];
const ARM_LABEL: Record<ResearchArm, string> = {
    A1: "A1 · Survey + $5",
    A2: "A2 · Survey, no offer",
    B1: "B1 · Call + $10",
    B2: "B2 · Call, no offer",
};
const SEND_KEYS: Record<ResearchArm, string> = {
    A1: "buyer-research-2026-a1",
    A2: "buyer-research-2026-a2",
    B1: "buyer-research-2026-b1",
    B2: "buyer-research-2026-b2",
};

function fmtWhen(iso: string | null): string {
    if (!iso) return "";
    return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

type ArmCounts = Record<ResearchArm, number>;
const zeros = (): ArmCounts => ({ A1: 0, A2: 0, B1: 0, B2: 0 });

export default async function BuyerResearchPage() {
    const db = getAdminDb();

    const [{ data: buyers }, { data: campaigns }, { data: surveyRows }, { data: callRows }, { data: creditRows }] =
        await Promise.all([
            db.from("buyers").select("*").eq("kind", "buyer").limit(1000),
            db.from("campaigns").select("id, send_key").in("send_key", Object.values(SEND_KEYS)),
            db.from("buyer_survey_responses").select("*").order("created_at", { ascending: false }).limit(1000),
            db.from("buyer_call_requests").select("*").order("created_at", { ascending: false }).limit(1000),
            db.from("store_credits").select("buyer_id, amount_usd, source").limit(10000),
        ]);

    const emailable = (buyers ?? []).filter((b) => !b.email.endsWith("@no-email.invalid"));
    const buyerById = new Map((buyers ?? []).map((b) => [b.id, b]));
    const armByEmail = new Map(emailable.map((b) => [b.email.toLowerCase(), researchArm(b.id)]));

    const assigned = zeros();
    for (const b of emailable) assigned[researchArm(b.id)]++;

    // Email funnel per arm (zeros until the research emails go out).
    const sent = zeros(), opened = zeros(), clicked = zeros();
    const campaignByKey = new Map((campaigns ?? []).map((c) => [c.send_key, c.id]));
    for (const arm of ARMS) {
        const cid = campaignByKey.get(SEND_KEYS[arm]);
        if (!cid) continue;
        const [{ count }, { data: events }] = await Promise.all([
            db.from("sent_history").select("id", { count: "exact", head: true }).eq("campaign_id", cid),
            db.from("email_events").select("subscriber_id, type").eq("campaign_id", cid).limit(10000),
        ]);
        sent[arm] = count ?? 0;
        opened[arm] = new Set((events ?? []).filter((e) => e.type === "open").map((e) => e.subscriber_id)).size;
        clicked[arm] = new Set((events ?? []).filter((e) => e.type === "click").map((e) => e.subscriber_id)).size;
    }

    // Page visits attributed to buyers, grouped by their arm.
    const visited = zeros();
    for (const path of ["/buyer-survey", "/founder-call"]) {
        const { data } = await db
            .from("events")
            .select("email")
            .like("path", `${path}%`)
            .in("email", [...armByEmail.keys()])
            .limit(10000);
        const seen = new Set<string>();
        for (const e of data ?? []) {
            const em = e.email?.toLowerCase();
            if (!em || seen.has(`${path}:${em}`)) continue;
            seen.add(`${path}:${em}`);
            const arm = armByEmail.get(em);
            if (arm) visited[arm]++;
        }
    }

    // Completions: survey submissions count for every arm (call arms may use
    // the survey as fallback); call requests only exist for B arms.
    const completed = zeros();
    for (const r of surveyRows ?? []) {
        const b = buyerById.get(r.buyer_id);
        if (b) completed[researchArm(b.id)]++;
    }
    for (const c of callRows ?? []) {
        const b = buyerById.get(c.buyer_id);
        if (b) completed[researchArm(b.id)]++;
    }

    const surveyDone = (surveyRows ?? []).length;
    const callsRequested = (callRows ?? []).length;
    const callsCompleted = (callRows ?? []).filter((c) => c.status === "completed").length;
    const researchCredits = (creditRows ?? [])
        .filter((c) => c.source === "survey-reward" || c.source === "call-reward")
        .reduce((s, c) => s + Number(c.amount_usd), 0);

    // Survey answer aggregation.
    const answerCounts = new Map<string, Map<string, number>>();
    const openAnswers: { question: string; buyer: string; arm: string; text: string; at: string }[] = [];
    for (const r of surveyRows ?? []) {
        const answers = (r.answers ?? {}) as Record<string, string>;
        const b = buyerById.get(r.buyer_id);
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
                    buyer: b?.email ?? r.buyer_id,
                    arm: b ? researchArm(b.id) : "?",
                    text: v,
                    at: r.created_at,
                });
            }
        }
    }

    const funnel: { label: string; counts: ArmCounts }[] = [
        { label: "Assigned", counts: assigned },
        { label: "Email sent", counts: sent },
        { label: "Opened", counts: opened },
        { label: "Clicked", counts: clicked },
        { label: "Visited page", counts: visited },
        { label: "Completed", counts: completed },
    ];

    return (
        <div>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                <div>
                    <Link href="/admin/buyers" className="font-sans text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors">
                        &larr; All buyers
                    </Link>
                    <h1 className="font-serif text-3xl tracking-tight mt-2">Buyer research 2x2</h1>
                    <p className="font-sans text-sm text-white/40 mt-1">
                        Method (survey vs founder call) x incentive (store credit vs none) · deterministic 16/16/16/16 split ·
                        call arms get the survey as fallback
                    </p>
                </div>
                <div className="border border-amber-400/40 bg-amber-400/[0.06] px-4 py-3">
                    <p className="font-sans text-xl text-amber-300">${researchCredits}</p>
                    <p className="font-sans text-[10px] uppercase tracking-widest text-amber-300/70 mt-0.5">Credit granted</p>
                </div>
            </div>

            {/* FUNNEL */}
            <div className="overflow-x-auto border border-white/10 mb-10">
                <table className="w-full font-sans text-sm">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/[0.03] text-left">
                            <th className="px-4 py-2.5 font-sans text-[11px] uppercase tracking-widest text-white/40">Funnel step</th>
                            {ARMS.map((arm) => (
                                <th key={arm} className={`px-4 py-2.5 font-sans text-[11px] uppercase tracking-widest ${armMethod(arm) === "survey" ? "text-blue-300" : "text-purple-300"}`}>
                                    {ARM_LABEL[arm]}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {funnel.map((row) => (
                            <tr key={row.label} className="border-b border-white/5">
                                <td className="px-4 py-2.5 text-white/70">{row.label}</td>
                                {ARMS.map((arm) => (
                                    <td key={arm} className="px-4 py-2.5 text-white/90">
                                        {row.counts[arm]}
                                        {row.label !== "Assigned" && assigned[arm] > 0 && (
                                            <span className="text-white/35 text-xs ml-2">
                                                {Math.round((row.counts[arm] / assigned[arm]) * 100)}%
                                            </span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
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
                                    {a.buyer} · {a.arm} · {a.question} · {fmtWhen(a.at)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CALL QUEUE */}
            <h2 className="font-serif text-2xl tracking-tight mb-4">
                Founder call queue ({callsRequested} requested · {callsCompleted} completed)
            </h2>
            {callsRequested === 0 ? (
                <p className="font-sans text-sm text-white/40">No call requests yet.</p>
            ) : (
                <div className="overflow-x-auto border border-white/10">
                    <table className="w-full font-sans text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.03] text-left">
                                {["Buyer", "Arm", "Contact", "Preferred times", "Timezone", "Notes", "Status", "Actions"].map((h) => (
                                    <th key={h} className="px-3 py-2.5 font-sans text-[11px] uppercase tracking-widest text-white/40 whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(callRows ?? []).map((c: Tables<"buyer_call_requests">) => {
                                const b = buyerById.get(c.buyer_id);
                                return (
                                    <tr key={c.id} className="border-b border-white/5">
                                        <td className="px-3 py-2.5 text-white/90">{b?.email ?? c.buyer_id}</td>
                                        <td className="px-3 py-2.5 text-white/70">{b ? researchArm(b.id) : "?"}</td>
                                        <td className="px-3 py-2.5 text-white/70 whitespace-nowrap">
                                            {c.contact_method}
                                            {c.contact_value && <span className="text-white/50"> · {c.contact_value}</span>}
                                        </td>
                                        <td className="px-3 py-2.5 text-white/70">{c.preferred_times.join(", ")}</td>
                                        <td className="px-3 py-2.5 text-white/70">{c.timezone ?? ""}</td>
                                        <td className="px-3 py-2.5 text-white/50 max-w-[200px] truncate" title={c.notes ?? ""}>{c.notes ?? ""}</td>
                                        <td className="px-3 py-2.5">
                                            <span className={`inline-block border px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                                                c.status === "completed" ? "border-emerald-400/50 text-emerald-300"
                                                : c.status === "cancelled" ? "border-white/20 text-white/40"
                                                : "border-sky-400/40 text-sky-300"
                                            }`}>{c.status}</span>
                                        </td>
                                        <td className="px-3 py-2.5"><CallStatusButtons requestId={c.id} status={c.status} /></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <p className="font-sans text-xs text-white/35 mt-6 leading-relaxed">
                Completion = survey submitted or call requested. Store credit ($5 survey / $10 completed call) is
                granted automatically on the credit arms only (A1/B1), one grant per reward type per buyer, into the
                store_credits ledger. Marking a B1 call completed grants the $10. Email funnel rows populate once the
                four research emails go out (send keys {Object.values(SEND_KEYS).join(", ")}).
            </p>
        </div>
    );
}
