"use client";

import { useState, useTransition } from "react";
import { requestFounderCall } from "@/actions/buyer-research-actions";

const METHODS = [
    { value: "zoom", label: "Zoom", hint: "We email you a link" },
    { value: "phone", label: "Phone call", hint: "Lionel calls you" },
    { value: "whatsapp", label: "WhatsApp", hint: "Voice call" },
];

export function CallRequestForm({
    token,
    timeOptions,
    alreadyRequested,
    showReward,
}: {
    token: string;
    timeOptions: readonly string[];
    alreadyRequested: boolean;
    showReward: boolean;
}) {
    const [method, setMethod] = useState("zoom");
    const [contact, setContact] = useState("");
    const [times, setTimes] = useState<string[]>([]);
    const [timezone, setTimezone] = useState("");
    const [notes, setNotes] = useState("");
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    const needsContact = method !== "zoom";
    const ready = times.length > 0 && (!needsContact || contact.trim().length > 0);

    function submit() {
        setError(null);
        startTransition(async () => {
            const result = await requestFounderCall(token, {
                contactMethod: method,
                contactValue: contact,
                preferredTimes: times,
                timezone,
                notes,
            });
            if (result.ok) setDone(true);
            else setError(result.error ?? "Something went wrong. Please try again.");
        });
    }

    if (done || alreadyRequested) {
        return (
            <div className="border border-emerald-400/30 bg-emerald-400/[0.06] rounded-xl p-8 text-center">
                <h2 className="font-serif text-2xl mb-3">
                    {done ? "You are on Lionel's call list." : "Your call request is already in."}
                </h2>
                <p className="font-sans text-sm text-white/60 leading-relaxed max-w-md mx-auto">
                    Lionel will email you within a few days to lock in a time that fits your preferences.
                    {showReward && " After the call, $10 of store credit is added to your account."}{" "}
                    Need to change anything? Just reply to the email that brought you here.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* HOW */}
            <div>
                <h2 className="font-sans text-xs uppercase tracking-[0.25em] text-blue-400 font-bold mb-4">How should we call you?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {METHODS.map((m) => (
                        <button
                            key={m.value}
                            type="button"
                            onClick={() => setMethod(m.value)}
                            className={`border px-5 py-4 text-left rounded-lg transition-all ${
                                method === m.value
                                    ? "border-blue-400 bg-blue-500/10 text-white"
                                    : "border-white/15 bg-white/[0.03] text-white/70 hover:border-white/40"
                            }`}
                        >
                            <span className="block font-sans text-sm font-bold">{m.label}</span>
                            <span className="block font-sans text-xs text-white/40 mt-1">{m.hint}</span>
                        </button>
                    ))}
                </div>
                {needsContact && (
                    <input
                        type="tel"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        placeholder={method === "phone" ? "Your phone number (with country code)" : "Your WhatsApp number"}
                        className="mt-3 w-full border border-white/15 bg-white/[0.03] rounded-lg p-4 font-sans text-sm text-white placeholder-white/30 focus:border-blue-400 focus:outline-none"
                    />
                )}
            </div>

            {/* WHEN */}
            <div>
                <h2 className="font-sans text-xs uppercase tracking-[0.25em] text-blue-400 font-bold mb-4">When do calls usually work for you?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {timeOptions.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() =>
                                setTimes((prev) => (prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]))
                            }
                            className={`border px-4 py-3 text-left font-sans text-sm rounded-lg transition-all ${
                                times.includes(opt)
                                    ? "border-blue-400 bg-blue-500/10 text-white"
                                    : "border-white/15 bg-white/[0.03] text-white/70 hover:border-white/40"
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    placeholder="Your city or timezone (e.g. Chicago, London, Tokyo)"
                    className="mt-3 w-full border border-white/15 bg-white/[0.03] rounded-lg p-4 font-sans text-sm text-white placeholder-white/30 focus:border-blue-400 focus:outline-none"
                />
            </div>

            {/* NOTES */}
            <div>
                <h2 className="font-sans text-xs uppercase tracking-[0.25em] text-blue-400 font-bold mb-4">Anything Lionel should know beforehand? (optional)</h2>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-white/15 bg-white/[0.03] rounded-lg p-4 font-sans text-sm text-white placeholder-white/30 focus:border-blue-400 focus:outline-none"
                    placeholder="Totally optional..."
                />
            </div>

            <div>
                <button
                    type="button"
                    disabled={!ready || pending}
                    onClick={submit}
                    className="inline-flex items-center justify-center border border-white bg-white px-8 py-4 font-sans text-xs font-bold uppercase tracking-widest text-black transition-all hover:bg-neutral-200 rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {pending ? "Sending..." : "Request My 15-Minute Call"}
                </button>
                {error && <p className="font-sans text-sm text-red-400 mt-4">{error}</p>}
            </div>
        </div>
    );
}
