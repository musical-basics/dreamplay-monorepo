"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { X, FileText, Package, DollarSign, CheckCircle2, Mail } from "lucide-react";
import SurveyPopup from "@/components/SurveyPopup";


import { subscribeToNewsletter } from "@/actions/email-actions";
import { trackEmailConversion } from "@/components/EmailTracker";
import { useAnalytics } from "@dreamplay/analytics/react";
import { WAITLIST_OFFER_BODY, WAITLIST_OFFER_HEADLINE, WAITLIST_OFFER_TAGS, WAITLIST_OFFER_TERMS } from "@/lib/waitlist-offer";

type PopupType = "none" | "shipping" | "pdf" | "classical_guide" | "discount" | "discount_44" | "accessory_25" | "store_credit_25" | "priority_shipping" | "survey_5off" | "tips";
type DreamPlayAnalyticsWindow = Window & {
    dreamplay?: {
        track?: (eventName: string, properties?: Record<string, unknown>) => void;
    };
};

/** Safe analytics wrapper — won't crash if tracker is blocked or hasn't loaded */
const trackPopup = (action: 'yes' | 'no', popupName: string) => {
    if (typeof window !== 'undefined') {
        const dreamplay = (window as DreamPlayAnalyticsWindow).dreamplay;
        dreamplay?.track?.(`click_popup_${action}`, { popup: popupName });
    }
};

const getPopupSeenKey = (popupType: PopupType) => (
    popupType === "shipping" ? "dp_v2_waitlist_credit_seen" : `dp_v2_${popupType}_seen`
);

// The Small Hands Guide (classical repertoire lead magnet) is the primary
// offer — value-first, no discount language. The hand-measuring guide stays
// available via InlineHandGuide on education pages.
const CLASSICAL_GUIDE_POPUP_ENABLED = true;
const HAND_SIZE_GUIDE_POPUP_ENABLED = false;
const WAITLIST_CREDIT_POPUP_ENABLED = false;

export default function NewsletterPopup() {
    const analytics = useAnalytics();
    const [activePopup, setActivePopup] = useState<PopupType>("none");
    const [email, setEmail] = useState("");
    const [isSubmitted, setIsSubmitted] = useState<PopupType>("none");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const hasExitFired = useRef(false);
    const pathname = usePathname();

    useEffect(() => {
        const popupTimers: ReturnType<typeof setTimeout>[] = [];

        const initPopups = () => {
            console.log('[PopupDebug] initPopups() called');

            // Disable all popups on commerce surfaces.
            if (window.location.pathname === '/customize' || window.location.pathname === '/shop') {
                console.log('[PopupDebug] SKIPPED: on commerce page');
                return;
            }

            // Disable all popups for email visitors (have discount code or SID)
            const urlParams = new URLSearchParams(window.location.search);
            const hasEmailSignal = urlParams.has('discount') || urlParams.has('sid')
                || sessionStorage.getItem('dp_vip_discount')
                || localStorage.getItem('dp_subscriber_id');
            if (hasEmailSignal) {
                console.log('[PopupDebug] SKIPPED: visitor came from email (discount/sid detected)');
                return;
            }

            // If user is already mapped, skip popups entirely
            if (localStorage.getItem("dp_user_email")) {
                console.log('[PopupDebug] SKIPPED: dp_user_email found in localStorage');
                return;
            }
            if (localStorage.getItem("dp_v2_subscribed") === "true") {
                console.log('[PopupDebug] SKIPPED: dp_v2_subscribed=true in localStorage');
                return;
            }

            const popups: Array<{ type: PopupType; delaySeconds: number }> = [
                ...(CLASSICAL_GUIDE_POPUP_ENABLED ? [{ type: "classical_guide" as const, delaySeconds: 35 }] : []),
                ...(HAND_SIZE_GUIDE_POPUP_ENABLED ? [{ type: "pdf" as const, delaySeconds: 35 }] : []),
                ...(WAITLIST_CREDIT_POPUP_ENABLED ? [{ type: "shipping" as const, delaySeconds: 35 }] : []),
            ];

            console.log('[PopupDebug] Scheduling', popups.length, 'popups:', JSON.stringify(popups));

            // Schedule each popup with its delay
            popups.forEach((popup, index) => {
                const popupType = popup.type as PopupType;
                if (localStorage.getItem(getPopupSeenKey(popupType)) === 'true') {
                    console.log(`[PopupDebug] SKIPPED popup ${index} (${popupType}): already seen`);
                    return;
                }

                console.log(`[PopupDebug] Scheduling popup ${index}: ${popupType} at ${popup.delaySeconds}s`);
                const timer = setTimeout(() => {
                    console.log(`[PopupDebug] Timer fired for popup ${index}: ${popupType}`);
                    if (localStorage.getItem('dp_v2_subscribed') === 'true') {
                        console.log(`[PopupDebug] SKIPPED: user subscribed during wait`);
                        return;
                    }
                    if (localStorage.getItem(getPopupSeenKey(popupType)) === 'true') {
                        console.log(`[PopupDebug] SKIPPED: popup ${popupType} marked seen during wait`);
                        return;
                    }
                    // Only show if no popup is currently active
                    setActivePopup(prev => {
                        if (prev === "none") {
                            console.log(`[PopupDebug] SHOWING popup: ${popupType}`);
                            return popupType;
                        }
                        console.log(`[PopupDebug] SKIPPED: another popup (${prev}) is already active`);
                        return prev;
                    });
                }, popup.delaySeconds * 1000);

                popupTimers.push(timer);
            });
        };

        initPopups();

        return () => {
            popupTimers.forEach(t => clearTimeout(t));
        };
    }, []);

    // --- EXIT-INTENT POPUP ---
    useEffect(() => {
        // Never interrupt commerce or account flows with exit intent.
        const excludedPaths = ["/vip", "/login", "/register", "/activate", "/forgot-password", "/reset-password", "/customize", "/shop", "/checkout"];
        if (!CLASSICAL_GUIDE_POPUP_ENABLED) return;
        if (excludedPaths.includes(pathname)) return;

        const handleMouseLeave = (e: MouseEvent) => {
            if (hasExitFired.current) return;
            if (e.clientY > 0) return;

            const isSubscribed = localStorage.getItem("dp_v2_subscribed") === "true" || !!localStorage.getItem("dp_user_email");
            if (isSubscribed) return;

            hasExitFired.current = true;
            console.log('[PopupDebug] Exit-intent fired');
            if (localStorage.getItem(getPopupSeenKey("classical_guide")) === 'true') return;
            setActivePopup(prev => prev === "none" ? "classical_guide" : prev);
        };

        // Delay attaching exit-intent by 5s to prevent false triggers on page load/refresh
        const attachTimer = setTimeout(() => {
            document.documentElement.addEventListener("mouseleave", handleMouseLeave);
        }, 5000);

        return () => {
            clearTimeout(attachTimer);
            document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [pathname]);


    const handleClose = () => {
        setErrorMsg("");
        const popupTrackNames: Record<string, string> = {
            shipping: 'waitlist_100_credit',
            pdf: 'hand_size',
            classical_guide: 'small_hands_guide',
            discount: 'discount_300',
            discount_44: 'discount_44',
            accessory_25: 'accessory_25',
            store_credit_25: 'store_credit_25',
            priority_shipping: 'priority_shipping',
            survey_5off: 'survey_5off',
            tips: 'piano_tips',
        };
        const trackName = popupTrackNames[activePopup];
        if (trackName) {
            trackPopup('no', trackName);
            localStorage.setItem(getPopupSeenKey(activePopup), "true");
            setActivePopup("none");
            setIsSubmitted("none");
        } else {
            setActivePopup("none");
            setIsSubmitted("none");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg("");

        const currentOffer = activePopup;

        try {
            const tagMap: Record<string, string> = {
                discount: "$300 Off Lead",
                discount_44: "44% Off Lead",
                accessory_25: "25% Accessory Lead",
                pdf: "Hand Guide Download",
                classical_guide: "Small Hands Guide",
                tips: "Piano Tips Subscriber",
            };
            const tags = currentOffer === "shipping"
                ? WAITLIST_OFFER_TAGS
                : [tagMap[currentOffer] || "Hand Guide Download"];
            const tempSession = localStorage.getItem("dp_temp_session") || undefined;

            const res = await subscribeToNewsletter({
                email,
                first_name: "",
                tags,
                temp_session_id: tempSession,
            });

            if (!res.success) {
                throw new Error(res.error || "Failed to subscribe");
            }

            localStorage.setItem("dp_v2_subscribed", "true");
            localStorage.setItem(getPopupSeenKey("shipping"), "true");
            localStorage.setItem("dp_v2_pdf_seen", "true");
            localStorage.setItem("dp_v2_discount_seen", "true");
            localStorage.setItem("dp_user_email", email);
            if (res.id) localStorage.setItem("dp_subscriber_id", res.id);

            setIsSubmitted(currentOffer);
            void analytics.track('email_signup', { source: 'newsletter_popup', offer: currentOffer, email });
            trackEmailConversion('conversion_t1', window.location.pathname);
            trackPopup('yes', currentOffer === 'classical_guide' ? 'small_hands_guide' : currentOffer === 'shipping' ? 'waitlist_100_credit' : currentOffer === 'discount' ? 'discount_300' : 'hand_size');

            // Auto-open PDF for pdf offer
            if (currentOffer === "pdf") {
                window.open(
                    "https://www.dropbox.com/scl/fi/9b72rbi4ga0pjterxyoan/DreamPlay-Infographic.pdf?rlkey=mc08i1ahn5tp3thdd0qjnag2d&st=olbh1t9w&dl=1",
                    "_blank"
                );
            }
        } catch (error: unknown) {
            console.error(error);
            setErrorMsg(error instanceof Error ? error.message : "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (activePopup === "none" && isSubmitted === "none") return null;

    // ── Survey popup gets its own full-screen component ──
    if (activePopup === "survey_5off") {
        return (
            <SurveyPopup
                onClose={() => {
                    setActivePopup("none");
                    setIsSubmitted("none");
                }}
            />
        );
    }

    // ── Tips popup gets its own distinct visual style ──
    if (activePopup === "tips" && isSubmitted === "none") {
        return (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300">
                <div className="relative w-full max-w-md bg-[#0a0f0a] border border-emerald-500/20 rounded-xl shadow-2xl shadow-emerald-900/10 p-8 md:p-10 animate-in fade-in zoom-in-95 duration-300">

                    <button
                        onClick={handleClose}
                        className="absolute right-4 top-4 text-white/30 hover:text-white transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>

                    <div className="mb-8 text-center">
                        <h2 className="text-2xl md:text-[28px] tracking-tight leading-tight mb-4">
                            <span className="text-white/90" style={{ fontFamily: "'Courier New', Courier, monospace", fontWeight: 400 }}>
                                improve your{" "}
                            </span>
                            <span className="text-emerald-400" style={{ fontFamily: "'Courier New', Courier, monospace", fontWeight: 700 }}>
                                practice
                            </span>
                        </h2>

                        <p className="text-white/50 font-sans text-sm leading-relaxed max-w-xs mx-auto" style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: "13px", lineHeight: "1.7" }}>
                            foundational tips on technique, practice strategies,
                            and principles that actually help you improve.
                        </p>
                        <p className="text-white/35 mt-3" style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: "12px" }}>
                            no sales. no spam. just piano.
                        </p>
                    </div>

                    {errorMsg && (
                        <div className="mb-4 p-3 border border-red-500/30 bg-red-500/10 rounded-lg text-red-400 text-xs font-sans text-center">
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex gap-3">
                        <input
                            type="email"
                            required
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex-1 px-4 py-3.5 rounded-lg border border-white/15 bg-white/5 placeholder-white/30 text-white focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all text-sm"
                            style={{ fontFamily: "'Courier New', Courier, monospace" }}
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-70 cursor-pointer shrink-0"
                            style={{ fontFamily: "'Courier New', Courier, monospace" }}
                        >
                            {isLoading ? "..." : "subscribe"}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Tips success state
    if (activePopup === "tips" && isSubmitted === "tips") {
        return (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300">
                <div className="relative w-full max-w-md bg-[#0a0f0a] border border-emerald-500/20 rounded-xl shadow-2xl shadow-emerald-900/10 p-8 md:p-10 animate-in fade-in zoom-in-95 duration-300">
                    <div className="text-center py-4">
                        <div className="mx-auto bg-emerald-500/10 border border-emerald-500/20 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 className="text-emerald-400" size={28} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl text-white mb-3" style={{ fontFamily: "'Courier New', Courier, monospace" }}>you&apos;re in.</h3>
                        <p className="text-white/50 text-sm mb-6 max-w-xs mx-auto" style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: "13px", lineHeight: "1.7" }}>
                            check your inbox for a welcome email with your first practice tip.
                        </p>
                        <button
                            onClick={handleClose}
                            className="text-white/30 hover:text-white/60 text-xs uppercase tracking-widest transition-colors cursor-pointer py-2"
                            style={{ fontFamily: "'Courier New', Courier, monospace" }}
                        >
                            close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300">
            <div className="relative w-full max-w-md bg-[#050505] border border-white/10 rounded-none shadow-2xl p-8 md:p-10 animate-in fade-in zoom-in-95 duration-300">

                <button
                    onClick={handleClose}
                    className="absolute right-4 top-4 text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                    <X size={20} />
                </button>

                {isSubmitted === "none" ? (
                    <>
                        <div className="mb-8 text-center">
                            <div className="mx-auto bg-white/5 border border-white/10 w-14 h-14 rounded-none flex items-center justify-center mb-6">
                                {activePopup === "shipping" ? (
                                    <Mail className="text-white" size={24} strokeWidth={1.5} />
                                ) : activePopup === "priority_shipping" ? (
                                    <Package className="text-white" size={24} strokeWidth={1.5} />
                                ) : activePopup === "discount" || activePopup === "discount_44" ? (
                                    <DollarSign className="text-white" size={24} strokeWidth={1.5} />
                                ) : activePopup === "accessory_25" || activePopup === "store_credit_25" ? (
                                    <DollarSign className="text-white" size={24} strokeWidth={1.5} />
                                ) : (
                                    <FileText className="text-white" size={24} strokeWidth={1.5} />
                                )}
                            </div>

                            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-3">
                                {activePopup === "shipping" ? "Waitlist Exclusive"
                                    : activePopup === "discount" ? "Founder's Batch"
                                        : activePopup === "discount_44" ? "Limited Time Offer"
                                            : activePopup === "accessory_25" ? "Bundle & Save"
                                                : activePopup === "store_credit_25" ? "Exclusive Offer"
                                                    : activePopup === "priority_shipping" ? "Priority Access"
                                                        : "Free Resource"}
                            </p>

                            <h2 className="text-2xl md:text-3xl font-serif text-white tracking-tight leading-tight mb-4">
                                {activePopup === "classical_guide"
                                    ? "The Small Hands Guide to Classical Piano Music."
                                    : activePopup === "shipping"
                                    ? WAITLIST_OFFER_HEADLINE
                                    : activePopup === "discount"
                                        ? "Lock in Founder's Pricing."
                                        : activePopup === "discount_44"
                                            ? "Get 44% Off Today."
                                            : activePopup === "accessory_25"
                                                ? "25% Off All Accessories."
                                                : activePopup === "store_credit_25"
                                                    ? "Get $25 Store Credit."
                                                    : activePopup === "priority_shipping"
                                                        ? "Get Priority Shipping."
                                                        : "Are standard keys holding you back?"}
                            </h2>

                            <p className="text-white/60 font-sans text-sm leading-relaxed">
                                {activePopup === "classical_guide"
                                    ? "Which pieces flatter a smaller hand span, the fingerings that tame the wide stretches, and how to build a repertoire that works with your hands. Free the day it's released."
                                    : activePopup === "shipping"
                                    ? WAITLIST_OFFER_BODY
                                    : activePopup === "discount"
                                        ? "Enter your email to secure early-adopter pricing for the DreamPlay One Founder's Batch, shipping May 2027."
                                        : activePopup === "discount_44"
                                            ? "Enter your email now to unlock an exclusive 44% discount on the DreamPlay One. This offer won't last."
                                            : activePopup === "accessory_25"
                                                ? "Enter your email to get 25% off our stand, pedal, and bench bundle when you order with your DreamPlay One."
                                                : activePopup === "store_credit_25"
                                                    ? "Enter your email and we'll send you $25 off any piano accessory — bench, stand, or headphones."
                                                    : activePopup === "priority_shipping"
                                                        ? "Enter your email to get priority status for early shipping. Be among the first to receive your DreamPlay One."
                                                        : "Enter your email to instantly download our Hand-Measuring Guide to see exactly which piano size will help you the most."}
                            </p>
                        </div>

                        {errorMsg && (
                            <div className="mb-4 p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-sans text-center">
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="email"
                                required
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-4 rounded-none border border-white/20 bg-transparent placeholder-white/40 text-white focus:ring-1 focus:ring-white focus:border-white outline-none transition-all font-sans text-sm"
                            />

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-white text-black font-sans text-xs uppercase tracking-widest font-bold py-4 rounded-none hover:bg-white/90 transition-colors disabled:opacity-70 cursor-pointer"
                            >
                                {isLoading
                                    ? "Processing..."
                                    : activePopup === "classical_guide"
                                        ? "Get The Guide"
                                        : activePopup === "shipping"
                                        ? "Join Waitlist"
                                        : activePopup === "discount"
                                            ? "Secure My Spot"
                                            : activePopup === "discount_44"
                                                ? "Claim 44% Off"
                                                : activePopup === "accessory_25"
                                                    ? "Get 25% Off Accessories"
                                                    : activePopup === "store_credit_25"
                                                        ? "Claim My $25 Credit"
                                                        : activePopup === "priority_shipping"
                                                            ? "Get Priority Status"
                                                            : "Get Free PDF Guide"}
                            </button>

                            <button
                                type="button"
                                onClick={handleClose}
                                className="w-full mt-1 text-white/30 hover:text-white/60 font-sans text-xs uppercase tracking-widest transition-colors cursor-pointer py-2"
                            >
                                Remind Me Later
                            </button>
                            <p className="text-[10px] text-center text-white/40 uppercase tracking-widest mt-2">
                                No spam. Unsubscribe anytime.
                            </p>
                            {activePopup === "shipping" && (
                                <p className="text-[10px] text-center text-white/35 leading-relaxed mt-3">
                                    {WAITLIST_OFFER_TERMS}
                                </p>
                            )}
                        </form>
                    </>
                ) : isSubmitted === "classical_guide" || isSubmitted === "shipping" || isSubmitted === "discount" || isSubmitted === "discount_44" || isSubmitted === "accessory_25" || isSubmitted === "store_credit_25" || isSubmitted === "priority_shipping" ? (
                    /* ── Shipping / Discount Success: Check your email ── */
                    <div className="text-center py-6">
                        <div className="mx-auto bg-white border border-white/20 w-16 h-16 rounded-none flex items-center justify-center mb-6">
                            <CheckCircle2 className="text-black" size={32} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-serif text-white mb-3">Check your inbox.</h3>
                        <p className="text-white/60 font-sans text-sm mb-8 max-w-xs mx-auto leading-relaxed">
                            {isSubmitted === "classical_guide"
                                ? "You're on the list — the Small Hands Guide to Classical Piano Music will land in your inbox the day it's released."
                                : isSubmitted === "discount"
                                ? "We just sent you an email with your exclusive $300 discount code. Use it at checkout to save on any DreamPlay keyboard or bundle."
                                : isSubmitted === "discount_44"
                                    ? "We just sent you an email with your exclusive 44% discount code. Use it at checkout to save on any DreamPlay keyboard."
                                    : isSubmitted === "accessory_25"
                                        ? "We just sent you an email with your exclusive 25% accessory discount. Use it at checkout with your DreamPlay order."
                                        : isSubmitted === "store_credit_25"
                                            ? "Your $25 store credit has been reserved. We'll send the details to your email."
                                            : isSubmitted === "priority_shipping"
                                                ? "You're on the priority list for early shipping. We'll keep you updated."
                                                : "You're on the DreamPlay Waitlist. We'll email production updates and preorder availability."
                            }
                        </p>
                        <button
                            onClick={handleClose}
                            className="bg-transparent border border-white/30 text-white font-sans text-xs uppercase tracking-widest font-bold py-4 px-8 w-full rounded-none hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            Continue Exploring
                        </button>
                    </div>
                ) : (
                    /* ── PDF Success ── */
                    <div className="text-center py-6">
                        <div className="mx-auto bg-white border border-white/20 w-16 h-16 rounded-none flex items-center justify-center mb-6">
                            <CheckCircle2 className="text-black" size={32} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-serif text-white mb-3">Your guide is downloading!</h3>
                        <p className="text-white/60 font-sans text-sm mb-8 max-w-xs mx-auto leading-relaxed">
                            Check your new tab for the PDF. Print it out, place your hand on the guide, and discover your ideal key size.
                        </p>
                        <button
                            onClick={handleClose}
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
