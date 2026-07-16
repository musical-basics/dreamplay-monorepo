"use client";

import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AnimatedSection } from "@/components/animated-section";
import { ChevronLeft, ChevronRight, ArrowRight, Factory, Maximize2, X } from "lucide-react";

// --- Fullscreen Carousel Lightbox ---
const Lightbox = ({ images, startIndex, onClose }: { images: { src: string; caption: string }[]; startIndex: number; onClose: () => void }) => {
    const [current, setCurrent] = useState(startIndex);
    const touchStartX = useRef<number | null>(null);

    const next = () => setCurrent((p) => (p + 1) % images.length);
    const prev = () => setCurrent((p) => (p - 1 + images.length) % images.length);

    const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0]?.clientX ?? null; };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
        if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); }
        touchStartX.current = null;
    };

    React.useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") next();
            if (e.key === "ArrowLeft") prev();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
        >
            <div
                className="relative max-w-5xl w-full mx-4 md:mx-8"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <Image
                    src={images[current]?.src ?? ""}
                    alt={images[current]?.caption ?? ""}
                    width={1200}
                    height={900}
                    className="w-full h-auto"
                />

                {/* Chevrons */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={prev}
                            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-black/60 border border-white/20 text-white rounded-full hover:bg-black/80 transition-colors cursor-pointer"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={next}
                            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-black/60 border border-white/20 text-white rounded-full hover:bg-black/80 transition-colors cursor-pointer"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </>
                )}

                {/* Caption + dots */}
                <div className="mt-4 text-center">
                    <p className="font-sans text-sm text-white/70 leading-relaxed mb-3">
                        <span className="text-white font-medium">Image {current + 1} of {images.length}:</span> {images[current]?.caption}
                    </p>
                    {images.length > 1 && (
                        <div className="flex justify-center gap-2 mb-3">
                            {images.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrent(idx)}
                                    className={`h-2 transition-all duration-300 cursor-pointer rounded-full ${current === idx ? 'w-6 bg-blue-500' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                                />
                            ))}
                        </div>
                    )}
                    <p className="font-sans text-xs text-white/50">Click anywhere to close</p>
                </div>
            </div>
        </div>
    );
};

// --- Mini Carousel Component ---
const MiniCarousel = ({ images }: { images: { src: string; caption: string }[] }) => {
    const [current, setCurrent] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);

    const nextSlide = () => setCurrent((prev) => (prev + 1) % images.length);
    const prevSlide = () => setCurrent((prev) => (prev - 1 + images.length) % images.length);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
        touchStartY.current = e.touches[0]?.clientY ?? null;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null || touchStartY.current === null) return;
        const deltaX = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
        const deltaY = (e.changedTouches[0]?.clientY ?? touchStartY.current) - touchStartY.current;
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (deltaX < 0) nextSlide();
            else prevSlide();
        }
        touchStartX.current = null;
        touchStartY.current = null;
    };

    if (!images || images.length === 0) return null;

    return (
        <>
            {lightboxOpen && createPortal(
                <Lightbox
                    images={images}
                    startIndex={current}
                    onClose={() => setLightboxOpen(false)}
                />,
                document.body
            )}
            <div
                className="relative w-full rounded-xl overflow-hidden border border-white/10 bg-[#050505] shadow-xl group"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <div
                    className="aspect-[4/3] w-full relative cursor-zoom-in"
                    onClick={() => setLightboxOpen(true)}
                >
                    {/* Background Blur for mixed aspect ratios */}
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl transform scale-110 transition-all duration-500"
                        style={{ backgroundImage: `url(${images[current]?.src ?? ""})` }}
                    />

                    {/* Main Image */}
                    <Image
                        src={images[current]?.src ?? ""}
                        alt="Production progress"
                        fill
                        className="absolute inset-0 w-full h-full object-contain transition-opacity duration-500 z-10"
                    />

                    {/* Enlarge icon hint */}
                    <div className="absolute top-3 right-3 z-20 w-7 h-7 flex items-center justify-center bg-black/50 border border-white/20 text-white/60 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 className="w-3.5 h-3.5" />
                    </div>

                    {/* Controls (visible on hover) */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center bg-black/50 border border-white/20 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center bg-black/50 border border-white/20 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 cursor-pointer"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>

                            {/* Dots */}
                            <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
                                {images.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={(e) => { e.stopPropagation(); setCurrent(idx); }}
                                        className={`h-1.5 transition-all duration-300 cursor-pointer ${current === idx ? 'w-4 bg-blue-500 rounded-full' : 'w-1.5 bg-white/50 hover:bg-white rounded-full'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
                {/* Caption + Click to enlarge */}
                <div className="p-4 bg-[#0a0a0f] border-t border-white/5 min-h-[75px]">
                    <p className="text-xs text-white/70 font-sans leading-relaxed mb-2">
                        <strong className="text-white/90">Image {current + 1} of {images.length}:</strong> {images[current]?.caption}
                    </p>
                    <p
                        className="text-[10px] text-white/30 font-sans uppercase tracking-widest flex items-center gap-1.5 cursor-pointer hover:text-white/50 transition-colors"
                        onClick={() => setLightboxOpen(true)}
                    >
                        <Maximize2 className="w-3 h-3" />
                        Click to enlarge
                    </p>
                </div>
            </div>
        </>
    );
};

export default function ProductionTimelinePage() {
    const timelineData = [
        {
            date: "June 2025",
            title: "Project Kickoff & Factory Partnership",
            description: "The DreamPlay project officially begins. Finding a manufacturer willing to take on a highly customized, low-volume (under 200 units) first batch was our biggest hurdle. Founder Lionel Yu traveled to Shenzhen to meet the engineering team at Ebulent Technologies. As a specialized \u2018custom order\u2019 facility, they had the exact precision capabilities we needed and believed in our mission.",
            images: [
                { src: "/images/factory-pictures/exterior.jpeg", caption: "The Ebulent Technologies manufacturing facility in Shenzhen, equipped for high-precision micro-engineering." },
                { src: "/images/factory-pictures/hq.jpg", caption: "Lionel arriving at the Ebulent Technologies headquarters in Shenzhen." },
                { src: "/images/factory-pictures/dinner.jpg", caption: "Celebrating the partnership and project kickoff with the lead engineering team." }
            ]
        },
        {
            date: "July 2025",
            title: "Early Planning & Proof-of-Concept",
            description: "Engineering the core architecture from the ground up. Because the physical pivot points and mechanical leverage of 15/16th-size keys differ entirely from standard keyboards, we couldn\u2019t rely on off-the-shelf software or firmware. Our team mapped entirely new velocity curves and logic diagrams, culminating in the first wired breadboard prototype to validate the custom sensor logic.",
            images: [
                { src: "/images/factory-pictures/whiteboard.jpg", caption: "Whiteboard calculations mapping the custom velocity curves and sound engine logic." },
                { src: "/images/factory-pictures/demo.jpg", caption: "The first working raw prototype board, testing mechanical resistance against custom PCB logic." }
            ]
        },
        {
            date: "October 2025",
            title: "PCBA & Electronics Integration",
            description: "Advancing to Printed Circuit Board Assembly (PCBA). Our engineering team finalized the primary logic boards, integrating the Bluetooth MIDI modules and the LED guide-light array onto the motherboard using precision Surface-Mount Technology (SMT). Strict Incoming Quality Control (IQC) protocols were established for all electronic components entering the production line.",
            images: [
                { src: "/images/factory-pictures/smt.jpeg", caption: "The Surface-Mount Technology (SMT) line where our motherboards are populated with precision components." },
                { src: "/images/factory-pictures/qc.jpg", caption: "Strict component logging and IQC (Incoming Quality Control) protocols ensuring every part meets spec." }
            ]
        },
        {
            date: "December 2025",
            title: "Steel Tooling & Injection Molding",
            description: "The most capital-intensive phase of hardware development. We commissioned the heavy custom steel molds required to cast our proprietary narrow keys. Each mold is precision-machined to tolerances of hundredths of a millimeter. High-pressure injection molding machinery was sourced and calibrated to ensure every key meets the strict dimensional requirements of the international DS Standard.",
            images: [
                { src: "/images/factory-pictures/mold.jpeg", caption: "The custom heavy steel mold engineered specifically for our proprietary 15/16th-size keys." },
                { src: "/images/factory-pictures/injection.jpeg", caption: "In-house injection molding machinery producing the first physical key batches." }
            ]
        },
        {
            date: "February 2026",
            title: "Chassis Design & Prototype Assembly",
            description: "Small-batch prototype manufacturing begins. The custom wood-insert keys are joined with our graded hammer-action mechanism and mounted into the structural chassis. Each assembled unit immediately enters rigorous lifecycle stress testing, simulating years of intensive use to guarantee long-term durability and an authentic acoustic playing feel.",
            images: [
                { src: "/images/factory-pictures/chassis.jpeg", caption: "The primary chassis structure fresh off the line, engineered to DS dimensional standards." },
                { src: "/images/factory-pictures/action.jpeg", caption: "A cross-section revealing the intricate graded hammer-action mechanism." },
                { src: "/images/factory-pictures/keys.jpeg", caption: "Solid wood-core inserts applied to the newly molded keys for premium feel and weight." },
                { src: "/images/factory-pictures/testing.jpg", caption: "The \u2018Key Life Test Machine\u2019 running durability cycles to validate decades of use." },
                { src: "/images/factory-pictures/keybeds.jpeg", caption: "Fully assembled DS5.5 and DS6.0 keybeds side-by-side, awaiting final enclosure." }
            ]
        },
        {
            date: "June 2026",
            title: "First Full Prototype Build",
            description: "The first complete prototype enters the build at our factory. The keys are the real, final DS6.0 size — what we have deliberately built larger is everything inside. By scaling up the internals (circuit boards, sensor array and electronics) for this first unit, our engineers get the room they need to prove out every core system, including the key action, before condensing it all into the slim final enclosure. A working prototype is expected by the end of July, with playable video to follow in August.",
            images: [
                { src: "/images/product-updates/june-2026-prototype-keybed.jpg", caption: "The first prototype keybed on the bench this month." },
                { src: "/images/product-updates/june-2026-render-front.jpg", caption: "Current front design render with the full-length LED guide array." },
                { src: "/images/product-updates/june-2026-render-wood.jpg", caption: "Design render exploring a premium wood-finish enclosure." },
                { src: "/images/product-updates/june-2026-render-front-alt.jpg", caption: "Front elevation render of the DreamPlay One." }
            ]
        }
    ];

    return (
        <div className="min-h-screen font-sans bg-[#050505] text-white selection:bg-blue-500/20">
            <Navbar forceOpaque={true} darkMode={true} className="border-b border-white/10 bg-[#050505] backdrop-blur-md" />

            <main className="pt-32 pb-24 overflow-hidden">
                {/* ═══ HERO ═══ */}
                <div className="max-w-3xl mx-auto px-6 text-center mb-20">
                    <AnimatedSection>
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
                            <Factory className="w-5 h-5 text-blue-400" />
                        </div>
                        <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-blue-400 font-bold mb-4">Behind the Scenes</p>
                        <h1 className="font-serif text-4xl md:text-6xl font-semibold tracking-tight leading-tight mb-6">
                            The Build Journey
                        </h1>
                        <p className="font-sans text-base md:text-lg text-white/60 leading-relaxed">
                            Building a custom hardware instrument from scratch requires precision, capital, and time. Follow our journey from the initial factory partnership to the final assembly line.
                        </p>
                    </AnimatedSection>
                </div>

                {/* ═══ TIMELINE ═══ */}
                <section className="max-w-5xl mx-auto px-6 relative">
                    {/* Center Line for Desktop */}
                    <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 via-white/10 to-transparent -translate-x-1/2 z-0"></div>
                    {/* Left Line for Mobile */}
                    <div className="md:hidden absolute left-[35px] top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 via-white/10 to-transparent z-0"></div>

                    <div className="space-y-16 md:space-y-24 relative z-10 py-12">
                        {timelineData.map((step, index) => {
                            const isEven = index % 2 === 0;
                            return (
                                <AnimatedSection key={index} className="relative flex flex-col md:flex-row items-center gap-8 md:gap-16">
                                    {/* Mobile Timeline Dot */}
                                    <div className="md:hidden absolute left-[29px] top-6 w-3 h-3 bg-[#050505] border-2 border-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)] z-10" />

                                    {/* Mobile Date Badge */}
                                    <div className="md:hidden ml-[56px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-[10px] uppercase tracking-widest px-3 py-1 self-start mt-4">
                                        {step.date}
                                    </div>

                                    {/* Left Column (Content or Image depending on alternating layout) */}
                                    <div className={`w-full md:w-1/2 pl-[56px] md:pl-0 pr-4 md:pr-0 ${isEven ? 'md:text-right' : 'md:order-2 md:text-left'}`}>
                                        <div className={`hidden md:inline-block bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold text-[10px] uppercase tracking-[0.2em] px-3 py-1 mb-4`}>
                                            {step.date}
                                        </div>
                                        <h3 className="font-serif text-2xl md:text-3xl font-bold mb-4">{step.title}</h3>
                                        <p className="font-sans text-sm md:text-base text-white/60 leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>

                                    {/* Center Dot (Desktop Only) */}
                                    <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#050505] border-2 border-blue-500 rounded-full z-10 items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.6)]">
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                    </div>

                                    {/* Right Column (Image Carousel) */}
                                    <div className={`w-full md:w-1/2 pl-[56px] md:pl-0 pr-4 md:pr-0 ${isEven ? '' : 'md:order-1'}`}>
                                        <div className={`p-2 bg-white/5 border border-white/10 rounded-xl transform transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 ${isEven ? 'md:-rotate-1' : 'md:rotate-1'}`}>
                                            <MiniCarousel images={step.images} />
                                        </div>
                                    </div>
                                </AnimatedSection>
                            );
                        })}
                    </div>
                </section>

                {/* ═══ WHERE WE ARE NOW (CTA BOX) ═══ */}
                <section className="px-6 max-w-4xl mx-auto mt-32">
                    <AnimatedSection>
                        <div className="relative border border-blue-500/30 bg-gradient-to-b from-blue-900/10 to-transparent p-8 md:p-16 text-center overflow-hidden rounded-2xl shadow-2xl">
                            {/* Glow effect */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent" />

                            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-blue-400 font-bold mb-4">Present Day</p>
                            <h2 className="font-serif text-3xl md:text-5xl font-semibold mb-6">The Final Validation Phase.</h2>
                            <p className="font-sans text-base md:text-lg text-white/70 leading-relaxed max-w-2xl mx-auto mb-10">
                                Right now, our factory is building the first full prototype — a validation unit that proves out the key action, sensors and electronics before final tooling. We expect a working prototype by the end of July, with playable video to follow in August, a final funding campaign in September, and official manufacturing beginning in November 2026.
                            </p>
                            <p className="font-sans text-base md:text-lg text-white/70 leading-relaxed max-w-2xl mx-auto mb-10">
                                Based on this timeline, we estimate our earliest backers will receive their keyboards in <strong className="text-white">January 2027</strong>. Reserve your spot today to be among the first to experience this groundbreaking instrument.
                            </p>

                            <Link href="/customize" className="group inline-flex items-center justify-center gap-3 border border-white bg-white px-8 py-4 font-sans text-xs font-bold uppercase tracking-widest text-black transition-all hover:bg-neutral-200 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                Secure My Allocation
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </AnimatedSection>
                </section>

            </main>

            <Footer />
        </div>
    );
}
