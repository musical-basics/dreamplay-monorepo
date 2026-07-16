"use client";

import React, { useEffect, useState } from "react";
import { LockKeyhole, Hammer, Package } from "lucide-react";
import { AnimatedSection } from "@/components/animated-section";

export function DynamicProductionTimeline() {
    const [dates, setDates] = useState({ today: "", delivery: "", year: "" });

    useEffect(() => {
        const today = new Date();
        const delivery = new Date(today);
        
        // Add exactly 6 months to today's date
        delivery.setMonth(delivery.getMonth() + 6);

        // eslint-disable-next-line react-hooks/set-state-in-effect -- dates are computed client-side to avoid hydration mismatch
        setDates({
            today: today.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            delivery: delivery.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            year: delivery.getFullYear().toString(),
        });
    }, []);

    // Don't render until client-side hydration is complete to avoid layout shifts
    if (!dates.today) return <div className="h-32"></div>; 

    return (
        <AnimatedSection delay={200} className="w-full max-w-4xl mx-auto mb-16">
            <div className="border border-white/10 bg-white/[0.03] p-8 md:p-12 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-emerald-500 opacity-50"></div>
                
                <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-8 text-center">
                    Bespoke Build Timeline
                </p>

                {/* Desktop / Tablet View */}
                <div className="hidden sm:flex items-start justify-between relative">
                    {/* Connecting lines */}
                    <div className="absolute top-[18px] left-[60px] right-[60px] h-[2px] bg-white/10" />
                    <div className="absolute top-[18px] left-[60px] h-[2px] w-[50%] bg-gradient-to-r from-amber-400/20 to-amber-400" />

                    {/* Node 1 — Order */}
                    <div className="relative z-10 flex flex-col items-center text-center w-1/3">
                        <div className="w-9 h-9 rounded-full bg-white/10 border-2 border-amber-400 mb-4 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                            <LockKeyhole className="w-4 h-4 text-amber-400" />
                        </div>
                        <span className="font-sans text-xs font-bold uppercase tracking-widest text-amber-400">
                            Order Today
                        </span>
                        <span className="font-sans text-[10px] text-amber-400/70 mt-1">
                            {dates.today}
                        </span>
                    </div>

                    {/* Node 2 — Build */}
                    <div className="relative z-10 flex flex-col items-center text-center w-1/3">
                        <div className="w-9 h-9 rounded-full bg-[#050505] border-2 border-white/20 mb-4 flex items-center justify-center">
                            <Hammer className="w-4 h-4 text-white/60" />
                        </div>
                        <span className="font-sans text-xs font-bold uppercase tracking-widest text-white">
                            Custom Tooling
                        </span>
                        <span className="font-sans text-[10px] text-white/50 mt-1">
                            6 Month Build Phase
                        </span>
                    </div>

                    {/* Node 3 — Delivery */}
                    <div className="relative z-10 flex flex-col items-center text-center w-1/3">
                        <div className="absolute -top-8 text-amber-400 animate-bounce text-lg">👇</div>
                        <div className="w-12 h-12 rounded-full bg-amber-400/20 border-2 border-amber-400 mb-4 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                            <Package className="w-5 h-5 text-amber-400" />
                        </div>
                        <span className="font-sans text-xs font-bold uppercase tracking-widest text-amber-400">
                            Delivery Target
                        </span>
                        <span className="font-sans text-[10px] text-amber-400/70 mt-1">
                            {dates.delivery}, {dates.year}
                        </span>
                    </div>
                </div>

                {/* Mobile View (Vertical) */}
                <div className="sm:hidden flex flex-col gap-6 relative">
                    <div className="absolute left-[17px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-amber-400 via-amber-400/50 to-white/10" />
                    
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-9 h-9 rounded-full bg-[#050505] border-2 border-amber-400 flex items-center justify-center shrink-0">
                            <LockKeyhole className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                            <div className="font-sans text-xs font-bold uppercase tracking-widest text-amber-400">Order Today</div>
                            <div className="font-sans text-[10px] text-amber-400/70">{dates.today}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-9 h-9 rounded-full bg-[#050505] border-2 border-white/20 flex items-center justify-center shrink-0">
                            <Hammer className="w-4 h-4 text-white/60" />
                        </div>
                        <div>
                            <div className="font-sans text-xs font-bold uppercase tracking-widest text-white">Custom Tooling</div>
                            <div className="font-sans text-[10px] text-white/50">6 Month Build Phase</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                            <Package className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                            <div className="font-sans text-xs font-bold uppercase tracking-widest text-amber-400">Delivery Target</div>
                            <div className="font-sans text-[10px] text-amber-400/70">{dates.delivery}, {dates.year}</div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-10 pt-6 border-t border-white/10 text-center">
                    <p className="font-sans text-xs text-white/60 leading-relaxed max-w-lg mx-auto">
                        Your instrument is custom-tooled for your biology. <strong className="text-amber-400 font-medium">Because every day matters, your estimated delivery date gets pushed back 1 day for every day you wait to reserve.</strong>
                    </p>
                </div>
            </div>
        </AnimatedSection>
    );
}
