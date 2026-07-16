"use client";
import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AnimatedSection } from "@/components/learn-page-components/animated-section";
import { LazyVideo } from "@/components/learn-page-components/lazy-video";
import {
    ArrowRight,
    Music,
    Hand,
    Lightbulb,
    Gauge,
    Zap,
    Eye,
    Volume2,
    CheckCircle2,
    Fingerprint,
    BookOpen,
    Layers,
} from "lucide-react";
import { UrgencySubtext } from "@/components/UrgencySubtext";

export default function LearnPage() {
    return (
        <div>
            <Navbar
                forceOpaque={true}
                darkMode={true}
                className="border-b border-white/10 bg-[#050505] backdrop-blur-md"
            />
            <main className="pt-[100px]">
                {/* ═══════════════════════════════════════════════════════════
                    SECTION 1 - HERO
                ═══════════════════════════════════════════════════════════ */}
                <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-[#050505] py-20 text-center">
                    {/* Background video: dual-element crossfade for seamless loops */}
                    <div className="absolute inset-0" ref={(container) => {
                        if (!container || container.dataset.initialized) return;
                        container.dataset.initialized = "true";

                        const sources = [
                            { src: "https://pub-9dd0751c546645238416e02409ccf084.r2.dev/videos/DreamPlay%20Grid%20Hero.mp4", startAt: 0, endBefore: 0, fadeMs: 600 },
                            { src: "https://pub-9dd0751c546645238416e02409ccf084.r2.dev/videos/Falling%20Notes%20Mode.mp4", startAt: 0, endBefore: 0, fadeMs: 600 },
                            { src: "https://pub-9dd0751c546645238416e02409ccf084.r2.dev/videos/UI%20Play%20through%202.mp4", startAt: 2, endBefore: 1.5, fadeMs: 400 },
                        ];
                        let idx = 0;

                        // Create two stacked video elements for crossfading
                        const vids = [0, 1].map(() => {
                            const v = document.createElement("video");
                            v.muted = true;
                            v.playsInline = true;
                            v.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 600ms ease-in-out;";
                            container.appendChild(v);
                            return v;
                        });

                        let active = 0; // which of the two video elements is currently visible

                        function loadAndPlay(vidEl: HTMLVideoElement, clipIdx: number) {
                            const clip = sources[clipIdx];
                            if (!clip) return;
                            vidEl.src = clip.src;
                            vidEl.currentTime = clip.startAt;
                            vidEl.play().catch(() => { });
                        }

                        function scheduleTransition(vidEl: HTMLVideoElement, clipIdx: number) {
                            const clip = sources[clipIdx];
                            if (!clip) return;
                            if (clip.endBefore > 0) {
                                // Cut clip short: trigger crossfade early
                                vidEl.ontimeupdate = () => {
                                    if (vidEl.duration && vidEl.currentTime >= vidEl.duration - clip.endBefore - (clip.fadeMs / 1000)) {
                                        vidEl.ontimeupdate = null;
                                        triggerNext();
                                    }
                                };
                            } else {
                                // Play full clip: crossfade on natural end
                                vidEl.onended = () => {
                                    vidEl.onended = null;
                                    triggerNext();
                                };
                            }
                        }

                        function triggerNext() {
                            const nextActive = 1 - active;
                            const nextIdx = (idx + 1) % sources.length;
                            const nextVid = vids[nextActive];
                            const curVid = vids[active];
                            if (!nextVid || !curVid) return;

                            loadAndPlay(nextVid, nextIdx);
                            // Set per-clip fade duration and crossfade
                            const fadeMs = sources[idx]?.fadeMs ?? 0;
                            nextVid.style.transition = `opacity ${fadeMs}ms ease-in-out`;
                            curVid.style.transition = `opacity ${fadeMs}ms ease-in-out`;
                            nextVid.style.opacity = "1";
                            curVid.style.opacity = "0";

                            idx = nextIdx;
                            active = nextActive;
                            scheduleTransition(nextVid, nextIdx);
                        }

                        // Start first clip
                        const firstVid = vids[0];
                        if (firstVid) {
                            loadAndPlay(firstVid, 0);
                            firstVid.style.opacity = "1";
                            active = 0;
                            scheduleTransition(firstVid, 0);
                        }
                    }} />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#050505]/60 via-[#050505]/20 to-[#050505]/90" />

                    <AnimatedSection className="relative z-10 mx-auto max-w-4xl px-6">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
                            <Zap className="h-3.5 w-3.5 text-cyan-400" />
                            <span className="font-sans text-[11px] uppercase tracking-[0.25em] text-white/60">
                                Software + Hardware Integration
                            </span>
                        </div>
                        <h1 className="mb-8 font-serif text-5xl font-semibold leading-tight tracking-tight text-white md:text-7xl lg:text-8xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                            Learn Piano.
                            <br />
                            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                                The Smart Way.
                            </span>
                        </h1>
                        <p className="mx-auto max-w-2xl font-sans text-lg leading-relaxed text-white/70 md:text-xl">
                            DreamPlay Learn guides you note by note, on screen and on your keyboard.
                            With LED-lit keys, finger indicators, and intelligent error correction,
                            every practice session is a step forward.
                        </p>
                        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                            <Link
                                href="/customize"
                                className="group inline-flex items-center justify-center gap-3 border border-white bg-white px-8 py-4 font-sans text-xs font-bold uppercase tracking-widest text-black transition-all hover:bg-neutral-200"
                            >
                                Reserve Now
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                            <a
                                href="#features"
                                className="inline-flex items-center gap-2 font-sans text-sm text-white/60 underline underline-offset-4 decoration-white/20 hover:text-white/90 hover:decoration-white/50 transition-colors"
                            >
                                See how it works
                            </a>
                        </div>
                    </AnimatedSection>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 2 - DUAL MODE (Sheet Music + Falling Notes)
                ═══════════════════════════════════════════════════════════ */}
                <section id="features" className="bg-white py-24 text-black md:py-32">
                    <div className="container mx-auto max-w-6xl px-6">
                        <AnimatedSection className="mb-20 text-center">
                            <p className="mb-4 font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-400">
                                Choose Your View
                            </p>
                            <h2 className="mb-6 font-serif text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                                Two Modes. One Goal.
                            </h2>
                            <p className="mx-auto max-w-2xl font-sans text-base leading-relaxed text-neutral-600">
                                Whether you read sheet music or prefer visual falling notes, DreamPlay Learn adapts to your learning style. Toggle between modes, or use both at once.
                            </p>
                        </AnimatedSection>

                        <div className="grid gap-8 md:grid-cols-2">
                            {/* Sheet Music Mode */}
                            <AnimatedSection delay={100} className="group relative overflow-hidden border border-neutral-200 bg-neutral-50 shadow-sm transition-all hover:shadow-xl">
                                <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                                    <img
                                        src="/images/learn/sheet-music-mode-real.jpg"
                                        alt="Sheet Music Mode"
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                </div>
                                <div className="p-8 md:p-10">
                                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white shadow-sm">
                                        <BookOpen className="h-5 w-5 text-neutral-800" />
                                    </div>
                                    <h3 className="mb-3 font-serif text-2xl font-semibold tracking-tight">
                                        Sheet Music Mode
                                    </h3>
                                    <p className="font-sans text-sm leading-relaxed text-neutral-600">
                                        Traditional notation with a modern twist. Notes highlight as you play, finger numbers guide your hand positioning, and the score scrolls automatically, waiting until you hit the right key before moving forward.
                                    </p>
                                </div>
                            </AnimatedSection>

                            {/* Falling Notes Mode */}
                            <AnimatedSection delay={200} className="group relative overflow-hidden border border-neutral-200 bg-neutral-50 shadow-sm transition-all hover:shadow-xl">
                                <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                                    <LazyVideo
                                        src="https://pub-9dd0751c546645238416e02409ccf084.r2.dev/videos/Falling%20Notes%20Mode.mp4"
                                        className="h-full w-full"
                                    />
                                </div>
                                <div className="p-8 md:p-10">
                                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center border border-neutral-200 bg-white shadow-sm">
                                        <Layers className="h-5 w-5 text-neutral-800" />
                                    </div>
                                    <h3 className="mb-3 font-serif text-2xl font-semibold tracking-tight">
                                        Falling Notes Mode
                                    </h3>
                                    <p className="font-sans text-sm leading-relaxed text-neutral-600">
                                        Colorful note blocks cascade toward the keys in real time. See exactly which note to play, when to play it, and for how long. No music reading required. Perfect for beginners and visual learners.
                                    </p>
                                </div>
                            </AnimatedSection>
                        </div>

                        {/* Both modes together callout */}
                        <AnimatedSection delay={300} className="mt-8 overflow-hidden border border-neutral-200 bg-neutral-50">
                            <div className="grid md:grid-cols-[1fr_1.5fr] items-center">
                                <div className="flex items-center gap-4 p-8 md:p-10">
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50">
                                        <Eye className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <p className="text-left font-sans text-sm leading-relaxed text-neutral-700">
                                        <strong className="text-black">Use both at once.</strong>{" "}
                                        Enable dual view to see falling notes and sheet music simultaneously: the best of both worlds.
                                    </p>
                                </div>
                                <div className="relative aspect-video overflow-hidden bg-neutral-100">
                                    <LazyVideo
                                        src="https://pub-9dd0751c546645238416e02409ccf084.r2.dev/videos/UI%20Play%20through%202.mp4"
                                        className="h-full w-full"
                                        startAt={2}
                                    />
                                </div>
                            </div>
                        </AnimatedSection>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 3 - SMART GUIDANCE & ERROR CORRECTION
                ═══════════════════════════════════════════════════════════ */}
                <section className="bg-[#050505] py-24 text-white md:py-32">
                    <div className="container mx-auto max-w-6xl px-6">
                        <AnimatedSection className="mb-20 text-center">
                            <p className="mb-4 font-sans text-[10px] uppercase tracking-[0.3em] text-white/50">
                                Intelligent Learning
                            </p>
                            <h2 className="mb-6 font-serif text-4xl font-semibold md:text-5xl">
                                Every note, every finger.
                                <br />
                                <span className="text-white/60">Guided.</span>
                            </h2>
                        </AnimatedSection>

                        <div className="grid gap-6 md:grid-cols-3">
                            {/* Feature 1 */}
                            <AnimatedSection delay={100} className="border border-white/10 bg-white/[0.03] p-8 md:p-10">
                                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10">
                                    <Fingerprint className="h-6 w-6 text-cyan-400" />
                                </div>
                                <h3 className="mb-3 font-serif text-xl font-semibold">
                                    Finger Numbers
                                </h3>
                                <p className="font-sans text-sm leading-relaxed text-white/60">
                                    Every note is annotated with the exact finger to use. Build proper technique from day one. No bad habits, no guesswork.
                                </p>
                            </AnimatedSection>

                            {/* Feature 2 */}
                            <AnimatedSection delay={200} className="border border-white/10 bg-white/[0.03] p-8 md:p-10">
                                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
                                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                                </div>
                                <h3 className="mb-3 font-serif text-xl font-semibold">
                                    Wait-For-Correct
                                </h3>
                                <p className="font-sans text-sm leading-relaxed text-white/60">
                                    The song won&apos;t move forward until you&apos;ve pressed the right key. No rushing, no falling behind. Learn at exactly your pace.
                                </p>
                            </AnimatedSection>

                            {/* Feature 3 */}
                            <AnimatedSection delay={300} className="border border-white/10 bg-white/[0.03] p-8 md:p-10">
                                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
                                    <Music className="h-6 w-6 text-amber-400" />
                                </div>
                                <h3 className="mb-3 font-serif text-xl font-semibold">
                                    Gentle Correction
                                </h3>
                                <p className="font-sans text-sm leading-relaxed text-white/60">
                                    Hit a wrong note? The software gently reminds you of the correct one. No frustration, just clear, instant feedback that keeps you in flow.
                                </p>
                            </AnimatedSection>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 4 - LED INTEGRATION (The Big Differentiator)
                ═══════════════════════════════════════════════════════════ */}
                <section className="relative overflow-hidden bg-gradient-to-b from-[#050505] via-[#0a0f1a] to-[#050505] py-24 text-white md:py-32">
                    {/* Subtle glow effect */}
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[120px]" />

                    <div className="container relative z-10 mx-auto max-w-6xl px-6">
                        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                            <AnimatedSection>
                                <p className="mb-4 font-sans text-[10px] uppercase tracking-[0.3em] text-cyan-400/80">
                                    Hardware Meets Software
                                </p>
                                <h2 className="mb-8 font-serif text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                                    Your keys
                                    <br />
                                    <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                                        light up.
                                    </span>
                                </h2>
                                <div className="space-y-6 font-sans text-base leading-relaxed text-white/70">
                                    <p>
                                        DreamPlay Learn is <strong className="text-white">fully integrated with DreamPlay One</strong>. Thanks to our custom LED system built into every key, the next note you need to play physically
                                        <span className="text-cyan-300"> lights up on your keyboard</span>.
                                    </p>
                                    <p>
                                        Not just a virtual indicator on a screen, but a <strong className="text-white">real, physical light</strong> that glows beneath the key you need to press. Your eyes stay on the keyboard. Your hands stay in position. Learning becomes instinctive.
                                    </p>
                                </div>

                                <div className="mt-10 grid grid-cols-2 gap-4">
                                    <div className="border border-white/10 bg-white/5 p-5">
                                        <div className="mb-2 font-serif text-2xl font-bold text-white">Virtual</div>
                                        <p className="font-sans text-xs text-white/50">On-screen note indicators guide your eyes</p>
                                    </div>
                                    <div className="border border-cyan-500/30 bg-cyan-500/10 p-5">
                                        <div className="mb-2 font-serif text-2xl font-bold text-cyan-300">Physical</div>
                                        <p className="font-sans text-xs text-cyan-200/60">LED keys light up on your actual keyboard</p>
                                    </div>
                                </div>
                            </AnimatedSection>

                            <AnimatedSection delay={200}>
                                <div className="relative overflow-hidden border border-white/10 shadow-2xl shadow-cyan-500/10">
                                    <img
                                        src="/images/learn/pianist-led-keys.jpg"
                                        alt="Pianist playing DreamPlay One with LED-lit keys and Learn app on tablet"
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/50 to-transparent" />
                                </div>
                            </AnimatedSection>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 5 - TEMPO & SMART DETECTION
                ═══════════════════════════════════════════════════════════ */}
                <section className="bg-white py-24 text-black md:py-32">
                    <div className="container mx-auto max-w-6xl px-6">
                        <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr] lg:items-center">
                            <AnimatedSection>
                                <div className="relative overflow-hidden border border-neutral-200 shadow-xl">
                                    <LazyVideo
                                        src="https://pub-9dd0751c546645238416e02409ccf084.r2.dev/videos/Clip-4-transcode.mp4"
                                        className="h-full w-full"
                                    />
                                </div>
                            </AnimatedSection>

                            <AnimatedSection delay={200}>
                                <p className="mb-4 font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-400">
                                    Your Pace, Your Way
                                </p>
                                <h2 className="mb-8 font-serif text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                                    Speed up. Slow down.
                                    <br />
                                    Or just play.
                                </h2>
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center border border-neutral-200 bg-neutral-50">
                                            <Gauge className="h-5 w-5 text-neutral-800" />
                                        </div>
                                        <div>
                                            <h3 className="mb-1 font-sans text-sm font-bold text-black">Tempo Control</h3>
                                            <p className="font-sans text-sm leading-relaxed text-neutral-600">
                                                Adjust the tempo to match your current skill level. Start slow, and increase the speed as you master each passage.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center border border-neutral-200 bg-neutral-50">
                                            <Volume2 className="h-5 w-5 text-neutral-800" />
                                        </div>
                                        <div>
                                            <h3 className="mb-1 font-sans text-sm font-bold text-black">Smart MIDI Detection</h3>
                                            <p className="font-sans text-sm leading-relaxed text-neutral-600">
                                                Simply start playing and our app will detect exactly which part of the piece you&apos;re on, thanks to our high-quality MIDI connection. No need to scroll or search.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center border border-neutral-200 bg-neutral-50">
                                            <Hand className="h-5 w-5 text-neutral-800" />
                                        </div>
                                        <div>
                                            <h3 className="mb-1 font-sans text-sm font-bold text-black">Section Practice</h3>
                                            <p className="font-sans text-sm leading-relaxed text-neutral-600">
                                                Loop any section to practice difficult passages. Combine with slow tempo for maximum efficiency in your practice sessions.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </AnimatedSection>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 5.5 - HARDWARE SHOWCASE
                ═══════════════════════════════════════════════════════════ */}
                <section className="border-t border-white/10 bg-[#050505] py-24 text-white md:py-32">
                    <div className="container mx-auto max-w-6xl px-6">
                        <AnimatedSection>
                            <div className="mb-16 text-center">
                                <p className="mb-4 font-sans text-[10px] uppercase tracking-[0.3em] text-white/50">
                                    Purpose-Built Hardware
                                </p>
                                <h2 className="font-serif text-3xl font-semibold leading-tight md:text-5xl">
                                    Designed for learning.
                                    <br />
                                    <span className="text-white/40">Built to last.</span>
                                </h2>
                            </div>
                        </AnimatedSection>

                        {/* Full-width keyboard shot */}
                        <AnimatedSection>
                            <div className="relative mb-16 overflow-hidden">
                                <LazyVideo
                                    src="https://pub-9dd0751c546645238416e02409ccf084.r2.dev/videos/Clip-3.mp4"
                                    className="w-full"
                                />
                            </div>
                        </AnimatedSection>

                        {/* Two-column detail grid */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <AnimatedSection>
                                <div className="relative overflow-hidden border border-white/10">
                                    <img
                                        src="/images/learn/keyboard-back-ports.jpg"
                                        alt="DreamPlay One back panel - USB, MIDI, Aux, Pedal, DC ports"
                                        className="w-full object-cover"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                                        <h3 className="font-serif text-xl font-semibold text-white">Full Connectivity</h3>
                                        <p className="mt-1 font-sans text-xs text-white/50">USB to Host, MIDI Out, Aux In, Pedal, DC Power</p>
                                    </div>
                                </div>
                            </AnimatedSection>
                            <AnimatedSection delay={150}>
                                <div className="relative overflow-hidden border border-white/10">
                                    <img
                                        src="/images/learn/keyboard-led-lights.jpg"
                                        alt="LED keys close-up with colored lights"
                                        className="w-full object-cover"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                                        <h3 className="font-serif text-xl font-semibold text-white">Custom LED System</h3>
                                        <p className="mt-1 font-sans text-xs text-white/50">Color-coded keys guide every note</p>
                                    </div>
                                </div>
                            </AnimatedSection>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 6 - THE ONLY KEYBOARD (Differentiator)
                ═══════════════════════════════════════════════════════════ */}
                <section className="border-t border-white/10 bg-[#0a0a0f] py-24 text-white md:py-32">
                    <div className="container mx-auto max-w-4xl px-6 text-center">
                        <AnimatedSection>
                            <p className="mb-4 font-sans text-[10px] uppercase tracking-[0.3em] text-white/50">
                                Industry First
                            </p>
                            <h2 className="mb-8 font-serif text-3xl font-semibold leading-tight md:text-5xl">
                                The only keyboard with this level of
                                <br />
                                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    software + hardware integration.
                                </span>
                            </h2>

                            <p className="mx-auto mb-16 max-w-2xl font-sans text-base leading-relaxed text-white/60">
                                Other keyboards have apps. Other apps support keyboards. But no other product on the market combines custom-built LED hardware with intelligent learning software like DreamPlay does.
                            </p>

                            <div className="grid gap-6 md:grid-cols-3">
                                <div className="border border-white/10 bg-white/[0.03] p-8 text-left">
                                    <div className="mb-4 font-serif text-4xl font-bold text-cyan-400">01</div>
                                    <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-white">App Teaches</h3>
                                    <p className="font-sans text-sm text-white/50">
                                        Sheet music, falling notes, and finger numbers. Every piece broken down step by step.
                                    </p>
                                </div>
                                <div className="border border-white/10 bg-white/[0.03] p-8 text-left">
                                    <div className="mb-4 font-serif text-4xl font-bold text-blue-400">02</div>
                                    <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-white">Keys Light Up</h3>
                                    <p className="font-sans text-sm text-white/50">
                                        Custom LEDs illuminate the exact key to press in real time: a physical guide built into your instrument.
                                    </p>
                                </div>
                                <div className="border border-white/10 bg-white/[0.03] p-8 text-left">
                                    <div className="mb-4 font-serif text-4xl font-bold text-purple-400">03</div>
                                    <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-white">MIDI Connects</h3>
                                    <p className="font-sans text-sm text-white/50">
                                        High-quality MIDI ensures the app knows exactly what you&apos;re playing, enabling instant feedback and smart detection.
                                    </p>
                                </div>
                            </div>
                        </AnimatedSection>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 7 - CTA
                ═══════════════════════════════════════════════════════════ */}
                <section className="border-t border-white/10 bg-[#050505] py-24 text-center">
                    <div className="container mx-auto max-w-3xl px-6">
                        <AnimatedSection>
                            <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10">
                                <Lightbulb className="h-8 w-8 text-cyan-400" />
                            </div>
                            <h2 className="mb-6 font-serif text-4xl font-semibold text-white md:text-5xl">
                                Ready to learn
                                <br />
                                the smart way?
                            </h2>
                            <p className="mb-10 font-sans text-base text-white/60 md:text-lg">
                                DreamPlay Learn comes included with every DreamPlay One keyboard.
                                <br />
                                Start your piano journey today.
                            </p>
                            <Link
                                href="/customize"
                                className="group inline-flex items-center justify-center gap-3 border border-white bg-white px-8 py-4 font-sans text-xs font-bold uppercase tracking-widest text-black transition-all hover:bg-neutral-200"
                            >
                                Reserve Now
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                            <UrgencySubtext />
                        </AnimatedSection>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
