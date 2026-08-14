import Link from "next/link";
import { getAdminDb } from "@/lib/db";
import { SURVEY_QUESTIONS, loadArmOverrides, resolveArm, type ResearchArm } from "@/lib/buyer-research";
import { SurveyResults, type SurveyRow, type QuestionDef } from "./SurveyResults";

/**
 * /admin/buyers/survey: every survey answer in one place.
 *
 * The research dashboard shows the 2x2 funnel; this page is for reading
 * what people actually said. Answer distributions per question, every
 * free-text response with who wrote it, and filters so a distribution bar
 * can be clicked to see just those people.
 */

export const dynamic = "force-dynamic";

function displayName(notes: string | null): string {
    const n = (notes ?? "").split(/[|—]/)[0]?.trim() ?? "";
    return n.length > 1 && !/^csv import/i.test(n) ? n : "";
}

export default async function SurveyResultsPage() {
    const db = getAdminDb();

    const [{ data: responses }, overrides] = await Promise.all([
        db.from("buyer_survey_responses").select("*").order("created_at", { ascending: false }).limit(500),
        loadArmOverrides(db),
    ]);

    const buyerIds = [...new Set((responses ?? []).map((r) => r.buyer_id))];
    const { data: buyers } = buyerIds.length
        ? await db.from("buyers").select("id, email, notes, product_line, price_paid_usd").in("id", buyerIds)
        : { data: [] as { id: string; email: string; notes: string | null; product_line: string | null; price_paid_usd: number | null }[] };
    const buyerById = new Map((buyers ?? []).map((b) => [b.id, b]));

    // Subscriber first names are the best source for a display name; the
    // buyers.notes fallback is often just "CSV import <date>".
    const emails = (buyers ?? []).map((b) => b.email.toLowerCase());
    const { data: subs } = emails.length
        ? await db.from("subscribers").select("email, first_name, last_name").in("email", emails)
        : { data: [] as { email: string; first_name: string | null; last_name: string | null }[] };
    const subByEmail = new Map((subs ?? []).map((s) => [s.email.toLowerCase(), s]));

    const rows: SurveyRow[] = (responses ?? []).map((r) => {
        const b = buyerById.get(r.buyer_id);
        const sub = b ? subByEmail.get(b.email.toLowerCase()) : undefined;
        const fromSub = [sub?.first_name?.trim(), sub?.last_name?.trim()].filter(Boolean).join(" ");
        return {
            id: r.id,
            buyerId: r.buyer_id,
            email: b?.email ?? "(unknown)",
            name: fromSub || displayName(b?.notes ?? null),
            product: b?.product_line ?? "",
            arm: resolveArm(r.buyer_id, overrides) as ResearchArm,
            rewardUsd: r.reward_usd ?? 0,
            createdAt: r.created_at,
            answers: (r.answers ?? {}) as Record<string, string>,
        };
    });

    const questions: QuestionDef[] = SURVEY_QUESTIONS.map((q) => ({
        id: q.id,
        label: q.label,
        kind: q.kind,
        options: q.options ?? [],
        optional: Boolean(q.optional),
    }));

    return (
        <div>
            <div className="mb-6">
                <Link
                    href="/admin/buyers/research"
                    className="font-sans text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors"
                >
                    &larr; Research dashboard
                </Link>
                <h1 className="font-serif text-3xl tracking-tight mt-2">Survey results</h1>
                <p className="font-sans text-sm text-white/40 mt-1">
                    {rows.length} response{rows.length === 1 ? "" : "s"}. Click any answer to filter the responses
                    below it.
                </p>
            </div>

            <SurveyResults rows={rows} questions={questions} />
        </div>
    );
}
