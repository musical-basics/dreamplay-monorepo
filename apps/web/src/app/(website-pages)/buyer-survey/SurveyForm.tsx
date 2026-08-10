"use client";

import { useState, useTransition } from "react";
import { submitBuyerSurvey } from "@/actions/buyer-research-actions";
import type { SurveyQuestion } from "@/lib/buyer-research";

export function SurveyForm({
    token,
    questions,
    alreadySubmitted,
    showReward,
}: {
    token: string;
    questions: SurveyQuestion[];
    alreadySubmitted: boolean;
    showReward: boolean;
}) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    const missing = questions.filter((q) => !q.optional && !(answers[q.id] ?? "").trim()).length;

    function submit() {
        setError(null);
        startTransition(async () => {
            const result = await submitBuyerSurvey(token, answers);
            if (result.ok) setDone(true);
            else setError(result.error ?? "Something went wrong. Please try again.");
        });
    }

    if (done || alreadySubmitted) {
        return (
            <div className="border border-emerald-400/30 bg-emerald-400/[0.06] rounded-xl p-8 text-center">
                <h2 className="font-serif text-2xl mb-3">
                    {done
                        ? showReward
                            ? "Thank you. Your $5 credit is in your account."
                            : "Thank you, this is really helpful."
                        : "You have already filled this out."}
                </h2>
                <p className="font-sans text-sm text-white/60 leading-relaxed max-w-md mx-auto">
                    {done
                        ? "I'll be reading these myself. Thanks again for being here this early, it really does mean a lot to me."
                        : "Sending it again would just update your answers, so if something has changed, reply to my email instead."}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {questions.map((q, i) => (
                <div key={q.id}>
                    <h2 className="font-sans text-sm font-bold text-white mb-4">
                        <span className="text-blue-400 mr-2">{i + 1}.</span>
                        {q.label}
                    </h2>
                    {q.kind === "radio" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options!.map((opt) => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                                    className={`border px-4 py-3 text-left font-sans text-sm rounded-lg transition-all ${
                                        answers[q.id] === opt
                                            ? "border-blue-400 bg-blue-500/10 text-white"
                                            : "border-white/15 bg-white/[0.03] text-white/70 hover:border-white/40"
                                    }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <textarea
                            value={answers[q.id] ?? ""}
                            onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                            rows={4}
                            className="w-full border border-white/15 bg-white/[0.03] rounded-lg p-4 font-sans text-sm text-white placeholder-white/30 focus:border-blue-400 focus:outline-none"
                            placeholder="Type your answer here..."
                        />
                    )}
                </div>
            ))}

            <div>
                <button
                    type="button"
                    disabled={missing > 0 || pending}
                    onClick={submit}
                    className="inline-flex items-center justify-center border border-white bg-white px-8 py-4 font-sans text-xs font-bold uppercase tracking-widest text-black transition-all hover:bg-neutral-200 rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {pending ? "Sending..." : showReward ? "Send My Answers and Claim $5" : "Send My Answers"}
                </button>
                {missing > 0 && (
                    <p className="font-sans text-xs text-white/40 mt-3">
                        {missing} question{missing === 1 ? "" : "s"} left to answer.
                    </p>
                )}
                {error && <p className="font-sans text-sm text-red-400 mt-4">{error}</p>}
            </div>
        </div>
    );
}
