"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WAITLIST_OFFER_TERMS } from "@/lib/waitlist-offer";

export default function PromoCodeBox() {
    const [promoCode, setPromoCode] = useState("");
    const [isCustom, setIsCustom] = useState(false);

    useEffect(() => {
        // Check if they were granted a custom code from an email.
        // Hydration-safe one-time read from browser storage (client-only source).
        const savedCode = sessionStorage.getItem("dp_vip_discount") || localStorage.getItem("dp_vip_discount");
        if (savedCode) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPromoCode(savedCode);
            setIsCustom(true);
        }
    }, []);

    return (
        <div className="border border-white/10 bg-white/[0.03] p-8 md:p-10">
            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-6">{isCustom ? "Your Exclusive Code" : "Your Waitlist Status"}</p>
            <div className="bg-white/5 border border-white/10 p-6 mb-6 text-center">
                <p className="text-white/50 text-[10px] uppercase tracking-[0.2em] mb-2">{isCustom ? "Promo Code" : "Status"}</p>
                <p className="text-3xl font-mono text-white tracking-widest font-bold">{isCustom ? promoCode : "Active"}</p>
            </div>
            <p className="text-white/50 font-sans text-sm leading-relaxed mb-8">
                {isCustom
                    ? "Use this code at checkout to apply your DreamPlay promotion where eligible."
                    : "Your waitlist profile is attached to this account. We'll email updates when checkout or preorder opens."}
            </p>
            {!isCustom && (
                <p className="mb-8 font-sans text-[10px] leading-relaxed text-white/35">{WAITLIST_OFFER_TERMS}</p>
            )}
            <Link
                href="/customize"
                className="group inline-flex items-center justify-center gap-2 bg-white text-black px-8 py-4 font-sans text-xs uppercase tracking-widest font-bold w-full transition-colors hover:bg-white/90"
            >
                Configure My Piano
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            </Link>
        </div>
    );
}
