"use client";

import { useState } from "react";
import { createBrowserClient } from "@dreamplay/db";
import { subscribeToNewsletter } from "@/actions/email-actions";
import { trackEmailConversion } from "@/components/EmailTracker";
import { X, ChevronRight, Loader2, Mail } from "lucide-react";
import { WAITLIST_OFFER_BODY, WAITLIST_OFFER_HEADLINE, WAITLIST_OFFER_TAGS, WAITLIST_OFFER_TERMS } from "@/lib/waitlist-offer";

interface RegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    discountCode?: string;
    onSuccess?: () => void;
}

export function RegisterModal({ isOpen, onClose, discountCode, onSuccess }: RegisterModalProps) {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [reason, setReason] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const reasons = [
        "My hands feel too small for standard keys",
        "I experience pain or tension playing",
        "I want to reach 10ths and larger chords",
        "I'm just curious about narrow keys",
        "Other"
    ];

    const handleNext = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError("");
        if (step === 1 && !email) { setError("Please enter a valid email"); return; }
        if (step === 2 && !name) { setError("Please enter your name"); return; }
        if (step === 3 && !reason) { setError("Please select a reason"); return; }
        setStep(s => s + 1);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            setIsLoading(false);
            return;
        }

        try {
            const supabase = createBrowserClient();

            // 1. Create Supabase Auth User
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: name, reason }
                }
            });

            if (signUpError) {
                if (signUpError.message.toLowerCase().includes("already")) {
                    throw new Error("An account with this email already exists. Please log in instead.");
                }
                throw new Error(signUpError.message);
            }

            // 2. Add to Newsletter/CRM
            const discountTag = discountCode ? [`Discount: ${discountCode}`] : [];
            const res = await subscribeToNewsletter({
                email,
                first_name: name.split(" ")[0],
                tags: ["VIP Account", ...WAITLIST_OFFER_TAGS, `Reason: ${reason}`, ...discountTag].filter(Boolean)
            });

            // 3. Save to LocalStorage for analytics/forms
            localStorage.setItem("dp_user_email", email);
            localStorage.setItem("dp_user_first_name", name.split(" ")[0] ?? name);
            localStorage.setItem("dp_v2_subscribed", "true");
            if (res.id || authData.user?.id) {
                localStorage.setItem("dp_subscriber_id", res.id || authData.user?.id || "");
            }

            trackEmailConversion('conversion_t1', window.location.pathname);
            if (onSuccess) {
                onSuccess();
            } else {
                setStep(5);
            }

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300">
            <div className="relative w-full max-w-md bg-[#050505] border border-white/10 shadow-2xl p-8 md:p-10">
                {step < 5 && !discountCode && (
                    <button onClick={onClose} className="absolute right-4 top-4 text-white/40 hover:text-white transition-colors cursor-pointer">
                        <X size={20} />
                    </button>
                )}

                {/* Progress Bar */}
                {step < 5 && (
                    <div className="flex gap-1 mb-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-sky-500' : 'bg-white/10'}`} />
                        ))}
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-sans text-center rounded">
                        {error}
                    </div>
                )}

                {/* Step 1: Email */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-serif text-white tracking-tight mb-2">
                                {discountCode ? "Register to Claim Your Discount" : WAITLIST_OFFER_HEADLINE}
                            </h2>
                            <p className="text-white/60 text-sm font-sans">
                                {discountCode
                                    ? "Create a VIP account to use your exclusive discount code."
                                    : WAITLIST_OFFER_BODY}
                            </p>
                            {!discountCode && (
                                <p className="mt-3 text-[10px] leading-relaxed text-white/35">
                                    {WAITLIST_OFFER_TERMS}
                                </p>
                            )}
                        </div>
                        <form onSubmit={handleNext}>
                            <label className="block font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2">Email Address</label>
                            <input type="email" autoFocus required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-none border border-white/20 bg-transparent text-white focus:border-white outline-none font-sans text-sm" placeholder="you@email.com" />
                            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-white text-black font-sans text-xs uppercase tracking-widest font-bold py-4 hover:bg-white/90 disabled:opacity-50 mt-4 cursor-pointer">
                                Next <ChevronRight size={16} />
                            </button>
                        </form>
                    </div>
                )}

                {/* Step 2: Name */}
                {step === 2 && (
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-serif text-white tracking-tight mb-2">What&apos;s your name?</h2>
                        </div>
                        <form onSubmit={handleNext}>
                            <label className="block font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2">Full Name</label>
                            <input type="text" autoFocus required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-none border border-white/20 bg-transparent text-white focus:border-white outline-none font-sans text-sm" placeholder="John Doe" />
                            <div className="flex gap-2 mt-4">
                                <button type="button" onClick={() => setStep(1)} className="px-4 py-4 border border-white/20 text-white/70 hover:text-white font-sans text-xs uppercase tracking-widest cursor-pointer">Back</button>
                                <button type="submit" className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-sans text-xs uppercase tracking-widest font-bold py-4 hover:bg-white/90 disabled:opacity-50 cursor-pointer">
                                    Next <ChevronRight size={16} />
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Step 3: Reason */}
                {step === 3 && (
                    <div className="space-y-4">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-serif text-white tracking-tight mb-2">Why are you interested in DreamPlay?</h2>
                        </div>
                        <div className="space-y-2">
                            {reasons.map(r => (
                                <button key={r} onClick={() => { setReason(r); handleNext(); }} className="w-full text-left px-4 py-3 border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30 text-white text-sm font-sans transition-all cursor-pointer">
                                    {r}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setStep(2)} className="w-full py-3 text-white/50 hover:text-white font-sans text-xs uppercase tracking-widest mt-2 cursor-pointer">Back</button>
                    </div>
                )}

                {/* Step 4: Password */}
                {step === 4 && (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-serif text-white tracking-tight mb-2">Create a Password</h2>
                            <p className="text-white/60 text-sm font-sans">Secure your account to keep your waitlist profile connected.</p>
                        </div>
                        <div>
                            <label className="block font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2">Password</label>
                            <input type="password" autoFocus required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-none border border-white/20 bg-transparent text-white focus:border-white outline-none font-sans text-sm" placeholder="Min 6 characters" />
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button type="button" onClick={() => setStep(3)} className="px-4 py-4 border border-white/20 text-white/70 hover:text-white font-sans text-xs uppercase tracking-widest cursor-pointer">Back</button>
                            <button type="submit" disabled={isLoading} className="flex-1 flex items-center justify-center gap-2 bg-sky-500 text-white font-sans text-xs uppercase tracking-widest font-bold py-4 hover:bg-sky-400 disabled:opacity-50 cursor-pointer">
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Setup"}
                            </button>
                        </div>
                    </form>
                )}

                {/* Step 5: Success — Check Email */}
                {step === 5 && (
                    <div className="text-center py-6">
                        <div className="mx-auto bg-sky-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                            <Mail className="text-sky-400" size={28} strokeWidth={2} />
                        </div>
                        <h3 className="font-serif text-3xl mb-4 text-white">Check your email</h3>
                        <p className="text-white/60 text-sm mb-6 leading-relaxed">
                            We&apos;ve sent a verification link to <span className="text-white/80">{email}</span>. Click the link to activate your account.
                        </p>
                        <p className="text-white/40 font-sans text-xs leading-relaxed">
                            Didn&apos;t receive the email? Check your spam folder or{" "}
                            <button onClick={() => { setStep(1); setPassword(''); }} className="text-white/60 hover:text-white underline underline-offset-4 transition-colors cursor-pointer">
                                try again
                            </button>.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
