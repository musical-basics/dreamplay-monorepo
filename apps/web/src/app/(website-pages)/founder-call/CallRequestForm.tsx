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
    dayOptions,
    dayPartOptions,
    alreadyRequested,
    showReward,
}: {
    token: string;
    dayOptions: readonly string[];
    dayPartOptions: readonly string[];
    alreadyRequested: boolean;
    showReward: boolean;
}) {
    const [method, setMethod] = useState("zoom");
    const [contact, setContact] = useState("");
    const [days, setDays] = useState<string[]>([]);
    const [parts, setParts] = useState<string[]>([]);
    // Auto-detected from the browser; editable in case it guesses wrong.
    const [timezone, setTimezone] = useState(() => {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
        } catch {
            return "";
        }
    });
    const [notes, setNotes] = useState("");
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    const needsContact = method !== "zoom";
    const ready = days.length > 0 && parts.length > 0 && (!needsContact || contact.trim().length > 0);

    const toggle = (list: string[], set: (v: string[]) => void, value: string) => {
        set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
        setDone(false);
    };

    function submit() {
        setError(null);
        startTransition(async () => {
            const result = await requestFounderCall(token, {
                contactMethod: method,
                contactValue: contact,
                preferredDays: days,
                dayParts: parts,
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
                    Lionel will email you within a few days to lock in a time on one of your preferred days.
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
                            onClick={() => {
                                setMethod(m.value);
                                setDone(false);
                            }}
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

            {/* WHICH DAYS */}
            <div>
                <h2 className="font-sans text-xs uppercase tracking-[0.25em] text-blue-400 font-bold mb-4">Which days usually work?</h2>
                <div className="flex flex-wrap gap-2">
                    {dayOptions.map((d) => (
                        <button
                            key={d}
                            type="button"
                            onClick={() => toggle(days, setDays, d)}
                            className={`border px-4 py-2.5 font-sans text-sm rounded-full transition-all ${
                                days.includes(d)
                                    ? "border-blue-400 bg-blue-500/10 text-white"
                                    : "border-white/15 bg-white/[0.03] text-white/70 hover:border-white/40"
                            }`}
                        >
                            {d}
                        </button>
                    ))}
                </div>
            </div>

            {/* PART OF DAY */}
            <div>
                <h2 className="font-sans text-xs uppercase tracking-[0.25em] text-blue-400 font-bold mb-4">What part of the day?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {dayPartOptions.map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => toggle(parts, setParts, p)}
                            className={`border px-5 py-3.5 font-sans text-sm rounded-lg transition-all ${
                                parts.includes(p)
                                    ? "border-blue-400 bg-blue-500/10 text-white"
                                    : "border-white/15 bg-white/[0.03] text-white/70 hover:border-white/40"
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
                <p className="font-sans text-xs text-white/40 mt-3">
                    Your timezone, detected automatically:{" "}
                    <input
                        type="text"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="inline-block border border-white/15 bg-white/[0.03] rounded px-2 py-1 text-xs text-white/80 w-56 focus:border-blue-400 focus:outline-none"
                    />
                </p>
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
                    {pending ? "Sending..." : "Yes, I Can Call"}
                </button>
                {error && <p className="font-sans text-sm text-red-400 mt-4">{error}</p>}
            </div>
        </div>
    );
}
