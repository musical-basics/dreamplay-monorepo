"use client";

import { useState, useTransition } from "react";
import { confirmCallTime, declineCallTime } from "@/actions/buyer-research-actions";

export function ConfirmCallForm({
    token,
    alreadyConfirmed,
    alreadyDeclined,
    isZoom,
}: {
    token: string;
    alreadyConfirmed: boolean;
    alreadyDeclined: boolean;
    isZoom: boolean;
}) {
    const [state, setState] = useState<"idle" | "confirmed" | "declined">(
        alreadyConfirmed ? "confirmed" : alreadyDeclined ? "declined" : "idle",
    );
    const [showNote, setShowNote] = useState(false);
    const [note, setNote] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function confirm() {
        setError(null);
        startTransition(async () => {
            const result = await confirmCallTime(token);
            if (result.ok) setState("confirmed");
            else setError(result.error ?? "Something went wrong. Please try again.");
        });
    }

    function decline() {
        setError(null);
        startTransition(async () => {
            const result = await declineCallTime(token, note);
            if (result.ok) setState("declined");
            else setError(result.error ?? "Something went wrong. Please try again.");
        });
    }

    if (state === "confirmed") {
        return (
            <div className="border border-emerald-400/30 bg-emerald-400/[0.06] rounded-xl p-8 text-center">
                <h2 className="font-serif text-2xl mb-3">You are booked in.</h2>
                <p className="font-sans text-sm text-white/60 leading-relaxed max-w-md mx-auto">
                    {isZoom
                        ? "I am sending the Zoom link over by email in a moment, so keep an eye on your inbox. Looking forward to it."
                        : "I will reach you at that time on the number you gave me. Looking forward to it."}{" "}
                    If anything changes, just reply to my email.
                </p>
            </div>
        );
    }

    if (state === "declined") {
        return (
            <div className="border border-white/15 bg-white/[0.03] rounded-xl p-8 text-center">
                <h2 className="font-serif text-2xl mb-3">No problem at all.</h2>
                <p className="font-sans text-sm text-white/60 leading-relaxed max-w-md mx-auto">
                    I will find another time and email you a new one shortly. Thanks for letting me know.
                </p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={confirm}
                    disabled={pending}
                    className="inline-flex items-center justify-center border border-white bg-white px-8 py-4 font-sans text-xs font-bold uppercase tracking-widest text-black transition-all hover:bg-neutral-200 rounded-full disabled:opacity-40"
                >
                    {pending ? "Just a second..." : "Yes, That Works"}
                </button>
                <button
                    type="button"
                    onClick={() => setShowNote((v) => !v)}
                    disabled={pending}
                    className="inline-flex items-center justify-center border border-white/25 px-8 py-4 font-sans text-xs font-bold uppercase tracking-widest text-white/80 transition-all hover:border-white/60 rounded-full disabled:opacity-40"
                >
                    Another Time Please
                </button>
            </div>

            {showNote && (
                <div className="mt-6">
                    <label className="block font-sans text-sm text-white/60 mb-3">
                        When would suit you better? Anything roughly right is fine.
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        placeholder="Weekday evenings, or Saturday morning..."
                        className="w-full border border-white/15 bg-white/[0.03] rounded-lg p-4 font-sans text-sm text-white placeholder-white/30 focus:border-blue-400 focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={decline}
                        disabled={pending}
                        className="mt-3 inline-flex items-center justify-center border border-white/25 px-6 py-3 font-sans text-xs font-bold uppercase tracking-widest text-white/80 hover:border-white/60 rounded-full disabled:opacity-40"
                    >
                        {pending ? "Sending..." : "Send This To Lionel"}
                    </button>
                </div>
            )}

            {error && <p className="font-sans text-sm text-red-400 mt-4">{error}</p>}
        </div>
    );
}
