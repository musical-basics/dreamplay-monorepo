"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { ChevronDown, ChevronRight, Play, ArrowRight, Send, Loader2, CheckCircle2, Smartphone, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/Navbar"
import { CalculatorSection } from "@/components/how-it-works/calculator-section"
import { LazyVideo } from "@/components/extended-offer/LazyVideo"
import DonutChart from "@/components/DonutChart"
import { subscribeToNewsletter, submitContactForm } from "@/actions/email-actions"
import { HorizontalBuyersGuide } from "@/components/buyers-guide/HorizontalBuyersGuide"
import { useAnalytics } from "@dreamplay/analytics/react"

const professorQuotes = [
    {
        quote: "We would never expect a world-class athlete to compete with equipment that does not fit their body. Yet we ask pianists, particularly women, to adapt to a one-size-fits-all design that was never built with them in mind.",
        author: "Elizabeth Schumann",
        title: "Director of Keyboard Studies, Stanford University"
    },
    {
        quote: "I often witness pianists place their hands for the first time on a keyboard that better suits their hand span. How often the pianist spontaneously bursts into tears. A lifetime of struggling with a seemingly insurmountable problem vanishes in the moment they realize, 'It's not me that is the problem; it is the instrument!' Following on that, the joy of possibility overwhelms them.",
        author: "Dr. Carol Leone",
        title: "Chair of Piano Studies, SMU Meadows School of the Arts"
    },
    {
        quote: "I cannot begin to describe the career-changing, and even life-changing, benefits our students have reaped from having these instruments to practice on daily. Their first response though was, 'Why did it take so long? Why did we have to suffer so unnecessarily?'",
        author: "Barbara Lister-Sink, Ed.D.",
        title: "Salem College School of Music, Director, Graduate Music Program"
    }
]

const factoryImages = [
    "/images/factory-pictures/exterior.jpeg",
    "/images/factory-pictures/hq.jpg",
    "/images/factory-pictures/smt.jpeg",
    "/images/factory-pictures/mold.jpeg",
    "/images/factory-pictures/chassis.jpeg",
    "/images/factory-pictures/action.jpeg",
    "/images/factory-pictures/keys.jpeg",
    "/images/factory-pictures/keybeds.jpeg",
]

const founderQuotes = [
    {
        quote: "I watched enough of my students struggle, both adults and children, that I want to make this keyboard for them. To show them what is possible when the piano finally fits one's hands.",
        author: "Lionel Yu",
        title: "Founder & Concert Pianist",
        image: "https://dreamplaypianos.com/images/marketing/carnegie-hall-performance.png"
    },
    {
        quote: "Everything is easier on the 6.0 for me... I feel very comfortable playing scales, fast passages, or big chords",
        author: "Claudia Wang",
        title: "Master's Student at SMU, Dallas · 7.2\" Handspan",
        image: "/images/marketing/claudia-wang.jpeg"
    }
]

const TOTAL_SLIDES = 17

// Human labels per slide index — attached to slide_view analytics events
// (restored from the legacy website-2 intro-offer slide tracking).
const SLIDE_LABELS = [
    "Launch Video",
    "History & Stats",
    "Professor Quotes",
    "DreamPlay One Hero",
    "LEDs / Learning App",
    "Expected Shipping",
    "Manufacturing",
    "Social Proof",
    "Official Price",
    "But Wait",
    "Pricing",
    "Money Back Guarantee",
    "Founder Quotes",
    "Ready / CTA",
    "FAQ / Contact",
    "Buyers Guide",
    "Footer",
]

const ScrollIndicator = ({ next, dark, onNav }: { next: number; dark?: boolean; onNav: (index: number) => void }) => (
    <button
        onClick={() => onNav(next)}
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-colors cursor-pointer z-20 ${dark ? "text-black/60 hover:text-black" : "text-white/60 hover:text-white"}`}
        aria-label="Next section"
    >
        <span className="font-sans text-xs uppercase tracking-[0.2em]">Scroll</span>
        <ChevronDown className="w-5 h-5 animate-bounce" />
    </button>
)

export default function IntroOfferPage() {
    const analytics = useAnalytics()
    const scrollRef = useRef<HTMLDivElement>(null)
    const [currentSlide, setCurrentSlide] = useState(0)
    const [isVideoPlaying, setIsVideoPlaying] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)

    // Horizontal slide states
    const [statsHorizontalSlide, setStatsHorizontalSlide] = useState(0)
    const [quoteHorizontalSlide, setQuoteHorizontalSlide] = useState(0)
    const [productHorizontalSlide, setProductHorizontalSlide] = useState(0)
    const [learnHorizontalSlide, setLearnHorizontalSlide] = useState(0)
    const [founderHorizontalSlide, setFounderHorizontalSlide] = useState(0)

    // Contact form states
    const [contactName, setContactName] = useState("")
    const [contactEmail, setContactEmail] = useState("")
    const [contactMessage, setContactMessage] = useState("")
    const [isContactSubmitting, setIsContactSubmitting] = useState(false)
    const [isContactSubmitted, setIsContactSubmitted] = useState(false)
    const [contactError, setContactError] = useState("")

    // Landscape Hint State
    const [showLandscapeHint, setShowLandscapeHint] = useState(false)



    // ─── Landscape Hint Logic (DISABLED — to re-enable, remove the early return below) ───
    useEffect(() => {
        return // DISABLED: landscape hint turned off
        if (typeof window === "undefined") return
        if (sessionStorage.getItem("dp_landscape_seen")) return

        let timer: NodeJS.Timeout

        const checkOrientation = () => {
            const isMobilePortrait = window.innerWidth < 768 && window.innerHeight > window.innerWidth
            if (!isMobilePortrait) {
                setShowLandscapeHint(false)
                sessionStorage.setItem("dp_landscape_seen", "true")
            }
        }

        const isMobilePortrait = window.innerWidth < 768 && window.innerHeight > window.innerWidth
        if (isMobilePortrait) {
            timer = setTimeout(() => {
                if (!sessionStorage.getItem("dp_landscape_seen")) {
                    setShowLandscapeHint(true)
                }
            }, 2500)
        }

        window.addEventListener("resize", checkOrientation)
        return () => {
            if (timer) clearTimeout(timer)
            window.removeEventListener("resize", checkOrientation)
        }
    }, [])

    const closeLandscapeHint = () => {
        setShowLandscapeHint(false)
        sessionStorage.setItem("dp_landscape_seen", "true")
    }



    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsContactSubmitting(true)
        setContactError("")
        try {
            const result = await submitContactForm({ name: contactName, email: contactEmail, subject: "Intro Offer Inquiry", message: contactMessage })
            if (!result.success) {
                throw new Error(result.error || "Failed to send message")
            }
            setIsContactSubmitted(true)
        } catch (err) {
            setContactError(err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.")
        } finally {
            setIsContactSubmitting(false)
        }
    }

    const scrollToSlide = useCallback((index: number) => {
        const el = scrollRef.current
        if (!el) return
        const clamped = Math.max(0, Math.min(index, TOTAL_SLIDES - 1))
        el.scrollTo({ top: clamped * window.innerHeight, behavior: "smooth" })
    }, [])

    // Track current slide based on scroll position (for dot nav indicator)
    useEffect(() => {
        const el = scrollRef.current
        if (!el) return

        const onScroll = () => {
            const slideIndex = Math.round(el.scrollTop / window.innerHeight)
            setCurrentSlide(Math.max(0, Math.min(slideIndex, TOTAL_SLIDES - 1)))
        }

        el.addEventListener("scroll", onScroll, { passive: true })
        return () => el.removeEventListener("scroll", onScroll)
    }, [])

    // ─── Slide-Level Analytics (restored from legacy website-2) ───
    // Fires slide_view for the slide the visitor just LEFT, carrying how long
    // they stayed on it; the final slide is flushed on tab hide/close.
    const slideEnteredAt = useRef(0) // stamped on mount (Date.now() is impure during render)
    const lastTrackedSlide = useRef(0)

    useEffect(() => {
        slideEnteredAt.current = Date.now()
    }, [])

    const sendSlideEvent = useCallback((slideIndex: number, durationSeconds: number) => {
        if (durationSeconds < 1) return // skip sub-second noise
        if (durationSeconds > 60 * 60 * 12) return // skip garbage (e.g. unset timer)
        void analytics.track("slide_view", {
            slide_index: slideIndex,
            slide_label: SLIDE_LABELS[slideIndex] || `Slide ${slideIndex + 1}`,
            duration_seconds: durationSeconds,
        })
    }, [analytics])

    useEffect(() => {
        if (currentSlide === lastTrackedSlide.current) return
        // Fire event for the PREVIOUS slide with its dwell time
        const prevSlide = lastTrackedSlide.current
        const duration = Math.round((Date.now() - slideEnteredAt.current) / 1000)
        sendSlideEvent(prevSlide, duration)

        // Reset for the new slide
        lastTrackedSlide.current = currentSlide
        slideEnteredAt.current = Date.now()
    }, [currentSlide, sendSlideEvent])

    // Flush the current slide's dwell time on page leave
    useEffect(() => {
        const flush = () => {
            const duration = Math.round((Date.now() - slideEnteredAt.current) / 1000)
            sendSlideEvent(lastTrackedSlide.current, duration)
        }
        const onVisibilityChange = () => {
            if (document.visibilityState === "hidden") flush()
        }
        document.addEventListener("visibilitychange", onVisibilityChange)
        window.addEventListener("pagehide", flush)
        return () => {
            document.removeEventListener("visibilitychange", onVisibilityChange)
            window.removeEventListener("pagehide", flush)
        }
    }, [sendSlideEvent])

    const playVideo = () => {
        setIsVideoPlaying(true)
    }

    return (
        <>
            {/* Landscape Hint Popup */}
            {showLandscapeHint && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 md:hidden">
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        @keyframes tilt-phone {
                            0% { transform: rotate(0deg); }
                            20% { transform: rotate(0deg); }
                            50% { transform: rotate(-90deg); }
                            80% { transform: rotate(-90deg); }
                            100% { transform: rotate(0deg); }
                        }
                        .animate-tilt {
                            animation: tilt-phone 3s ease-in-out infinite;
                        }
                    `}} />
                    <div className="relative w-full max-w-sm bg-[#0a0a0f] border border-white/20 p-8 rounded-3xl shadow-2xl text-center">
                        <button
                            onClick={closeLandscapeHint}
                            className="absolute top-4 right-4 text-white/40 hover:text-white cursor-pointer"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex justify-center mb-6">
                            <Smartphone className="w-16 h-16 text-amber-400 animate-tilt" strokeWidth={1.5} />
                        </div>

                        <h3 className="text-2xl font-serif text-white mb-3">Rotate your phone</h3>
                        <p className="text-sm font-sans text-white/60 mb-8 leading-relaxed">
                            A piano is a horizontal instrument. For the best visual experience, please turn your phone sideways.
                        </p>

                        <button
                            onClick={closeLandscapeHint}
                            className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-full hover:bg-white/90 transition-colors cursor-pointer"
                        >
                            Continue in Portrait
                        </button>
                    </div>
                </div>
            )}



            {/* Header */}
            <Navbar forceOpaque={true} darkMode={true} className="border-b border-white/10 bg-[#050505] backdrop-blur-md" />

            {/* Dot navigation */}
            {(() => {
                const lightSlides = [8, 9, 12, 15] // slides with white/light backgrounds
                const isDark = lightSlides.includes(currentSlide)
                return (
                    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
                        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => scrollToSlide(i)}
                                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${currentSlide === i
                                    ? isDark ? "bg-black scale-125" : "bg-white scale-125"
                                    : isDark ? "bg-black/30 hover:bg-black/50" : "bg-white/30 hover:bg-white/50"
                                    }`}
                                aria-label={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>
                )
            })()}

            {/*
        This single div is both the viewport (h-screen, overflow-hidden)
        AND the scroll target. We attach the ref here.
      */}
            <div
                ref={scrollRef}
                className="h-screen overflow-y-scroll"
                style={{ scrollSnapType: "y mandatory", scrollBehavior: "smooth" }}
            >

                {/* Slide 1: Launch Video */}
                <section className="h-screen snap-start relative flex items-center justify-center bg-black" style={{ scrollSnapAlign: "start" }}>
                    <div className="absolute inset-0">
                        <Image
                            src="https://dreamplaypianos.com/images/keyboards/Main-Product-In-Studio-1-1_1.avif"
                            alt="DreamPlay One"
                            fill
                            className="object-cover opacity-40"
                            priority
                        />
                    </div>
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="relative z-10 flex flex-col items-center text-center px-6">
                        {!isVideoPlaying ? (
                            <>
                                <h1 className="font-serif text-4xl md:text-6xl lg:text-8xl text-white leading-tight max-w-4xl text-balance" style={{ textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
                                    The Piano That Fits <em className="text-amber-400 not-italic font-serif italic">Your</em> Hands
                                </h1>
                                <p className="mt-6 font-sans text-sm md:text-base text-white/50">Click to watch our official launch video</p>

                                {/* Pulsating play button — centered below subtitle */}
                                <button
                                    onClick={playVideo}
                                    className="mt-8 group cursor-pointer relative"
                                >
                                    {/* Outer pulsating ring */}
                                    <span className="absolute inset-0 -m-3 rounded-full border-2 border-white/20 animate-ping" />
                                    {/* Middle glow ring */}
                                    <span className="absolute inset-0 -m-2 rounded-full border border-white/10 animate-pulse" />
                                    {/* Button */}
                                    <span
                                        className="relative flex items-center justify-center w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/10 backdrop-blur-sm border border-white/30 group-hover:bg-white/20 transition-all"
                                        style={{ boxShadow: "0 0 30px rgba(255,255,255,0.08), 0 0 60px rgba(255,255,255,0.04)" }}
                                    >
                                        <Play className="w-6 h-6 md:w-10 md:h-10 text-white fill-white ml-1" />
                                    </span>
                                </button>
                            </>
                        ) : (
                            <div
                                className="fixed inset-0 z-50 bg-black flex flex-col md:relative md:inset-auto md:z-auto md:bg-transparent md:w-full md:max-w-6xl md:block"
                                style={{ perspective: "1000px" }}
                            >
                                {/* Close button bar — always visible above video */}
                                <div className="flex-shrink-0 flex justify-end items-center px-4 py-3 md:hidden" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsVideoPlaying(false); }}
                                        className="z-[60] w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white transition-colors cursor-pointer"
                                        aria-label="Close video"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                                {/* Desktop close button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsVideoPlaying(false); }}
                                    className="hidden md:flex absolute -top-10 right-0 z-30 w-8 h-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                                    aria-label="Close video"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                                {/* Video — flex-1 so it fills remaining space below the close bar */}
                                <div className="flex-1 min-h-0 flex items-center justify-center" onClick={() => setIsVideoPlaying(false)}>
                                    <video
                                        ref={videoRef}
                                        className="w-full max-h-full object-contain md:aspect-video md:h-auto md:rounded-2xl md:shadow-2xl"
                                        style={{ transform: "rotateX(0deg)", transformOrigin: "center center" }}
                                        controls
                                        autoPlay
                                        playsInline
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <source src="https://pub-ae162277c7104eb2b558af08104deafc.r2.dev/Final%204k%20Video%20DreamPlay%20Intro.mp4" type="video/mp4" />
                                    </video>
                                </div>
                            </div>
                        )}
                    </div>
                    <ScrollIndicator onNav={scrollToSlide} next={1} />
                </section>

                {/* Slide 2: 55% Stats with horizontal swipe */}
                <section className="h-screen relative bg-black overflow-hidden" style={{ scrollSnapAlign: "start" }}>
                    <div className="h-full flex transition-transform duration-500" style={{ transform: `translateX(-${statsHorizontalSlide * 100}%)` }}>
                        {/* Horizontal Slide 0: History (Beethoven/Chopin) */}
                        <div className="h-full w-full flex-shrink-0 relative flex items-center justify-center bg-[#0a0a0f] px-6 md:px-16 overflow-y-auto">
                            <div className="w-full max-w-6xl mx-auto grid md:grid-cols-2 gap-4 landscape:gap-3 md:gap-12 items-center py-16 landscape:py-4">
                                <div className="space-y-4 landscape:space-y-2 order-2 md:order-1">
                                    <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-amber-400 font-bold mb-2 landscape:mb-0">Historical Context</p>
                                    <h2 className="font-serif text-2xl landscape:text-xl md:text-4xl lg:text-5xl tracking-tight leading-tight text-white">
                                        Beethoven and Chopin wrote their masterpieces while playing a narrower piano keyboard than our modern one.
                                    </h2>
                                    <p className="font-sans text-base md:text-lg text-white/80 leading-relaxed font-medium italic border-l-2 border-amber-400 pl-4">
                                        Why are small and medium-handed pianists playing an oversized keyboard meant for large hands?
                                    </p>
                                    <div className="space-y-2 landscape:space-y-1 font-sans text-base md:text-lg landscape:text-xs text-white/60 mt-4 landscape:mt-2">
                                        <p>• Prior to the 1880s, pianos featured much narrower keys, perfectly suited for rapid, intricate finger work.</p>
                                        <p>• The modern 6.5&quot; octave was standardized in the late 19th century merely to accommodate heavy cast-iron frames and large hammers.</p>
                                        <p>• It was built for the massive hands of romantic giants like Liszt, not the average pianist.</p>
                                    </div>
                                    <div className="pt-4">
                                        <Link
                                            href="/historical-facts"
                                            target="_blank"
                                            className="inline-flex items-center gap-2 px-8 py-4 border border-white/20 bg-white/5 hover:bg-white/10 text-white font-sans text-xs uppercase tracking-widest transition-colors rounded-full"
                                        >
                                            Learn more about history <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                                <div className="order-1 md:order-2 relative aspect-video md:aspect-[4/5] landscape:aspect-[3/2] landscape:max-h-[60vh] rounded-2xl overflow-hidden border border-white/10 shadow-2xl max-w-md mx-auto w-full lg:max-w-none group hidden landscape:max-md:hidden md:block">
                                    <Image
                                        src="/images/stock/franz-liszt-in-colour-1546939903-large-article-0.jpg"
                                        alt="Franz Liszt, a pianist with large hands who helped standardize the modern wide keyboard"
                                        fill
                                        className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                    <div className="absolute bottom-4 left-0 right-0 text-center">
                                        <p className="text-white/80 font-sans text-[10px] uppercase tracking-widest">Franz Liszt (1811–1886)</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setStatsHorizontalSlide(1)}
                                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                                aria-label="Next"
                            >
                                <ChevronRight className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        {/* Horizontal Slide 1: Hidden Barrier (87% / 24%) */}
                        <div className="h-full w-full flex-shrink-0 relative bg-[#050505] flex items-center justify-center overflow-y-auto">
                            <div className="w-full max-w-5xl px-6 py-8 landscape:py-3">
                                <div className="text-center mb-4 landscape:mb-2 md:mb-12">
                                    <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2 landscape:mb-1">The Data</p>
                                    <h2 className="font-serif text-3xl md:text-5xl tracking-tight leading-tight text-white">The Hidden Barrier</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-4 md:gap-12 lg:gap-16">
                                    <div className="flex flex-col items-center">
                                        <div className="text-center mb-3 md:mb-6">
                                            <div className="font-serif text-3xl md:text-5xl font-bold mb-1 md:mb-2 text-[#c0392b]">87%</div>
                                            <div className="font-sans text-sm md:text-lg font-medium text-white/60 mb-1 md:mb-2">of females</div>
                                            <p className="font-sans text-xs md:text-sm text-white/40 max-w-[260px] mx-auto leading-relaxed hidden md:block">
                                                Have hand spans smaller than the 8.5 inch minimum that standard keyboards expect.
                                            </p>
                                        </div>
                                        <div className="bg-white/[0.03] border border-white/10 rounded-none p-4 md:p-8 w-full max-w-sm flex flex-col items-center">
                                            <DonutChart percent={87} label="" theme="dark" />
                                            <div className="flex gap-4 md:gap-8 text-[10px] md:text-xs font-medium text-white/50 mt-4 md:mt-6">
                                                <div className="flex items-center gap-1.5 md:gap-2.5"><span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[#c0392b]"></span>Too small</div>
                                                <div className="flex items-center gap-1.5 md:gap-2.5"><span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[#1e7a3a]"></span>Comfortable</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="text-center mb-3 md:mb-6">
                                            <div className="font-serif text-3xl md:text-5xl font-bold mb-1 md:mb-2 text-[#c0392b]">24%</div>
                                            <div className="font-sans text-sm md:text-lg font-medium text-white/60 mb-1 md:mb-2">of males</div>
                                            <p className="font-sans text-xs md:text-sm text-white/40 max-w-[260px] mx-auto leading-relaxed hidden md:block">
                                                Also fall below the comfortable reach threshold for a standard 6.5 inch keyboard.
                                            </p>
                                        </div>
                                        <div className="bg-white/[0.03] border border-white/10 rounded-none p-4 md:p-8 w-full max-w-sm flex flex-col items-center">
                                            <DonutChart percent={24} label="" theme="dark" />
                                            <div className="flex gap-4 md:gap-8 text-[10px] md:text-xs font-medium text-white/50 mt-4 md:mt-6">
                                                <div className="flex items-center gap-1.5 md:gap-2.5"><span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[#c0392b]"></span>Too small</div>
                                                <div className="flex items-center gap-1.5 md:gap-2.5"><span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[#1e7a3a]"></span>Comfortable</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setStatsHorizontalSlide(0)}
                                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer rotate-180"
                                aria-label="Previous"
                            >
                                <ChevronRight className="w-6 h-6 text-white" />
                            </button>
                            <button
                                onClick={() => setStatsHorizontalSlide(2)}
                                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                                aria-label="Next"
                            >
                                <ChevronRight className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        {/* Horizontal Slide 2: Calculator ("Am I in that 87%?") */}
                        <div className="h-full w-full flex-shrink-0 relative bg-black flex items-center justify-center overflow-y-auto overflow-x-hidden">
                            <CalculatorSection />
                            <button
                                onClick={() => setStatsHorizontalSlide(1)}
                                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer rotate-180"
                                aria-label="Previous"
                            >
                                <ChevronRight className="w-6 h-6 text-white" />
                            </button>
                            <button
                                onClick={() => setStatsHorizontalSlide(3)}
                                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                                aria-label="Next"
                            >
                                <ChevronRight className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        {/* Horizontal Slide 3: Stats Slide (55%) */}
                        <div className="h-full w-full flex-shrink-0 relative overflow-y-auto">
                            <Image
                                src="/images/marketing/pianist-hands-on-narrow-keys.jpg"
                                alt="Hands playing narrow keys piano"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60" />
                            <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
                                <div className="flex flex-col lg:flex-row items-center gap-12">
                                    <div className="text-center lg:text-right">
                                        <div className="relative w-40 h-40 md:w-56 md:h-56 mx-auto lg:mx-0">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                                                <circle
                                                    cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="8"
                                                    strokeDasharray={`${55 * 2.83} ${100 * 2.83}`}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="font-serif text-5xl md:text-7xl text-white">55<span className="text-3xl md:text-5xl">%</span></span>
                                            </div>
                                        </div>
                                        <p className="mt-4 font-sans text-sm uppercase tracking-[0.3em] text-white">of Pianists Have Hands</p>
                                    </div>
                                    <div className="hidden lg:block h-40 w-px bg-white/60" />
                                    <div className="text-center lg:text-left">
                                        <p className="font-sans text-xs uppercase tracking-[0.3em] text-white/80">Under</p>
                                        <p className="font-serif text-6xl md:text-8xl text-white">8.5</p>
                                        <p className="font-sans text-sm uppercase tracking-[0.3em] text-white">Inches</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setStatsHorizontalSlide(2)}
                                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer rotate-180"
                                aria-label="Previous"
                            >
                                <ChevronRight className="w-6 h-6 text-white" />
                            </button>
                            <button
                                onClick={() => setStatsHorizontalSlide(4)}
                                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                                aria-label="Next"
                            >
                                <ChevronRight className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        {/* Horizontal Slide 4: Pain Point (Biomechanical) */}
                        <div className="h-full w-full flex-shrink-0 relative flex flex-col items-center justify-center bg-black px-6 md:px-16 overflow-y-auto">
                            <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl text-white mb-8 md:mb-12 text-center" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
                                Biomechanical Impact on Small Hands
                            </h2>
                            <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm">
                                <Image
                                    src="https://dreamplaypianos.com/images/Biomechanical%20Impact%20on%20Small%20Hands.png"
                                    alt="Diagram showing how wide piano keys cause hands injury in pianists with small hands"
                                    width={1200}
                                    height={700}
                                    className="w-full h-auto object-contain"
                                />
                            </div>
                            <Link
                                href="/how-it-works"
                                className="mt-8 md:mt-10 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/10 border border-white/20 text-white font-sans text-sm hover:bg-white/20 transition-all"
                            >
                                Learn more about the science <ChevronRight className="w-4 h-4" />
                            </Link>
                            <button
                                onClick={() => setStatsHorizontalSlide(3)}
                                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer rotate-180"
                                aria-label="Previous"
                            >
                                <ChevronRight className="w-6 h-6 text-white" />
                            </button>
                        </div>
                    </div>
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <button
                                key={i}
                                onClick={() => setStatsHorizontalSlide(i)}
                                className={`h-2 rounded-full transition-all cursor-pointer ${statsHorizontalSlide === i ? "bg-white w-6" : "bg-white/30 w-2"
                                    }`}
                                aria-label={`Slide ${i + 1}`}
                            />
                        ))}
                    </div>
                    <ScrollIndicator onNav={scrollToSlide} next={2} />
                </section>

                {/* Slide 3: Professor Quotes */}
                <section className="h-screen relative bg-black overflow-hidden" style={{ scrollSnapAlign: "start" }}>
                    <div className="h-full flex transition-transform duration-500" style={{ transform: `translateX(-${quoteHorizontalSlide * 100}%)` }}>
                        {professorQuotes.map((quote, index) => (
                            <div key={index} className="h-full w-full flex-shrink-0 flex items-center justify-center px-6 md:px-16 lg:px-24 relative overflow-y-auto">
                                <div className="max-w-4xl">
                                    <div className="border-l-2 border-white/20 pl-8 md:pl-12">
                                        <blockquote className="font-serif text-xl md:text-2xl lg:text-3xl leading-relaxed text-white/90">
                                            &ldquo;{quote.quote}&rdquo;
                                        </blockquote>
                                        <div className="mt-8 flex flex-col gap-1">
                                            <cite className="font-serif text-lg font-medium text-white not-italic">{quote.author}</cite>
                                            <span className="font-sans text-sm text-white/50">{quote.title}</span>
                                        </div>
                                    </div>
                                </div>
                                {index < professorQuotes.length - 1 && (
                                    <button
                                        onClick={() => setQuoteHorizontalSlide(index + 1)}
                                        className="absolute right-4 md:right-8 bottom-6 md:bottom-8 z-20 flex items-center gap-2 group cursor-pointer"
                                        aria-label="Next quote"
                                    >
                                        <span className="font-sans text-xs uppercase tracking-[0.2em] text-white/60 group-hover:text-white transition-colors">Next Slide</span>
                                        <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                                    </button>
                                )}
                                {index > 0 && (
                                    <button
                                        onClick={() => setQuoteHorizontalSlide(index - 1)}
                                        className="absolute left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer rotate-180"
                                        aria-label="Previous quote"
                                    >
                                        <ChevronRight className="w-6 h-6 text-white" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {professorQuotes.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setQuoteHorizontalSlide(i)}
                                className={`h-2 rounded-full transition-all cursor-pointer ${quoteHorizontalSlide === i ? "bg-white w-6" : "bg-white/30 w-2"
                                    }`}
                                aria-label={`Quote ${i + 1}`}
                            />
                        ))}
                    </div>
                    <ScrollIndicator onNav={scrollToSlide} next={3} />
                </section>

                {/* Slide 4: DreamPlay One Hero */}
                <section className="h-screen relative bg-black overflow-hidden" style={{ scrollSnapAlign: "start" }}>
                    <div className="h-full flex transition-transform duration-500" style={{ transform: `translateX(-${productHorizontalSlide * 100}%)` }}>
                        <div className="h-full w-full flex-shrink-0 relative flex flex-col items-center justify-center bg-black px-6 md:px-16 overflow-y-auto">
                            {/* Text */}
                            <p className="font-sans text-[10px] md:text-xs uppercase tracking-[0.3em] text-amber-400 mb-3">Introducing</p>
                            <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white text-center" style={{ textShadow: "0 0 30px rgba(255,255,255,0.1)" }}>DreamPlay One</h2>
                            <p className="mt-4 max-w-lg mx-auto font-sans text-sm md:text-base text-white/60 text-center">
                                The world&apos;s first premium digital piano with ergonomically scaled keys
                            </p>

                            {/* Glassmorphism hero card */}
                            <div className="mt-6 md:mt-10 relative w-full max-w-5xl rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
                                <Image
                                    src="/images/keyboards/piano-front-2.jpg"
                                    alt="DreamPlay One digital piano front view with narrow keys for small hands"
                                    width={1200}
                                    height={700}
                                    className="w-full h-auto object-cover"
                                />
                            </div>

                            <Link
                                href="/product-information"
                                className="mt-6 inline-flex items-center gap-2 px-8 py-4 border border-white/20 bg-white/5 hover:bg-white/10 text-white font-sans text-xs uppercase tracking-widest transition-colors rounded-full"
                            >
                                Learn more about our product <ArrowRight className="w-4 h-4" />
                            </Link>

                            {/* Next slide indicator — bottom right */}
                            <button
                                onClick={() => setProductHorizontalSlide(1)}
                                className="absolute right-4 md:right-8 bottom-6 md:bottom-8 z-20 flex items-center gap-2 group cursor-pointer"
                            >
                                <span className="font-sans text-xs uppercase tracking-[0.2em] text-white/60 group-hover:text-white transition-colors">Next Slide</span>
                                <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                            </button>
                        </div>

                        {/* Product Slide 2: Video */}
                        <div className="h-full w-full flex-shrink-0 relative flex items-center justify-center bg-black">
                            <video
                                className="w-full h-full object-cover"
                                autoPlay
                                loop
                                muted
                                playsInline
                                poster=""
                            >
                                <source src="https://pub-ae162277c7104eb2b558af08104deafc.r2.dev/Clip%202.m4v" type="video/mp4" />
                            </video>
                            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20">
                                <Link
                                    href="/product-information"
                                    className="inline-flex items-center gap-2 bg-white px-8 py-4 font-sans text-xs uppercase tracking-widest text-black hover:bg-white/90 transition-colors"
                                >
                                    View All Product Information <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                            <button
                                onClick={() => setProductHorizontalSlide(0)}
                                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer rotate-180"
                                aria-label="Previous"
                            >
                                <ChevronRight className="w-6 h-6 text-white" />
                            </button>
                            <button
                                onClick={() => setProductHorizontalSlide(2)}
                                className="absolute right-4 md:right-8 bottom-6 md:bottom-8 z-20 flex items-center gap-2 group cursor-pointer"
                            >
                                <span className="font-sans text-xs uppercase tracking-[0.2em] text-white/60 group-hover:text-white transition-colors">Next Slide</span>
                                <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                            </button>
                        </div>

                        {/* Product Slide 3: Designed for Learning (from /learn) */}
                        <div className="h-full w-full flex-shrink-0 relative flex flex-col items-center justify-center bg-[#050505] px-6 md:px-16 overflow-y-auto">
                            <div className="w-full max-w-6xl mx-auto py-12">
                                <div className="text-center mb-8">
                                    <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-3">Purpose-Built Hardware</p>
                                    <h2 className="font-serif text-3xl md:text-5xl text-white leading-tight">
                                        Designed for learning.
                                        <br />
                                        <span className="text-white/40">Built to last.</span>
                                    </h2>
                                </div>

                                {/* Full-width keyboard video */}
                                <div className="relative mb-8 overflow-hidden rounded-xl border border-white/10">
                                    <video
                                        className="w-full"
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                    >
                                        <source src="https://pub-9dd0751c546645238416e02409ccf084.r2.dev/videos/Clip-3.mp4" type="video/mp4" />
                                    </video>
                                </div>

                                {/* Two-column detail grid */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="relative overflow-hidden border border-white/10 rounded-lg">
                                        <Image
                                            src="/images/learn/keyboard-back-ports.jpg"
                                            alt="DreamPlay One back panel - USB, MIDI, Aux, Pedal, DC ports"
                                            width={600}
                                            height={400}
                                            className="w-full object-cover"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 md:p-6">
                                            <h3 className="font-serif text-lg md:text-xl font-semibold text-white">Full Connectivity</h3>
                                            <p className="mt-1 font-sans text-xs text-white/50">USB to Host, MIDI Out, Aux In, Pedal, DC Power</p>
                                        </div>
                                    </div>
                                    <div className="relative overflow-hidden border border-white/10 rounded-lg">
                                        <Image
                                            src="/images/learn/keyboard-led-lights.jpg"
                                            alt="LED keys close-up with colored lights"
                                            width={600}
                                            height={400}
                                            className="w-full object-cover"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 md:p-6">
                                            <h3 className="font-serif text-lg md:text-xl font-semibold text-white">Custom LED System</h3>
                                            <p className="mt-1 font-sans text-xs text-white/50">Color-coded keys guide every note</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setProductHorizontalSlide(1)}
                                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer rotate-180"
                                aria-label="Previous"
                            >
                                <ChevronRight className="w-6 h-6 text-white" />
                            </button>
                        </div>
                    </div>
                    <ScrollIndicator onNav={scrollToSlide} next={4} />
                </section>

                {/* Slide 5: LEDs / Learning App */}
                <section className="h-screen relative bg-black overflow-hidden" style={{ scrollSnapAlign: "start" }}>
                    <div className="h-full flex transition-transform duration-500" style={{ transform: `translateX(-${learnHorizontalSlide * 100}%)` }}>
                        <div className="h-full w-full flex-shrink-0 relative overflow-y-auto">
                            <LazyVideo
                                src="https://pub-9dd0751c546645238416e02409ccf084.r2.dev/videos/DreamPlay%20Grid%20Hero.mp4"
                                className="absolute inset-0"
                            />
                            <div className="absolute inset-0 bg-black/50" />
                            <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-6">
                                <h2 className="font-serif text-3xl md:text-4xl text-white mb-8">Learn Your Favorite Songs</h2>
                                <p className="font-sans text-white/60 max-w-xl mx-auto mb-12">Our companion app guides you through every note with visual feedback and progress tracking.</p>
                                <Link
                                    href="/learn"
                                    className="inline-flex items-center gap-2 bg-white px-8 py-4 font-sans text-xs uppercase tracking-widest text-black hover:bg-white/90 transition-colors"
                                >
                                    View All Learning Features <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                            <button
                                onClick={() => setLearnHorizontalSlide(1)}
                                className="absolute right-4 md:right-8 bottom-6 md:bottom-8 z-20 flex items-center gap-2 group cursor-pointer"
                                aria-label="Next"
                            >
                                <span className="font-sans text-xs uppercase tracking-[0.2em] text-white/60 group-hover:text-white transition-colors">Next Slide</span>
                                <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                            </button>
                        </div>
                        <div className="h-full w-full flex-shrink-0 relative">
                            <img
                                src="/images/marketing/DreamPlay piano with Midi app copy.png"
                                alt="DreamPlay Piano with MIDI App"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/75" />
                            <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-6">
                                <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white leading-tight max-w-3xl text-balance" style={{ textShadow: "0 4px 12px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.5)" }}>
                                    Dedicated learning app to improve even faster.
                                </h2>
                                <p className="mt-6 font-sans text-base text-white/70 max-w-xl">
                                    LED lights above every key make learning songs fast and fun. Want a classic look? They toggle off completely.
                                </p>
                            </div>
                            <button
                                onClick={() => setLearnHorizontalSlide(0)}
                                className="absolute left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer rotate-180"
                                aria-label="Previous"
                            >
                                <ChevronRight className="w-6 h-6 text-white" />
                            </button>
                        </div>
                    </div>
                    <ScrollIndicator onNav={scrollToSlide} next={5} />
                </section>

                {/* Slide 6: Expected Shipping */}
                <section className="h-screen relative bg-neutral-950 flex items-center justify-center overflow-hidden" style={{ scrollSnapAlign: "start" }}>
                    <div className="text-center px-6 max-w-5xl mx-auto">
                        <p className="font-sans text-xs uppercase tracking-[0.3em] text-white/50 mb-4">Expected Shipping</p>
                        <h2 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white">October 2026</h2>
                        <div className="mt-8 mx-auto max-w-3xl">
                            <img src="/images/stock/Worldmap.png" alt="World Map showing shipping regions" className="w-full h-auto object-contain opacity-70" />
                        </div>
                        <p className="mt-6 font-sans text-base text-white/60 max-w-md mx-auto">
                            We&apos;re working hard to bring DreamPlay One to your doorstep.
                        </p>
                        <Link
                            href="/information-and-policies/shipping"
                            className="mt-6 inline-flex items-center gap-2 border border-white/30 px-8 py-4 font-sans text-xs uppercase tracking-widest text-white hover:bg-white/10 transition-colors"
                        >
                            View Shipping Details <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <ScrollIndicator onNav={scrollToSlide} next={6} />
                </section>

                {/* Slide 7: Manufacturing */}
                <section className="h-screen relative bg-black flex flex-col items-center justify-center overflow-hidden" style={{ scrollSnapAlign: "start" }}>
                    <div className="w-full max-w-6xl px-6 flex flex-col items-center">
                        <div className="text-center mb-4 md:mb-8">
                            <p className="font-sans text-xs uppercase tracking-[0.3em] text-white/50 mb-2">Behind the Scenes</p>
                            <h2 className="font-serif text-3xl md:text-4xl text-white">Manufacturing Timeline</h2>
                            <p className="mt-2 font-sans text-sm text-white/40 max-w-md mx-auto md:hidden">
                                Inside our factory — from raw materials to finished keyboards.
                            </p>
                        </div>
                        {/* Mobile: 2x2 grid showing 4 key images */}
                        <div className="grid grid-cols-2 gap-2 md:hidden w-full">
                            {[factoryImages[0], factoryImages[2], factoryImages[5], factoryImages[7]].filter((img): img is string => img !== undefined).map((img, i) => (
                                <div key={i} className="aspect-square relative overflow-hidden bg-neutral-900 rounded-lg">
                                    <Image
                                        src={img}
                                        alt={`Manufacturing ${i + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                        {/* Desktop: full 4-col grid */}
                        <div className="hidden md:grid grid-cols-4 gap-2 w-full">
                            {factoryImages.map((img, i) => (
                                <div key={i} className="aspect-square relative overflow-hidden bg-neutral-900">
                                    <Image
                                        src={img}
                                        alt={`Manufacturing ${i + 1}`}
                                        fill
                                        className="object-cover hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="text-center mt-6 md:mt-8">
                            <Link
                                href="/production-timeline"
                                className="inline-flex items-center gap-2 bg-white px-8 py-4 font-sans text-xs uppercase tracking-widest text-black hover:bg-white/90 transition-colors rounded-full md:rounded-none"
                            >
                                View Production Timeline <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                    <ScrollIndicator onNav={scrollToSlide} next={7} />
                </section>

                {/* Slide 8: Social Proof */}
                <section className="h-screen relative bg-black flex items-center justify-center overflow-hidden" style={{ scrollSnapAlign: "start" }}>
                    <div className="text-center px-6">
                        <p className="font-sans text-xs uppercase tracking-[0.3em] text-white/50 mb-8">Join the Movement</p>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                            <div className="text-center">
                                <p className="font-serif text-6xl md:text-8xl text-white">120k</p>
                                <p className="mt-2 font-sans text-sm uppercase tracking-[0.2em] text-white/50">Reserved</p>
                            </div>
                            <div className="hidden md:block h-24 w-px bg-white/20" />
                            <div className="text-center">
                                <p className="font-serif text-6xl md:text-8xl text-white">300+</p>
                                <p className="mt-2 font-sans text-sm uppercase tracking-[0.2em] text-white/50">Confirmed Reservations</p>
                            </div>
                        </div>
                        <p className="mt-12 font-serif text-xl md:text-2xl text-white/80 italic max-w-2xl mx-auto text-balance">
                            Join the revolution of pianists escaping hand strain forever.
                        </p>
                    </div>
                    <ScrollIndicator onNav={scrollToSlide} next={8} />
                </section>

                {/* Slide 9: Official Price */}
                <section className="h-screen relative bg-white flex items-center justify-center overflow-hidden" style={{ scrollSnapAlign: "start" }}>
                    <div className="text-center px-6">
                        <p className="font-sans text-xs uppercase tracking-[0.3em] text-black/50 mb-4">Official Release Price</p>
                        <p className="font-sans text-sm text-black/60 mb-2">Here&apos;s how much DreamPlay One will cost once our product is officially released:</p>
                        <p className="font-serif text-7xl md:text-9xl text-black">$1,499</p>
                    </div>
                    <ScrollIndicator onNav={scrollToSlide} next={9} dark />
                </section>

                {/* Slide 10: But Wait */}
                <section className="h-screen relative bg-black flex items-center justify-center overflow-hidden" style={{ scrollSnapAlign: "start" }}>
                    <div className="text-center px-6">
                        <h2 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white italic">But wait...</h2>
                    </div>
                    <ScrollIndicator onNav={scrollToSlide} next={10} />
                </section>

                {/* Slide 11: Pricing */}
                <section className="h-screen relative bg-neutral-950 flex items-center justify-center overflow-hidden" style={{ scrollSnapAlign: "start" }}>
                    <div className="text-center px-6">
                        <p className="font-sans text-sm text-white/60 mb-4">TODAY, You can lock in our exclusive, <span className="underline">limited introductory</span> price of just</p>
                        <p className="font-serif text-6xl md:text-8xl text-white mb-12">$999</p>
                        <p className="font-sans text-sm text-white/50">Founder&apos;s pricing — limited time</p>
                    </div>
                    <ScrollIndicator onNav={scrollToSlide} next={11} />
                </section>

                {/* Slide 13: Money Back Guarantee */}
                <section className="h-screen relative bg-white flex items-center justify-center overflow-hidden" style={{ scrollSnapAlign: "start" }}>
                    <div className="max-w-3xl mx-auto text-center px-6">
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center">
                                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="font-serif text-3xl md:text-4xl text-black mb-8">Our Money Back Guarantee</h2>
                        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                            <span className="px-4 py-2 border border-black/20 font-sans text-sm text-black">Full Refund</span>
                            <span className="px-4 py-2 border border-black/20 font-sans text-sm text-black">Cancel Anytime</span>
                            <span className="px-4 py-2 border border-black/20 font-sans text-sm text-black">90 Day Trial</span>
                            <span className="px-4 py-2 border border-black/20 font-sans text-sm text-black">No Risk</span>
                            <span className="px-4 py-2 border border-black/20 font-sans text-sm text-black">Shipping Updates</span>
                        </div>
                        <div className="bg-neutral-100 p-8 md:p-12">
                            <p className="font-serif text-lg md:text-xl text-black leading-relaxed">
                                <strong>Our promise:</strong> When we are ready to ship to you, we will reach out to confirm with you, your exact shipping address. At this point, you may cancel and get a 100% full refund (no fees) if you changed your mind.
                            </p>
                        </div>
                        <div className="bg-neutral-100 p-8 md:p-12 mt-4">
                            <p className="font-serif text-lg md:text-xl text-black leading-relaxed">
                                When you reserve, your reservation is held in a separate escrow account and at any time you may request a full refund.
                            </p>
                        </div>
                        <Link
                            href="/information-and-policies/shipping"
                            className="mt-8 inline-block font-sans text-sm text-black/60 underline hover:no-underline"
                        >
                            View our full shipping &amp; taxes policy
                        </Link>
                    </div>
                    <ScrollIndicator onNav={scrollToSlide} next={12} dark />
                </section>

                {/* Slide 14: Founder Quotes */}
                <section className="h-screen relative bg-black overflow-hidden" style={{ scrollSnapAlign: "start" }}>
                    <div className="h-full flex transition-transform duration-500" style={{ transform: `translateX(-${founderHorizontalSlide * 100}%)` }}>
                        {founderQuotes.map((quote, index) => (
                            <div key={index} className="h-full w-full flex-shrink-0 flex items-center relative">
                                <div className="w-full max-w-6xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
                                    <div className="relative w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-full overflow-hidden flex-shrink-0">
                                        <Image src={quote.image} alt={quote.author} fill className="object-cover" />
                                    </div>
                                    <div className="flex-1 text-center lg:text-left">
                                        <blockquote className="font-serif text-xl md:text-2xl lg:text-3xl text-white/90 leading-relaxed">
                                            &ldquo;{quote.quote}&rdquo;
                                        </blockquote>
                                        <div className="mt-6">
                                            <cite className="font-serif text-lg text-white not-italic">{quote.author}</cite>
                                            <p className="font-sans text-sm text-white/50">{quote.title}</p>
                                        </div>
                                    </div>
                                </div>
                                {index < founderQuotes.length - 1 && (
                                    <button
                                        onClick={() => setFounderHorizontalSlide(index + 1)}
                                        className="absolute right-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                                        aria-label="Next quote"
                                    >
                                        <ChevronRight className="w-6 h-6 text-white" />
                                    </button>
                                )}
                                {index > 0 && (
                                    <button
                                        onClick={() => setFounderHorizontalSlide(index - 1)}
                                        className="absolute left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer rotate-180"
                                        aria-label="Previous quote"
                                    >
                                        <ChevronRight className="w-6 h-6 text-white" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {founderQuotes.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setFounderHorizontalSlide(i)}
                                className={`h-2 rounded-full transition-all cursor-pointer ${founderHorizontalSlide === i ? "bg-white w-6" : "bg-white/30 w-2"
                                    }`}
                                aria-label={`Quote ${i + 1}`}
                            />
                        ))}
                    </div>
                    <ScrollIndicator onNav={scrollToSlide} next={13} />
                </section>

                {/* Slide 15: Ready to Take Next Step */}
                <section className="h-screen relative bg-neutral-950 flex items-center justify-center overflow-hidden" style={{ scrollSnapAlign: "start" }}>
                    <Image
                        src="/images/marketing/dreamplay-one-hero.jpg"
                        alt="DreamPlay One"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60" />
                    <div className="relative z-10 text-center px-6">
                        <h2 className="font-serif text-3xl md:text-5xl text-white mb-8">Ready to take the next step?</h2>
                        <Link
                            href="/customize"
                            onClick={() => void analytics.track("cta_click", { cta: "intro_offer_ready_order", href: "/customize" })}
                            className="inline-flex items-center gap-3 bg-white px-12 py-6 font-sans text-sm uppercase tracking-widest text-black hover:bg-white/90 transition-colors"
                        >
                            Order Your DreamPlay One <ArrowRight className="w-5 h-5" />
                        </Link>
                        <p className="mt-6 font-sans text-sm text-white/50">Receive it by October 2026</p>
                    </div>
                    <ScrollIndicator onNav={scrollToSlide} next={14} />
                </section>

                {/* Slide 16: FAQ / Contact Form */}
                <section className="h-screen relative bg-white flex items-center justify-center overflow-y-auto" style={{ scrollSnapAlign: "start" }}>
                    <div className="w-full max-w-2xl px-6 py-12">
                        <div className="text-center mb-8">
                            <h2 className="font-serif text-3xl md:text-4xl text-black mb-3">Still have questions?</h2>
                            <p className="font-sans text-sm text-black/50 max-w-lg mx-auto leading-relaxed">
                                Visit our FAQ, or contact us here. We will love to hear from you. If you truly believe that this keyboard will change your piano playing experience, please tell us your story. We want to deliver your dream keyboard.
                            </p>
                        </div>

                        {isContactSubmitted ? (
                            <div className="text-center py-12">
                                <div className="mx-auto w-14 h-14 bg-green-50 border border-green-200 flex items-center justify-center mb-5">
                                    <CheckCircle2 className="w-7 h-7 text-green-600" />
                                </div>
                                <h3 className="font-serif text-2xl text-neutral-900 mb-3">Message Sent</h3>
                                <p className="font-sans text-sm text-neutral-500">We typically respond within 24–48 hours.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleContactSubmit}>
                                {contactError && (
                                    <div className="mb-4 p-3 border border-red-200 bg-red-50 text-red-700 text-sm font-sans">
                                        {contactError}
                                    </div>
                                )}
                                <div className="grid gap-4 md:grid-cols-2 mb-4">
                                    <div>
                                        <label className="block font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-1.5">Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={contactName}
                                            onChange={(e) => setContactName(e.target.value)}
                                            placeholder="Your name"
                                            className="w-full px-4 py-3 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:border-black focus:ring-0 outline-none font-sans text-sm transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-1.5">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={contactEmail}
                                            onChange={(e) => setContactEmail(e.target.value)}
                                            placeholder="you@email.com"
                                            className="w-full px-4 py-3 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:border-black focus:ring-0 outline-none font-sans text-sm transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-1.5">Message</label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={contactMessage}
                                        onChange={(e) => setContactMessage(e.target.value)}
                                        placeholder="Tell us how we can help..."
                                        className="w-full px-4 py-3 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:border-black focus:ring-0 outline-none font-sans text-sm transition-colors resize-none"
                                    />
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <button
                                        type="submit"
                                        disabled={isContactSubmitting}
                                        className="flex-1 w-full sm:w-auto flex items-center justify-center gap-2 bg-black text-white font-sans text-xs uppercase tracking-widest font-bold py-4 hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
                                    >
                                        {isContactSubmitting ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                Send Message
                                                <Send className="w-3 h-3" />
                                            </>
                                        )}
                                    </button>
                                    <Link
                                        href="/faq"
                                        className="flex-shrink-0 inline-flex items-center gap-2 border border-black px-8 py-4 font-sans text-xs uppercase tracking-widest text-black hover:bg-black hover:text-white transition-colors"
                                    >
                                        View FAQ <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                                <p className="text-center text-neutral-400 font-sans text-[10px] uppercase tracking-widest mt-3">
                                    We typically respond within 24–48 hours
                                </p>
                            </form>
                        )}
                    </div>
                    <ScrollIndicator onNav={scrollToSlide} next={15} dark />
                </section>

                {/* Slide 17: Buyer's Guide (Horizontal) */}
                <HorizontalBuyersGuide />

            </div>
        </>
    )
}
