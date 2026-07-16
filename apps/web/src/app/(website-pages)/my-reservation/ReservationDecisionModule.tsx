"use client";

import { useState } from "react";
import Image from "next/image";
import { saveReservationDecision } from "@/actions/reservation-actions";
import type { DecisionRecord, ReservationDecision } from "@/actions/reservation-actions";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";

interface ReservationDecisionModuleProps {
    userId: string;
    email: string;
    existingDecision: DecisionRecord | null;
}

const OPTIONS: {
    value: ReservationDecision;
    label: string;
    eyebrow: string;
    description: string;
    cta: string;
    confirmationMessage: string;
    dark?: boolean;
    accent?: string;
}[] = [
    {
        value: "refund_requested",
        label: "Request Full Refund",
        eyebrow: "Option 1",
        description:
            "We understand. Building a brand-new keyboard from scratch has taken more time than any of us expected. If you'd like your money back, we will process a full refund, no questions asked.",
        cta: "Request Full Refund",
        confirmationMessage:
            "Your refund request has been received. Our team will reach out within 2–3 business days to complete the process.",
        dark: false,
        accent: "rose",
    },
    {
        value: "keep_reservation",
        label: "Keep My Reservation",
        eyebrow: "Option 2",
        description:
            "Your reservation stays active. DreamPlay One is on track for January 2027 delivery. Your spot is protected, your Founder's pricing is locked, and we'll keep you updated every step of the way.",
        cta: "Keep My Reservation",
        confirmationMessage:
            "Your reservation is confirmed. Your estimated delivery is January 2027. We'll be in touch as production progresses.",
        dark: true,
        accent: "white",
    },
    {
        value: "upgrade_to_pro",
        label: "Upgrade to DreamPlay One Pro",
        eyebrow: "Option 3 — Loyalty Upgrade",
        description:
            "As an early supporter, you can upgrade to DreamPlay One Pro for just $200 more than what you already paid. Pro features elevated finishes — Aztec Gold and Nightmare Black — and a more distinctive visual identity.",
        cta: "Upgrade to DreamPlay One Pro",
        confirmationMessage:
            "Your Pro upgrade request has been received. Our team will reach out to confirm the details and process the $200 difference.",
        dark: false,
        accent: "amber",
    },
];

const DECISION_DISPLAY: Record<ReservationDecision, string> = {
    refund_requested: "Full Refund Requested",
    keep_reservation: "Keeping My Reservation",
    upgrade_to_pro: "Upgrading to DreamPlay One Pro",
};

export default function ReservationDecisionModule({
    userId,
    email,
    existingDecision,
}: ReservationDecisionModuleProps) {
    const [selected, setSelected] = useState<ReservationDecision | null>(
        existingDecision?.decision ?? null
    );
    const [confirmed, setConfirmed] = useState<ReservationDecision | null>(
        existingDecision?.decision ?? null
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isChanging, setIsChanging] = useState(false);

    const selectedOption = OPTIONS.find((o) => o.value === selected);
    const confirmedOption = OPTIONS.find((o) => o.value === confirmed);

    const handleSubmit = async () => {
        if (!selected || selected === confirmed) return;
        setIsSubmitting(true);
        setError(null);

        const result = await saveReservationDecision(userId, email, selected, {
            previous_decision: confirmed,
        });

        if (!result.success) {
            setError(result.error ?? "Something went wrong. Please try again.");
            setIsSubmitting(false);
            return;
        }

        setConfirmed(selected);
        setIsChanging(false);
        setIsSubmitting(false);
    };

    // ── Confirmed State ──
    if (confirmed && !isChanging && confirmedOption) {
        const option = confirmedOption;
        return (
            <div className="border border-white/10 bg-white/[0.03] p-8 md:p-10">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-10 h-10 rounded-none border border-green-500/40 bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                        <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/40 mb-1">
                            Your choice has been recorded
                        </p>
                        <h3 className="font-serif text-xl text-white">{DECISION_DISPLAY[confirmed]}</h3>
                    </div>
                </div>

                <div className="border-l-2 border-white/10 pl-6 mb-8">
                    <p className="font-sans text-sm text-white/60 leading-relaxed">
                        {option.confirmationMessage}
                    </p>
                </div>

                {/* Pro upgrade — show imagery */}
                {confirmed === "upgrade_to_pro" && (
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="relative aspect-[4/3] overflow-hidden border border-amber-500/20">
                            <Image
                                src="/images/pro/aztec-gold-full.jpg"
                                alt="DreamPlay One Pro — Aztec Gold"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
                                <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-amber-400">
                                    Aztec Gold
                                </p>
                            </div>
                        </div>
                        <div className="relative aspect-[4/3] overflow-hidden border border-white/10">
                            <Image
                                src="/images/pro/nightmare-black-angled.jpg"
                                alt="DreamPlay One Pro — Nightmare Black"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
                                <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-white/60">
                                    Nightmare Black
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => setIsChanging(true)}
                    className="flex items-center gap-2 font-sans text-xs uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                >
                    <RotateCcw className="w-3 h-3" />
                    Change my selection
                </button>
            </div>
        );
    }

    // ── Selection State ──
    return (
        <div>
            {/* Update Header */}
            <div className="mb-10 border-l-4 border-amber-500/60 pl-6">
                <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-amber-400/80 mb-3">
                    An Update from the Founder
                </p>
                <p className="font-sans text-sm text-white/70 leading-relaxed max-w-2xl">
                    Building a new acoustic digital piano keyboard from scratch has taken longer than any of us
                    anticipated. We&apos;ve been honest with ourselves, and the revised delivery target is{" "}
                    <strong className="text-white">January 2027</strong>. We deeply value your trust and early
                    support, and we want to make sure you have a clear choice about what happens next.
                </p>
            </div>

            {/* Pricing Context */}
            <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="border border-white/10 bg-white/[0.02] p-6">
                    <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-white/30 mb-2">
                        DreamPlay One
                    </p>
                    <p className="font-serif text-3xl text-white mb-1">$999</p>
                    <p className="font-sans text-xs text-white/40">Core instrument · Standard keys</p>
                </div>
                <div className="border border-amber-500/30 bg-amber-500/5 p-6">
                    <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-amber-400/80 mb-2">
                        DreamPlay One Pro
                    </p>
                    <p className="font-serif text-3xl text-white mb-1">$1,899</p>
                    <p className="font-sans text-xs text-white/40">Aztec Gold · Nightmare Black</p>
                </div>
            </div>

            {/* Three Cards */}
            <div className="space-y-4 mb-8">
                {OPTIONS.map((option) => {
                    const isSelected = selected === option.value;
                    const isDark = option.dark;

                    return (
                        <button
                            key={option.value}
                            id={`reservation-option-${option.value}`}
                            onClick={() => setSelected(option.value)}
                            className={`w-full text-left border p-6 md:p-8 transition-all duration-200 cursor-pointer group relative ${
                                isDark
                                    ? isSelected
                                        ? "border-white/40 bg-white/10"
                                        : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                                    : isSelected
                                    ? option.value === "upgrade_to_pro"
                                        ? "border-amber-500/50 bg-amber-500/5"
                                        : "border-white/40 bg-white/5"
                                    : "border-white/10 bg-transparent hover:border-white/20"
                            }`}
                        >
                            {/* Selection indicator */}
                            <div
                                className={`absolute right-6 top-6 w-5 h-5 rounded-none border flex items-center justify-center transition-all ${
                                    isSelected
                                        ? option.value === "upgrade_to_pro"
                                            ? "border-amber-500 bg-amber-500"
                                            : "border-white bg-white"
                                        : "border-white/20"
                                }`}
                            >
                                {isSelected && (
                                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                                        <path
                                            d="M2 6l3 3 5-5"
                                            stroke={option.value === "upgrade_to_pro" ? "#000" : "#000"}
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                )}
                            </div>

                            <p
                                className={`font-sans text-[9px] uppercase tracking-[0.3em] mb-2 ${
                                    option.value === "upgrade_to_pro"
                                        ? isSelected
                                            ? "text-amber-400"
                                            : "text-amber-500/60"
                                        : "text-white/30"
                                }`}
                            >
                                {option.eyebrow}
                            </p>
                            <h3
                                className={`font-serif text-xl mb-3 ${
                                    isSelected ? "text-white" : "text-white/70"
                                }`}
                            >
                                {option.label}
                            </h3>
                            <p className="font-sans text-sm text-white/50 leading-relaxed max-w-xl pr-8">
                                {option.description}
                            </p>

                            {/* Pro imagery preview on hover/select */}
                            {option.value === "upgrade_to_pro" && isSelected && (
                                <div className="grid grid-cols-2 gap-3 mt-6">
                                    <div className="relative aspect-[3/2] overflow-hidden border border-amber-500/20">
                                        <Image
                                            src="/images/pro/aztec-gold.jpg"
                                            alt="Aztec Gold"
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                                            <p className="font-sans text-[8px] uppercase tracking-[0.2em] text-amber-400">
                                                Aztec Gold
                                            </p>
                                        </div>
                                    </div>
                                    <div className="relative aspect-[3/2] overflow-hidden border border-white/10">
                                        <Image
                                            src="/images/pro/nightmare-black-angled-2.jpg"
                                            alt="Nightmare Black"
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                                            <p className="font-sans text-[8px] uppercase tracking-[0.2em] text-white/60">
                                                Nightmare Black
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 border border-red-500/30 bg-red-500/10 px-4 py-3">
                    <p className="font-sans text-xs text-red-400">{error}</p>
                </div>
            )}

            {/* Submit */}
            <div className="flex items-center gap-4">
                <button
                    id="reservation-decision-submit"
                    onClick={handleSubmit}
                    disabled={!selected || selected === confirmed || isSubmitting}
                    className={`flex items-center justify-center gap-2 border px-10 py-4 font-sans text-xs uppercase tracking-widest transition-all ${
                        !selected || selected === confirmed || isSubmitting
                            ? "border-white/10 text-white/20 cursor-not-allowed"
                            : selected === "upgrade_to_pro"
                            ? "border-amber-500 bg-amber-500 text-black hover:bg-amber-400 cursor-pointer"
                            : "border-white bg-white text-black hover:bg-white/90 cursor-pointer"
                    }`}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        selectedOption?.cta ?? "Confirm My Choice"
                    )}
                </button>
                {selected && !isSubmitting && (
                    <p className="font-sans text-xs text-white/30">One selection only. You can change it later.</p>
                )}
            </div>
        </div>
    );
}
