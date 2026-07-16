"use client";

import { useState } from "react";
import { subscribeToNewsletter } from "@/actions/email-actions";
import { trackEmailConversion } from "@/components/EmailTracker";
import { X, CheckCircle2, Loader2, Rocket } from "lucide-react";

interface FoundersBatchCaptureProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FoundersBatchCapture({ isOpen, onClose }: FoundersBatchCaptureProps) {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const tempSession = localStorage.getItem("dp_temp_session") || undefined;

            const res = await subscribeToNewsletter({
                email,
                first_name: "",
                tags: ["$300 Off Lead", "Founder's Batch Interest"],
                temp_session_id: tempSession,
            });

            if (!res.success) {
                throw new Error(res.error || "Failed to subscribe");
            }

            localStorage.setItem("dp_v2_subscribed", "true");
            localStorage.setItem("dp_user_email", email);
            if (res.id) localStorage.setItem("dp_subscriber_id", res.id);

            trackEmailConversion('conversion_t1', window.location.pathname);
            setIsSuccess(true);
        } catch (err) {
            setError(err instanceof Error && err.message ? err.message : "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300">
            <div className="relative w-full max-w-md bg-[#050505] border border-white/10 shadow-2xl p-8 md:p-10 animate-in fade-in zoom-in-95 duration-300">
                <button
                    onClick={() => { onClose(); setIsSuccess(false); setEmail(""); setError(""); }}
                    className="absolute right-4 top-4 text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                    <X size={20} />
                </button>

                {!isSuccess ? (
                    <>
                        <div className="mb-8 text-center">
                            <div className="mx-auto bg-white/5 border border-white/10 w-14 h-14 rounded-none flex items-center justify-center mb-6">
                                <Rocket className="text-white" size={24} strokeWidth={1.5} />
                            </div>
                            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-amber-400/80 mb-3">
                                Founder&apos;s Batch — October 2026
                            </p>
                            <h2 className="text-2xl md:text-3xl font-serif text-white tracking-tight leading-tight mb-4">
                                Secure Your Spot.
                            </h2>
                            <p className="text-white/60 font-sans text-sm leading-relaxed">
                                Lock in early-adopter pricing for the DreamPlay One. We&apos;ll send your exclusive Founder&apos;s code directly to your inbox.
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-sans text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2">
                                    Where should we send your code?
                                </label>
                                <input
                                    type="email"
                                    autoFocus
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-4 py-4 rounded-none border border-white/20 bg-transparent placeholder-white/40 text-white focus:ring-1 focus:ring-white focus:border-white outline-none transition-all font-sans text-sm"
                                    placeholder="you@email.com"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-white text-black font-sans text-xs uppercase tracking-widest font-bold py-4 hover:bg-white/90 transition-colors disabled:opacity-70 cursor-pointer"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Secure My Spot"}
                            </button>

                            <button
                                type="button"
                                onClick={() => { onClose(); setEmail(""); setError(""); }}
                                className="w-full mt-1 text-white/30 hover:text-white/60 font-sans text-xs uppercase tracking-widest transition-colors cursor-pointer py-2"
                            >
                                Maybe Later
                            </button>
                            <p className="text-[10px] text-center text-white/40 uppercase tracking-widest mt-2">
                                No spam. Unsubscribe anytime.
                            </p>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-6">
                        <div className="mx-auto bg-white border border-white/20 w-16 h-16 rounded-none flex items-center justify-center mb-6">
                            <CheckCircle2 className="text-black" size={32} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-serif text-white mb-3">Check your inbox.</h3>
                        <p className="text-white/60 font-sans text-sm mb-8 max-w-xs mx-auto leading-relaxed">
                            We just sent your exclusive Founder&apos;s code to <span className="text-white/80">{email}</span>. Use it at checkout to lock in your early-adopter pricing.
                        </p>
                        <button
                            onClick={() => { onClose(); setIsSuccess(false); setEmail(""); }}
                            className="bg-transparent border border-white/30 text-white font-sans text-xs uppercase tracking-widest font-bold py-4 px-8 w-full rounded-none hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            Continue Exploring
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
