"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@dreamplay/db";
import { subscribeToNewsletter } from "@/actions/email-actions";
import { Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { WAITLIST_OFFER_BODY, WAITLIST_OFFER_HEADLINE, WAITLIST_OFFER_TERMS } from "@/lib/waitlist-offer";

function ActivateForm() {
    const searchParams = useSearchParams();
    const emailFromUrl = searchParams.get("em") || searchParams.get("email") || "";

    // Grab the discount code from the email link
    const discountFromUrl = searchParams.get("discount");

    const [email] = useState(emailFromUrl);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [isComplete] = useState(false);

    // Save it silently to the browser session so it survives until checkout
    useEffect(() => {
        if (discountFromUrl) {
            sessionStorage.setItem("dp_vip_discount", discountFromUrl);
            localStorage.setItem("dp_vip_discount", discountFromUrl);
        }
    }, [discountFromUrl]);

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg("");

        if (password.length < 6) {
            setErrorMsg("Password must be at least 6 characters.");
            setIsLoading(false);
            return;
        }

        try {
            const supabase = createBrowserClient();

            // Try sign up
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) {
                // If already registered, try sign in
                if (signUpError.message.toLowerCase().includes("already") || signUpError.message.toLowerCase().includes("registered")) {
                    const { error: signInError } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                    });

                    if (signInError) {
                        setErrorMsg("An account with this email already exists. Please check your password or sign in instead.");
                        setIsLoading(false);
                        return;
                    }
                } else {
                    setErrorMsg(signUpError.message);
                    setIsLoading(false);
                    return;
                }
            }

            // Tag them as a VIP account in the CRM
            try {
                await subscribeToNewsletter({
                    email,
                    first_name: "",
                    tags: ["VIP Account"],
                });
            } catch {
                // Non-critical
            }

            // Redirect to VIP dashboard
            localStorage.setItem("dp_user_email", email);
            window.location.href = "/vip";
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
            setIsLoading(false);
        }
    };

    if (isComplete) return null;

    return (
        <div className="bg-[#050505] min-h-screen flex items-center justify-center px-6">
            <div className="w-full max-w-sm">
                {/* Brand */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-block mb-8">
                        <img src="/images/logos/DreamPlay Logo White.png" alt="DreamPlay" className="h-6 mx-auto" />
                    </Link>
                    <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-4">Founder&apos;s Club</p>
                    <h1 className="font-serif text-3xl text-white tracking-tight mb-3">{WAITLIST_OFFER_HEADLINE}</h1>
                    <p className="font-sans text-sm text-white/40 leading-relaxed">
                        {WAITLIST_OFFER_BODY} Set a password to keep your waitlist profile connected.
                    </p>
                    <p className="mt-3 font-sans text-[10px] leading-relaxed text-white/30">
                        {WAITLIST_OFFER_TERMS}
                    </p>
                </div>

                {/* Error */}
                {errorMsg && (
                    <div className="mb-4 p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-sans text-center">
                        {errorMsg}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleActivate} className="space-y-4">
                    <div>
                        <label className="block font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            readOnly
                            className="w-full px-4 py-4 rounded-none border border-white/10 bg-white/5 text-white/60 font-sans text-sm cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2">Create Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={6}
                                placeholder="Min 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-4 pr-12 rounded-none border border-white/20 bg-transparent placeholder-white/30 text-white focus:ring-1 focus:ring-white focus:border-white outline-none transition-all font-sans text-sm"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-white text-black font-sans text-xs uppercase tracking-widest font-bold py-4 rounded-none hover:bg-white/90 transition-colors disabled:opacity-70 cursor-pointer mt-2"
                    >
                        {isLoading ? "Creating Account..." : "Create Account & Keep My Credit"}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-8 text-center space-y-3">
                    <p className="text-white/30 text-xs font-sans">
                        Already have an account?{" "}
                        <a href="/login" className="text-white/60 hover:text-white underline underline-offset-4 transition-colors">
                            Sign in
                        </a>
                    </p>
                    <Link href="/" className="block text-white/20 hover:text-white/40 text-xs font-sans uppercase tracking-widest transition-colors">
                        ← Back to DreamPlay
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function ActivatePage() {
    return (
        <Suspense fallback={
            <div className="bg-[#050505] min-h-screen flex items-center justify-center">
                <p className="text-white/40 font-sans text-sm">Loading...</p>
            </div>
        }>
            <ActivateForm />
        </Suspense>
    );
}
