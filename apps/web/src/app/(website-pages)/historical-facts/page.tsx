"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AnimatedSection } from "@/components/animated-section";
import { ArrowRight, Quote } from "lucide-react";
import { UrgencySubtext } from "@/components/UrgencySubtext";

export default function HistoricalFactsPage() {
    const [activeSection, setActiveSection] = useState("");

    useEffect(() => {
        const sections = ['the-myth', 'classical-era', 'industrial-shift', 'the-standard', 'the-exception'];
        const handleScroll = () => {
            const scrollPosition = window.scrollY + window.innerHeight / 2;
            for (const sectionId of sections) {
                const element = document.getElementById(sectionId);
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(sectionId);
                        return;
                    }
                }
            }
            if (window.scrollY < 100) setActiveSection("");
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    return (
        <div className="min-h-screen font-sans selection:bg-blue-500/20 bg-[#050505]">
            <Navbar forceOpaque={true} darkMode={true} className="border-b border-white/10 bg-[#050505] backdrop-blur-md" />

            <main className="relative pt-[60px] md:pt-[80px]">

                {/* DESKTOP NAV (Left Sticky) */}
                <nav className="fixed left-6 md:left-12 top-1/2 -translate-y-1/2 z-40 hidden lg:block">
                    <div className="relative">
                        <div className="absolute left-[9px] top-0 bottom-0 w-[2px] bg-blue-600/20"></div>
                        <div className="space-y-12 xl:space-y-16">
                            {[
                                { id: 'the-myth', year: 'Introduction', title: 'The Myth' },
                                { id: 'classical-era', year: 'Pre-1880s', title: 'The Classical Era' },
                                { id: 'industrial-shift', year: '19th Century', title: 'The Industrial Shift' },
                                { id: 'the-standard', year: 'Late 1880s', title: 'The New Standard' },
                                { id: 'the-exception', year: '1900s', title: 'The Exception' }
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => scrollToSection(item.id)}
                                    className="relative flex items-center gap-6 group w-full text-left"
                                >
                                    <div className={`w-5 h-5 rounded-full border-[3px] transition-all duration-300 z-10 ${activeSection === item.id ? 'bg-blue-600 border-blue-600 scale-125' : 'bg-[#050505] border-neutral-500 group-hover:border-blue-600 group-hover:scale-125'}`}></div>
                                    <div className={`transition-all duration-300 ${activeSection === item.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0'}`}>
                                        <div className="whitespace-nowrap">
                                            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-blue-600 font-semibold">{item.year}</p>
                                            <p className={`text-base font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] ${activeSection === item.id ? 'text-blue-500' : 'text-neutral-500'}`}>{item.title}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </nav>

                {/* ═══ HERO — DARK ═══ */}
                <section id="the-myth" className="relative min-h-screen flex flex-col items-center justify-center px-6 bg-[#050505] text-white overflow-hidden pb-12">
                    <div className="absolute inset-0 opacity-20">
                        <Image src="/images/marketing/dreamplay-one-hero.jpg" alt="DreamPlay One narrow keys piano - historical piano keyboard context" fill className="object-cover" />
                    </div>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#050505]/60 via-[#050505]/80 to-[#050505]" />

                    <AnimatedSection className="text-center max-w-4xl mx-auto z-10 pt-20 w-full">
                        <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-blue-400 font-bold mb-6">Historical Facts</p>
                        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight leading-none mb-6 text-white text-balance">
                            The Myth of the<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                                Permanent Standard
                            </span>
                        </h1>
                        <p className="font-sans text-base md:text-lg text-white/60 max-w-xl mx-auto leading-relaxed mb-12">
                            The 6.5-inch piano octave was never an objective ergonomic ideal. Discover how history, engineering, and anatomical outliers shaped the modern keyboard.
                        </p>

                        <div className="w-full max-w-3xl mx-auto aspect-video rounded-none border border-white/20 bg-[#0a0a0f] shadow-2xl relative overflow-hidden group">
                            <iframe
                                className="absolute top-0 left-0 w-full h-full z-10"
                                src="https://www.youtube.com/embed/ZXlknI-Jc48"
                                title="Piano's Darkest Secret"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>

                    </AnimatedSection>
                </section>

                {/* ═══ CHAPTER 1: THE CLASSICAL ERA — LIGHT ═══ */}
                <section id="classical-era" className="bg-white text-black relative">
                    <div className="flex flex-col justify-center py-32 px-6 md:px-12 lg:px-24 min-h-screen">
                        <div className="max-w-7xl mx-auto w-full pl-0 lg:pl-16">
                            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                                <div>
                                    <span className="inline-block font-sans text-[10px] uppercase tracking-[0.3em] text-blue-600 bg-blue-600/10 px-4 py-2 mb-6 border border-blue-600/20">
                                        Chapter One · Pre-1880s
                                    </span>
                                    <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-tight mb-8 text-black">
                                        The nimble keys of Mozart & Bach.
                                    </h2>
                                    <div className="space-y-6 font-sans text-base md:text-lg text-neutral-600 leading-relaxed max-w-xl">
                                        <p>There is a prevailing myth within the classical music industry that the piano keyboard has always been this size. Historical organology proves this assumption entirely false.</p>
                                        <p>Prior to the 1880s, keyboard sizes varied significantly across regions and manufacturers. Early fortepianos, harpsichords, and clavichords frequently featured much narrower keys, shallower key dips, and a significantly lighter action.</p>
                                        <p>Giants of the era—like <strong>Mozart, Haydn, and Bach</strong>—composed and performed on instruments perfectly suited to rapid, intricate finger work, not massive, forceful chordal playing.</p>
                                    </div>
                                </div>
                                <div className="relative group">
                                    <div className="aspect-[4/5] overflow-hidden rounded-none border border-neutral-200 bg-neutral-100 flex items-center justify-center relative">
                                        <Image src="/images/stock/article-placeholder.jpg" alt="Historical fortepiano with narrow keys" fill className="object-cover transition-all duration-700 opacity-80 group-hover:opacity-100 group-hover:scale-105" />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-white font-sans text-sm tracking-widest uppercase">Historical Fortepiano Keys</p>
                                            <p className="text-white/70 font-sans text-xs tracking-widest uppercase mt-2">[ Replace Image ]</p>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-xs text-neutral-400 font-sans tracking-wide text-center">Historical fortepianos featured significantly narrower keys than today&apos;s standard.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ CHAPTER 2: THE INDUSTRIAL SHIFT — DARK ═══ */}
                <section id="industrial-shift" className="bg-[#050505] text-white relative border-t border-white/10">
                    <div className="flex flex-col justify-center py-32 px-6 md:px-12 lg:px-24 min-h-screen">
                        <div className="max-w-7xl mx-auto w-full pl-0 lg:pl-16">

                            <div className="grid lg:grid-cols-[2fr_3fr] gap-12 lg:gap-20 items-center">
                                <AnimatedSection className="order-1 lg:order-2 space-y-6 lg:space-y-8">
                                    <span className="inline-block font-sans text-[10px] uppercase tracking-[0.3em] text-blue-400 bg-blue-400/10 px-4 py-2 border border-blue-400/20">
                                        Chapter Two · 19th Century
                                    </span>
                                    <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-tight text-white">
                                        Built for halls, not for hands.
                                    </h2>
                                    <div className="space-y-6 font-sans text-sm md:text-base text-white/60 leading-relaxed max-w-2xl">
                                        <p>As the piano evolved throughout the 19th century, manufacturers sought to increase the instrument&apos;s volume and projection to suit the larger concert halls being built across Europe.</p>
                                        <p>The pivotal introduction of cast iron frames allowed for vastly higher string tension. This structural evolution necessitated heavier, thicker strings and substantially larger hammers to strike them.</p>
                                        <p>To accommodate these robust mechanical actions, and to provide the necessary leverage to move the heavier hammers, <strong>the keys themselves became longer, heavier, and wider.</strong></p>
                                    </div>
                                </AnimatedSection>

                                <AnimatedSection delay={200} className="order-2 lg:order-1 relative">
                                    <div className="w-full aspect-[4/5] overflow-hidden rounded-none border border-white/10 relative group bg-neutral-900 flex items-center justify-center">
                                        <Image src="/images/factory-pictures/action.jpeg" alt="Piano action mechanics showing heavy hammers that drove wider key design" fill className="object-cover transition-all duration-700 grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100" />
                                    </div>
                                    <p className="mt-4 text-xs text-white/40 font-sans tracking-wide text-center">Mechanics required larger actions, shifting the design focus away from ergonomics.</p>
                                </AnimatedSection>
                            </div>

                        </div>
                    </div>
                </section>

                {/* ═══ CHAPTER 3: THE NEW STANDARD — LIGHT ═══ */}
                <section id="the-standard" className="bg-neutral-50 text-black relative border-t border-neutral-200">
                    <div className="flex flex-col justify-center py-32 px-6 md:px-12 lg:px-24 min-h-screen">
                        <div className="max-w-7xl mx-auto w-full pl-0 lg:pl-16">
                            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                                <div className="order-2 lg:order-1 relative group">
                                    <div className="aspect-[4/3] overflow-hidden rounded-none border border-neutral-200 bg-white relative flex items-center justify-center">
                                        <Image src="/images/stock/franz-liszt-in-colour-1546939903-large-article-0.jpg" alt="Franz Liszt, pianist with large hands who helped standardize wide keyboard" fill className="object-cover transition-all duration-700 opacity-90 group-hover:opacity-100 group-hover:scale-105" />
                                    </div>
                                    <p className="mt-4 text-xs text-neutral-400 font-sans tracking-wide text-center">Franz Liszt and his contemporaries composed for their own massive anatomies.</p>
                                </div>

                                <div className="order-1 lg:order-2">
                                    <AnimatedSection>
                                        <span className="inline-block font-sans text-[10px] uppercase tracking-[0.3em] text-blue-600 bg-blue-600/10 px-4 py-2 mb-6 border border-blue-600/20">
                                            Chapter Three · Late 1880s
                                        </span>
                                        <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-tight mb-8 text-black">
                                            Composing for giants.
                                        </h2>
                                        <div className="space-y-6 font-sans text-base md:text-lg text-neutral-600 leading-relaxed max-w-xl">
                                            <p>By the late 1880s, mass production techniques formalized the physical dimensions of the keyboard to a rigid 6.5-inch (16.5 cm) octave width.</p>
                                            <p>Crucially, this standardization coincided with the Romantic virtuoso tradition. Composers and touring virtuosos like Franz Liszt, Johannes Brahms, and Sergei Rachmaninoff possessed exceptionally large hands.</p>
                                            <p>Rachmaninoff, standing 6 feet 6 inches tall, could cleanly strike a 13th interval. These men wrote music that fully utilized their unique anatomical advantages, embedding gargantuan intervals into the foundational canon of advanced piano repertoire.</p>
                                        </div>
                                    </AnimatedSection>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ CHAPTER 4: THE EXCEPTION — DARK ═══ */}
                <section id="the-exception" className="bg-[#050505] text-white relative border-t border-white/10">
                    <div className="py-32 px-6 md:px-12 lg:px-24 min-h-screen flex flex-col justify-center">
                        <div className="max-w-7xl mx-auto w-full pl-0 lg:pl-16 text-center">

                            <AnimatedSection>
                                <span className="inline-block font-sans text-[10px] uppercase tracking-[0.3em] text-amber-500 bg-amber-500/10 px-4 py-2 mb-6 border border-amber-500/20">
                                    Chapter Four · 1900s
                                </span>
                                <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-tight mb-8 text-white max-w-4xl mx-auto">
                                    The industry&apos;s best kept secret.
                                </h2>
                            </AnimatedSection>

                            <AnimatedSection delay={200}>
                                <div className="max-w-4xl mx-auto bg-white/[0.03] border border-white/10 p-8 md:p-16 relative mt-16 text-left">
                                    <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                                    <Quote className="h-10 w-10 text-white/20 mb-6" />
                                    <div className="space-y-6 font-sans text-base md:text-lg text-white/70 leading-relaxed">
                                        <p>The rigid adherence to the 6.5-inch standard was quietly bypassed by those with enough influence to demand accommodation.</p>
                                        <p>The legendary pianist Josef Hofmann, a close friend of Rachmaninoff and the dedicatee of his notoriously difficult Third Piano Concerto, openly refused to perform the piece publicly due to the limitations of his smaller hand span.</p>
                                        <p>Leveraging his immense fame, Hofmann demanded that Steinway & Sons build him a custom 7-foot instrument featuring a narrower keyboard with a <strong>6.3-inch octave</strong>.</p>
                                        <p>While Hofmann&apos;s custom instrument highlights that manufacturers have long possessed the capability to alter keyboard dimensions without ruining the instrument, this practice was kept quiet in an industry notoriously slow to embrace systemic change.</p>
                                    </div>
                                </div>
                            </AnimatedSection>

                        </div>
                    </div>
                </section>

                {/* ═══ CTA — DARK ═══ */}
                <section className="bg-[#0a0a0f] text-white py-32 border-t border-white/10">
                    <div className="flex flex-col items-center justify-center px-6 text-center">
                        <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-4">A New Era</p>
                        <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-tight mb-6 text-white max-w-3xl mx-auto">
                            The instrument should adapt to the player.
                        </h2>
                        <p className="font-sans text-base md:text-lg text-white/60 mb-12 max-w-xl mx-auto">
                            Join the revolution of pianists escaping the constraints of the 19th-century standard. Experience the joy of possibility with DreamPlay One.
                        </p>
                        <Link href="/customize" className="group inline-flex items-center justify-center gap-2 border border-white bg-white px-8 py-4 font-sans text-xs uppercase tracking-widest text-black transition-colors hover:bg-white/90">
                            Reserve Now
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <div className="mt-6">
                            <UrgencySubtext />
                        </div>
                    </div>
                </section>

            </main>
            <Footer />
        </div>
    );
}
