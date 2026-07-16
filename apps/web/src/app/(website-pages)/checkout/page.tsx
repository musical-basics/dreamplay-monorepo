"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Star, ShieldCheck, Undo2, Truck, CheckCircle2, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { VARIANT_MAP } from "@/config/variant-map";
import { trackEmailConversion } from "@/components/EmailTracker";
import { useAnalytics } from "@dreamplay/analytics/react";

const PRODUCT_IMAGES = {
    Black: [
        "/images/keyboards/DS6.0-Black-transparent v2.png",
        "/images/keyboards/piano-front-2.jpg",
        "/images/keyboards/Piano + Bench Frontal + Bundle.png",
        "/images/learn/keyboard-led-lights.jpg"
    ],
    White: [
        "/images/keyboards/ds55-white-narrow-keys-alt.png",
        "/images/keyboards/piano-front-2.jpg",
        "/images/accessories/piano-in-the-box.png",
        "/images/learn/keyboard-led-lights.jpg"
    ]
};

const PACKAGES = [
    {
        id: "solo",
        title: "Keyboard Only",
        subtitle: "DreamPlay One",
        price: 999,
        comparePrice: 1499,
        badge: null
    },
    {
        id: "full",
        title: "Premium Bundle",
        subtitle: "Keyboard, Stand, Bench, Pedal",
        price: 1099,
        comparePrice: 1499,
        badge: "Most Popular"
    }
];

function CheckoutContent() {
    const searchParams = useSearchParams();
    const analytics = useAnalytics();
    const [discountCode, setDiscountCode] = useState<string | null>(null);

    // Form State
    const [size, setSize] = useState<"DS6.0" | "DS5.5">("DS6.0");
    const [color, setColor] = useState<"Black" | "White">("Black");
    const [tier, setTier] = useState<"full" | "solo">("full");
    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const [isCheckingOut, setIsCheckingOut] = useState(false);


    useEffect(() => {
        const promo = searchParams?.get("discount") || sessionStorage.getItem("dp_vip_discount");
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage is only readable after hydration
        if (promo) setDiscountCode(promo);
    }, [searchParams]);

    // Reset image gallery to first image if color changes
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- legacy behavior: reset gallery when color changes
        setActiveImageIdx(0);
    }, [color]);

    const activeImages = PRODUCT_IMAGES[color];

    // Use hardcoded PACKAGES — no journey overrides
    const displayPackages = PACKAGES;

    const activePackage = displayPackages.find(p => p.id === tier)!;

    const handleCheckout = () => {
        setIsCheckingOut(true);

        const exactVariantId = VARIANT_MAP[tier]?.[size]?.[color] || "";

        // Fire-and-forget (keepalive) — survives the navigation below.
        void analytics.track('begin_checkout', {
            checkout_source: 'pdp',
            tier,
            size,
            color,
        });

        if (exactVariantId && exactVariantId.trim() !== '') {
            let permalink = `/cart/${exactVariantId}:1?note=checkout_source:pdp`;
            if (discountCode) permalink += `&discount=${discountCode}`;

            const checkoutUrl = `https://dreamplay-pianos.myshopify.com/cart/clear?return_to=${encodeURIComponent(permalink)}`;
            trackEmailConversion('conversion_t2', window.location.pathname);
            window.location.href = checkoutUrl;
        } else {
            let fallbackUrl = `https://dreamplay-pianos.myshopify.com/cart/add?id=52209394549050&quantity=1&return_to=/checkout&properties[Size]=${size}&properties[Finish]=${color}&note=checkout_source:pdp`;
            if (discountCode) fallbackUrl += `&discount=${discountCode}`;
            window.location.href = fallbackUrl;
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-neutral-900 selection:bg-neutral-200">
            <Navbar forceOpaque={true} darkMode={false} className="border-b border-neutral-200 bg-white" />

            <main className="pt-28 pb-24 md:pt-32 max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 items-start">

                    {/* ================= LEFT: IMAGE GALLERY ================= */}
                    <div className="flex flex-col gap-4 lg:sticky lg:top-28 mb-10 lg:mb-0">
                        {/* Main Image Stage */}
                        <div className="relative w-full aspect-[4/3] bg-[#f8f9fa] overflow-hidden flex items-center justify-center p-8 border border-neutral-100">
                            <Image
                                src={activeImages[activeImageIdx] ?? activeImages[0] ?? "/images/keyboards/DS6.0-Black-transparent v2.png"}
                                alt={`DreamPlay One in ${color}`}
                                fill
                                className="object-contain p-4 transition-opacity duration-300 mix-blend-multiply"
                                priority
                            />
                        </div>

                        {/* Thumbnails */}
                        <div className="grid grid-cols-4 gap-3">
                            {activeImages.map((src, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImageIdx(idx)}
                                    className={`relative aspect-[4/3] overflow-hidden border-2 bg-[#f8f9fa] transition-all ${activeImageIdx === idx ? "border-neutral-900" : "border-transparent hover:border-neutral-300"
                                        }`}
                                >
                                    <Image src={src} alt={`Thumbnail ${idx + 1}`} fill className="object-cover p-1 mix-blend-multiply" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ================= RIGHT: PRODUCT DETAILS ================= */}
                    <div className="flex flex-col pt-2">

                        {/* Title & Reviews */}
                        <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-neutral-900 tracking-tight mb-2">
                            DreamPlay One
                        </h1>

                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex text-[#FFD700]">
                                {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={16} fill="currentColor" strokeWidth={0} />)}
                            </div>
                            <span className="text-sm font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer transition-colors">
                                (208 Reviews)
                            </span>
                        </div>

                        {/* Price */}
                        <div className="flex items-end gap-3 mb-2">
                            <span className="text-2xl font-bold text-neutral-900">${activePackage.price.toLocaleString()}.00</span>
                            <span className="text-lg text-neutral-400 line-through mb-[2px]">${activePackage.comparePrice.toLocaleString()}.00</span>
                        </div>

                        {/* Shop Pay snippet matching Nightseal */}
                        <p className="text-sm text-neutral-600 mb-6">
                            Pay in 4 interest-free installments of <strong>${(activePackage.price / 4).toFixed(2)}</strong> with
                            <span className="font-bold text-[#5A31F4] ml-1">shop</span>
                            <span className="bg-[#5A31F4] text-white text-[10px] font-bold px-1 py-0.5 rounded-sm ml-[2px]">Pay</span>
                        </p>

                        {/* Nightseal-style Bullet Points */}
                        <ul className="space-y-3 mb-8">
                            {[
                                "Ergonomic key width eliminates hand & wrist strain",
                                "88 fully-weighted, graded hammer-action keys",
                                "Interactive LED learning lights built directly into keys"
                            ].map((bullet, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="text-neutral-500 shrink-0 mt-[3px]" strokeWidth={2} />
                                    <span className="text-neutral-800 text-sm leading-snug font-medium">{bullet}</span>
                                </li>
                            ))}
                        </ul>

                        {/* ================= OPTIONS ================= */}
                        <div className="space-y-6">

                            {/* Size Selection */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-neutral-900">1. Key Size: <span className="font-normal text-neutral-600 ml-1">{size}</span></label>
                                    <a href="/buyers-guide" target="_blank" className="text-xs text-blue-600 hover:underline">Size Guide</a>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {(["DS6.0", "DS5.5"] as const).map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setSize(s)}
                                            className={`py-3 px-4 border-2 text-left transition-all ${size === s ? "border-neutral-900 bg-neutral-900 shadow-sm" : "border-neutral-300 bg-white hover:border-neutral-400"
                                                }`}
                                        >
                                            <div className={`font-bold text-sm ${size === s ? 'text-white' : 'text-neutral-700'}`}>{s}</div>
                                            <div className={`text-xs mt-0.5 ${size === s ? 'text-neutral-300' : 'text-neutral-500'}`}>{s === "DS6.0" ? "15/16ths Size" : "7/8ths Size"}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color Selection */}
                            <div>
                                <span className="block text-sm font-bold text-neutral-900 mb-2">2. Finish: <span className="font-normal text-neutral-600 ml-1">{color}</span></span>
                                <div className="flex gap-3">
                                    {(["Black", "White"] as const).map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setColor(c)}
                                            className={`flex items-center gap-2 py-2.5 px-5 border-2 transition-all ${color === c ? "border-neutral-900 bg-neutral-900 shadow-sm" : "border-neutral-300 bg-white hover:border-neutral-400"
                                                }`}
                                        >
                                            <span className={`w-4 h-4 rounded-full border shadow-inner ${c === "Black" ? "bg-[#111] border-neutral-800" : "bg-[#f4f4f5] border-neutral-300"}`}></span>
                                            <span className={`text-sm font-bold ${color === c ? 'text-white' : 'text-neutral-700'}`}>{c}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* BUNDLE & SAVE (Nightseal Radio Layout) */}
                            <div className="pt-4">
                                <div className="relative flex items-center py-2 mb-4">
                                    <div className="flex-grow border-t border-neutral-300"></div>
                                    <span className="flex-shrink-0 mx-4 text-xs font-bold tracking-[0.1em] text-neutral-800 uppercase">
                                        Reserve
                                    </span>
                                    <div className="flex-grow border-t border-neutral-300"></div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    {displayPackages.map((option) => {
                                        const isSelected = tier === option.id;
                                        return (
                                            <label
                                                key={option.id}
                                                className={`relative flex items-center justify-between p-4 border-2 cursor-pointer transition-all ${isSelected ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 bg-white hover:border-neutral-300'}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="package"
                                                    value={option.id}
                                                    checked={isSelected}
                                                    onChange={(e) => setTier(e.target.value as "full" | "solo")}
                                                    className="sr-only"
                                                />

                                                <div className="flex items-center gap-4">
                                                    {/* Radio Circle */}
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-neutral-900' : 'border-neutral-300'}`}>
                                                        {isSelected && <div className="w-2.5 h-2.5 bg-neutral-900 rounded-full" />}
                                                    </div>
                                                    <div className="flex flex-col text-left">
                                                        <span className={`text-sm font-bold leading-none mb-1 ${isSelected ? 'text-neutral-900' : 'text-neutral-700'}`}>{option.title}</span>
                                                        <span className="text-xs text-neutral-500">{option.subtitle}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end text-right">
                                                    <span className={`text-sm font-bold ${isSelected ? 'text-neutral-900' : 'text-neutral-700'}`}>${option.price.toLocaleString()}</span>
                                                    {option.comparePrice && <span className="text-xs text-neutral-400 line-through mt-0.5">${option.comparePrice.toLocaleString()}</span>}
                                                </div>

                                                {/* NightSeal "Most Popular" Badge */}
                                                {option.badge && (
                                                    <div className="absolute -top-3 right-4 bg-neutral-900 text-white text-[10px] font-bold px-2.5 py-0.5 shadow-md uppercase tracking-wider">
                                                        {option.badge}
                                                    </div>
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* ADD TO CART BUTTON */}
                        <button
                            onClick={handleCheckout}
                            disabled={isCheckingOut}
                            className="w-full bg-[#111111] text-white font-bold text-sm tracking-widest uppercase py-4 hover:bg-black transition-colors mt-2 mb-8 disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {isCheckingOut ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : "Add To Cart"}
                        </button>

                        {/* Trust Icons Row */}
                        <div className="grid grid-cols-3 gap-2 border-b border-neutral-200 pb-8 mb-8">
                            <div className="flex flex-col items-center justify-center text-center gap-2">
                                <ShieldCheck size={28} strokeWidth={1.5} className="text-neutral-800" />
                                <span className="text-[11px] font-bold text-neutral-800">90-Day Trial</span>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center gap-2">
                                <Undo2 size={28} strokeWidth={1.5} className="text-neutral-800" />
                                <span className="text-[11px] font-bold text-neutral-800">Easy Returns</span>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center gap-2">
                                <Truck size={28} strokeWidth={1.5} className="text-neutral-800" />
                                <span className="text-[11px] font-bold text-neutral-800">Shipping Updates</span>
                            </div>
                        </div>

                        {/* Simple Nightseal-style Testimonial Snippet */}
                        <div>
                            <p className="text-sm font-medium italic text-neutral-600 mb-3 leading-relaxed">
                                &ldquo;Everything is easier on the 6.0 for me&hellip; I feel very comfortable playing scales, fast passages, or big chords.&rdquo;
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-neutral-400">Claudia Wang, Master&apos;s Student at SMU</span>
                                <div className="flex text-[#FFD700]">
                                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={12} fill="currentColor" strokeWidth={0} />)}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
            <CheckoutContent />
        </Suspense>
    );
}
