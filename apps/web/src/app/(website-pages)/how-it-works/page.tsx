"use client";
import React, { useEffect, useState, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { cn } from "@/lib/utils";
import OldTestimonialsSection from "@/components/checkout/OldTestimonialsSection";
import { InlineHandGuide } from "@/components/InlineHandGuide";
import { UrgencySubtext } from "@/components/UrgencySubtext";
import DonutChart from "@/components/DonutChart";

// --- HELPERS ---



/**
 * Animated Bar — accepts color directly
 */
const AnimatedBar = ({ targetWidth, color }: { targetWidth: number; color: string }) => {
    const [width, setWidth] = useState(0);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) {
                setTimeout(() => setWidth(targetWidth), 200);
                observer.disconnect();
            }
        });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [targetWidth]);

    return (
        <div ref={ref} className="h-3 w-full bg-neutral-200 rounded-none overflow-hidden">
            <div
                className="h-full transition-all duration-1000 ease-out rounded-none"
                style={{ width: `${width}%`, backgroundColor: color }}
            />
        </div>
    );
};

export default function HowItWorksPage() {
    // --- CALCULATOR STATE ---
    const [sliderValue, setSliderValue] = useState(50);
    const [bioLightbox, setBioLightbox] = useState(false);
    const [result, setResult] = useState({
        val: 8.0,
        cm: 20.3,
        zone: "B",
        model: "DS6.0",
        desc: "The 'Goldilocks' size. Slightly narrower than standard, giving you the power of a concert pianist without the stretching fatigue.",
        reach: "Play 10ths with new ease",
        activeColor: "#f59e0b",
        activeTwColor: "text-amber-500",
    });

    const getRealValue = (percent: number) => {
        const visualZoneA_End = 33.33;
        const visualZoneB_End = 66.66;
        if (percent <= visualZoneA_End) {
            return 6.0 + (percent / visualZoneA_End) * (7.6 - 6.0);
        } else if (percent <= visualZoneB_End) {
            const relativeP = (percent - visualZoneA_End) / (visualZoneB_End - visualZoneA_End);
            return 7.6 + relativeP * (8.5 - 7.6);
        } else {
            const relativeP = (percent - visualZoneB_End) / (100 - visualZoneB_End);
            return 8.5 + relativeP * (10.0 - 8.5);
        }
    };

    /* eslint-disable react-hooks/set-state-in-effect -- legacy behavior: derive result state from slider value */
    useEffect(() => {
        const realVal = getRealValue(sliderValue);
        const cm = realVal * 2.54;
        if (realVal < 7.6) {
            setResult({ val: realVal, cm, zone: "A", model: "DS5.5", desc: "Standard keys are physically too wide for you. The DS5.5 solves this by shrinking the octave, instantly removing tension.", reach: "Finally play 9ths and 10ths comfortably. Octaves become way easier.", activeColor: "#f43f5e", activeTwColor: "text-rose-500" });
        } else if (realVal <= 8.5) {
            setResult({ val: realVal, cm, zone: "B", model: "DS6.0", desc: "The 'Goldilocks' size. Slightly narrower than standard, giving you the power of a concert pianist without the stretching fatigue.", reach: "Experience the joy of playing octaves with ease, and 9ths and 10ths without stretching.", activeColor: "#f59e0b", activeTwColor: "text-amber-500" });
        } else {
            setResult({ val: realVal, cm, zone: "C", model: "DS6.5", desc: "You fit the historical standard. Since your hands are naturally large, this model provides the traditional concert grand key width.", reach: "Enjoy our premium feel keys, fun LEDs and guided music learning app.", activeColor: "#2dd4bf", activeTwColor: "text-teal-400" });
        }
    }, [sliderValue]);
    /* eslint-enable react-hooks/set-state-in-effect */

    return (
        <div className="min-h-screen selection:bg-white/20">
            <Navbar forceOpaque={true} darkMode={true} className="border-b border-white/10 bg-[#050505] backdrop-blur-md" />

            <main className="flex flex-col items-center">

                {/* ═══ TESTIMONIALS — DARK ═══ */}
                <OldTestimonialsSection />

                {/* ═══ SECTION: THE HIDDEN BARRIER — DARK ═══ */}
                <section className="w-full bg-[#050505] text-white py-12 md:py-24 px-4 flex justify-center">
                    <div className="w-full max-w-[80rem] p-6 md:p-16">
                        <div className="text-center mb-20">
                            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-4">The Data</p>
                            <h2 className="font-serif text-4xl md:text-5xl tracking-tight leading-tight mb-6 text-white">The Hidden Barrier</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-16 lg:gap-24 mb-20">
                            {/* Chart 1: Females */}
                            <div className="flex flex-col items-center">
                                <div className="text-center mb-10">
                                    <div className="font-serif text-6xl font-bold mb-3 text-[#c0392b]">87%</div>
                                    <div className="font-sans text-xl font-medium text-white/60 mb-3">of females</div>
                                    <p className="font-sans text-sm text-white/40 max-w-[280px] mx-auto leading-relaxed">
                                        Have hand spans smaller than the 8.5 inch minimum that standard keyboards expect.
                                    </p>
                                </div>
                                <div className="bg-white/[0.03] border border-white/10 rounded-none p-10 w-full max-w-sm flex flex-col items-center hover:border-white/20 transition-all duration-500">
                                    <DonutChart percent={87} label="" theme="dark" />
                                    <div className="flex gap-8 text-xs font-medium text-white/50 mt-8">
                                        <div className="flex items-center gap-2.5"><span className="w-2.5 h-2.5 rounded-full bg-[#c0392b]"></span>Too small</div>
                                        <div className="flex items-center gap-2.5"><span className="w-2.5 h-2.5 rounded-full bg-[#1e7a3a]"></span>Comfortable</div>
                                    </div>
                                </div>
                            </div>

                            {/* Chart 2: Males */}
                            <div className="flex flex-col items-center">
                                <div className="text-center mb-10">
                                    <div className="font-serif text-6xl font-bold mb-3 text-[#c0392b]">24%</div>
                                    <div className="font-sans text-xl font-medium text-white/60 mb-3">of males</div>
                                    <p className="font-sans text-sm text-white/40 max-w-[280px] mx-auto leading-relaxed">
                                        Also fall below the comfortable reach threshold for a standard 6.5 inch keyboard.
                                    </p>
                                </div>
                                <div className="bg-white/[0.03] border border-white/10 rounded-none p-10 w-full max-w-sm flex flex-col items-center hover:border-white/20 transition-all duration-500">
                                    <DonutChart percent={24} label="" theme="dark" />
                                    <div className="flex gap-8 text-xs font-medium text-white/50 mt-8">
                                        <div className="flex items-center gap-2.5"><span className="w-2.5 h-2.5 rounded-full bg-[#c0392b]"></span>Too small</div>
                                        <div className="flex items-center gap-2.5"><span className="w-2.5 h-2.5 rounded-full bg-[#1e7a3a]"></span>Comfortable</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-16 mt-8 grid md:grid-cols-2 gap-12 text-center md:text-left">
                            <div className="px-4">
                                <div className="font-serif text-6xl font-bold mb-3 text-white">8.5&quot;</div>
                                <div className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-4">The Threshold</div>
                                <p className="font-sans text-base leading-relaxed text-white/60">
                                    Minimum hand span needed to play a conventional 6.5 inch keyboard from Yamaha or Steinway with real comfort.
                                </p>
                            </div>
                            <div className="px-4">
                                <div className="font-serif text-6xl font-bold mb-3 text-white">25 to 30%</div>
                                <div className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-4">Larger Reach Required</div>
                                <p className="font-sans text-base leading-relaxed text-white/60">
                                    Hand span often needs to be at least one quarter larger than the octave just to reach 8ths, 9ths, and 10ths without strain.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ SECTION 1: CALCULATOR — DARK ═══ */}
                <section className="w-full bg-[#050505] text-white pt-24 py-12 md:py-24 px-4 flex justify-center">
                    <div className="w-full max-w-[80rem] border border-white/10 rounded-none overflow-hidden p-6 md:p-16">
                        <div className="text-center mb-16">
                            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-4">Hand Span Calculator</p>
                            <h2 className="font-serif text-4xl md:text-5xl tracking-tight leading-tight mb-4 text-white">A Keyboard That Fits You.</h2>
                            <p className="font-sans text-sm md:text-base leading-relaxed text-white/60 max-w-2xl mx-auto">
                                DreamPlay&apos;s DS Standard keyboards come in different sizes to match your biology.
                            </p>
                        </div>

                        <div className="grid lg:grid-cols-12 gap-8">
                            {/* INPUT CARD */}
                            <div className="lg:col-span-7 rounded-none border border-white/10 p-8 md:p-10 bg-[#050505] flex flex-col">
                                <div className="flex items-center gap-3 mb-8 relative z-10">
                                    <div className="w-10 h-10 rounded-none bg-white/10 flex items-center justify-center text-xl text-white">📏</div>
                                    <div className="font-serif text-2xl font-semibold">Find Your Zone</div>
                                </div>

                                <div className="mb-12 relative z-10">
                                    <div className="flex justify-between items-end mb-6">
                                        <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50">Your hand span</span>
                                        <div className={`text-4xl font-bold ${result.activeTwColor} transition-colors duration-300`}>
                                            {result.val.toFixed(1)}&quot; <span className="text-white/40 text-lg font-normal">/ {result.cm.toFixed(1)} cm</span>
                                        </div>
                                    </div>

                                    {/* THE SLIDER CONTAINER */}
                                    <div className="relative w-full h-12 flex items-center justify-center">
                                        {/* Tri-Color Glow */}
                                        <div
                                            className="absolute left-0 right-0 h-3 blur-md opacity-60"
                                            style={{ background: 'linear-gradient(90deg, #f43f5e 0%, #f43f5e 33%, #f59e0b 33%, #f59e0b 66%, #2dd4bf 66%, #2dd4bf 100%)' }}
                                        ></div>
                                        {/* Tri-Color Track */}
                                        <div
                                            className="absolute left-0 right-0 h-1.5"
                                            style={{ background: 'linear-gradient(90deg, #f43f5e 0%, #f43f5e 33%, #f59e0b 33%, #f59e0b 66%, #2dd4bf 66%, #2dd4bf 100%)' }}
                                        ></div>
                                        <input
                                            type="range" min="0" max="100" step="0.5"
                                            value={sliderValue}
                                            onChange={(e) => setSliderValue(parseFloat(e.target.value))}
                                            className="w-full h-1.5 bg-transparent appearance-none cursor-pointer relative z-10"
                                        />
                                        <style jsx>{`
                                            input[type=range]::-webkit-slider-thumb {
                                                -webkit-appearance: none;
                                                height: 24px; width: 24px; border-radius: 0;
                                                background: #ffffff; cursor: pointer;
                                                border: 3px solid ${result.activeColor};
                                                box-shadow: 0 0 16px ${result.activeColor};
                                                transition: border-color 0.2s ease, box-shadow 0.2s ease;
                                                margin-top: -10px;
                                            }
                                            input[type=range]::-moz-range-thumb {
                                                height: 24px; width: 24px; border-radius: 0;
                                                background: #ffffff; cursor: pointer;
                                                border: 3px solid ${result.activeColor};
                                                box-shadow: 0 0 16px ${result.activeColor};
                                                transition: border-color 0.2s ease, box-shadow 0.2s ease;
                                                margin-top: -10px;
                                            }
                                            input[type=range]::-webkit-slider-runnable-track { background: transparent; height: 6px; }
                                        `}</style>
                                    </div>
                                    <div className="flex justify-between font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mt-4 px-1">
                                        <span>Small (6 in)</span><span>Average (8 in)</span><span>Large (10 in)</span>
                                    </div>
                                    <p className="font-sans text-xs text-white/40 text-center mt-4 italic">Drag the slider to see which Zone your hand size belongs to.</p>
                                </div>

                                <div className="bg-[#0a0a0a] rounded-none p-6 flex items-center gap-6 mt-auto relative z-10 border border-white/10">
                                    <div className="w-20 h-20 relative rounded-none overflow-hidden bg-black flex-shrink-0">
                                        <Image src="/images/hands/hand-size-comparison.jpg" alt="Hand span guide" fill className="object-cover opacity-80" />
                                    </div>
                                    <div>
                                        <div className="font-sans text-base font-semibold mb-1 text-white">How to measure</div>
                                        <p className="font-sans text-sm text-white/60 leading-relaxed">Spread your hand wide. Measure from the <strong>tip of the thumb</strong> to the <strong>tip of the pinky</strong>.</p>
                                    </div>
                                </div>
                            </div>

                            {/* RESULT CARD */}
                            <div className="lg:col-span-5 rounded-none border border-white/10 p-8 md:p-10 bg-[#050505] flex flex-col">
                                <div className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2">Your match</div>
                                <div className={`text-5xl font-bold mb-2 ${result.activeTwColor} transition-colors duration-300`}>Zone {result.zone}</div>
                                <div className="font-sans text-sm text-white/40 mb-8">Hand span range: {result.val < 7.6 ? '6.0 to 7.6 inches' : result.val <= 8.5 ? '7.6 to 8.5 inches' : '8.5 inches +'}</div>
                                <div className="font-serif text-6xl font-bold text-white mb-2 tracking-tight">{result.model}</div>
                                <div className="text-white/60 font-medium text-lg mb-8">
                                    Recommended model <br />
                                    <a href="/about-us/ds-standard" className="font-sans text-sm underline hover:text-white transition-colors">Learn about the DS Standard</a>
                                </div>
                                <p className="font-sans text-base leading-relaxed text-white/60 mb-8 flex-grow">{result.desc}</p>
                                <div className="mt-auto bg-[#0a0a0a] border border-white/10 rounded-none p-5 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-none bg-white/10 flex items-center justify-center text-green-500 text-xl">✓</div>
                                    <div>
                                        <div className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-0.5">Capability Unlocked</div>
                                        <div className="text-base font-semibold text-white">{result.reach}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ INLINE PDF HAND GUIDE ═══ */}
                <section className="w-full bg-[#f5f5f0] flex justify-center pt-0 pb-0">
                    <div className="w-full max-w-[80rem] px-4 md:px-6">
                        <InlineHandGuide />
                    </div>
                </section>


                {/* ═══ SECTION 2: UNLOCK YOUR POTENTIAL — LIGHT ═══ */}
                <section className="w-full bg-[#f5f5f0] text-black py-12 md:py-24 px-4 flex justify-center">
                    <div className="w-full max-w-[80rem] p-6 md:p-16">
                        <div className="text-center mb-20">
                            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-4">Performance</p>
                            <h2 className="font-serif text-4xl md:text-5xl tracking-tight leading-tight mb-6 text-black">Unlock Your Potential</h2>
                            <p className="font-sans text-sm md:text-base leading-relaxed text-neutral-600 max-w-2xl mx-auto">
                                Matching your hand size to the correct keyboard unlocks greater comfort, accuracy, and musical expression.
                            </p>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
                            {/* Zone A Card */}
                            <div className="rounded-none border border-neutral-200 bg-neutral-50 p-8 md:p-10 flex flex-col gap-8">
                                <div className="pb-6 border-b border-neutral-200">
                                    <h3 className="font-serif text-4xl font-bold text-rose-500 mb-2">Zone A Players</h3>
                                    <p className="font-sans text-sm text-neutral-500">Petite Hands / DS5.5 Standard</p>
                                </div>
                                <div className="space-y-8">
                                    <div>
                                        <div className="flex justify-between font-sans text-sm text-neutral-400 mb-3 tracking-wide">
                                            <span>Conventional (DS6.5)</span><span>8 Notes</span>
                                        </div>
                                        <AnimatedBar targetWidth={60} color="#d4d4d4" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between font-sans text-sm text-rose-500 font-bold mb-3 tracking-wide">
                                            <span>DS5.5 Model</span><span>10 Notes</span>
                                        </div>
                                        <AnimatedBar targetWidth={100} color="#f43f5e" />
                                    </div>
                                </div>
                            </div>

                            {/* Zone B Card */}
                            <div className="rounded-none border border-neutral-200 bg-neutral-50 p-8 md:p-10 flex flex-col gap-8">
                                <div className="pb-6 border-b border-neutral-200">
                                    <h3 className="font-serif text-4xl font-bold text-amber-500 mb-2">Zone B Players</h3>
                                    <p className="font-sans text-sm text-neutral-500">Average Hands / DS6.0 Standard</p>
                                </div>
                                <div className="space-y-8">
                                    <div>
                                        <div className="flex justify-between font-sans text-sm text-neutral-400 mb-3 tracking-wide">
                                            <span>Conventional (DS6.5)</span><span>9 Notes</span>
                                        </div>
                                        <AnimatedBar targetWidth={75} color="#d4d4d4" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between font-sans text-sm text-amber-500 font-bold mb-3 tracking-wide">
                                            <span>DS6.0 Model</span><span>10 Notes</span>
                                        </div>
                                        <AnimatedBar targetWidth={100} color="#f59e0b" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>



                {/* ═══ BIOMECHANICAL RESEARCH CARD ═══ */}
                <section className="w-full bg-[#050505] flex justify-center pb-12 md:pb-24">
                    <div className="w-full max-w-5xl px-4 md:px-6">
                        <div className="border border-white/10 bg-[#0a0a0f] overflow-hidden">

                            {/* Title Bar */}
                            <div className="border-b border-white/10 bg-white/[0.03] px-6 md:px-10 py-5 flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-[#c0392b]/60"></span>
                                    <span className="w-3 h-3 rounded-full bg-amber-500/60"></span>
                                    <span className="w-3 h-3 rounded-full bg-emerald-500/60"></span>
                                </div>
                                <span className="font-sans text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/40 font-medium ml-2">Clinical Research — Biomechanics</span>
                            </div>

                            {/* Card Content */}
                            <div className="p-6 md:p-10 lg:p-12">

                                {/* Header */}
                                <div className="mb-8 md:mb-10">
                                    <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/40 mb-3">Peer-Reviewed Analysis</p>
                                    <h3 className="font-serif text-2xl md:text-4xl font-semibold text-white leading-tight mb-4">
                                        How Standard Keyboards Cause Pain
                                    </h3>
                                    <p className="font-sans text-sm md:text-base text-white/60 leading-relaxed max-w-3xl">
                                        When small-handed pianists attempt to play octaves or large chords on a standard keyboard, they are forced completely out of an &quot;anatomically neutral&quot; position into a state of maximum stretch known as <strong className="text-white/90">hyperabduction</strong>.
                                    </p>
                                </div>

                                {/* Image — Clickable */}
                                <button
                                    onClick={() => setBioLightbox(true)}
                                    className="group relative border border-white/10 hover:border-white/25 transition-all duration-300 cursor-pointer overflow-hidden w-full mb-3"
                                >
                                    <Image
                                        src="/images/hands/Biomechanical Impact on Small Hands copy.png"
                                        alt="Biomechanical Impact of Key Width on Small Hands"
                                        width={1200}
                                        height={900}
                                        className="w-full h-auto opacity-90 group-hover:opacity-100 transition-opacity duration-300 scale-[1.3] object-cover"
                                    />
                                </button>
                                <button
                                    onClick={() => setBioLightbox(true)}
                                    className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/30 hover:text-white/60 transition-colors cursor-pointer mb-8 md:mb-10 block"
                                >
                                    Click to enlarge
                                </button>

                                {/* Explanation */}
                                <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-10">
                                    <div className="border border-white/10 bg-white/[0.03] p-5 md:p-6">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="w-3 h-3 rounded-full bg-[#c0392b]"></span>
                                            <span className="font-sans text-xs font-bold uppercase tracking-widest text-[#e74c3c]">Standard Keyboard (Left)</span>
                                        </div>
                                        <p className="font-sans text-sm text-white/60 leading-relaxed">
                                            Players depress keys with fingers splayed completely flat, destroying the supportive bridge-like arch of the hand. This is accompanied by severe <strong className="text-white/90">ulnar deviation</strong> — bending the wrist sharply toward the pinky — severely straining the lumbrical muscles and compressing the median nerve.
                                        </p>
                                    </div>
                                    <div className="border border-white/10 bg-white/[0.03] p-5 md:p-6">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                            <span className="font-sans text-xs font-bold uppercase tracking-widest text-emerald-400">Narrower Keyboard (Right)</span>
                                        </div>
                                        <p className="font-sans text-sm text-white/60 leading-relaxed">
                                            The same hand maintains an anatomically neutral arch and relaxed wrist position. Full mechanical leverage is restored, allowing arm weight to transfer directly into the keys — producing a richer, more powerful tone with zero strain.
                                        </p>
                                    </div>
                                </div>

                                {/* Key Findings */}
                                <div className="border-t border-white/10 pt-6 md:pt-8 mb-8 md:mb-10">
                                    <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/40 mb-4">Key Findings</p>
                                    <div className="grid sm:grid-cols-3 gap-4 md:gap-6">
                                        <div className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-full bg-[#c0392b]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3 text-[#e74c3c]"><path d="M18 6 6 18M6 6l12 12"></path></svg>
                                            </div>
                                            <p className="font-sans text-sm text-white/60"><strong className="text-white/90">86%</strong> of university piano majors experience active pain while playing</p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-full bg-[#c0392b]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3 text-[#e74c3c]"><path d="M18 6 6 18M6 6l12 12"></path></svg>
                                            </div>
                                            <p className="font-sans text-sm text-white/60">Over-stretching leads to <strong className="text-white/90">tendonitis, focal dystonia, and carpal tunnel syndrome</strong></p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3 text-emerald-400"><path d="M20 6 9 17l-5-5"></path></svg>
                                            </div>
                                            <p className="font-sans text-sm text-white/60">Narrower keyboards show a <strong className="text-white/90">drastic reduction in muscle fatigue</strong> via EMG</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Sources */}
                                <div className="border-t border-white/10 pt-6 md:pt-8">
                                    <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/40 mb-3">Sources</p>
                                    <ul className="space-y-2">
                                        <li className="font-sans text-xs text-white/40 leading-relaxed">
                                            Yoshimura, E., et al. (2006). <em>Risk factors for piano-related pain among college students and piano teachers.</em> Medical Problems of Performing Artists.
                                        </li>
                                        <li className="font-sans text-xs text-white/40 leading-relaxed">
                                            Sakai, N. (2008). <em>Keyboard Span in Old Musical Instruments Concerning Hand Span and Overuse Problems in Pianists.</em>
                                        </li>
                                        <li className="font-sans text-xs text-white/40 leading-relaxed">
                                            Wristen, B. (2000). <em>Avoiding Piano-Related Injury: A Proposed Theoretical Procedure for Biomechanical Analysis of Piano Technique.</em> Medical Problems of Performing Artists.
                                        </li>
                                    </ul>
                                </div>

                            </div>
                        </div>
                    </div>
                </section>


                {/* ═══ SECTION 4: RESEARCH — DARK ═══ */}
                <section className="w-full bg-[#050505] text-white flex flex-col items-center py-24 md:py-40">
                    <div className="w-full max-w-[80rem] px-6">
                        <div className="text-center mb-16">
                            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-4">Evidence</p>
                            <h2 className="font-serif text-4xl md:text-5xl tracking-tight leading-tight text-white mb-4">Published Research</h2>
                            <p className="font-sans text-base text-white/60 max-w-[36rem] mx-auto leading-relaxed">Decades of peer reviewed research explain why standard keyboards hold most pianists back.</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mb-16">
                            <div className="border border-white/10 bg-white/5 rounded-none p-10 flex flex-col hover:border-white/20 transition-all">
                                <div className="font-serif text-xl font-bold text-white mb-3">Hand size and performance related injuries</div>
                                <div className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-4">Applied Ergonomics, 2021</div>
                                <div className="font-sans text-sm text-white/60 leading-relaxed mb-8 flex-grow">Pianists with smaller hands show <strong>reduced muscular effort and lower perceived strain</strong> when they move to 5.5 inch octave keyboards instead of standard size.</div>
                                <a href="https://www.sciencedirect.com/science/article/abs/pii/S0003687021001654" target="_blank" className="group inline-flex items-center justify-center gap-2 border border-white bg-white px-8 py-4 font-sans text-xs uppercase tracking-widest text-black transition-colors hover:bg-white/90 w-fit">
                                    Read full study
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                                </a>
                            </div>
                            <div className="border border-white/10 bg-white/5 rounded-none p-10 flex flex-col hover:border-white/20 transition-all">
                                <div className="font-serif text-xl font-bold text-white mb-3">Gender differences and career impact</div>
                                <div className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-4">Susan Tomes</div>
                                <div className="font-sans text-sm text-white/60 leading-relaxed mb-8 flex-grow">Studies note that <strong>internationally acclaimed women pianists tend to have larger hands</strong>, which aligns with a repertoire that often expects very wide reaches.</div>
                                <a href="https://www.susantomes.com/blog/hand-size-gender-differences-pianists-acclaim/" target="_blank" className="group inline-flex items-center justify-center gap-2 border border-white bg-white px-8 py-4 font-sans text-xs uppercase tracking-widest text-black transition-colors hover:bg-white/90 w-fit">
                                    Read article
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                                </a>
                            </div>
                            <div className="border border-white/10 bg-white/5 rounded-none p-10 flex flex-col hover:border-white/20 transition-all">
                                <div className="font-serif text-xl font-bold text-white mb-3">Benefits of ergonomically scaled keyboards</div>
                                <div className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-4">Survey of reduced size users</div>
                                <div className="font-sans text-sm text-white/60 leading-relaxed mb-8 flex-grow">Players report <strong>relief from pain, faster technical progress, and greater comfort</strong> when they move to keyboards that match their hand span.</div>
                                <a href="https://www.researchgate.net/publication/264457999" target="_blank" className="group inline-flex items-center justify-center gap-2 border border-white bg-white px-8 py-4 font-sans text-xs uppercase tracking-widest text-black transition-colors hover:bg-white/90 w-fit">
                                    Read full study
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                                </a>
                            </div>
                            <div className="border border-white/10 bg-white/5 rounded-none p-10 flex flex-col hover:border-white/20 transition-all">
                                <div className="font-serif text-xl font-bold text-white mb-3">Performance quality improvements</div>
                                <div className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-4">PASK findings</div>
                                <div className="font-sans text-sm text-white/60 leading-relaxed mb-8 flex-grow"><strong>Shorter reaches and reduced wrist travel</strong> on compatible keyboards are linked to better control and lower risk of overuse injuries.</div>
                                <a href="https://paskpiano.org/performance-quality/" target="_blank" className="group inline-flex items-center justify-center gap-2 border border-white bg-white px-8 py-4 font-sans text-xs uppercase tracking-widest text-black transition-colors hover:bg-white/90 w-fit">
                                    Learn more
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                                </a>
                            </div>
                        </div>

                        <div className="border border-white/10 rounded-none p-10 bg-white/5">
                            <h3 className="font-serif text-2xl font-bold text-white mb-2">Academic recognition</h3>
                            <p className="font-sans text-sm text-white/60 leading-relaxed">The Donison Steinbuhler standard appears in research and teaching at leading institutions.</p>
                            <div className="grid md:grid-cols-2 gap-8 mt-10">
                                <div className="flex gap-4 items-start">
                                    <div className="w-6 h-6 bg-white/10 rounded-none flex items-center justify-center flex-shrink-0 border border-white/10">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }} className="text-[#34c759]"><path d="M20 6 9 17l-5-5"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-serif text-lg font-bold text-white mb-1">Stanford University</h4>
                                        <p className="font-sans text-sm text-white/60">Research and advocacy around scaled keyboards in music education and injury prevention.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="w-6 h-6 bg-white/10 rounded-none flex items-center justify-center flex-shrink-0 border border-white/10">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }} className="text-[#34c759]"><path d="M20 6 9 17l-5-5"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-serif text-lg font-bold text-white mb-1">Johns Hopkins Peabody Institute</h4>
                                        <p className="font-sans text-sm text-white/60">Use of alternative sizes inside curriculum and performance programs.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-10 text-center">
                                <a href="/about-us/ds-standard" className="group inline-flex items-center justify-center gap-2 border border-white bg-white px-8 py-4 font-sans text-xs uppercase tracking-widest text-black transition-colors hover:bg-white/90">
                                    Learn more about the DS Standard
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </section>


                {/* ═══ SECTION 5: CTA — DARK ═══ */}
                <section className="w-full bg-[#050505] text-white py-32 text-center border-t border-white/10">
                    <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-4">Get Started</p>
                    <h2 className="font-serif text-4xl md:text-5xl tracking-tight leading-tight mb-10 text-white">Ready to Play Pain-Free?</h2>
                    <a href="/customize" className="group inline-flex items-center justify-center gap-2 border border-white bg-white px-8 py-4 font-sans text-xs uppercase tracking-widest text-black transition-colors hover:bg-white/90">
                        Reserve Now
                    </a>
                    <UrgencySubtext />
                </section>

            </main>

            {/* Biomechanical Lightbox */}
            {bioLightbox && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-pointer"
                    onClick={() => setBioLightbox(false)}
                >
                    <div className="relative max-w-5xl w-full mx-4 md:mx-8">
                        <Image
                            src="/images/hands/Biomechanical Impact on Small Hands copy.png"
                            alt="Biomechanical Impact of Key Width on Small Hands"
                            width={1200}
                            height={900}
                            className="w-full h-auto scale-[1.3] object-cover"
                        />
                        <p className="text-center font-sans text-xs text-white/50 mt-4">
                            Click anywhere to close
                        </p>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
