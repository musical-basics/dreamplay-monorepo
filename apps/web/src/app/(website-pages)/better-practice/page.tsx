"use client";
import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AnimatedSection } from "@/components/animated-section";
import { ArrowRight, Quote, Brain, Crosshair } from "lucide-react";
import { UrgencySubtext } from "@/components/UrgencySubtext";

export default function BetterPracticePage() {
    return (
        <div>
            <Navbar forceOpaque={true} darkMode={true} className="border-b border-white/10 bg-[#050505] backdrop-blur-md" />
            <main className="pt-[100px]">
                {/* ═══ HERO — DARK ═══ */}
                <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-[#050505] py-20 text-center">
                    <div className="absolute inset-0">
                        <img src="/images/stock/BW Piano (1).jpg" alt="" className="h-full w-full object-cover opacity-30" />
                    </div>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#050505]/60 via-transparent to-[#050505]"></div>
                    <AnimatedSection className="relative z-10 mx-auto max-w-4xl px-6">
                        <p className="mb-6 font-sans text-[10px] uppercase tracking-[0.3em] text-white/50">
                            Performance &amp; Virtuosity
                        </p>
                        <h1 className="mb-8 font-serif text-5xl font-semibold leading-tight tracking-tight text-white md:text-7xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                            The Benefits Of Practicing on Narrower Keys
                        </h1>
                        <p className="mx-auto max-w-2xl font-serif text-2xl leading-relaxed text-white/90 md:text-3xl drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
                            Stop practicing the stretch.<br />
                            <span className="italic">Start playing the music.</span>
                        </p>
                    </AnimatedSection>
                </section>

                {/* ═══ THE 90% TRAP — LIGHT ═══ */}
                <section className="bg-white py-24 text-black md:py-32">
                    <div className="container mx-auto max-w-6xl px-6">
                        <div className="grid gap-16 lg:grid-cols-[1.2fr_1fr] lg:items-center">
                            <AnimatedSection>
                                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center border border-neutral-200 bg-neutral-50 shadow-sm">
                                    <Brain className="h-6 w-6 text-neutral-800" />
                                </div>
                                <h2 className="mb-8 font-serif text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                                    The Cognitive Load of Small Hands.
                                </h2>
                                <div className="space-y-6 font-sans text-base leading-relaxed text-neutral-600">
                                    <p>
                                        The greater the degree of technical difficulty for a pianist, <strong>the greater the amount of practice required</strong>. This means the pianist must spend more time on technical issues, with <span className="underline decoration-neutral-400 underline-offset-4">less time and mental capacity</span> to focus on musical issues.
                                    </p>
                                    <p>
                                        When small-handed pianists play a piece on a smaller keyboard that they previously learnt on the conventional keyboard, <strong>it is often a revelation</strong>. They immediately become aware of how much <span className="underline decoration-neutral-400 underline-offset-4">physical and mental effort</span> they previously had to invest just to &quot;get the notes&quot; in passages that were not &quot;under the hand&quot;.
                                    </p>
                                    <p>
                                        Suddenly, a pianist no longer has to focus on just reaching the octaves, but has the ability to <span className="underline decoration-neutral-400 underline-offset-4">relax the hand</span> and think about <strong>shaping the musical line</strong> being played by both hands.
                                    </p>
                                </div>
                            </AnimatedSection>
                            <AnimatedSection delay={200}>
                                <div className="relative border border-neutral-200 bg-neutral-50 p-10 shadow-xl md:p-12">
                                    <Quote className="absolute left-6 top-6 h-12 w-12 text-neutral-200" />
                                    <blockquote className="relative z-10 mb-8 pt-6 font-serif text-xl leading-relaxed text-neutral-900 md:text-2xl">
                                        &quot;I realize now, looking back, that most of the time I spent practicing was used trying to overcome difficulties because of my hand-size... If you spend 90% of the time trying to overcome limitations imposed by hand size, then you are truly disadvantaged.&quot;
                                    </blockquote>
                                    <div>
                                        <p className="font-sans text-sm font-bold uppercase tracking-wider text-black">Christopher Donison</p>
                                        <p className="mt-1 font-sans text-xs text-neutral-500">Executive Artistic Director, Music by the Sea (Co-inventor of DS keyboards)</p>
                                    </div>
                                </div>
                            </AnimatedSection>
                        </div>
                    </div>
                </section>

                {/* ═══ ENTERING THE FLOW STATE — LIGHT ═══ */}
                <section className="bg-white py-20 text-black md:py-28">
                    <div className="container mx-auto max-w-4xl px-6 text-center">
                        <AnimatedSection>
                            <p className="mb-4 font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-400">
                                The Result
                            </p>
                            <h3 className="mb-8 font-serif text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
                                Entering the Flow State.
                            </h3>
                            <p className="mx-auto max-w-2xl font-serif text-xl leading-relaxed text-neutral-600 md:text-2xl">
                                When you don&apos;t have to dedicate 50% of your brain&apos;s processing power to calculating awkward stretches, you enter the <span className="italic text-neutral-900">Flow State</span>. Your hands simply do what your heart feels. When you stop fighting the instrument, your true musical voice emerges.
                            </p>
                        </AnimatedSection>
                    </div>
                </section>

                {/* ═══ CLAUDIA WANG QUOTE — WARM ═══ */}
                <section className="border-y border-neutral-200 bg-[#f7f3ee] py-20 md:py-28">
                    <div className="container mx-auto max-w-3xl px-6 text-center">
                        <AnimatedSection>
                            <Quote className="mx-auto mb-8 h-8 w-8 text-[#c9a85c]" />
                            <blockquote className="mb-10 font-serif text-xl italic leading-relaxed text-neutral-800 md:text-2xl">
                                &ldquo;Everything is easier on the 6.0 for me… I feel very comfortable playing scales, fast passages, or big chords&rdquo;
                            </blockquote>
                            <div className="mx-auto mb-4 h-px w-12 bg-neutral-300"></div>
                            <p className="font-sans text-sm font-semibold tracking-wide text-[#c9a85c]">Claudia Wang</p>
                            <p className="mt-1 font-sans text-xs text-neutral-500">Master&apos;s Student at Southern Methodist University (SMU), Dallas</p>
                            <p className="font-sans text-xs text-neutral-500">Pianist With 7.2&quot; Handspan</p>
                        </AnimatedSection>
                    </div>
                </section>

                {/* ═══ VIDEO EVIDENCE — DARK ═══ */}
                <section className="bg-[#050505] py-24 text-white md:py-32">
                    <div className="container mx-auto max-w-6xl px-6">
                        <AnimatedSection className="mb-20 text-center">
                            <p className="mb-4 font-sans text-[10px] uppercase tracking-[0.3em] text-white/50">The Proof</p>
                            <h2 className="mb-6 font-serif text-4xl font-semibold md:text-5xl">See the difference instantly.</h2>
                            <p className="mx-auto max-w-2xl font-sans text-white/60">
                                Watch Concert Pianist Lionel Yu demonstrate how the DS6.0 transforms technically demanding repertoire into effortless performances.
                            </p>
                        </AnimatedSection>

                        {/* Top Row: 2 Shorts */}
                        <div className="mb-8 grid gap-8 md:grid-cols-2">
                            {/* Short 1 */}
                            <AnimatedSection delay={100} className="flex flex-col border border-white/10 bg-white/5 p-6 md:p-10">
                                <h3 className="mb-4 font-serif text-2xl font-semibold">Play Like Rachmaninoff.</h3>
                                <p className="mb-8 flex-grow font-sans text-sm leading-relaxed text-white/60">
                                    Rachmaninoff had notoriously large hands. For the rest of us, his repertoire means constant jumping and rolling. On the DS6.0, those impossible chords finally fall right under your fingers.
                                </p>
                                <div className="relative mx-auto aspect-[9/16] w-full max-w-[320px] overflow-hidden border border-white/10 bg-black shadow-2xl">
                                    <iframe
                                        className="absolute left-0 top-0 h-full w-full"
                                        src="https://www.youtube.com/embed/V9lxdJpgO0U"
                                        title="Rachmaninoff on DS6.0"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            </AnimatedSection>

                            {/* Short 2 */}
                            <AnimatedSection delay={200} className="flex flex-col border border-white/10 bg-white/5 p-6 md:p-10">
                                <h3 className="mb-4 font-serif text-2xl font-semibold">Effortless Octave Tremolos.</h3>
                                <p className="mb-8 flex-grow font-sans text-sm leading-relaxed text-white/60">
                                    Rapid octave passages—like the left hand of Beethoven&apos;s Pathétique—require a fraction of the muscular effort, allowing you to play faster, longer, and without fatigue.
                                </p>
                                <div className="relative mx-auto aspect-[9/16] w-full max-w-[320px] overflow-hidden border border-white/10 bg-black shadow-2xl">
                                    <iframe
                                        className="absolute left-0 top-0 h-full w-full"
                                        src="https://www.youtube.com/embed/ZAEP5CRcGsA"
                                        title="Beethoven's Pathétique on DS6.0"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            </AnimatedSection>
                        </div>

                        {/* Bottom Row: Wide Video */}
                        <AnimatedSection delay={300} className="flex flex-col items-center gap-10 border border-white/10 bg-white/5 p-6 md:p-10 lg:flex-row">
                            <div className="w-full lg:w-1/2">
                                <div className="mb-6 inline-flex h-10 w-10 items-center justify-center border border-white/20 bg-transparent shadow-sm">
                                    <Crosshair className="h-5 w-5 text-white" />
                                </div>
                                <h3 className="mb-4 font-serif text-3xl font-semibold">Flawless Leaps.</h3>
                                <p className="mb-8 font-sans text-sm leading-relaxed text-white/60">
                                    By reducing the physical distance of the leap across the keyboard, notoriously difficult pieces like <span className="italic text-white/90">La Campanella</span> become incredibly manageable, practically eliminating the need to practice purely for the sake of accuracy.
                                </p>
                                <div className="border-l-2 border-white/20 pl-6">
                                    <blockquote className="mb-4 font-serif text-lg italic leading-relaxed text-white/80">
                                        &quot;When jumping from one note to a distantly placed note, small-handed players should use their arms to find the notes and refrain from reaching with the fingers. This necessitates much practice purely for the sake of accuracy.&quot;
                                    </blockquote>
                                    <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-white/50">
                                        Brenda Wristen &amp; Lora Deahl (2003)
                                    </p>
                                </div>
                            </div>
                            <div className="relative aspect-video w-full overflow-hidden border border-white/10 bg-black shadow-2xl lg:w-1/2">
                                <iframe
                                    className="absolute left-0 top-0 h-full w-full"
                                    src="https://www.youtube.com/embed/IH8MDBibPBA"
                                    title="La Campanella on DS6.0"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </AnimatedSection>
                    </div>
                </section>

                {/* ═══ THE CROSS-TRAINING EFFECT (Hubert Ness) ═══ */}
                <section className="border-t border-white/10 bg-[#0a0a0f] py-24 text-white md:py-32">
                    <div className="container mx-auto max-w-4xl px-6 text-center">
                        <AnimatedSection>
                            <p className="mb-4 font-sans text-[10px] uppercase tracking-[0.3em] text-white/50">The #1 Question</p>
                            <h2 className="mb-12 font-serif text-3xl font-semibold leading-tight md:text-5xl">
                                &quot;Will this ruin my technique on a standard piano?&quot;
                            </h2>

                            <div className="relative border border-white/10 bg-[#050505] p-10 text-left shadow-2xl md:p-16 md:text-center">
                                <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                                <blockquote className="mb-8 font-serif text-2xl leading-relaxed text-white/90 md:text-3xl">
                                    &quot;Another surprising effect for me was that playing this [DS6.0] also has a positive effect when you go back to the normal keyboard.&quot;
                                </blockquote>
                                <div className="font-sans">
                                    <p className="text-sm font-bold uppercase tracking-wider text-white">Hubert Ness</p>
                                    <p className="mt-1 text-xs text-white/50">Professor of Jazz Piano, HMDK University of Stuttgart</p>
                                </div>
                            </div>

                            <p className="mx-auto mt-12 max-w-2xl font-sans text-base leading-relaxed text-white/60">
                                The reality is the exact opposite of what most people fear. Because the narrower keys teach your hands to play without tension, your brain maps a healthier, more relaxed technique. When you return to a standard piano, that relaxed muscle memory translates with you.
                            </p>

                            <div className="mx-auto mt-10 max-w-2xl border border-white/10 bg-white/5 p-8 md:p-10 text-center">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                                </div>
                                <h3 className="mb-4 font-sans text-sm font-bold uppercase tracking-widest text-white">100% Satisfaction Guaranteed</h3>
                                <p className="font-sans text-base leading-relaxed text-white/60">
                                    While we at DreamPlay — and every small-handed pianist we know — love the narrower keyboard, we can&apos;t guarantee every single person will. For this reason, we offer a <strong className="text-white">90-day full refund, no questions asked</strong> policy, including return shipping paid for. We also offer <strong className="text-white">free exchanges</strong> in case you try one size and decide you&apos;d like the other.
                                </p>
                                <Link href="/information-and-policies/shipping" className="mt-6 inline-flex items-center gap-2 font-sans text-sm font-medium text-white underline underline-offset-4 decoration-white/30 hover:decoration-white transition-colors">
                                    See full policy details <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </AnimatedSection>
                    </div>
                </section>

                {/* ═══ ACADEMIC TESTIMONIAL — Barbara Lister-Sink ═══ */}
                <section className="border-t border-white/10 bg-[#050505] py-24 text-white md:py-32">
                    <div className="container mx-auto max-w-4xl px-6 text-center">
                        <AnimatedSection>
                            <p className="mb-4 font-sans text-[10px] uppercase tracking-[0.3em] text-white/50">From the Academy</p>
                            <div className="relative border border-white/10 bg-[#0a0a0f] p-10 text-left shadow-2xl md:p-16 md:text-center">
                                <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                                <Quote className="mx-auto mb-6 h-10 w-10 text-white/15" />
                                <blockquote className="mb-8 font-serif text-2xl leading-relaxed text-white/90 md:text-3xl">
                                    &quot;I cannot begin to describe the career-changing, and even life-changing, benefits our students have reaped from having these instruments to practice on daily. Their first response though was, &apos;Why did it take so long? Why did we have to suffer so unnecessarily?&apos;&quot;
                                </blockquote>
                                <div className="font-sans">
                                    <p className="text-sm font-bold uppercase tracking-wider text-white">Barbara Lister-Sink, Ed.D.</p>
                                    <p className="mt-1 text-xs text-white/50">Salem College School of Music, Director, Graduate Music Program</p>
                                </div>
                            </div>
                        </AnimatedSection>
                    </div>
                </section>

                {/* ═══ CTA ═══ */}
                <section className="border-t border-white/10 bg-[#050505] py-24 text-center">
                    <div className="container mx-auto max-w-3xl px-6">
                        <AnimatedSection>
                            <h2 className="mb-6 font-serif text-4xl font-semibold text-white md:text-5xl">
                                Experience the Revelation.
                            </h2>
                            <p className="mb-10 font-sans text-base text-white/60 md:text-lg">
                                Stop limiting your repertoire. Secure your allocation today.
                            </p>
                            <Link href="/customize" className="group inline-flex items-center justify-center gap-3 border border-white bg-white px-8 py-4 font-sans text-xs font-bold uppercase tracking-widest text-black transition-all hover:bg-neutral-200">
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
