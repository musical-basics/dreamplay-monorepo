"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@dreamplay/db";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg("");

        if (password.length < 6) {
            setErrorMsg("Password must be at least 6 characters.");
            setIsLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg("Passwords do not match.");
            setIsLoading(false);
            return;
        }

        try {
            const supabase = createBrowserClient();
            const { error } = await supabase.auth.updateUser({ password });

            if (error) {
                setErrorMsg(error.message);
                setIsLoading(false);
                return;
            }

            setSuccess(true);
            setTimeout(() => {
                window.location.href = "/login";
            }, 2500);
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
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

                    {success ? (
                        <>
                            <div className="mx-auto bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle2 className="text-green-500" size={32} strokeWidth={2} />
                            </div>
                            <h1 className="font-serif text-3xl text-white tracking-tight mb-2">Password updated!</h1>
                            <p className="font-sans text-sm text-white/40 leading-relaxed">
                                Your password has been reset successfully. Redirecting to login...
                            </p>
                            <p className="text-white/40 font-sans text-xs flex items-center justify-center gap-2 mt-4">
                                <Loader2 size={14} className="animate-spin" /> Redirecting...
                            </p>
                        </>
                    ) : (
                        <>
                            <h1 className="font-serif text-3xl text-white tracking-tight mb-2">Set new password</h1>
                            <p className="font-sans text-sm text-white/40">Choose a new password for your account.</p>
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
                {!success && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    autoFocus
                                    minLength={6}
                                    placeholder="Min 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-4 pr-12 rounded-none border border-white/20 bg-transparent placeholder-white/30 text-white focus:ring-1 focus:ring-white focus:border-white outline-none transition-all font-sans text-sm"
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

                        <div>
                            <label className="block font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2">Confirm Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={6}
                                placeholder="Re-enter your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-4 rounded-none border border-white/20 bg-transparent placeholder-white/30 text-white focus:ring-1 focus:ring-white focus:border-white outline-none transition-all font-sans text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-white text-black font-sans text-xs uppercase tracking-widest font-bold py-4 rounded-none hover:bg-white/90 transition-colors disabled:opacity-70 cursor-pointer mt-2"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Update Password"}
                        </button>
                    </form>
                )}

                {/* Footer Links */}
                {!success && (
                    <div className="mt-8 text-center space-y-3">
                        <a href="/login" className="block text-white/30 hover:text-white/60 text-xs font-sans transition-colors">
                            ← Back to Login
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
