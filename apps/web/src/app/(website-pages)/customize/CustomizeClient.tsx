"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { getCountdownDate } from "@/actions/admin-actions";
import { subscribeToNewsletter } from "@/actions/email-actions";
import { trackEmailConversion } from "@/components/EmailTracker";
import { useAnalytics } from "@dreamplay/analytics/react";
import { ArrowRight, ArrowLeft, Check, ShieldCheck, X, CheckCircle2, Undo2, Truck } from "lucide-react";
import { createBrowserClient } from "@dreamplay/db";
import { VARIANT_MAP } from "@/config/variant-map";
import { abCheckoutNoteParts } from "@/lib/ab-checkout";
import { DynamicProductionTimeline } from "@/components/customize/DynamicProductionTimeline";
import { RegisterModal } from "@/components/RegisterModal";
import { formatOneProTargetDeliveryDate } from "@/lib/one-pro-delivery";
import { WAITLIST_OFFER_BODY, WAITLIST_OFFER_HEADLINE, WAITLIST_OFFER_TAGS, WAITLIST_OFFER_TERMS } from "@/lib/waitlist-offer";

interface CustomizeClientProps {
    urls: {
        bundle?: string;
        solo?: string;
        reservation?: string;
    }
    hiddenProducts: string[]
}

type HandSizeId = 'small' | 'medium' | 'large';

interface ProductTier {
    id: string;
    badge: string | null;
    title: string;
    subtitle: string;
    price: string;
    retailPrice: string | null;
    originalPrice: string | null;
    description: string;
    includes: string[];
    delivery: string;
    backers: number | null;
    remaining: number | null;
    total: number | null;
    highlight: boolean;
}

type AuthUser = {
    email?: string;
    user_metadata?: {
        full_name?: string;
    };
};

function TierPaymentInfo({ tier, isSelected }: { tier: ProductTier; isSelected: boolean }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="mt-3">
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
                className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest transition-colors cursor-pointer ${isSelected ? 'text-black/40 hover:text-black/60' : 'text-white/40 hover:text-white/60'}`}
            >
                <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border text-[8px] ${isSelected ? 'border-black/30' : 'border-white/30'}`}>?</span>
                How does this work?
            </button>
            {open && (
                <div className={`mt-3 p-4 border text-xs leading-relaxed ${isSelected ? 'border-black/10 bg-black/[0.03] text-black/60' : 'border-white/10 bg-white/[0.04] text-white/60'}`}>
                    <div className="flex flex-col gap-2.5">
                        <div className="flex gap-2.5">
                            <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${isSelected ? 'bg-black text-white' : 'bg-white text-black'}`}>1</span>
                            <span>Pay <strong>{tier.price}</strong> today to lock in your Founder&apos;s price and secure your Batch 1 slot.</span>
                        </div>
                        <div className="flex gap-2.5">
                            <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${isSelected ? 'bg-black text-white' : 'bg-white text-black'}`}>2</span>
                            <span>We&apos;ll email you before your piano ships to collect the remaining balance.</span>
                        </div>
                        <div className="flex gap-2.5">
                            <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${isSelected ? 'bg-black text-white' : 'bg-white text-black'}`}>3</span>
                            <span>Full refund available anytime before your piano ships — no questions asked.</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function CustomizeClient({ urls, hiddenProducts }: CustomizeClientProps) {
    const searchParams = useSearchParams();
    const analytics = useAnalytics();

    // --- STATE ---
    const [appState, setAppState] = useState({
        product: 'one' as 'one' | 'pro',
        handSpan: null as string | null,
        size: null as string | null,
        color: null as string | null,
        selectedTier: null as string | null,
    });

    const [discountCode, setDiscountCode] = useState<string | null>(null);
    const [discountDismissed, setDiscountDismissed] = useState(false);

    useEffect(() => {
        const promo = searchParams.get("discount");
        if (promo) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage is only readable after hydration
            setDiscountCode(promo);
            sessionStorage.setItem("dp_vip_discount", promo);
        } else {
            const saved = sessionStorage.getItem("dp_vip_discount");
            if (saved) setDiscountCode(saved);
        }
    }, [searchParams]);

    const [currentSection, setCurrentSection] = useState(0);
    const [isSizingModalOpen, setIsSizingModalOpen] = useState(false);
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    const [policyUrl, setPolicyUrl] = useState("");

    // Save My Build modal state
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [saveEmail, setSaveEmail] = useState("");
    const [saveLoading, setSaveLoading] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState("");

    // Sizing Tool State
    const [sliderValue, setSliderValue] = useState(50);
    const [customerCount, setCustomerCount] = useState(208); // Real backer count
    const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
    const [countDownDate, setCountDownDate] = useState<number | null>(null);

    // Auth & Urgency Widget State
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [showRegisterGate, setShowRegisterGate] = useState(false);
    const [widgetTimeLeft, setWidgetTimeLeft] = useState(12 * 60);
    const [showWidget, setShowWidget] = useState(true);


    const sectionRefs = useRef<(HTMLElement | null)[]>([]);
    const oneProTargetDeliveryDate = formatOneProTargetDeliveryDate();

    // --- PRODUCT CATALOG (static data, shared across all checkout flows) ---
    const PRODUCT_CATALOG: Record<string, ProductTier> = {
        reservation: {
            id: 'reservation',
            badge: null as string | null,
            title: "Lock My Spot",
            subtitle: "Batch 1 — August 2027",
            price: "$99",
            retailPrice: null as string | null,
            originalPrice: null as string | null,
            description: "100% refundable reservation. Lock in Founder\u0027s pricing and secure your Batch 1 (August 2027) delivery. Pay the remaining balance only when your piano is boxed and ready to ship.",
            includes: ["Batch 1 Delivery Slot", "Founder\u0027s Price Lock", "Full Refund Anytime"],
            delivery: "Aug 2027",
            backers: 0,
            remaining: 50,
            total: 50,
            highlight: false,
        },
        reserve50: {
            id: 'reserve50',
            badge: null as string | null,
            title: "Reserve (50%)",
            subtitle: "",
            price: "$499",
            retailPrice: null as string | null,
            originalPrice: null as string | null,
            description: "Pay 50% now ($499), the rest ($500 + shipping/taxes) when ready to ship.",
            includes: ["DreamPlay One Keyboard"],
            delivery: "Aug 2027",
            backers: 2,
            remaining: 8,
            total: 10,
            highlight: false,
        },
        solo: {
            id: 'solo',
            badge: null as string | null,
            title: "DreamPlay One",
            subtitle: "50% Now · 50% At Delivery",
            price: "$499",
            retailPrice: "$999.00" as string | null,
            originalPrice: null as string | null,
            description: "Pay $499 today to secure your spot. The remaining $500 is charged only when your piano is boxed and ready to ship. Available in DS5.5, DS6.0, or DS6.5 — Midnight Black or Pearl White.",
            includes: ["DreamPlay One Keyboard"],
            delivery: "Aug 2027",
            backers: 40,
            remaining: 10,
            total: 50,
            highlight: false,
        },
        full: {
            id: 'full',
            badge: "Most Popular",
            title: "DreamPlay Premium Bundle",
            subtitle: "50% Now · 50% At Delivery",
            price: "$549",
            retailPrice: "$1,099.00" as string | null,
            originalPrice: null as string | null,
            description: "Pay $549 today to secure your spot. The remaining $550 is charged only when your piano is boxed and ready to ship. Includes stand, bench, and pedal.",
            includes: ["DreamPlay One Keyboard", "Keyboard Stand", "Sustain Pedal", "Padded Bench"],
            delivery: "Aug 2027",
            backers: 208,
            remaining: 42,
            total: 250,
            highlight: true,
        },
        pro_solo: {
            id: 'pro_solo',
            badge: null as string | null,
            title: "DreamPlay One Pro",
            subtitle: "Keyboard only",
            price: "$1,899",
            retailPrice: null as string | null,
            originalPrice: null as string | null,
            description: "DreamPlay One Pro keyboard in DS5.5 or DS6.0, available in Nightmare Black or Aztec Gold.",
            includes: ["DreamPlay One Pro 88-key keyboard", "Sustain pedal", "DreamPlay Learn app (lifetime access)", "Power adapter and USB-C cable"],
            delivery: oneProTargetDeliveryDate,
            backers: null,
            remaining: null,
            total: null,
            highlight: false,
        },
        pro_full: {
            id: 'pro_full',
            badge: "Flagship",
            title: "DreamPlay One Pro Premium Bundle",
            subtitle: "Keyboard · Stand · Triple pedal · Bench",
            price: "$1,999",
            retailPrice: null as string | null,
            originalPrice: null as string | null,
            description: "DreamPlay One Pro with the matched furniture stand, triple pedal unit, and padded bench.",
            includes: ["DreamPlay One Pro 88-key keyboard", "Matched furniture stand", "Triple pedal unit", "Padded bench", "DreamPlay Learn app (lifetime access)"],
            delivery: oneProTargetDeliveryDate,
            backers: null,
            remaining: null,
            total: null,
            highlight: true,
        },
    };

    // --- BUILD VISIBLE TIERS ---
    // Always use static PRODUCT_CATALOG filtered by hiddenProducts
    const tiers = (() => {
        const defaultOrder = appState.product === 'pro'
            ? ['pro_solo', 'pro_full']
            : ['reservation', 'reserve50', 'solo', 'full'];
        return defaultOrder
            .filter(id => appState.product === 'pro' || !hiddenProducts.includes(id))
            .map(id => PRODUCT_CATALOG[id])
            .filter((tier): tier is ProductTier => tier !== undefined);
    })();

    const keyboards = {
        'DS5.5': {
            name: 'DS5.5',
            tagline: '7/8ths Size',
            description: 'Designed for pianists with hands under 7.6 inches. Play octaves and 9ths with ease.',
            zone: 'Zone A',
            imgSrc: '/images/keyboards/ds55-white-narrow-keys-alt.png'
        },
        'DS6.0': {
            name: 'DS6.0',
            tagline: '15/16ths Size',
            description: 'Designed for pianists with hands between 7.6 and 8.5 inches. Play octaves effortlessly.',
            zone: 'Zone B',
            imgSrc: '/images/keyboards/DS6.0-Black-transparent v2.png'
        },
        'DS6.5': {
            name: 'DS6.5',
            tagline: 'Standard Size',
            description: 'For the small percentage with larger hands. Conventional sizing.',
            zone: 'Zone C',
            imgSrc: '/images/keyboards/ds65-black-standard-digital-piano.png'
        }
    };

    const productOptions = [
        {
            id: 'one' as const,
            title: 'DreamPlay One',
            subtitle: 'The core ergonomic instrument',
            detail: 'Midnight Black or Pearl White',
        },
        {
            id: 'pro' as const,
            title: 'DreamPlay One Pro',
            subtitle: 'The flagship DreamPlay tier',
            detail: 'Nightmare Black or Aztec Gold',
        },
    ];

    const finishOptions = appState.product === 'pro'
        ? [
            {
                id: 'Nightmare Black',
                title: 'Nightmare Black',
                description: 'The dark flagship Pro finish.',
                swatch: '#0a0a0a',
                image: '/images/pro/nightmare-black-angled.png',
                background: '#111111',
            },
            {
                id: 'Aztec Gold',
                title: 'Aztec Gold',
                description: 'The gold-toned flagship Pro finish.',
                swatch: '#c5a059',
                image: '/images/pro/aztec-gold.jpg',
                background: '#f2eee4',
            },
        ]
        : [
            {
                id: 'Black',
                title: 'Midnight Black',
                description: 'Classic elegance with a sophisticated matte finish. Commands presence on any stage.',
                swatch: '#000000',
                image: '/images/keyboards/ds65-black-standard-digital-piano.png',
                background: '#e5e5e5',
            },
            {
                id: 'White',
                title: 'Pearl White',
                description: 'Modern aesthetic with a pristine glossy finish. A striking centerpiece for any studio.',
                swatch: '#ffffff',
                image: '/images/keyboards/ds55-white-narrow-keys-alt.png',
                background: '#ffffff',
            },
        ];

    const availableKeyboards = Object.entries(keyboards).filter(([key]) => appState.product === 'one' || key !== 'DS6.5');
    const selectedProductName = appState.product === 'pro' ? 'DreamPlay One Pro' : 'DreamPlay One';
    const selectedFinishLabel = finishOptions.find(option => option.id === appState.color)?.title || '—';

    // --- EFFECTS ---
    useEffect(() => {
        const productParam = searchParams.get("product");
        const packageParam = searchParams.get("package");

        if (productParam !== 'pro') return;

        // eslint-disable-next-line react-hooks/set-state-in-effect -- legacy behavior: sync product selection from URL params on mount
        setAppState(prev => {
            const packageId = packageParam === 'pro_full' || packageParam === 'pro_solo'
                ? packageParam
                : prev.selectedTier?.startsWith('pro_')
                    ? prev.selectedTier
                    : null;

            return {
                ...prev,
                product: 'pro',
                size: prev.size === 'DS6.5' ? 'DS6.0' : prev.size,
                color: prev.color === 'Nightmare Black' || prev.color === 'Aztec Gold' ? prev.color : 'Nightmare Black',
                selectedTier: packageId,
            };
        });
    }, [searchParams]);

    useEffect(() => {
        const handleScroll = () => {
            const scrollPos = window.scrollY + window.innerHeight / 2;
            sectionRefs.current.forEach((section, index) => {
                if (!section) return;
                const rect = section.getBoundingClientRect();
                const top = rect.top + window.scrollY;
                const bottom = top + rect.height;
                if (scrollPos >= top && scrollPos < bottom) {
                    setCurrentSection(index);
                }
            });
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        getCountdownDate().then((dateStr) => {
            const target = dateStr ? new Date(dateStr).getTime() : new Date("2026-01-19T21:00:00-08:00").getTime();
            setCountDownDate(target);
        });
    }, []);

    useEffect(() => {
        if (!countDownDate) return;
        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = countDownDate - now;
            if (distance < 0) {
                setCountdown({ days: 0, hours: 0, mins: 0, secs: 0 });
                return;
            }
            setCountdown({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                secs: Math.floor((distance % (1000 * 60)) / 1000)
            });
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [countDownDate]);

    useEffect(() => {
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                window.location.reload();
            }
        };
        window.addEventListener('pageshow', handlePageShow);
        return () => window.removeEventListener('pageshow', handlePageShow);
    }, []);

    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth) * 100;
            const y = (e.clientY / window.innerHeight) * 100;
            setMousePos({ x, y });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem("dp_user_email");
        // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after hydration
        if (saved) setSaveEmail(saved);

        const fetchUser = async () => {
            const supabase = createBrowserClient();
            const { data } = await supabase.auth.getUser();
            if (data.user) {
                setAuthUser(data.user);
            }
            // No more register gate for discount users — let them browse freely
            setAuthChecked(true);
        };
        fetchUser();
    }, [searchParams]);

    // 12-minute urgency timer
    useEffect(() => {
        if (!authUser) return;

        const storedEnd = sessionStorage.getItem("dp_fs_timer_end");
        let endTime: number;

        if (storedEnd) {
            endTime = parseInt(storedEnd, 10);
        } else {
            endTime = Date.now() + 12 * 60 * 1000;
            sessionStorage.setItem("dp_fs_timer_end", endTime.toString());
        }

        const timer = setInterval(() => {
            const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
            setWidgetTimeLeft(remaining);
        }, 1000);

        return () => clearInterval(timer);
    }, [authUser]);

    const formatWidgetTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // --- HELPERS ---
    const scrollToSection = (index: number) => {
        const section = sectionRefs.current[index];
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const getRealValue = (percent: number) => {
        const visualZoneA_End = 33.33;
        const visualZoneB_End = 66.66;
        if (percent <= visualZoneA_End) return 6.0 + (percent / visualZoneA_End) * (7.6 - 6.0);
        else if (percent <= visualZoneB_End) {
            const relativeP = (percent - visualZoneA_End) / (visualZoneB_End - visualZoneA_End);
            return 7.6 + relativeP * (8.5 - 7.6);
        } else {
            const relativeP = (percent - visualZoneB_End) / (100 - visualZoneB_End);
            return 8.5 + relativeP * (10.0 - 8.5);
        }
    };

    const getSizingResult = (realVal: number) => {
        if (realVal < 7.6) {
            return { zone: 'A', rangeText: 'Hand span range: under 7.6 inches', model: 'DS5.5', desc: "Standard keys are physically too wide for you.", reach: 'Finally play 10ths comfortably' };
        } else if (realVal <= 8.5) {
            return { zone: 'B', rangeText: 'Hand span range: 7.6 to 8.5 inches', model: 'DS6.0', desc: "The perfect fit. Slightly narrower than standard.", reach: 'Play 10ths with new ease' };
        } else {
            return { zone: 'C', rangeText: 'Hand span range: above 8.5 inches', model: 'DS6.5', desc: 'You fit the historical standard.', reach: 'Master standard repertoire' };
        }
    };

    // --- ACTIONS ---
    const handleSelectProduct = (product: 'one' | 'pro') => {
        setAppState(prev => {
            const isPro = product === 'pro';
            const colorIsValid = isPro
                ? prev.color === 'Nightmare Black' || prev.color === 'Aztec Gold'
                : prev.color === 'Black' || prev.color === 'White';

            return {
                ...prev,
                product,
                size: isPro && prev.size === 'DS6.5' ? 'DS6.0' : prev.size,
                color: colorIsValid ? prev.color : isPro ? 'Nightmare Black' : 'Black',
                selectedTier: null,
            };
        });
    };

    // "Info entered" scoring event (D11): first real configurator interaction
    // this session — the visitor is actively speccing a keyboard.
    const infoEnteredSent = useRef(false);
    const markInfoEntered = () => {
        if (infoEnteredSent.current) return;
        infoEnteredSent.current = true;
        void analytics.track('checkout_info_entered', { source: 'customize' });
    };

    const handleSelectHandSize = (size: 'small' | 'medium' | 'large') => {
        const sizeMap = {
            small: 'DS5.5',
            medium: 'DS6.0',
            large: appState.product === 'pro' ? 'DS6.0' : 'DS6.5',
        };
        markInfoEntered();
        setAppState(prev => ({ ...prev, handSpan: size, size: sizeMap[size] }));
        setTimeout(() => scrollToSection(2), 300);
    };

    const handleSelectSize = (size: string) => {
        markInfoEntered();
        setAppState(prev => ({ ...prev, size }));
        setTimeout(() => scrollToSection(3), 300);
    };

    const handleSelectColor = (color: string) => {
        markInfoEntered();
        setAppState(prev => ({ ...prev, color }));
        setTimeout(() => scrollToSection(4), 300);
    };

    const handleSelectTier = (tierId: string) => {
        setAppState(prev => ({ ...prev, selectedTier: tierId }));

        if (['full', 'reservation', 'reserve50', 'solo', 'pro_solo', 'pro_full'].includes(tierId)) {
            // Never silently default the variant. The customer must explicitly pick a
            // size and finish so the Shopify order always matches what they chose —
            // otherwise scrolling straight to Reserve would lock in DS6.0 / Black by
            // accident (the cause of mis-sized orders).
            if (!appState.size) {
                alert('Please choose your key size before reserving.');
                scrollToSection(2);
                return;
            }
            if (!appState.color) {
                alert('Please choose your finish before reserving.');
                scrollToSection(3);
                return;
            }
            const size = appState.product === 'pro' && appState.size === 'DS6.5'
                ? 'DS6.0'
                : appState.size;
            const color = appState.color;

            // Variant lookup: journey product variantId > VARIANT_MAP[tier][size][color]
            const exactVariantId = VARIANT_MAP[tierId]?.[size]?.[color] || "";

            let checkoutUrl = "";

            if (exactVariantId && exactVariantId.trim() !== '') {
                const noteParts = ['checkout_source:customize'];
                if (appState.product === 'pro') {
                    noteParts.push(`target_delivery:${oneProTargetDeliveryDate}`);
                }
                // Variant + session survive into the Shopify order note so the
                // orders webhook can attribute the purchase (D11).
                noteParts.push(...abCheckoutNoteParts(analytics.getSessionId()));
                let permalink = `/cart/${exactVariantId}:1?note=${encodeURIComponent(noteParts.join(' | '))}`;

                // Append discount code from URL params or sessionStorage (email links)
                if (discountCode) {
                    permalink += `&discount=${discountCode}`;
                }

                checkoutUrl = `https://dreamplay-pianos.myshopify.com/cart/clear?return_to=${encodeURIComponent(permalink)}`;

            } else if (appState.product === 'pro') {
                alert('This DreamPlay One Pro configuration is not available for checkout yet. Please choose a listed Pro size and finish.');
                return;
            } else {
                // FALLBACK: Admin Panel URL variables
                const sizeParam = encodeURIComponent(size);
                const colorParam = encodeURIComponent(color);
                const propertiesParams = `&properties[Size]=${sizeParam}&properties[Finish]=${colorParam}`;

                const getCheckoutUrl = (configValue: string | undefined, defaultId: string) => {
                    const val = configValue?.trim();
                    if (val && /^\d+$/.test(val)) return `https://dreamplay-pianos.myshopify.com/cart/add?id=${val}&quantity=1&return_to=/checkout`;
                    if (val) return val;
                    if (defaultId) return `https://dreamplay-pianos.myshopify.com/cart/add?id=${defaultId}&quantity=1&return_to=/checkout`;
                    return "";
                }

                let baseUrl = "";
                if (tierId === 'full') baseUrl = getCheckoutUrl(urls.bundle, "52209394549050");
                else if (tierId === 'reservation') baseUrl = getCheckoutUrl(urls.reservation, "52213397291322");
                else if (tierId === 'reserve50') baseUrl = getCheckoutUrl(urls.reservation, "");
                else if (tierId === 'solo') baseUrl = getCheckoutUrl(urls.solo, "");


                if (baseUrl) {
                    const separator = baseUrl.includes('?') ? '&' : '?';
                    const finalParams = separator === '?' ? propertiesParams.substring(1) : propertiesParams;
                    checkoutUrl = baseUrl + (baseUrl.includes('?') ? propertiesParams : `?${finalParams}`);

                    const fallbackNote = ['checkout_source:customize', ...abCheckoutNoteParts(analytics.getSessionId())];
                    checkoutUrl += `&note=${encodeURIComponent(fallbackNote.join(' | '))}`;

                    if (discountCode) {
                        checkoutUrl += `&discount=${discountCode}`;
                    }
                }
            }

            if (checkoutUrl) {
                // Fire-and-forget (keepalive) — survives the navigation below.
                void analytics.track('begin_checkout', {
                    checkout_source: 'customize',
                    tier: tierId,
                    product: appState.product,
                    size,
                    color,
                });
                trackEmailConversion('conversion_t2', window.location.pathname);
                window.location.assign(checkoutUrl);
            }
        }
    };

    // --- SAVE MY BUILD HANDLER ---
    const handleSaveBuild = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveLoading(true);
        setSaveError("");

        try {
            const res = await subscribeToNewsletter({
                email: saveEmail,
                first_name: "",
                tags: ["Saved Build", ...WAITLIST_OFFER_TAGS],
            });

            if (!res.success) {
                throw new Error(res.error || "Failed to save");
            }

            localStorage.setItem("dp_v2_subscribed", "true");
            localStorage.setItem("dp_user_email", saveEmail);
            if (res.id) localStorage.setItem("dp_subscriber_id", res.id);
            setSaveSuccess(true);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
            console.error(error);
            setSaveError(message);
        } finally {
            setSaveLoading(false);
        }
    };

    const handleSubmitWaitlist = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const email = (form.elements.namedItem('email') as HTMLInputElement).value;
        const fullName = (form.elements.namedItem('full-name') as HTMLInputElement).value;

        localStorage.setItem("dp_user_email", email);

        const ACTION_URL = 'https://dreamplaypianos.us12.list-manage.com/subscribe/post?u=90fbaa21ba86eecae78c767a8&id=cc37fd2637&f_id=00c46be9f0';
        const iframeName = 'mc_iframe_' + Date.now();
        const iframe = document.createElement('iframe');
        iframe.name = iframeName;
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        const hiddenForm = document.createElement('form');
        hiddenForm.action = ACTION_URL;
        hiddenForm.method = 'POST';
        hiddenForm.target = iframeName;

        const payload = {
            'EMAIL': email,
            'FNAME': fullName,
            'DP1SIZE': appState.size || 'Not Selected',
            'DP1FINISH': appState.color || 'Not Selected',
            'DP1TIER': appState.selectedTier || ''
        };

        for (const [key, value] of Object.entries(payload)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            hiddenForm.appendChild(input);
        }

        document.body.appendChild(hiddenForm);
        hiddenForm.submit();

        setTimeout(() => {
            alert('You have been added to the waitlist! Please check your email.');
            document.body.removeChild(hiddenForm);
            document.body.removeChild(iframe);
            form.reset();
        }, 1500);
    }

    const realVal = getRealValue(sliderValue);
    const sizingResult = getSizingResult(realVal);
    const cmVal = (realVal * 2.54).toFixed(1);
    const displayedSizingResult = appState.product === 'pro' && sizingResult.model === 'DS6.5'
        ? {
            ...sizingResult,
            zone: 'B',
            rangeText: `${sizingResult.rangeText}. DreamPlay One Pro checkout currently offers DS6.0 as its largest size.`,
            model: 'DS6.0',
            desc: 'DreamPlay One Pro checkout currently offers DS5.5 and DS6.0.',
        }
        : sizingResult;

    const navSteps = ['Start', 'Measure', 'Size', 'Color', 'Reserve'];
    const handSizeOptions: Array<{
        id: HandSizeId;
        label: string;
        desc: string;
        range: string;
        fullZone: string;
        zoneDesc: string;
        emoji: string;
        dark?: boolean;
    }> = [
        { id: 'small', label: 'Smaller Hands', desc: 'Ideal for women and children', range: '< 7.6 inches', fullZone: 'Zone A', zoneDesc: 'Narrowest Keys · 88 keys', emoji: '🤚', dark: true },
        { id: 'medium', label: 'Average Hands', desc: 'Perfect for most men and women', range: '7.6–8.5 inches', fullZone: 'Zone B', zoneDesc: 'Narrow Keys · 88 keys', emoji: '✋' },
        appState.product === 'pro'
            ? { id: 'large', label: 'Larger Hands', desc: 'Shows the largest Pro size available for checkout', range: '8.5+ inches', fullZone: 'Zone B', zoneDesc: 'Largest Pro size available · 88 keys', emoji: '🖐️', dark: true }
            : { id: 'large', label: 'Larger Hands', desc: 'For the small percentage with larger hands', range: '8.5+ inches', fullZone: 'Zone C', zoneDesc: 'Standard Keys · 88 keys', emoji: '🖐️', dark: true },
    ];

    return (
        <div className="min-h-screen bg-white font-sans text-neutral-900 selection:bg-neutral-200">
            <Navbar forceOpaque={true} darkMode={true} className="border-b border-white/10 bg-[#050505] backdrop-blur-md" />

            {/* --- FIXED FLOATING WIDGETS WRAPPER (below the header) --- */}
            <div className="fixed top-16 left-0 right-0 z-50 flex flex-col pointer-events-none">
                <div className="pointer-events-auto">

                {/* DESKTOP URGENCY WIDGET */}
                {authUser && showWidget && widgetTimeLeft > 0 && (
                    <div className="absolute right-4 md:right-8 top-[140px] z-[60] bg-[#050505] border border-green-500/30 p-5 shadow-2xl max-w-sm hidden md:block" style={{ animation: 'slideInRight 0.5s ease-out' }}>
                        <button onClick={() => setShowWidget(false)} className="absolute top-2 right-2 text-white/40 hover:text-white cursor-pointer">
                            <X size={14} />
                        </button>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="text-green-400 w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-serif text-white text-base font-bold mb-1">
                                    Welcome back, {authUser.user_metadata?.full_name?.split(' ')[0] || authUser.email?.split('@')[0]}
                                </h4>
                                <p className="font-sans text-xs text-white/70 leading-relaxed mb-1">
                                    Your offer has been activated for this purchase. Complete your {selectedProductName} order within the next <strong className="text-green-400 font-mono tracking-tight">{formatWidgetTime(widgetTimeLeft)}</strong>.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* DESKTOP BUILD SUMMARY */}
                {(appState.handSpan || appState.size || appState.color) && (
                    <div className={`absolute right-4 md:right-8 ${authUser && showWidget && widgetTimeLeft > 0 ? 'top-[290px]' : 'top-[140px]'} z-[60] bg-[#050505] border border-white/10 p-5 shadow-2xl max-w-sm hidden md:block transition-all`}>
                        <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3">Your Build So Far</h4>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="font-sans text-xs text-white/50">Product</span>
                                <span className="font-sans text-xs text-white font-medium">
                                    {selectedProductName}
                                </span>
                            </div>
                            <div className="h-px bg-white/5" />
                            <div className="flex items-center justify-between">
                                <span className="font-sans text-xs text-white/50">Hand Size</span>
                                <span className={`font-sans text-xs ${appState.handSpan ? 'text-white font-medium' : 'text-white/20'}`}>
                                    {appState.handSpan === 'small' ? 'Zone A' : appState.handSpan === 'medium' ? 'Zone B' : appState.handSpan === 'large' ? 'Zone C' : '—'}
                                </span>
                            </div>
                            <div className="h-px bg-white/5" />
                            <div className="flex items-center justify-between">
                                <span className="font-sans text-xs text-white/50">Keyboard</span>
                                <span className={`font-sans text-xs ${appState.size ? 'text-white font-medium' : 'text-white/20'}`}>
                                    {appState.size || '—'}
                                </span>
                            </div>
                            <div className="h-px bg-white/5" />
                            <div className="flex items-center justify-between">
                                <span className="font-sans text-xs text-white/50">Finish</span>
                                <span className={`font-sans text-xs ${appState.color ? 'text-white font-medium' : 'text-white/20'}`}>
                                    {selectedFinishLabel}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* FLOATING DISCOUNT CALLOUT — desktop: below build summary, mobile: top-right */}
                {discountCode && !discountDismissed && (() => {
                    const hasBuild = !!(appState.handSpan || appState.size || appState.color);
                    const hasUrgency = !!(authUser && showWidget && widgetTimeLeft > 0);
                    // Desktop top offset: stack below urgency widget + build summary
                    const desktopTop = hasUrgency && hasBuild ? 'md:top-[440px]'
                        : hasBuild ? 'md:top-[290px]'
                        : hasUrgency ? 'md:top-[290px]'
                        : 'md:top-[140px]';
                    return (
                        <div className={`absolute right-3 top-[140px] ${desktopTop} md:right-8 z-[60] transition-all`} style={{ animation: 'slideInRight 0.5s ease-out' }}>
                            <div className="flex items-center gap-3 bg-[#050505] border border-emerald-500/30 px-5 py-4 shadow-2xl max-w-sm">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                                    <CheckCircle2 className="h-[18px] w-[18px] text-emerald-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-sans text-xs font-semibold text-emerald-400 uppercase tracking-wider">Discount Applied</p>
                                    <p className="font-sans text-xs text-white/60 mt-0.5 truncate">
                                        Code <span className="font-mono text-white/90 font-medium">{discountCode}</span> active at checkout
                                    </p>
                                </div>
                                <button onClick={() => setDiscountDismissed(true)} className="shrink-0 p-1 text-white/30 hover:text-white/60 transition-colors cursor-pointer">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    );
                })()}

                </div>
            </div>

            {/* Steps Sub-Navbar — fixed flush below the 64px Navbar */}
            <header id="sticky-nav" className="fixed top-16 left-0 right-0 z-[90] w-full bg-[#050505]/95 backdrop-blur-md border-b border-white/5 shadow-sm">
                <div className="mx-auto max-w-7xl px-4 md:px-6">
                    <div className="flex h-12 md:h-14 items-center justify-between">
                        <div className="hidden md:flex items-center gap-8 text-[10px] uppercase tracking-[0.2em] font-medium text-white/40 mx-auto">
                            {navSteps.map((label, i) => (
                                <React.Fragment key={i}>
                                    <button onClick={() => scrollToSection(i)} className={`flex items-center gap-2 transition-colors cursor-pointer hover:text-white ${currentSection === i ? 'text-white font-bold' : ''}`}>
                                        <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${currentSection === i ? 'border-white bg-white text-black' : 'border-white/20'}`}>{i + 1}</span>
                                        <span>{label}</span>
                                    </button>
                                    {i < 4 && <div className={`h-px w-6 bg-white/10`}></div>}
                                </React.Fragment>
                            ))}
                        </div>
                        <div className="md:hidden text-[10px] uppercase tracking-[0.2em] font-medium text-white mx-auto">
                            Step {currentSection + 1} of 5
                        </div>
                    </div>
                </div>
            </header>


            {/* SECTION 0: HERO (DARK MODE) */}
            <section ref={el => { if (sectionRefs.current) sectionRefs.current[0] = el }} id="section-0" className="relative flex h-screen items-center justify-center overflow-hidden bg-[#050505] pt-16 text-white">
                {/* Subtle blue/white glow tracking mouse */}
                <div
                    className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                    style={{ background: `radial-gradient(1000px circle at ${mousePos.x}% ${mousePos.y}%, rgba(100, 180, 255, 0.15), transparent 40%)` }}
                ></div>

                <div className="relative z-10 mx-auto max-w-4xl px-4 text-center md:px-6">
                    <div className="mb-6 inline-block border border-white/20 bg-white/5 px-4 py-2 font-sans text-[10px] uppercase tracking-[0.3em] text-white/70 backdrop-blur-sm md:mb-8">
                        <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white"></span>
                        {appState.product === 'pro' ? 'DreamPlay One Pro Preorder' : 'Final Units Remaining in Batch 1'}
                    </div>

                    <h1 className="mb-8 font-serif text-5xl leading-tight text-white md:text-7xl lg:text-8xl">
                        Build your<br />
                        <span className="italic text-white/90">{selectedProductName}.</span>
                    </h1>

                    <p className="mx-auto mb-12 max-w-xl font-sans text-sm leading-relaxed text-white/60 md:text-base">
                        In just a few steps, we&apos;ll help you discover the ideal keyboard size and finish for your musical journey.
                    </p>

                    <div className="mx-auto mb-10 grid max-w-3xl gap-3 md:grid-cols-2">
                        {productOptions.map(product => {
                            const isSelected = appState.product === product.id;
                            return (
                                <button
                                    key={product.id}
                                    onClick={() => handleSelectProduct(product.id)}
                                    className={`border p-5 text-left transition-all ${isSelected ? 'border-white bg-white text-black' : 'border-white/15 bg-white/[0.04] text-white hover:border-white/40 hover:bg-white/[0.08]'}`}
                                >
                                    <div className="mb-2 flex items-center justify-between gap-4">
                                        <span className="font-serif text-xl">{product.title}</span>
                                        {isSelected && <Check className="h-4 w-4" />}
                                    </div>
                                    <p className={`font-sans text-xs uppercase tracking-[0.18em] ${isSelected ? 'text-black/50' : 'text-white/45'}`}>{product.subtitle}</p>
                                    <p className={`mt-2 font-sans text-sm ${isSelected ? 'text-black/65' : 'text-white/60'}`}>{product.detail}</p>
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => scrollToSection(1)}
                        className="group mx-auto flex items-center justify-center gap-3 border border-white bg-white px-10 py-5 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-white/90 hover:scale-105 shadow-xl shadow-white/10"
                    >
                        Start Customization
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                </div>
            </section>

            {/* SECTION 1: HAND SIZE (LIGHT MODE) */}
            <section ref={el => { if (sectionRefs.current) sectionRefs.current[1] = el }} id="section-1" className="relative flex min-h-screen flex-col justify-center border-t border-neutral-200 bg-[#f5f5f0] py-24">
                <div className="mx-auto w-full max-w-5xl px-6">
                    <div className="mb-6 text-center mt-12 md:mb-10">
                        <p className="mb-4 font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-400">Step One</p>
                        <h2 className="mb-4 font-serif text-3xl text-neutral-900 md:text-5xl">Select Your Hand Size.</h2>
                        <p className="mx-auto max-w-xl text-sm text-neutral-500 md:text-base">
                            Choose the option that best describes your hand size.{" "}
                            <a href="/about-us/ds-standard" target="_blank" className="inline-flex items-center gap-1 text-[#4a9eff] hover:text-[#4a9eff]/80 transition-colors">
                                <span className="underline">Learn about sizes</span>
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </a>
                        </p>
                    </div>

                    {/* Recommended: Measure Hand Button */}
                    <div className="mb-10 flex justify-center">
                        <button onClick={() => setIsSizingModalOpen(true)} className="group relative flex w-full max-w-md items-center justify-between rounded-xl border border-[#4a9eff]/30 bg-[#4a9eff]/5 p-4 transition-all hover:border-[#4a9eff] hover:bg-[#4a9eff]/10 hover:shadow-lg cursor-pointer">
                            <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4a9eff] text-white">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                </span>
                                <div className="text-left">
                                    <div className="text-xs font-bold uppercase tracking-wider text-[#4a9eff]">Recommended</div>
                                    <div className="text-sm font-medium text-neutral-900 md:text-base">Measure Your Hand Using Our Sizing Tool</div>
                                </div>
                            </div>
                            <span className="text-sm font-semibold text-[#4a9eff] transition-transform group-hover:translate-x-1">→</span>
                        </button>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        {handSizeOptions.map((btn) => {
                            const isSelected = appState.handSpan === btn.id;
                            const isDark = 'dark' in btn && btn.dark;
                            return (
                                <button
                                    key={btn.id}
                                    onClick={() => handleSelectHandSize(btn.id)}
                                    className={`group relative flex flex-col border p-8 text-center transition-all duration-300 md:p-10 cursor-pointer ${isDark
                                        ? isSelected
                                            ? 'border-white/30 bg-[#050505] shadow-xl z-10'
                                            : 'border-neutral-800 bg-[#050505] shadow-md hover:border-neutral-600 hover:shadow-xl'
                                        : isSelected
                                            ? 'border-black bg-white shadow-xl z-10'
                                            : 'border-neutral-200 bg-white/80 shadow-md hover:border-neutral-400 hover:shadow-xl hover:bg-white'
                                        }`}
                                >
                                    {isSelected && (
                                        <div className={`absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                                            <Check className="h-3 w-3" />
                                        </div>
                                    )}

                                    {/* Emoji */}
                                    <div className="mb-4 flex justify-center">
                                        <span className={`-scale-x-100 inline-block text-3xl transition-all duration-300 md:text-4xl ${isSelected ? 'grayscale-0 opacity-100' : 'opacity-50 grayscale group-hover:opacity-80 group-hover:grayscale-0'}`} role="img" aria-label={btn.label}>{btn.emoji}</span>
                                    </div>

                                    {/* Label & Description */}
                                    <h3 className={`mb-2 font-serif text-xl md:text-2xl ${isDark ? 'text-white' : 'text-neutral-900'}`}>{btn.label}</h3>
                                    <p className={`min-h-[44px] mb-3 font-sans text-sm leading-relaxed ${isDark
                                        ? isSelected ? 'text-white/70' : 'text-white/50'
                                        : isSelected ? 'text-black/60' : 'text-neutral-500'
                                        }`}>{btn.desc}</p>

                                    {/* Hand Span */}
                                    <p className={`mb-6 font-sans text-sm ${isDark ? 'text-white/40' : 'text-neutral-400'}`}>{btn.range}</p>

                                    {/* Zone Label — prominent */}
                                    <div className={`w-full border-t pt-5 ${isDark
                                        ? isSelected ? 'border-white/20' : 'border-white/10'
                                        : isSelected ? 'border-black/15' : 'border-gray-200'
                                        }`}>
                                        <span className={`font-serif text-2xl ${isDark ? 'text-white' : 'text-neutral-900'}`}>{btn.fullZone}</span>
                                        <p className={`mt-1.5 font-sans text-xs ${isDark
                                            ? isSelected ? 'text-white/50' : 'text-white/40'
                                            : isSelected ? 'text-black/40' : 'text-neutral-400'
                                            }`}>{btn.zoneDesc}</p>
                                    </div>

                                    {/* Select Button */}
                                    <div className={`mt-6 flex w-full items-center justify-center gap-2 border px-6 py-4 font-sans text-xs uppercase tracking-widest transition-colors ${isDark
                                        ? isSelected
                                            ? 'border-white bg-white text-black'
                                            : 'border-white/20 text-white group-hover:border-white group-hover:bg-white group-hover:text-black'
                                        : isSelected
                                            ? 'border-black bg-black text-white'
                                            : 'border-black/20 text-neutral-900 group-hover:border-black group-hover:bg-black group-hover:text-white'
                                        }`}>
                                        {isSelected ? 'Selected' : 'Select'}
                                        {!isSelected && <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />}
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    <p className="mt-6 text-center text-sm text-neutral-400">
                        We recommend the {appState.size || '...'} for your hand size.
                    </p>
                    {appState.product === 'pro' && (
                        <p className="mt-2 text-center text-xs text-neutral-400">
                            DreamPlay One Pro checkout currently offers DS5.5 and DS6.0.
                        </p>
                    )}
                </div>
            </section>

            {/* SECTION 2: RECOMMENDATION (DARK MODE) */}
            <section ref={el => { if (sectionRefs.current) sectionRefs.current[2] = el }} id="section-2" className="relative flex min-h-screen flex-col justify-center bg-[#0a0a0f] py-24 text-white">
                <div className="mx-auto w-full max-w-6xl px-6">
                    <button onClick={() => scrollToSection(1)} className="mb-12 flex items-center gap-2 font-sans text-xs uppercase tracking-widest text-white/50 transition-colors hover:text-white">
                        <ArrowLeft className="h-3 w-3" /> Back
                    </button>

                    <div className="mb-16 text-center">
                        <p className="mb-4 font-sans text-[10px] uppercase tracking-[0.3em] text-white/50">Step Two</p>
                        <h2 className="mb-6 font-serif text-3xl text-white md:text-5xl">Your Recommended Size.</h2>
                        <p className="mx-auto max-w-xl font-sans text-sm text-white/60">
                            Based on your hand span, we recommend the {appState.size || 'DS6.0'}.
                        </p>
                    </div>

                    <div className={`grid gap-6 ${appState.product === 'pro' ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
                        {availableKeyboards.map(([key, kb]) => {
                            const isSelected = key === appState.size;
                            const isRecommended = key === appState.size;
                            const isLight = key === 'DS5.5' || key === 'DS6.5';
                            return (
                                <button
                                    key={key}
                                    onClick={() => handleSelectSize(key)}
                                    className={`group relative flex flex-col items-start border text-left transition-all duration-300 ${isLight
                                        ? isSelected
                                            ? 'z-10 scale-105 border-black bg-white shadow-2xl shadow-black/30'
                                            : 'border-black/15 bg-white shadow-lg shadow-black/10 hover:border-black/40 hover:shadow-xl'
                                        : isSelected
                                            ? 'z-10 scale-105 border-white bg-white/10 shadow-2xl shadow-black/60'
                                            : 'border-white/30 bg-white/5 shadow-lg shadow-black/50 hover:border-white/50 hover:bg-white/10'
                                        }`}
                                >
                                    {isRecommended && (
                                        <div className={`absolute left-6 top-6 z-10 border px-3 py-1 font-sans text-[9px] uppercase tracking-[0.2em] backdrop-blur-md ${isLight
                                            ? isSelected ? 'border-black/20 bg-black/80 text-white' : 'border-black/20 bg-black/70 text-white'
                                            : isSelected ? 'border-white/20 bg-white/50 text-black' : 'border-white/20 bg-black/50 text-white'
                                            }`}>
                                            Recommended
                                        </div>
                                    )}

                                    {/* Image Container */}
                                    <div className={`relative flex h-64 w-full items-center justify-center border-b p-8 transition-colors md:h-72 ${isLight
                                        ? isSelected ? 'border-black/15 bg-neutral-100' : 'border-black/10 bg-neutral-50'
                                        : isSelected ? 'border-white/30 bg-black/30' : 'border-white/15 bg-black/15'
                                        }`}>
                                        <Image src={kb.imgSrc} alt={kb.name} width={600} height={400} className="w-auto max-w-[90%] max-h-[80%] object-contain transition-transform duration-700 group-hover:scale-105" />
                                    </div>

                                    <div className="flex w-full flex-1 flex-col p-8 md:p-10">
                                        <h3 className={`mb-2 font-serif text-2xl md:text-3xl ${isLight ? 'text-black' : 'text-white'}`}>{key}</h3>
                                        <p className={`mb-6 font-sans text-[10px] uppercase tracking-widest ${isLight ? 'text-black/50' : 'text-white/50'}`}>{kb.tagline}</p>

                                        <p className={`mb-8 flex-1 font-sans text-sm leading-relaxed ${isLight ? 'text-black/60' : 'text-white/60'}`}>{kb.description}</p>

                                        <div className={`mb-8 flex w-full justify-between border-t pt-6 ${isLight ? 'border-black/10' : 'border-white/10'}`}>
                                            <div>
                                                <div className={`font-serif text-xl ${isLight ? 'text-black' : 'text-white'}`}>88</div>
                                                <div className={`mt-1 font-sans text-[10px] uppercase tracking-widest ${isLight ? 'text-black/40' : 'text-white/40'}`}>Keys</div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`font-serif text-xl ${isLight ? 'text-black' : 'text-white'}`}>{key === 'DS5.5' ? 'Narrowest' : key === 'DS6.0' ? 'Narrow' : 'Standard'}</div>
                                                <div className={`mt-1 font-sans text-[10px] uppercase tracking-widest ${isLight ? 'text-black/40' : 'text-white/40'}`}>Key Width</div>
                                            </div>
                                        </div>

                                        <div className={`mt-auto flex w-full items-center justify-center gap-2 border px-6 py-4 text-center font-sans text-xs uppercase tracking-widest transition-colors ${isLight
                                            ? isSelected ? 'border-black bg-black text-white hover:bg-black/90' : 'border-black/30 text-black group-hover:border-black group-hover:bg-black group-hover:text-white'
                                            : isSelected ? 'border-white bg-white text-black hover:bg-white/90' : 'border-white/30 text-white group-hover:border-white group-hover:bg-white/10'
                                            }`}>
                                            {isSelected ? 'Selected' : 'Select Size'}
                                            {!isSelected && <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />}
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                    <div className="mt-12 text-center">
                        <button onClick={() => { setPolicyUrl("/information-and-policies/shipping"); setIsPolicyModalOpen(true); }} className="font-sans text-[10px] uppercase tracking-widest text-white/40 underline underline-offset-4 transition-colors hover:text-white/80">
                            Unsure? We have a flexible change policy.
                        </button>
                    </div>
                </div>
            </section>

            {/* SECTION 3: FINISH (LIGHT GRAY MODE) */}
            <section ref={el => { if (sectionRefs.current) sectionRefs.current[3] = el }} id="section-3" className="journey-section relative flex min-h-screen flex-col justify-center bg-[#f5f5f0] py-24 text-black">
                <div className="mx-auto w-full max-w-5xl px-6">
                    <button onClick={() => scrollToSection(2)} className="mb-12 flex items-center gap-2 font-sans text-xs uppercase tracking-widest text-black/50 transition-colors hover:text-black">
                        <ArrowLeft className="h-3 w-3" /> Back
                    </button>

                    <div className="mb-16 text-center">
                        <p className="mb-4 font-sans text-[10px] uppercase tracking-[0.3em] text-black/50">Step Three</p>
                        <h2 className="font-serif text-3xl text-black md:text-5xl">Choose Your Finish.</h2>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        {finishOptions.map(finish => {
                            const isSelected = appState.color === finish.id;
                            return (
                                <button
                                    key={finish.id}
                                    onClick={() => handleSelectColor(finish.id)}
                                    className={`group relative flex flex-col overflow-hidden border text-left transition-all duration-300 ${isSelected ? 'border-black bg-white z-10 scale-105 shadow-xl' : 'border-black/10 bg-white shadow-lg hover:border-black/30 hover:shadow-xl'
                                        }`}
                                >
                                    {isSelected && (
                                        <div className="absolute right-6 top-6 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white shadow-lg">
                                            <Check className="h-4 w-4" />
                                        </div>
                                    )}
                                    <div className={`relative flex h-72 w-full items-center justify-center border-b p-8 transition-colors duration-500 ${isSelected ? 'border-black/20' : 'border-black/10'}`} style={{ backgroundColor: finish.background }}>
                                        <Image src={finish.image} alt={finish.title} width={800} height={500} className="h-auto w-full max-h-full object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-105" />
                                    </div>
                                    <div className="flex w-full flex-1 flex-col p-8 md:p-10">
                                        <div className="mb-4 flex items-center gap-4">
                                            <div className={`h-6 w-6 rounded-full border ${isSelected ? 'border-black/50' : 'border-black/20'}`} style={{ backgroundColor: finish.swatch }}></div>
                                            <h3 className="font-serif text-2xl text-black">{finish.title}</h3>
                                        </div>
                                        <p className="mb-8 flex-1 font-sans text-sm leading-relaxed text-black/70">{finish.description}</p>

                                        <div className={`mt-auto w-full border py-4 text-center font-sans text-xs uppercase tracking-widest transition-colors ${isSelected ? 'border-black bg-black text-white' : 'border-black/30 text-black group-hover:border-black group-hover:bg-black/10'
                                            }`}>
                                            {isSelected ? 'Selected' : 'Choose Finish'}
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* SECTION 4: PRICING / RESERVE (DARK MODE) */}
            <section ref={el => { if (sectionRefs.current) sectionRefs.current[4] = el }} id="section-4" className="journey-section relative flex min-h-screen flex-col justify-center bg-[#0a0a0f] py-24 text-white">
                <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
                    <button onClick={() => scrollToSection(3)} className="mb-12 flex items-center gap-2 font-sans text-xs uppercase tracking-widest text-white/50 transition-colors hover:text-white">
                        <ArrowLeft className="h-3 w-3" /> Back
                    </button>

                    <div className="mb-16 max-w-2xl text-left">
                        <p className="mb-4 font-sans text-[10px] uppercase tracking-[0.3em] text-white/50">Final Step</p>
                        <h2 className="mb-4 font-serif text-4xl leading-tight text-white md:text-5xl lg:text-6xl text-balance">Reserve your {selectedProductName}.</h2>
                        <div className="flex items-center gap-2 font-sans text-sm text-white/60">
                            <ShieldCheck className="h-4 w-4" /> {appState.product === 'pro' ? 'Choose the Pro size, finish, and package that suits you.' : 'Ships worldwide. Choose the size and color that suits you.'}
                        </div>
                    </div>



                    {appState.product === 'one' && <DynamicProductionTimeline />}

                    <div className={`grid gap-6 md:grid-cols-2 ${appState.product === 'pro' ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
                        {tiers.map(tier => {
                            const isSelected = appState.selectedTier === tier.id;
                            const isHighlight = tier.highlight;
                            const isOneProTier = tier.id.startsWith('pro_');
                            const showProgress =
                                typeof tier.backers === 'number' &&
                                typeof tier.remaining === 'number' &&
                                typeof tier.total === 'number' &&
                                tier.total > 0;
                            const progressPercent = showProgress ? ((tier.total! - tier.remaining!) / tier.total!) * 100 : 0;

                            return (
                                <div
                                    key={tier.id}
                                    className={`relative flex flex-col border p-8 text-left transition-all md:p-10 overflow-visible ${isHighlight
                                            ? "border-white/30 bg-white/10 shadow-lg"
                                            : "border-white/10 bg-white/5 shadow-lg"
                                        }`}
                                >

                                    {/* Original Badge */}
                                    {tier.badge && (
                                        <span className="absolute -top-3 left-6 px-4 py-1 font-sans text-[10px] uppercase tracking-[0.3em] font-bold bg-white text-black">
                                            {tier.badge}
                                        </span>
                                    )}

                                    <h3 className={`w-full font-serif text-xl md:text-2xl ${isSelected ? 'text-black' : 'text-white'} ${tier.badge ? 'mt-2' : ''}`}>
                                        {tier.title}
                                    </h3>
                                    <p className={`mt-1 w-full font-sans text-[10px] uppercase tracking-wider ${isSelected ? 'text-black/40' : 'text-white/50'}`}>
                                        {tier.subtitle}
                                    </p>

                                    <div className="mt-6 flex w-full flex-col">
                                        {tier.retailPrice && (
                                            <p className={`font-sans text-[10px] uppercase tracking-[0.2em] mb-1 ${isSelected ? 'text-black/40' : 'text-white/40'}`}>
                                                Founder&apos;s Price
                                            </p>
                                        )}
                                        <div className="flex items-baseline gap-3">
                                            <span className={`font-serif text-4xl md:text-5xl ${isSelected ? 'text-black' : 'text-white'}`}>{tier.price}</span>
                                            {tier.originalPrice && (
                                                <span className={`text-lg line-through ${isSelected ? 'text-black/40' : 'text-white/40'}`}>
                                                    {tier.originalPrice}
                                                </span>
                                            )}
                                        </div>
                                        {tier.retailPrice && (
                                            <p className={`font-sans text-xs mt-2 ${isSelected ? 'text-black/50' : 'text-white/50'}`}>
                                                Retail MSRP: {tier.retailPrice}
                                            </p>
                                        )}

                                        {/* 50% info pill */}
                                        {tier.subtitle?.includes('50%') && <TierPaymentInfo tier={tier} isSelected={isSelected} />}
                                    </div>

                                    <p className={`mt-6 min-h-[80px] w-full flex-grow font-sans text-sm leading-relaxed ${isSelected ? 'text-black/60' : 'text-white/70'}`}>
                                        {tier.description}
                                    </p>


                                    {/* Includes — glassmorphism panel */}
                                    {tier.includes && (
                                        <div className={`mt-6 w-full p-5 backdrop-blur-md border ${isSelected ? 'bg-black/[0.03] border-black/10' : 'bg-white/[0.06] border-white/10'}`}>
                                            <p className={`font-sans text-[10px] uppercase tracking-[0.2em] mb-3 ${isSelected ? 'text-black/40' : 'text-white/40'}`}>
                                                Includes
                                            </p>
                                            <div className="flex flex-col gap-2">
                                                {tier.includes.map((item: string, i: number) => (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <span className={`h-1 w-1 shrink-0 rounded-full ${isSelected ? 'bg-black/40' : 'bg-white/40'}`} />
                                                        <span className={`font-sans text-sm ${isSelected ? 'text-black/70' : 'text-white/80'}`}>{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Meta */}
                                    <div className="mt-8 flex w-full items-center gap-4 md:gap-6">
                                        {tier.delivery && (
                                            <div>
                                            <p className={`font-sans text-[10px] uppercase tracking-widest ${isSelected ? 'text-black/40' : 'text-white/40'}`}>{isOneProTier ? 'Target Delivery' : 'Delivery'}</p>
                                            <p className={`mt-1 font-sans text-xs ${isSelected ? 'text-black/70' : 'text-white/80'}`}>{tier.delivery}</p>
                                            </div>
                                        )}
                                        {tier.delivery && showProgress && <div className={`h-6 w-px ${isSelected ? 'bg-black/10' : 'bg-white/10'}`} />}
                                        {showProgress && (
                                            <>
                                                <div>
                                                    <p className={`font-sans text-[10px] uppercase tracking-widest ${isSelected ? 'text-black/40' : 'text-white/40'}`}>Backers</p>
                                                    <p className={`mt-1 font-sans text-xs ${isSelected ? 'text-black/70' : 'text-white/80'}`}>{tier.backers}</p>
                                                </div>
                                                <div className={`h-6 w-px ${isSelected ? 'bg-black/10' : 'bg-white/10'}`} />
                                                <div>
                                                    <p className={`font-sans text-[10px] uppercase tracking-widest ${isSelected ? 'text-black/40' : 'text-white/40'}`}>Left</p>
                                                    <p className={`mt-1 font-sans text-xs ${isSelected ? 'text-black/70' : 'text-white/80'}`}>{tier.remaining} of {tier.total}</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    {showProgress && (
                                        <div className={`mt-3 h-px w-full ${isSelected ? 'bg-black/10' : 'bg-white/10'}`}>
                                            <div className={`h-full transition-all ${isSelected ? 'bg-black/40' : 'bg-white/40'}`} style={{ width: `${progressPercent}%` }} />
                                        </div>
                                    )}

                                    {/* CTA Button */}
                                    <div className="mt-8 w-full pt-4">
                                        <button
                                            onClick={() => handleSelectTier(tier.id)}
                                            className={`flex w-full items-center justify-center gap-2 border px-6 py-4 text-center font-sans text-xs uppercase tracking-widest transition-colors cursor-pointer ${isSelected
                                                ? 'border-white bg-white text-black hover:bg-white/90'
                                                : 'border-white/30 text-white hover:border-white hover:bg-white/10'
                                            }`}
                                        >
                                            {isSelected ? 'Reserve Now' : 'Select'}
                                            {!isSelected && <span className="ml-1">→</span>}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {appState.product === 'one' ? (
                        <>
                            {/* Trust Badges */}
                            <div className="grid grid-cols-3 gap-4 mt-10 max-w-xl mx-auto">
                                <div className="flex flex-col items-center justify-center text-center gap-2">
                                    <ShieldCheck size={28} strokeWidth={1.5} className="text-white/70" />
                                    <span className="text-[11px] font-bold text-white/70">90-Day Trial</span>
                                </div>
                                <div className="flex flex-col items-center justify-center text-center gap-2">
                                    <Undo2 size={28} strokeWidth={1.5} className="text-white/70" />
                                    <span className="text-[11px] font-bold text-white/70">Easy Returns</span>
                                </div>
                                <div className="flex flex-col items-center justify-center text-center gap-2">
                                    <Truck size={28} strokeWidth={1.5} className="text-white/70" />
                                    <span className="text-[11px] font-bold text-white/70">Shipping Updates</span>
                                </div>
                            </div>

                            {/* Pricing footnote */}
                            <p className="text-center text-xs text-white/40 mt-10 max-w-xl mx-auto leading-relaxed font-sans">
                                * All prices shown are the official retail MSRP. Shipping and applicable taxes will be calculated before dispatch.
                            </p>
                        </>
                    ) : (
                        <p className="text-center text-xs text-white/40 mt-10 max-w-xl mx-auto leading-relaxed font-sans">
                            DreamPlay One Pro pricing and package contents match the selected product. Target delivery is {oneProTargetDeliveryDate}. Taxes, shipping charges, and preorder terms are shown in checkout.
                        </p>
                    )}

                    {/* Save My Build CTA */}
                    <div className="text-center mt-6">
                        <button
                            onClick={() => setIsSaveModalOpen(true)}
                            className="font-sans text-sm text-white/50 hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
                        >
                            Not ready to reserve today? Join the waitlist and save this build.
                        </button>
                    </div>

                    {appState.product === 'one' && (
                        <div className="mt-12 mx-auto max-w-2xl border border-white/15 bg-white/[0.04] backdrop-blur-md p-8 md:p-10">
                            <h4 className="font-serif text-xl text-white mb-6 text-center md:text-2xl">Pre-Order Logistics</h4>
                            <div className="flex flex-col gap-5">
                                <div className="flex items-start gap-4">
                                    <span className="text-xl shrink-0 mt-0.5">🚚</span>
                                    <div>
                                        <p className="font-sans text-sm font-semibold text-white/90 mb-1">Update your address anytime</p>
                                        <p className="font-sans text-sm text-white/55 leading-relaxed">We will email you 3 weeks before shipping to confirm your final address.</p>
                                    </div>
                                </div>
                                <div className="h-px bg-white/10" />
                                <div className="flex items-start gap-4">
                                    <span className="text-xl shrink-0 mt-0.5">🛡️</span>
                                    <div>
                                        <p className="font-sans text-sm font-semibold text-white/90 mb-1">Escrow Protection</p>
                                        <p className="font-sans text-sm text-white/55 leading-relaxed">Your funds are held securely. 100% refundable at any time before it ships. No questions asked.</p>
                                    </div>
                                </div>
                                <div className="h-px bg-white/10" />
                                <div className="flex items-start gap-4">
                                    <span className="text-xl shrink-0 mt-0.5">📦</span>
                                    <div>
                                        <p className="font-sans text-sm font-semibold text-white/90 mb-1">Custom Foam Packaging</p>
                                        <p className="font-sans text-sm text-white/55 leading-relaxed">Fully insured against damage in transit.</p>
                                    </div>
                                </div>
                                <div className="h-px bg-white/10" />
                                <div className="flex items-start gap-4">
                                    <span className="text-xl shrink-0 mt-0.5">⚖️</span>
                                    <div>
                                        <p className="font-sans text-sm font-semibold text-white/90 mb-1">Duties & Taxes</p>
                                        <p className="font-sans text-sm text-white/55 leading-relaxed">
                                            We ship Delivered Duty Paid (DDP). All import duties and taxes will be calculated transparently at final checkout. If shipping costs exceed your budget, you can cancel your order for a 100% full refund before it ships.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* MOBILE URGENCY WIDGET */}
            {authUser && showWidget && widgetTimeLeft > 0 && (
                <div className="fixed bottom-4 left-4 right-4 z-[90] bg-[#050505] border border-green-500/30 p-4 shadow-2xl md:hidden">
                    <button onClick={() => setShowWidget(false)} className="absolute top-2 right-2 text-white/40 hover:text-white cursor-pointer">
                        <X size={14} />
                    </button>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="text-green-400 w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-serif text-white text-sm font-bold mb-1">
                                Offer Activated
                            </h4>
                            <p className="font-sans text-xs text-white/70 leading-relaxed">
                                Lock in your order within <strong className="text-green-400 font-mono tracking-tight">{formatWidgetTime(widgetTimeLeft)}</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* MOBILE BUILD SUMMARY */}
            {!showWidget && (appState.handSpan || appState.size || appState.color) && (
                <div className="fixed bottom-4 left-4 right-4 z-[90] bg-[#050505] border border-white/10 p-4 shadow-2xl md:hidden">
                    <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">Your Build So Far</h4>
                    <div className="flex items-center justify-between gap-4">
                        <div className="text-center flex-1">
                            <div className="font-sans text-[10px] text-white/40 mb-0.5">Product</div>
                            <div className="font-sans text-xs text-white font-medium">
                                {appState.product === 'pro' ? 'Pro' : 'One'}
                            </div>
                        </div>
                        <div className="h-6 w-px bg-white/10" />
                        <div className="text-center flex-1">
                            <div className="font-sans text-[10px] text-white/40 mb-0.5">Size</div>
                            <div className={`font-sans text-xs ${appState.size ? 'text-white font-medium' : 'text-white/20'}`}>
                                {appState.size || '—'}
                            </div>
                        </div>
                        <div className="h-6 w-px bg-white/10" />
                        <div className="text-center flex-1">
                            <div className="font-sans text-[10px] text-white/40 mb-0.5">Finish</div>
                            <div className={`font-sans text-xs ${appState.color ? 'text-white font-medium' : 'text-white/20'}`}>
                                {selectedFinishLabel}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SIZING MODAL (DARK) --- */}
            {isSizingModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
                    <div className="relative max-h-[90vh] w-full max-w-6xl overflow-auto border border-white/20 bg-[#050505] p-8 shadow-2xl md:p-16">
                        <button onClick={() => setIsSizingModalOpen(false)} className="absolute right-6 top-6 font-sans text-xs uppercase tracking-widest text-white/50 transition-colors hover:text-white">
                            Close ✕
                        </button>

                        <div className="mb-16 text-center">
                            <h2 className="mb-4 font-serif text-3xl text-white md:text-5xl">A Keyboard That Fits You.</h2>
                            <p className="mx-auto max-w-xl font-sans text-sm text-white/50">DreamPlay&apos;s DS Standard keyboards come in different sizes to match your biology.</p>
                        </div>

                        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr]">
                            {/* CARD 1: INPUT */}
                            <div className="flex flex-col border border-white/10 bg-white/5 p-10">
                                <div className="mb-12">
                                    <div className="mb-4 flex items-end justify-between border-b border-white/20 pb-4">
                                        <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/50">Your Span</span>
                                        <div className="font-serif text-4xl text-white">
                                            {getRealValue(sliderValue).toFixed(1)}&quot; <span className="font-sans text-lg font-normal text-white/40">/ {(getRealValue(sliderValue) * 2.54).toFixed(1)} cm</span>
                                        </div>
                                    </div>

                                    <input
                                        type="range"
                                        min="0" max="100" step="0.5"
                                        value={sliderValue}
                                        onChange={(e) => setSliderValue(Number(e.target.value))}
                                        className="mb-4 h-1 w-full cursor-pointer appearance-none rounded-none bg-white/20"
                                        style={{
                                            background: `linear-gradient(to right, white ${sliderValue}%, rgba(255,255,255,0.2) ${sliderValue}%)`
                                        }}
                                    />
                                    <style jsx>{`
                                        input[type=range]::-webkit-slider-thumb {
                                            -webkit-appearance: none;
                                            height: 24px;
                                            width: 8px;
                                            background: #fff;
                                            cursor: pointer;
                                            margin-top: -10px;
                                        }
                                    `}</style>
                                    <div className="mt-4 flex justify-between font-sans text-[10px] uppercase tracking-widest text-white/40">
                                        <span>Small (6 in)</span>
                                        <span>Average (8 in)</span>
                                        <span>Large (10 in)</span>
                                    </div>
                                </div>

                                <div className="mt-auto flex items-start gap-6 border-t border-white/10 pt-8">
                                    <div className="relative h-16 w-16 shrink-0 bg-black grayscale border border-white/10">
                                        <Image src="/images/hands/hand-size-comparison.jpg" alt="Hand span" fill className="object-cover opacity-60" />
                                    </div>
                                    <div>
                                        <div className="mb-2 font-serif text-lg text-white">How to measure</div>
                                        <p className="font-sans text-xs leading-relaxed text-white/50">Spread your hand wide. Measure from the tip of the thumb to the tip of the pinky.</p>
                                    </div>
                                </div>
                            </div>

                            {/* CARD 2: RESULT */}
                            <div className="flex flex-col justify-center border border-white/10 bg-transparent p-10">
                                <div className="mb-2 font-sans text-[10px] uppercase tracking-[0.2em] text-white/40">Your match</div>
                                <div className="mb-2 font-serif text-5xl text-white">Zone {displayedSizingResult.zone}</div>
                                <div className="mb-10 border-b border-white/10 pb-6 font-sans text-sm text-white/50">{displayedSizingResult.rangeText}</div>

                                <div className="mb-2 font-serif text-3xl text-white">{displayedSizingResult.model}</div>
                                <div className="mb-6 font-sans text-[10px] uppercase tracking-widest text-white/50">Recommended Model</div>

                                <p className="mb-10 min-h-[60px] border-l border-white/20 pl-4 font-sans text-sm leading-relaxed text-white/60">
                                    {displayedSizingResult.desc}
                                </p>

                                <button
                                    onClick={() => {
                                        const zoneMap: Record<string, HandSizeId> = { A: 'small', B: 'medium', C: 'large' };
                                        handleSelectHandSize(zoneMap[displayedSizingResult.zone] ?? 'medium');
                                        setIsSizingModalOpen(false);
                                    }}
                                    className="group mt-auto flex w-full items-center justify-center gap-2 border border-white bg-white py-4 font-sans text-xs uppercase tracking-widest text-black transition-colors hover:bg-white/90"
                                >
                                    Select and Return
                                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- POLICY MODAL --- */}
            {isPolicyModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
                    <div className="relative flex h-full max-h-[90vh] w-full max-w-6xl flex-col border border-white/20 bg-[#050505] shadow-2xl">
                        <div className="flex items-center justify-between border-b border-white/10 px-8 py-6">
                            <h3 className="font-serif text-2xl text-white">Our Policy</h3>
                            <button onClick={() => setIsPolicyModalOpen(false)} className="font-sans text-xs uppercase tracking-widest text-white/50 transition-colors hover:text-white">Close ✕</button>
                        </div>
                        <div className="flex-1 bg-white">
                            <iframe src={policyUrl} className="h-full w-full border-0" title="Policy Page"></iframe>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SAVE MY BUILD MODAL --- */}
            {isSaveModalOpen && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300">
                    <div className="relative w-full max-w-md bg-[#050505] border border-white/10 rounded-none shadow-2xl p-8 md:p-10 animate-in fade-in zoom-in-95 duration-300">
                        <button
                            onClick={() => { setIsSaveModalOpen(false); setSaveSuccess(false); setSaveError(""); setSaveEmail(""); }}
                            className="absolute right-4 top-4 text-white/40 hover:text-white transition-colors cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        {!saveSuccess ? (
                            <>
                                <div className="mb-8 text-center">
                                    <div className="mx-auto bg-white/5 border border-white/10 w-14 h-14 rounded-none flex items-center justify-center mb-6">
                                        <ShieldCheck className="text-white" size={24} strokeWidth={1.5} />
                                    </div>
                                    <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-3">
                                        DreamPlay Waitlist
                                    </p>
                                    <h2 className="text-2xl md:text-3xl font-serif text-white tracking-tight leading-tight mb-4">
                                        {WAITLIST_OFFER_HEADLINE}
                                    </h2>
                                    <p className="text-white/60 font-sans text-sm leading-relaxed">
                                        {WAITLIST_OFFER_BODY}
                                    </p>
                                </div>

                                {saveError && (
                                    <div className="mb-4 p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-sans text-center">
                                        {saveError}
                                    </div>
                                )}

                                <form onSubmit={handleSaveBuild} className="space-y-4">
                                    <input
                                        type="email"
                                        required
                                        placeholder="Enter your email address"
                                        value={saveEmail}
                                        onChange={(e) => setSaveEmail(e.target.value)}
                                        className="w-full px-4 py-4 rounded-none border border-white/20 bg-transparent placeholder-white/40 text-white focus:ring-1 focus:ring-white focus:border-white outline-none transition-all font-sans text-sm"
                                    />

                                    <button
                                        type="submit"
                                        disabled={saveLoading}
                                        className="w-full bg-white text-black font-sans text-xs uppercase tracking-widest font-bold py-4 rounded-none hover:bg-white/90 transition-colors disabled:opacity-70 cursor-pointer"
                                    >
                                        {saveLoading ? "Joining..." : "Join Waitlist"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => { setIsSaveModalOpen(false); setSaveError(""); setSaveEmail(""); }}
                                        className="w-full mt-1 text-white/30 hover:text-white/60 font-sans text-xs uppercase tracking-widest transition-colors cursor-pointer py-2"
                                    >
                                        Maybe Later
                                    </button>
                                    <p className="text-[10px] text-center text-white/40 uppercase tracking-widest mt-2">
                                        No spam. Unsubscribe anytime.
                                    </p>
                                    <p className="text-[10px] text-center text-white/35 leading-relaxed mt-3">
                                        {WAITLIST_OFFER_TERMS}
                                    </p>
                                </form>
                            </>
                        ) : (
                            <div className="text-center py-6">
                                <div className="mx-auto bg-white border border-white/20 w-16 h-16 rounded-none flex items-center justify-center mb-6">
                                    <CheckCircle2 className="text-black" size={32} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-2xl font-serif text-white mb-3">Build saved. Check your inbox.</h3>
                                <p className="text-white/60 font-sans text-sm mb-8 max-w-xs mx-auto leading-relaxed">
                                    You&apos;re on the DreamPlay Waitlist. We&apos;ll send production updates and preorder availability.
                                </p>
                                <button
                                    onClick={() => { setIsSaveModalOpen(false); setSaveSuccess(false); setSaveEmail(""); }}
                                    className="bg-transparent border border-white/30 text-white font-sans text-xs uppercase tracking-widest font-bold py-4 px-8 w-full rounded-none hover:bg-white/10 transition-colors cursor-pointer"
                                >
                                    Continue Building
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Discount Registration Gate */}
            {showRegisterGate && (
                <RegisterModal
                    isOpen={true}
                    onClose={() => { }}
                    discountCode={discountCode || undefined}
                    onSuccess={async () => {
                        setShowRegisterGate(false);
                        // Re-fetch the auth user after registration
                        const supabase = createBrowserClient();
                        const { data } = await supabase.auth.getUser();
                        if (data.user) setAuthUser(data.user);
                    }}
                />
            )}
        </div>
    );
}
