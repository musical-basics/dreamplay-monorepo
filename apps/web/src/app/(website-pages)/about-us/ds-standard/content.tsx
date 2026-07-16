"use client";
import React from "react";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AnimatedSection } from "@/components/animated-section";
import { ArrowRight, CheckCircle2, Globe, MapPin } from "lucide-react";

export default function DSStandardContent() {
    return (
        <div className="min-h-screen font-sans selection:bg-white/20">
            <Navbar forceOpaque={true} darkMode={true} className="border-b border-white/10 bg-[#050505] backdrop-blur-md" />

            <main className="pt-24">

                {/* ═══ HERO — DARK ═══ */}
                <section className="relative py-24 lg:py-32 overflow-hidden bg-[#050505] text-white">
                    <div className="container max-w-6xl mx-auto px-6 relative z-10 text-center">
                        <AnimatedSection>
                            <div className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-10 relative">
                                <Image src="/images/logos/DS Logo Registered 1200-Recovered.jpg" alt="DS Standard Registered Logo" fill className="object-contain" style={{ filter: "invert(1)" }} />
                            </div>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/10 text-white/50 font-sans text-[10px] uppercase tracking-[0.3em] mb-8">
                                Official Licensed Partner
                            </div>
                            <h1 className="text-5xl md:text-7xl font-serif font-semibold tracking-tight leading-tight mb-8 text-white">
                                The Gold Standard <br /><span className="text-white/40">of Ergonomics.</span>
                            </h1>
                            <p className="font-sans text-base md:text-lg text-white/60 leading-relaxed max-w-3xl mx-auto">
                                DreamPlay is an authorized partner of the DS Standard Foundation. We build our instruments to the exact specifications that are revolutionizing piano performance at universities worldwide.
                            </p>
                        </AnimatedSection>
                    </div>
                </section>

                {/* ═══ THE MARK OF QUALITY — LIGHT ═══ */}
                <section className="py-24 bg-white text-black">
                    <div className="container max-w-6xl mx-auto px-6">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <AnimatedSection>
                                <div className="relative aspect-[4/3] rounded-none overflow-hidden border border-neutral-200">
                                    <Image src="/images/keyboards/DSDS6.0-Straightened-1-1024x788.jpg" alt="DS Logo on Piano Keys" fill className="object-cover transition-all duration-700" />
                                </div>
                            </AnimatedSection>
                            <AnimatedSection delay={100}>
                                <h2 className="font-serif text-3xl md:text-5xl tracking-tight leading-tight mb-8 text-black">The Mark of Quality</h2>
                                <p className="font-sans text-base text-neutral-600 mb-8 leading-relaxed border-l-2 border-neutral-300 pl-6">
                                    All DreamPlay Keyboards ship with the DS® logo stamped on the bottom two keys.
                                </p>
                                <div className="space-y-6 font-sans text-sm md:text-base text-neutral-600 leading-relaxed">
                                    <p>This isn&apos;t just decoration. It is a certification of precision. It guarantees that the instrument you practice on at home matches the exact specifications of the DS Standard® keyboards found in concert halls and universities.</p>
                                    <p>When you see this mark, you know that the octave width is accurate to within <strong>±0.04 inches</strong> of the international standard.</p>
                                </div>
                            </AnimatedSection>
                        </div>
                    </div>
                </section>

                {/* ═══ A BIG IDEA (Origin Story) — DARK ═══ */}
                <section className="py-24 bg-[#050505] text-white border-y border-white/10">
                    <div className="container max-w-6xl mx-auto px-6">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <AnimatedSection className="order-2 lg:order-1">
                                <div className="inline-flex items-center gap-2 text-white/50 font-sans text-[10px] uppercase tracking-[0.3em] mb-6">
                                    <MapPin className="w-4 h-4" /> Titusville, Pennsylvania
                                </div>
                                <h2 className="font-serif text-3xl md:text-5xl tracking-tight leading-tight mb-8 text-white">A Big Idea</h2>
                                <div className="space-y-6 font-sans text-sm md:text-base text-white/60 leading-relaxed">
                                    <p>It started with a chance meeting in 1991. <strong>David Steinbuhler</strong>, visiting the Shaw Festival, met music director <strong>Christopher Donison</strong>, who had a custom 7/8 keyboard installed in his grand piano.</p>
                                    <p>David played it and was amazed by the ease of adaptation. Christopher explained how a whole new world opened before him when he first got the keyboard.</p>
                                    <p>Combining Christopher&apos;s vision with David&apos;s engineering background from his family&apos;s textile business, they collaborated to create the <strong>Donison-Steinbuhler (DS) Standard®</strong>.</p>
                                    <p>Today, David and his wife Linda continue to champion this ergonomic revolution from Titusville, PA, transforming the lives of pianists worldwide.</p>
                                    <p>The DS Foundation continues to work with prestigious universities around the world, including <strong>Stanford University</strong>, <strong>Johns Hopkins Peabody Institute</strong>, <strong>Eastman School of Music</strong>, and many more — advancing research, education, and adoption of ergonomically scaled keyboards.</p>
                                </div>
                                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                                    <a href="https://dsstandardfoundation.org/" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center justify-center gap-2 border border-white/20 bg-transparent px-8 py-4 font-sans text-xs uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black">
                                        Visit the Foundation <ArrowRight className="ml-2 w-5 h-5" />
                                    </a>
                                    <a href="https://paskpiano.org/universities-schools/" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center justify-center gap-2 border border-white bg-white px-8 py-4 font-sans text-xs uppercase tracking-widest text-black transition-colors hover:bg-white/90">
                                        See All Supporting Schools <ArrowRight className="ml-2 w-5 h-5" />
                                    </a>
                                </div>
                            </AnimatedSection>
                            <AnimatedSection delay={100} className="order-1 lg:order-2">
                                <div className="relative aspect-[4/5] w-full rounded-none overflow-hidden border border-white/10">
                                    <Image src="/images/keyboards/products_DS5.5-Yamaha-CFX-3-1024x711.jpg" alt="DS5.5 Yamaha CFX Piano" fill className="object-cover transition-all duration-700" />
                                </div>
                            </AnimatedSection>
                        </div>
                    </div>
                </section>

                {/* ═══ THE DATA (Graph) — LIGHT ═══ */}
                <section className="py-24 bg-neutral-50 text-neutral-900">
                    <div className="container max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-4">Research Data</p>
                            <h2 className="font-serif text-3xl md:text-5xl tracking-tight leading-tight mb-6 text-black">The Science of Hand Span</h2>
                            <p className="font-sans text-base text-neutral-600">Data collected at the 2004 MTNA National Convention</p>
                        </div>
                        <AnimatedSection>
                            <div className="relative w-full aspect-[3/1] min-h-[300px] bg-white rounded-none overflow-hidden p-6 md:p-8 border border-neutral-200">
                                <Image src="/images/hands/Hand-Size-Chart-Data-1024x336.jpg" alt="Hand Size Chart Data" fill className="object-contain" />
                            </div>
                            <p className="text-center font-sans text-sm text-neutral-500 mt-8 max-w-4xl mx-auto leading-relaxed">
                                The graph illustrates the wide diversity of hand spans among pianists. The colored zones indicate which keyboard size (DS5.5, DS6.0, or Standard) is ergonomically appropriate for each hand span range.
                            </p>
                        </AnimatedSection>
                    </div>
                </section>

                {/* ═══ THE THREE STANDARDS — DARK ═══ */}
                <section className="py-24 bg-black text-white">
                    <div className="container max-w-6xl mx-auto px-6">
                        <div className="text-center mb-20">
                            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-4">Models</p>
                            <h2 className="font-serif text-3xl md:text-5xl tracking-tight leading-tight mb-6">The Three Adult Standards</h2>
                            <p className="font-sans text-base text-white/60 max-w-2xl mx-auto">DreamPlay One creates instruments exclusively in the two alternative sizes certified by the foundation.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {/* DS6.5 */}
                            <AnimatedSection delay={0}>
                                <div className="h-full p-10 rounded-none border border-white/20 bg-transparent flex flex-col text-white">
                                    <div className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-6">The Old Standard</div>
                                    <h3 className="font-serif text-4xl font-bold mb-3">DS6.5™</h3>
                                    <p className="font-sans text-base text-white/60 mb-8">Conventional Size</p>
                                    <ul className="space-y-6 font-sans text-sm text-white/40 mt-auto">
                                        <li className="flex gap-4 items-center"><div className="w-2 h-2 rounded-full bg-white/30 shrink-0"></div><span><strong>6.5 inch</strong> octave span</span></li>
                                        <li className="flex gap-4 items-center"><div className="w-2 h-2 rounded-full bg-white/30 shrink-0"></div><span>Fit for hands &gt; 8.5 inches</span></li>
                                    </ul>
                                </div>
                            </AnimatedSection>
                            {/* DS6.0 — Inverted: bg-white text-black */}
                            <AnimatedSection delay={100}>
                                <div className="h-full p-10 rounded-none bg-white text-black relative flex flex-col border border-black/10">
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-black text-white font-sans text-[10px] uppercase tracking-[0.3em] px-6 py-2">Universal</div>
                                    <div className="font-sans text-[10px] uppercase tracking-[0.3em] text-black/50 mb-6">DreamPlay Choice</div>
                                    <h3 className="font-serif text-4xl font-bold mb-3 text-black">DS6.0®</h3>
                                    <p className="font-sans text-base text-black/60 mb-8">Universal Size</p>
                                    <ul className="space-y-6 font-sans text-sm text-black/70 mt-auto">
                                        <li className="flex gap-4 items-center"><CheckCircle2 className="w-6 h-6 text-black shrink-0" /><span><strong>6.0 inch</strong> octave span</span></li>
                                        <li className="flex gap-4 items-center"><CheckCircle2 className="w-6 h-6 text-black shrink-0" /><span>Fits 7.6&quot; – 8.5&quot; hands (Average)</span></li>
                                        <li className="flex gap-4 items-center"><CheckCircle2 className="w-6 h-6 text-black shrink-0" /><span><strong>15/16ths</strong> width of standard</span></li>
                                    </ul>
                                </div>
                            </AnimatedSection>
                            {/* DS5.5 */}
                            <AnimatedSection delay={200}>
                                <div className="h-full p-10 rounded-none border border-white/20 bg-transparent flex flex-col text-white">
                                    <div className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-6">DreamPlay Choice</div>
                                    <h3 className="font-serif text-4xl font-bold mb-3">DS5.5®</h3>
                                    <p className="font-sans text-base text-white/60 mb-8">7/8th Size</p>
                                    <ul className="space-y-6 font-sans text-sm text-white/40 mt-auto">
                                        <li className="flex gap-4 items-center"><CheckCircle2 className="w-6 h-6 text-white/40 shrink-0" /><span><strong>5.5 inch</strong> octave span</span></li>
                                        <li className="flex gap-4 items-center"><CheckCircle2 className="w-6 h-6 text-white/40 shrink-0" /><span>Fits &lt; 7.6&quot; hands (Small)</span></li>
                                        <li className="flex gap-4 items-center"><CheckCircle2 className="w-6 h-6 text-white/40 shrink-0" /><span><strong>7/8ths</strong> width of standard</span></li>
                                    </ul>
                                </div>
                            </AnimatedSection>
                        </div>
                    </div>
                </section>

                {/* ═══ OUR SHARED VISION — LIGHT ═══ */}
                <section className="py-32 bg-white text-neutral-900">
                    <div className="container max-w-6xl mx-auto px-6">
                        <div className="grid lg:grid-cols-2 gap-20 items-center">
                            <div className="order-2 lg:order-1">
                                <AnimatedSection>
                                    <div className="flex items-center gap-3 mb-8">
                                        <Globe className="w-6 h-6 text-neutral-500" />
                                        <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-500">Our Shared Vision</span>
                                    </div>
                                    <h2 className="font-serif text-5xl md:text-6xl tracking-tight leading-tight mb-8 text-black">
                                        Practice at Home.<br />Perform Anywhere.
                                    </h2>
                                    <blockquote className="font-serif text-xl md:text-2xl text-neutral-400 italic mb-10 pl-6 border-l-2 border-neutral-200">
                                        &quot;If I practice on a smaller keyboard at home, will I be able to play on a standard piano on stage?&quot;
                                    </blockquote>
                                    <div className="space-y-6 mb-12">
                                        <p className="font-sans text-base text-neutral-600 leading-relaxed">
                                            Our vision, aligned with the DS Standard Foundation and PASK Piano, is a world where <strong>DS5.5® and DS6.0® pianos and keyboards are standard equipment in every concert hall and university</strong>.
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-6">
                                        <div className="flex-1 p-6 bg-neutral-50 rounded-none border border-neutral-200 hover:border-neutral-400 transition-colors">
                                            <div className="flex items-center gap-3 mb-3">
                                                <CheckCircle2 className="w-6 h-6 text-black" />
                                                <span className="font-bold text-xl text-black">Universities</span>
                                            </div>
                                            <p className="font-sans text-sm text-neutral-600 leading-snug">SMU, UNT, and others already use DS keyboards for teaching.</p>
                                        </div>
                                        <div className="flex-1 p-6 bg-neutral-50 rounded-none border border-neutral-200 hover:border-neutral-400 transition-colors">
                                            <div className="flex items-center gap-3 mb-3">
                                                <CheckCircle2 className="w-6 h-6 text-black" />
                                                <span className="font-bold text-xl text-black">Competitions</span>
                                            </div>
                                            <p className="font-sans text-sm text-neutral-600 leading-snug">International competitions are beginning to accept DS sizes.</p>
                                        </div>
                                    </div>
                                    <div className="mt-8 pt-8 border-t border-neutral-200 font-sans text-sm text-neutral-500 leading-relaxed italic">
                                        <p className="mb-2">That being said, pianists have generally reported feeling more relaxed after practicing on a narrower keyboard, and the technique improvements translate to the standard piano.</p>
                                        <p className="text-neutral-600">For more information, see our <a href="/information-and-policies/faq" className="underline hover:text-black transition-colors">FAQ</a>.</p>
                                    </div>
                                </AnimatedSection>
                            </div>
                            {/* Carnegie Hall Image */}
                            <div className="order-1 lg:order-2 relative aspect-[4/3] rounded-none overflow-hidden border border-neutral-200 group">
                                <Image src="/images/marketing/carnegie-hall-performance.png" alt="Performance on stage" fill className="object-cover transition-all duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/40 to-transparent"></div>
                                <div className="absolute bottom-8 left-8 font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-800 font-medium">
                                    The Goal: A DS Keyboard on Every Stage
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </main>
            <Footer />
        </div>
    );
}
