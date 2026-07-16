"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@dreamplay/db";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [sent, setSent] = useState(false);

    useEffect(() => {
        // Hydration-safe one-time prefill from localStorage (client-only source).
        const saved = localStorage.getItem("dp_user_email");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (saved) setEmail(saved);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg("");

        try {
            const supabase = createBrowserClient();
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
            });

            if (error) {
                setErrorMsg(error.message);
                setIsLoading(false);
                return;
            }

            setSent(true);
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-[#050505] min-h-screen flex items-center justify-center px-6">
            <div className="w-full max-w-sm">
                {/* Logo / Brand */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-block mb-8">
                        <img src="/images/logos/DreamPlay Logo White.png" alt="DreamPlay" className="h-6 mx-auto" />
                    </Link>

                    {sent ? (
                        <>
                            <div className="mx-auto bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle2 className="text-green-500" size={32} strokeWidth={2} />
                            </div>
                            <h1 className="font-serif text-3xl text-white tracking-tight mb-2">Check your email</h1>
                            <p className="font-sans text-sm text-white/40 leading-relaxed">
                                We&apos;ve sent a password reset link to <span className="text-white/70">{email}</span>. Click the link in the email to set a new password.
                            </p>
                        </>
                    ) : (
                        <>
                            <h1 className="font-serif text-3xl text-white tracking-tight mb-2">Forgot password?</h1>
                            <p className="font-sans text-sm text-white/40">Enter your email and we&apos;ll send you a reset link.</p>
                        </>
                    )}
                </div>

                {/* Error Message */}
                {errorMsg && (
                    <div className="mb-4 p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-sans text-center">
                        {errorMsg}
                    </div>
                )}

                {/* Form */}
                {!sent && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2">Email</label>
                            <input
                                type="email"
                                required
                                autoFocus
                                placeholder="you@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-4 rounded-none border border-white/20 bg-transparent placeholder-white/30 text-white focus:ring-1 focus:ring-white focus:border-white outline-none transition-all font-sans text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-white text-black font-sans text-xs uppercase tracking-widest font-bold py-4 rounded-none hover:bg-white/90 transition-colors disabled:opacity-70 cursor-pointer mt-2"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Send Reset Link"}
                        </button>
                    </form>
                )}

                {/* Footer Links */}
                <div className="mt-8 text-center space-y-3">
                    <a href="/login" className="block text-white/30 hover:text-white/60 text-xs font-sans transition-colors">
                        ← Back to Login
                    </a>
                </div>
            </div>
        </div>
    );
}
