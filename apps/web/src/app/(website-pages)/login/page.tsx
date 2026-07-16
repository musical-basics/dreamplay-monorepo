"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@dreamplay/db";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        // Hydration-safe one-time prefill from localStorage (client-only source).
        const saved = localStorage.getItem("dp_user_email");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (saved) setEmail(saved);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg("");

        try {
            const supabase = createBrowserClient();
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setErrorMsg(error.message);
                setIsLoading(false);
                return;
            }

            // Redirect to VIP dashboard
            localStorage.setItem("dp_user_email", email);
            window.location.href = "/vip";
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
                    <h1 className="font-serif text-3xl text-white tracking-tight mb-2">Welcome back.</h1>
                    <p className="font-sans text-sm text-white/40">Sign in to your VIP account</p>
                </div>

                {/* Error Message */}
                {errorMsg && (
                    <div className="mb-4 p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-sans text-center">
                        {errorMsg}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2">Email</label>
                        <input
                            type="email"
                            required
                            placeholder="you@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-4 rounded-none border border-white/20 bg-transparent placeholder-white/30 text-white focus:ring-1 focus:ring-white focus:border-white outline-none transition-all font-sans text-sm"
                        />
                    </div>

                    <div>
                        <label className="block font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="Enter your password"
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

                    <div className="text-right">
                        <a href="/forgot-password" className="text-white/40 hover:text-white/70 text-xs font-sans transition-colors">
                            Forgot password?
                        </a>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-white text-black font-sans text-xs uppercase tracking-widest font-bold py-4 rounded-none hover:bg-white/90 transition-colors disabled:opacity-70 cursor-pointer mt-2"
                    >
                        {isLoading ? "Signing In..." : "Sign In"}
                    </button>
                </form>

                {/* Footer Links */}
                <div className="mt-8 text-center space-y-3">
                    <p className="text-white/30 text-xs font-sans">
                        Don&apos;t have an account?{" "}
                        <a href="/register" className="text-white/60 hover:text-white underline underline-offset-4 transition-colors">
                            Register here
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
