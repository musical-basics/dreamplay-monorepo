"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Navbar } from "@/components/Navbar"
import { AbCtaLink } from "@/components/ab/AbCtaLink"
import {
    Check,
    Star,
    ShieldCheck,
    Lock,
    CalendarDays,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    X,
    Zap,
    Hand,
    Brain,
    Music,
    ArrowRight,
    MessageCircle,
    HelpCircle,
    Keyboard,
    Crosshair,
    RefreshCw,
    LockKeyhole,
    Wrench,
    Package,
} from "lucide-react"

/* ─────────────────────────────────────────────
   DATA
   ───────────────────────────────────────────── */

const GALLERY_IMAGES = [
    {
        src: "/images/marketing/DreamPlay Piano Hands.jpg",
        alt: "DreamPlay One, Hands on Keys",
    },
    {
        src: "/images/keyboards/DS6.0-Black-transparent v2.png",
        alt: "DreamPlay One DS6.0, Front View",
    },
    {
        src: "/images/keyboards/piano-front-2.jpg",
        alt: "DreamPlay One, Front Angle",
    },
    {
        src: "/images/keyboards/Piano%20%2B%20Bench%20Frontal%20%2B%20Bundle.png",
        alt: "DreamPlay One Complete Bundle",
    },
    {
        src: "/images/learn/keyboard-led-lights.jpg",
        alt: "DreamPlay One, LED Learning Lights",
    },
    {
        src: "/images/keyboards/ds60-black-narrow-keys-piano.png",
        alt: "DreamPlay One DS6.0, Side Angle",
    },
    {
        src: "/images/keyboards/ds55-white-narrow-keys-piano.png",
        alt: "DreamPlay One DS5.5, White Model",
    },
    {
        src: "/images/keyboards/DSDS6.0-Straightened-1-1024x788.jpg",
        alt: "DreamPlay One DS6.0, In Studio",
    },
]

const TRUST_BADGES = [
    { icon: ShieldCheck, label: "100% Refundable Deposit Anytime" },
    { icon: Lock, label: "Funds Held Securely in Escrow" },
    { icon: CalendarDays, label: "Guaranteed Monthly Updates" },
]

const ACCORDIONS = [
    {
        title: "Why Narrower Keys?",
        content:
            "Standard pianos use a 6.5-inch octave, a size locked in since the 1880s for large male hands. The DS5.5® (5.5-inch octave) and DS6.0® (6.0-inch octave) standards are scientifically sized to let smaller and average-sized hands play with a naturally relaxed arch, eliminating overstretching, pain, and injury.",
    },
    {
        title: "What's in the Box?",
        content:
            "DreamPlay One keyboard (73 or 88 keys), adjustable stand, sustain pedal, USB-C MIDI cable, power adapter, and a quick-start guide. Choose between DS5.5 or DS6.0 sizing at checkout.",
    },
    {
        title: "The Pre-Order Promise",
        content:
            "DreamPlay One is currently in the final design stage. What you see are production-intent renderings. Tooling begins shortly and you will receive monthly backstage photo and video updates showing your piano being built. Your deposit is 100% refundable at any time, no questions asked.",
    },
    {
        title: "90-Day Home Trial",
        content:
            "Once your DreamPlay One arrives, you have a full 90 days to play it in your own home. If you are not completely satisfied for any reason, we will arrange free return shipping and issue a full refund. We also offer free exchanges if you'd like to try the other key size.",
    },
]

const PAIN_POINTS = [
    {
        icon: Zap,
        emoji: "⚡",
        title: "Causes Active Pain",
        desc: "86% of university piano majors experience pain or injury from overstretching (ulnar deviation).",
    },
    {
        icon: Hand,
        emoji: "✋🏻",
        title: "Unfair Advantage",
        desc: "Standard 6.5\" octaves were built for massive male hands from the 1880s.",
    },
    {
        icon: Brain,
        emoji: "🧩",
        title: "Cognitive Overload",
        desc: "You spend 90% of your time practicing \"the stretch\" instead of the music.",
    },
    {
        icon: Music,
        emoji: "🎼",
        title: "Limits Repertoire",
        desc: "Late-Romantic pieces (Chopin, Rachmaninoff) become impossibly frustrating to reach.",
    },
]

const COMPARISON_ROWS = [
    {
        feature: "Reach a 10th comfortably",
        dream: true,
        standard: false,
        note: "",
        stdNote: "Not for 87% of women",
    },
    {
        feature: "Maintains natural hand arch",
        dream: true,
        standard: false,
        note: "",
        stdNote: "Forces flat-finger stretching",
    },
    {
        feature: "Eliminates ulnar deviation",
        dream: true,
        standard: false,
        note: "",
        stdNote: "Causes wrist strain",
    },
    {
        feature: "Biologically accurate sizing",
        dream: true,
        standard: false,
        note: "DS5.5 & DS6.0",
        stdNote: "One-size-fits-all",
    },
]

const STATS = [
    {
        value: "87.1%",
        label: "Of adult women possess a hand span too small for standard keyboards.",
    },
    {
        value: "10–15 min",
        label: "The average time it takes a pianist's brain to perfectly adapt to our DS6.0 size.",
    },
    {
        value: "100%",
        label: "Of children are currently learning on instruments that are biologically too large for them.",
    },
]

const EXPERT_TESTIMONIALS = [
    {
        name: "Elizabeth Schumann",
        role: "Director of Keyboard Studies, Stanford University",
        quote: "We would never expect a world-class athlete to compete with equipment that does not fit their body. Yet we ask pianists, particularly women, to adapt to a one-size-fits-all design that was never built with them in mind.",
    },
    {
        name: "Barbara Lister-Sink, Ed.D.",
        role: "Salem College School of Music, Director of Graduate Music Program",
        quote: "I cannot begin to describe the career-changing, and even life-changing, benefits our students have reaped from having these instruments to practice on daily. Their first response though was, 'Why did it take so long? Why did we have to suffer so unnecessarily?'",
    },
    {
        name: "Dr. Carol Leone",
        role: "Chair of Piano Studies, SMU Meadows School of the Arts",
        quote: "I often witness pianists place their hands for the first time on a keyboard that better suits their hand span. How often the pianist spontaneously bursts into tears. A lifetime of struggling with a seemingly insurmountable problem vanishes in the moment they realize, 'It's not me that is the problem; it is the instrument!'",
    },
    {
        name: "Kathryn-Ananda Owens",
        role: "Professor of Music – Piano, St Olaf College, Minnesota",
        quote: "My favorite story is from a piano performance major, who couldn't believe that playing the piano didn't have to hurt. The instrument restored her joy for piano repertoire. She had been preparing to change over to harpsichord due to keyboard size issues.",
    },
    {
        name: "Hubert Nuss",
        role: "Professor of Jazz Piano, HMDK University of Stuttgart",
        quote: "Another surprising effect for me was that playing this [SIRIUS 6.0] also has a positive effect when you go back to the normal keyboard.",
    },
]

const FEATURES_DEEP = [
    {
        headline: "Sized for Your Hands",
        copy: "DS5.5 and DS6.0 octaves let your hands play in a natural arch: no overstretching, no strain. It's the first piano sized for the pianist, not the other way around.",
        img: "/images/keyboards/ds55-white-narrow-keys-piano.png",
        icon: Keyboard,
    },
    {
        headline: "Studio-Ready MIDI",
        copy: "Connect to any DAW, play any virtual instrument, layer sounds. DreamPlay One is a production-grade controller with Bluetooth and USB-C MIDI.",
        img: "/images/learn/keyboard-back-ports.jpg",
        icon: Crosshair,
    },
    {
        headline: "Your Brain Adapts in Minutes",
        copy: "Studies show pianists adapt to narrower keys in 10–15 minutes. Your muscle memory transfers seamlessly. Only the pain disappears.",
        img: "/images/marketing/DreamPlay Piano Hands.jpg",
        icon: RefreshCw,
    },
]

const USER_TESTIMONIALS = [
    {
        quote: "I realize now, looking back, that most of the time I spent practicing was used trying to overcome difficulties because of my hand-size... If you spend 90% of the time trying to overcome limitations imposed by hand size, then you are truly disadvantaged.",
        name: "Christopher Donison",
        role: "Executive Artistic Director, Music by the Sea (Co-inventor of DS keyboards)",
    },
    {
        quote: "I can play for much longer and continue to play every day. I don't get frustrated from the pain and from being limited in my playing.",
        name: "Jen McCabe",
        role: "Pianist, teacher, music director",
    },
    {
        quote: "Everything is easier on the 6.0 for me… I feel very comfortable playing scales, fast passages, or big chords.",
        name: "Claudia Wang",
        role: "Master's Student, Southern Methodist University (SMU)",
    },
]

const FAQ_ITEMS = [
    {
        q: "Why narrower keys?",
        a: "Standard pianos use a 6.5-inch octave, a size locked in since the 1880s for large male hands. The DS5.5® and DS6.0® sizes are scientifically designed so smaller and average-sized hands can play with a naturally relaxed arch, eliminating overstretching, pain, and injury.",
    },
    {
        q: "What's in the box?",
        a: "DreamPlay One keyboard (73 or 88 keys), adjustable stand, sustain pedal, USB-C MIDI cable, power adapter, and a quick-start guide. Choose between DS5.5 or DS6.0 sizing at checkout.",
    },
    {
        q: "When will it ship?",
        a: "Batch 1 ships August 2027. You'll receive monthly backstage photo and video updates showing your piano being built.",
    },
    {
        q: "Can I try both sizes?",
        a: "Absolutely. We offer free exchanges within 90 days if you'd like to try the other key size.",
    },
    {
        q: "Is my deposit refundable?",
        a: "Yes. Your $99 deposit is 100% refundable at any time, no questions asked. Funds are held securely in escrow until your piano is ready to ship.",
    },
    {
        q: "What about the 90-Day Home Trial?",
        a: "Once your DreamPlay One arrives, you have a full 90 days to play it at home. If you're not completely satisfied, we arrange free return shipping and issue a full refund.",
    },
]

const TIMELINE_STEPS = [
    {
        step: "1",
        title: "Reserve",
        desc: "Lock in your discounted Founder's price today with a fully refundable $99 deposit.",
        icon: LockKeyhole,
    },
    {
        step: "2",
        title: "Build",
        desc: "We tool the steel and assemble the tech. You get monthly backstage photo & video updates.",
        icon: Wrench,
    },
    {
        step: "3",
        title: "Ship",
        desc: "Pay the remaining balance only when your piano is boxed and ready to ship (August 2027).",
        icon: Package,
    },
]

/* ─────────────────────────────────────────────
   COMPONENT
   ───────────────────────────────────────────── */

export function LandingPage1Content() {
    const [activeImage, setActiveImage] = useState(0)
    const [activeTestimonial, setActiveTestimonial] = useState(0)
    const [showSticky, setShowSticky] = useState(false)
    const [openAccordion, setOpenAccordion] = useState<number | null>(null)

    const currentImage =
        GALLERY_IMAGES[activeImage] ?? { src: "", alt: "" }
    const currentExpert =
        EXPERT_TESTIMONIALS[activeTestimonial] ?? { name: "", role: "", quote: "" }

    /* Sticky bar on scroll */
    useEffect(() => {
        const onScroll = () => setShowSticky(window.scrollY > 700)
        window.addEventListener("scroll", onScroll)
        return () => window.removeEventListener("scroll", onScroll)
    }, [])

    return (
        <div
            className="font-sans antialiased bg-white text-stone-900"
            style={{ fontFamily: "var(--font-inter), sans-serif" }}
        >
            {/* ═══════════════════════════════════════════════════════
                HEADER — shared Navbar (opaque, light)
            ═══════════════════════════════════════════════════════ */}
            <Navbar forceOpaque />
            {/* Spacer for fixed header */}
            <div className="h-16" />

            <main>
                {/* ═══════════════════════════════════════════════════
                    1. ABOVE-THE-FOLD BUY BOX
                ═══════════════════════════════════════════════════ */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-14 grid md:grid-cols-2 gap-8 md:gap-14 items-start">
                    {/* Left: Media Gallery */}
                    <div className="space-y-4">
                        {/* Main image */}
                        <div className="relative overflow-hidden rounded-2xl bg-stone-100 aspect-[4/3]">
                            <img
                                src={currentImage.src}
                                alt={currentImage.alt}
                                className="w-full h-full object-cover transition-opacity duration-300"
                            />
                            {/* Feature callouts on first image */}
                            {activeImage === 0 && (
                                <>
                                    <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white text-[11px] font-semibold px-3 py-1.5 rounded-full">
                                        15/16th Scale Keys
                                    </div>
                                    <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white text-[11px] font-semibold px-3 py-1.5 rounded-full">
                                        Bluetooth MIDI
                                    </div>
                                    <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white text-[11px] font-semibold px-3 py-1.5 rounded-full">
                                        Premium Weighted Action
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Thumbnail row */}
                        <div className="flex gap-2">
                            {GALLERY_IMAGES.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveImage(i)}
                                    className={`flex-1 aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${activeImage === i
                                        ? "border-stone-900 shadow-md"
                                        : "border-transparent opacity-60 hover:opacity-100"
                                        }`}
                                >
                                    <img
                                        src={img.src}
                                        alt={img.alt}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Product Details */}
                    <div className="space-y-5">
                        {/* Social proof stars */}
                        <div className="flex items-center gap-1 flex-wrap">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Star
                                    key={i}
                                    className="w-4 h-4 fill-amber-400 text-amber-400"
                                />
                            ))}
                            <span className="text-stone-500 text-sm ml-2">
                                Backed by 208 Founders • $124,000+ Reserved
                            </span>
                        </div>

                        {/* Title */}
                        <h1
                            className="text-3xl md:text-4xl font-bold leading-tight"
                            style={{ fontFamily: "var(--font-playfair)" }}
                        >
                            DreamPlay One
                        </h1>
                        <p className="text-stone-500 text-sm -mt-2">
                            DS5.5® & DS6.0® | Scientifically Sized Keys
                        </p>

                        {/* Pricing */}
                        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
                            <div className="text-2xl md:text-3xl font-black text-stone-900 leading-tight">
                                $99 <span className="text-lg md:text-xl font-bold">DUE TODAY TO SECURE YOUR SPOT</span>
                            </div>
                            <p className="text-sm text-stone-500">
                                Fully refundable deposit. Locks in{" "}
                                <span className="font-bold text-stone-800">
                                    $999 Founder&apos;s Price
                                </span>
                                <span className="line-through text-stone-400 ml-2">
                                    $1,499 MSRP
                                </span>
                            </p>
                        </div>

                        {/* Urgency */}
                        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                            <div className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </div>
                            <p className="text-sm text-amber-900 font-medium">
                                Batch 1 Delivery (August 2027) is{" "}
                                <strong>83% Full</strong>. Only{" "}
                                <strong>42 allocations</strong> remaining.
                            </p>
                        </div>

                        {/* CTA */}
                        <AbCtaLink
                            cta="landing_page_1_buy_box"
                            href="/customize"
                            className="block w-full text-center bg-[#111111] text-white py-4 text-sm font-bold tracking-widest uppercase hover:bg-transparent hover:text-[#111111] transition-all duration-200"
                            style={{ border: "2px solid #111111" }}
                        >
                            Secure My August Delivery
                            <ArrowRight className="inline-block ml-2 w-5 h-5" />
                        </AbCtaLink>

                        {/* Trust badges */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                            {TRUST_BADGES.map(({ icon: Icon, label }, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 text-stone-500"
                                >
                                    <Icon className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span className="text-xs font-medium leading-tight">
                                        {label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Inline Testimonial */}
                        <div className="flex items-start gap-3 bg-stone-50/80 border border-stone-200/80 rounded-xl px-4 py-3 mt-1">
                            <MessageCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-stone-600 italic leading-relaxed">
                                &ldquo;Everything is easier on the 6.0 for me… I feel very comfortable playing scales, fast passages, or big chords.&rdquo;
                                <span className="block text-xs text-stone-400 mt-1 not-italic">Claudia Wang, Master&apos;s Student, SMU</span>
                            </p>
                        </div>

                        {/* Accordions */}
                        <div className="divide-y divide-stone-200 border-t border-b border-stone-200 mt-4">
                            {ACCORDIONS.map((item, i) => (
                                <div key={i}>
                                    <button
                                        onClick={() =>
                                            setOpenAccordion(
                                                openAccordion === i ? null : i
                                            )
                                        }
                                        className="w-full flex items-center justify-between py-4 text-left cursor-pointer group"
                                    >
                                        <span className="text-sm font-semibold text-stone-800 group-hover:text-stone-600 transition-colors">
                                            {item.title}
                                        </span>
                                        <ChevronDown
                                            className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${openAccordion === i
                                                ? "rotate-180"
                                                : ""
                                                }`}
                                        />
                                    </button>
                                    <div
                                        className={`overflow-hidden transition-all duration-300 ${openAccordion === i
                                            ? "max-h-60 pb-4"
                                            : "max-h-0"
                                            }`}
                                    >
                                        <p className="text-sm text-stone-500 leading-relaxed pr-4">
                                            {item.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════
                    2. PROBLEM AGITATION ICON BAR
                ═══════════════════════════════════════════════════ */}
                <section className="bg-stone-50 border-y border-stone-200 py-16 px-4">
                    <div className="max-w-5xl mx-auto">
                        <h2
                            className="text-2xl md:text-3xl font-bold text-center mb-4"
                            style={{ fontFamily: "var(--font-playfair)" }}
                        >
                            The Problem With &ldquo;Standard&rdquo; Pianos
                        </h2>
                        <p className="text-center text-stone-500 text-sm mb-12 max-w-xl mx-auto">
                            For over a century, one key size has dominated,
                            regardless of the pianist&apos;s hand.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {PAIN_POINTS.map((item, i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="w-14 h-14 bg-stone-100 rounded-xl flex items-center justify-center mb-4 border border-stone-200">
                                        {i < 3 ? (
                                            <item.icon className="w-7 h-7 text-stone-700 stroke-[1.5]" />
                                        ) : (
                                            <span className="text-3xl">{item.emoji}</span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-stone-900 mb-2">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-stone-500 leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════
                    2B. IMAGE-WITH-TEXT FEATURES
                ═══════════════════════════════════════════════════ */}
                <section className="py-20 px-4">
                    <div className="max-w-5xl mx-auto">
                        <h2
                            className="text-2xl md:text-3xl font-bold text-center mb-4"
                            style={{ fontFamily: "var(--font-playfair)" }}
                        >
                            What Makes DreamPlay Different
                        </h2>
                        <p className="text-center text-stone-500 text-sm mb-16 max-w-lg mx-auto">
                            Three breakthroughs that change everything about how
                            you experience the piano.
                        </p>

                        <div className="space-y-16 md:space-y-24">
                            {FEATURES_DEEP.map((f, i) => {
                                const Icon = f.icon
                                return (
                                    <div
                                        key={i}
                                        className={`flex flex-col md:flex-row items-center gap-8 md:gap-14 ${i % 2 === 1
                                            ? "md:flex-row-reverse"
                                            : ""
                                            }`}
                                    >
                                        {/* Image */}
                                        <div className="w-full md:w-1/2 rounded-2xl overflow-hidden bg-stone-100 aspect-[4/3]">
                                            <img
                                                src={f.img}
                                                alt={f.headline}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* Text */}
                                        <div className="w-full md:w-1/2 space-y-4">
                                            <div className="inline-flex items-center gap-2 bg-stone-100 rounded-full px-3 py-1.5">
                                                <Icon className="w-4 h-4 text-stone-600" />
                                                <span className="text-xs font-semibold text-stone-600 uppercase tracking-wide">
                                                    {f.headline}
                                                </span>
                                            </div>
                                            <h3
                                                className="text-xl md:text-2xl font-bold text-stone-900"
                                                style={{
                                                    fontFamily:
                                                        "var(--font-playfair)",
                                                }}
                                            >
                                                {f.headline}
                                            </h3>
                                            <p className="text-stone-500 leading-relaxed">
                                                {f.copy}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════
                    3. COMPARISON TABLE
                ═══════════════════════════════════════════════════ */}
                <section className="py-20 px-4 max-w-4xl mx-auto">
                    <h2
                        className="text-2xl md:text-3xl font-bold text-center mb-4"
                        style={{ fontFamily: "var(--font-playfair)" }}
                    >
                        Why DreamPlay Unlocks Your Potential
                    </h2>
                    <p className="text-center text-stone-500 text-sm mb-12 max-w-lg mx-auto">
                        A side-by-side look at what changes when the keys
                        finally fit your hands.
                    </p>

                    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                        {/* Table header */}
                        <div className="grid grid-cols-3 p-4 bg-stone-50 border-b border-stone-100 text-sm font-bold">
                            <div className="text-stone-500">Feature</div>
                            <div className="text-center text-emerald-700">
                                DreamPlay One
                            </div>
                            <div className="text-center text-stone-400">
                                Standard Piano
                            </div>
                        </div>

                        {COMPARISON_ROWS.map((row, i) => (
                            <div
                                key={i}
                                className={`grid grid-cols-3 px-4 py-4 text-sm items-center ${i % 2 === 0 ? "bg-white" : "bg-stone-50/50"
                                    }`}
                            >
                                <div className="font-medium text-stone-700 pr-2">
                                    {row.feature}
                                </div>
                                <div className="flex flex-col items-center gap-0.5">
                                    <Check className="text-emerald-600 w-5 h-5" />
                                    {row.note && (
                                        <span className="text-[11px] text-emerald-600/70">
                                            {row.note}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col items-center gap-0.5">
                                    <X className="text-stone-300 w-5 h-5" />
                                    {row.stdNote && (
                                        <span className="text-[11px] text-stone-400 text-center">
                                            {row.stdNote}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════
                    4. DATA-BACKED RESULTS
                ═══════════════════════════════════════════════════ */}
                <section className="bg-[#0a0a0a] text-white py-20 px-4">
                    <div className="max-w-5xl mx-auto">
                        <h2
                            className="text-2xl md:text-3xl font-bold text-center mb-4"
                            style={{ fontFamily: "var(--font-playfair)" }}
                        >
                            The Science is Clear.
                        </h2>
                        <p className="text-center text-stone-400 text-sm mb-14 max-w-lg mx-auto">
                            Decades of peer-reviewed research confirm what
                            pianists have always felt.
                        </p>

                        <div className="grid md:grid-cols-3 gap-8">
                            {STATS.map((s, i) => (
                                <div
                                    key={i}
                                    className="text-center bg-[#1a1a1a] rounded-2xl p-8 border border-white/10"
                                >
                                    <div
                                        className="text-5xl md:text-6xl font-black text-white mb-4"
                                        style={{
                                            fontFamily: "var(--font-playfair)",
                                        }}
                                    >
                                        {s.value}
                                    </div>
                                    <p className="text-stone-300 text-sm leading-relaxed">
                                        {s.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════
                    5. EXPERT TESTIMONIAL SLIDER
                ═══════════════════════════════════════════════════ */}
                <section className="py-20 px-4 bg-stone-50">
                    <div className="max-w-3xl mx-auto">
                        <h2
                            className="text-2xl md:text-3xl font-bold text-center mb-14"
                            style={{ fontFamily: "var(--font-playfair)" }}
                        >
                            What Piano Professors At Top Universities Say
                        </h2>

                        {/* Active card with chevrons */}
                        <div className="relative">
                            {/* Left chevron */}
                            <button
                                onClick={() => setActiveTestimonial((p) => (p - 1 + EXPERT_TESTIMONIALS.length) % EXPERT_TESTIMONIALS.length)}
                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-10 w-10 h-10 rounded-full bg-white border border-stone-200 shadow-sm flex items-center justify-center hover:bg-stone-50 transition-colors cursor-pointer"
                            >
                                <ChevronLeft className="w-5 h-5 text-stone-600" />
                            </button>

                            {/* Right chevron */}
                            <button
                                onClick={() => setActiveTestimonial((p) => (p + 1) % EXPERT_TESTIMONIALS.length)}
                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-10 w-10 h-10 rounded-full bg-white border border-stone-200 shadow-sm flex items-center justify-center hover:bg-stone-50 transition-colors cursor-pointer"
                            >
                                <ChevronRight className="w-5 h-5 text-stone-600" />
                            </button>

                            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-stone-200 min-h-[260px] flex flex-col items-center justify-center text-center relative">
                                {/* Stars */}
                                <div className="flex gap-0.5 mb-6">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            className="w-5 h-5 fill-amber-400 text-amber-400"
                                        />
                                    ))}
                                </div>

                                <blockquote
                                    className="text-stone-700 text-lg md:text-xl leading-relaxed mb-6 max-w-2xl italic transition-opacity duration-500"
                                    style={{
                                        fontFamily: "var(--font-playfair)",
                                    }}
                                >
                                    &ldquo;{currentExpert.quote}&rdquo;
                                </blockquote>

                                <div>
                                    <p className="font-bold text-stone-900 text-sm">
                                        {currentExpert.name}
                                    </p>
                                    <p className="text-stone-500 text-xs mt-1">
                                        {currentExpert.role}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Dots */}
                        <div className="flex justify-center gap-2 mt-6">
                            {EXPERT_TESTIMONIALS.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveTestimonial(i)}
                                    className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${activeTestimonial === i
                                        ? "bg-stone-800 scale-125"
                                        : "bg-stone-300 hover:bg-stone-400"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════
                    5B. REVIEWS CAROUSEL — "What Pianists Are Saying"
                ═══════════════════════════════════════════════════ */}
                <section className="py-20 px-4">
                    <div className="max-w-5xl mx-auto">
                        <h2
                            className="text-2xl md:text-3xl font-bold text-center mb-4"
                            style={{ fontFamily: "var(--font-playfair)" }}
                        >
                            What Pianists Are Saying
                        </h2>
                        <p className="text-center text-stone-500 text-sm mb-12 max-w-lg mx-auto">
                            Real stories from pianists who&apos;ve experienced
                            ergonomically-sized keys.
                        </p>

                        <div className="grid md:grid-cols-3 gap-6">
                            {USER_TESTIMONIALS.map((t, i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    {/* Stars */}
                                    <div className="flex gap-0.5 mb-4">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star
                                                key={s}
                                                className="w-4 h-4 fill-amber-400 text-amber-400"
                                            />
                                        ))}
                                    </div>
                                    <p className="text-stone-700 text-sm leading-relaxed mb-4 italic">
                                        &ldquo;{t.quote}&rdquo;
                                    </p>
                                    <div className="border-t border-stone-100 pt-3">
                                        <p className="font-bold text-stone-900 text-sm">
                                            {t.name}
                                        </p>
                                        <p className="text-stone-500 text-xs mt-0.5">
                                            {t.role}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════
                    6. TRANSPARENCY / HOW IT WORKS TIMELINE
                ═══════════════════════════════════════════════════ */}
                <section className="py-20 px-4">
                    <div className="max-w-4xl mx-auto">
                        <h2
                            className="text-2xl md:text-3xl font-bold text-center mb-4"
                            style={{ fontFamily: "var(--font-playfair)" }}
                        >
                            How Pre-Ordering Works
                        </h2>
                        <p className="text-center text-stone-500 text-sm mb-14 max-w-lg mx-auto">
                            Transparent, simple, and risk-free. You&apos;re in
                            control every step of the way.
                        </p>

                        <div className="grid md:grid-cols-3 gap-8 relative">
                            {/* Connecting line (desktop) */}
                            <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-0.5 bg-stone-200"></div>

                            {TIMELINE_STEPS.map((s, i) => (
                                <div
                                    key={i}
                                    className="relative flex flex-col items-center text-center"
                                >
                                    <div className="w-24 h-24 bg-stone-100 rounded-2xl flex items-center justify-center mb-6 border border-stone-200 relative z-10">
                                        <s.icon className="w-10 h-10 text-stone-700 stroke-[1.5]" />
                                    </div>
                                    <div className="absolute top-4 -left-2 bg-stone-900 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center z-20">
                                        {s.step}
                                    </div>
                                    <h3
                                        className="text-lg font-bold mb-2"
                                        style={{
                                            fontFamily: "var(--font-playfair)",
                                        }}
                                    >
                                        {s.title}
                                    </h3>
                                    <p className="text-sm text-stone-500 leading-relaxed max-w-xs">
                                        {s.desc}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Final CTA */}
                        <div className="text-center mt-16">
                            <AbCtaLink
                                cta="landing_page_1_timeline"
                                href="/customize"
                                className="inline-flex items-center gap-2 bg-[#111111] text-white px-8 py-4 text-sm font-bold tracking-widest uppercase hover:bg-transparent hover:text-[#111111] transition-all duration-200 cursor-pointer"
                                style={{ border: "2px solid #111111" }}
                            >
                                Secure My August Delivery
                                <ArrowRight className="w-5 h-5" />
                            </AbCtaLink>
                            <p className="text-stone-400 text-xs mt-4">
                                $99 fully refundable deposit • No risk
                            </p>
                        </div>
                    </div>
                </section>
                {/* ═══════════════════════════════════════════════════
                    7. STANDALONE FAQ
                ═══════════════════════════════════════════════════ */}
                <section className="bg-stone-50 border-t border-stone-200 py-20 px-4">
                    <div className="max-w-3xl mx-auto">
                        <h2
                            className="text-2xl md:text-3xl font-bold text-center mb-4"
                            style={{ fontFamily: "var(--font-playfair)" }}
                        >
                            Questions? We&apos;ve Got You Covered
                        </h2>
                        <p className="text-center text-stone-500 text-sm mb-12">
                            Everything you need to know before reserving.
                        </p>

                        <div className="divide-y divide-stone-200 border-t border-b border-stone-200">
                            {FAQ_ITEMS.map((item, i) => (
                                <details
                                    key={i}
                                    className="group"
                                >
                                    <summary className="flex items-center justify-between py-5 cursor-pointer list-none">
                                        <span className="text-sm font-semibold text-stone-800 group-hover:text-stone-600 transition-colors flex items-center gap-2">
                                            <HelpCircle className="w-4 h-4 text-stone-400" />
                                            {item.q}
                                        </span>
                                        <ChevronDown className="w-4 h-4 text-stone-400 transition-transform duration-300 group-open:rotate-180" />
                                    </summary>
                                    <div className="pb-5 pr-4 pl-6">
                                        <p className="text-sm text-stone-500 leading-relaxed">
                                            {item.a}
                                        </p>
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* ═══════════════════════════════════════════════════
                MINIMAL FOOTER
            ═══════════════════════════════════════════════════ */}
            <footer className="border-t border-stone-200 py-8 px-4 text-center">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div
                        className="text-lg font-bold tracking-tight text-stone-400"
                        style={{ fontFamily: "var(--font-playfair)" }}
                    >
                        DreamPlay
                    </div>
                    <div className="flex items-center gap-4 text-xs text-stone-400">
                        <Link href="/contact" className="hover:text-stone-600 transition-colors">
                            Contact
                        </Link>
                        <span>•</span>
                        <span>© {new Date().getFullYear()} DreamPlay Inc.</span>
                    </div>
                </div>
            </footer>

            {/* ═══════════════════════════════════════════════════
                STICKY MOBILE CTA
            ═══════════════════════════════════════════════════ */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 shadow-[0_-4px_24px_rgba(0,0,0,.10)] transition-transform duration-300 ${showSticky ? "translate-y-0" : "translate-y-full"
                    }`}
            >
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    <div className="hidden sm:block">
                        <h4 className="font-bold text-sm text-stone-900">
                            DreamPlay Deposit
                        </h4>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-black text-stone-900">
                                $99
                            </span>
                            <span className="text-stone-400 text-xs">
                                locks in $999
                            </span>
                        </div>
                    </div>
                    <div className="sm:hidden text-sm font-bold text-stone-900">
                        DreamPlay Deposit: $99
                    </div>
                    <AbCtaLink
                        cta="landing_page_1_sticky"
                        href="/customize"
                        className="flex-shrink-0 bg-[#111111] text-white px-6 py-3 text-sm font-bold tracking-widest uppercase hover:bg-transparent hover:text-black transition-all duration-200 cursor-pointer"
                        style={{ border: "2px solid #111111" }}
                    >
                        Reserve Now
                    </AbCtaLink>
                </div>
            </div>
        </div>
    )
}
