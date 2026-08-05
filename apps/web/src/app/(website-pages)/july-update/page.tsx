import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AnimatedSection } from "@/components/animated-section";
import { ArrowRight } from "lucide-react";

export const metadata = {
    title: "July 2026 Production Update | DreamPlay Pianos",
    description:
        "The first DreamPlay prototype is here, and it plays. Watch the video, see the photos, and check where your order stands.",
};

const gallery = [
    { src: "/images/product-updates/july-2026-prototype-studio.jpg", alt: "The first DreamPlay prototype, fully assembled in the studio" },
    { src: "/images/product-updates/july-2026-prototype-pedals.jpg", alt: "DreamPlay prototype with the triple pedal unit connected" },
    { src: "/images/product-updates/july-2026-control-panel.jpg", alt: "DreamPlay control panel with volume and reverb knobs, screen and transport buttons" },
    { src: "/images/product-updates/july-2026-prototype-stand.jpg", alt: "DreamPlay prototype on its stand during testing" },
    { src: "/images/product-updates/july-2026-rear-ports.jpg", alt: "Rear panel of the DreamPlay prototype with audio, MIDI and pedal connections" },
    { src: "/images/product-updates/july-2026-prototype-hero.jpg", alt: "Angled view of the DreamPlay prototype keybed and branding" },
];

const internals = [
    { src: "/images/product-updates/july-2026-internals-keybed.jpg", alt: "Inside the prototype: keybed, speaker and wiring on the bench" },
    { src: "/images/product-updates/july-2026-internals-board.jpg", alt: "Inside the prototype: main circuit board and sensor connections behind the keys" },
];

const roadmap = [
    {
        when: "July 2026 · Done",
        title: "Working prototype complete",
        body: "The first full prototype is assembled and playing: keys, lights, sound and speakers all working together. This update is that milestone.",
    },
    {
        when: "August 2026",
        title: "Calibration and refinement",
        body: "We are tuning key sensitivity, volume response and sound quality: the details that decide how the instrument feels under your fingers.",
    },
    {
        when: "September 2026",
        title: "Final funding campaign",
        body: "With a proven prototype behind us, we run our final fundraising campaign to carry DreamPlay into full production.",
    },
    {
        when: "November 2026",
        title: "Official manufacturing begins",
        body: "The production line starts building the keyboards that ship to you.",
    },
    {
        when: "January 2027",
        title: "Estimated delivery",
        body: "Based on this timeline, we estimate your DreamPlay One will be delivered in January 2027.",
        highlight: true,
    },
];

export default function JulyUpdatePage() {
    return (
        <div className="min-h-screen font-sans bg-[#050505] text-white selection:bg-blue-500/20">
            <Navbar forceOpaque={true} darkMode={true} className="border-b border-white/10 bg-[#050505] backdrop-blur-md" />

            <main className="pt-32 pb-24 overflow-hidden">
                {/* ═══ HERO ═══ */}
                <section className="max-w-3xl mx-auto px-6 text-center mb-14">
                    <AnimatedSection>
                        <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-blue-400 font-bold mb-4">
                            Production Update · July 2026
                        </p>
                        <h1 className="font-serif text-4xl md:text-6xl font-semibold tracking-tight leading-tight mb-6">
                            The first prototype is here. And it plays.
                        </h1>
                        <p className="font-sans text-base md:text-lg text-white/60 leading-relaxed">
                            Last month we told you the first full prototype was being built. This month, it is on the bench and working: keys, lights, sound and all. Watch it for yourself.
                        </p>
                    </AnimatedSection>
                </section>

                {/* ═══ VIDEO ═══ */}
                <section className="max-w-4xl mx-auto px-6 mb-20">
                    <AnimatedSection>
                        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                            <iframe
                                className="absolute inset-0 h-full w-full"
                                src="https://www.youtube.com/embed/_wrlDpEAQdU"
                                title="DreamPlay July 2026 Update: the first prototype, playing"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                        <p className="font-sans text-xs text-white/40 mt-3 text-center">
                            The first DreamPlay prototype, demonstrated on camera this month.
                        </p>
                    </AnimatedSection>
                </section>

                {/* ═══ WHAT THIS PROTOTYPE IS ═══ */}
                <section className="max-w-3xl mx-auto px-6 mb-20">
                    <AnimatedSection>
                        <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-6">Proof, not promises.</h2>
                        <p className="font-sans text-base md:text-lg text-white/60 leading-relaxed mb-5">
                            This is the milestone we have been building toward all year, especially for our earliest backers, who have waited the longest. The first DreamPlay prototype is fully assembled and working: the narrow keys, the built-in guide lights, the speakers, the volume and reverb controls, all of it playing together in one instrument.
                        </p>
                        <p className="font-sans text-base md:text-lg text-white/60 leading-relaxed mb-5">
                            As we explained in June, this prototype is deliberately built larger than the final DreamPlay One. It is a proof of concept. The point is to prove every core system works before we condense it all into the slim final enclosure. The keys themselves are the real DS6.0 size: 92% of a standard full-size keyboard, exactly the narrow keys you reserved. And for the many of you who ordered the DS5.5, that size enters production at the same time.
                        </p>
                        <p className="font-sans text-base md:text-lg text-white/60 leading-relaxed">
                            To be honest about where we are: this prototype is still in testing and QA. The sound quality is not final, and we are deep in calibration: key sensitivity, volume response, the things that decide how an instrument feels. That is the most important part to get right, and it is exactly what the coming weeks are for.
                        </p>
                    </AnimatedSection>
                </section>

                {/* ═══ PHOTO GALLERY ═══ */}
                <section className="max-w-5xl mx-auto px-6 mb-20">
                    <AnimatedSection>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {gallery.map((g) => (
                                <div key={g.src} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-white/5">
                                    <Image src={g.src} alt={g.alt} fill quality={85} className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                                </div>
                            ))}
                        </div>
                        <p className="font-sans text-xs text-white/40 mt-3 text-center">
                            The prototype this month: assembled, on its stand, pedals connected. Real photos, not renders.
                        </p>
                    </AnimatedSection>
                </section>

                {/* ═══ UNDER THE HOOD ═══ */}
                <section className="max-w-5xl mx-auto px-6 mb-24">
                    <AnimatedSection>
                        <div className="max-w-3xl mx-auto mb-8">
                            <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">Under the hood</h2>
                            <p className="font-sans text-base md:text-lg text-white/60 leading-relaxed">
                                A look inside the prototype: the keybed, the speaker, and the main board reading every key through the sensor array. This is the system we are calibrating right now.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {internals.map((g) => (
                                <div key={g.src} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-white/5">
                                    <Image src={g.src} alt={g.alt} fill quality={85} className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
                                </div>
                            ))}
                        </div>
                    </AnimatedSection>
                </section>

                {/* ═══ ROADMAP ═══ */}
                <section className="max-w-3xl mx-auto px-6 mb-24">
                    <AnimatedSection>
                        <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-blue-400 font-bold mb-4 text-center">The road to delivery</p>
                        <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-12 text-center">On schedule</h2>
                    </AnimatedSection>
                    <div className="space-y-4">
                        {roadmap.map((step, i) => (
                            <AnimatedSection key={step.when} delay={i * 60}>
                                <div className={`flex gap-5 border p-6 rounded-xl ${step.highlight ? "border-amber-400/30 bg-amber-400/[0.06]" : "border-white/10 bg-white/[0.03]"}`}>
                                    <div className="flex-shrink-0">
                                        <div className={`font-sans text-[10px] uppercase tracking-[0.2em] font-bold ${step.highlight ? "text-amber-300/80" : "text-blue-400"}`}>
                                            {step.when}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-sans font-bold text-white text-base mb-1">{step.title}</h3>
                                        <p className="font-sans text-sm text-white/50 leading-relaxed">{step.body}</p>
                                    </div>
                                </div>
                            </AnimatedSection>
                        ))}
                    </div>
                </section>

                {/* ═══ ORDER STATUS CTA ═══ */}
                <section className="px-6 max-w-4xl mx-auto">
                    <AnimatedSection>
                        <div className="relative border border-blue-500/30 bg-gradient-to-b from-blue-900/10 to-transparent p-8 md:p-16 text-center overflow-hidden rounded-2xl shadow-2xl">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
                            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-blue-400 font-bold mb-4">Your order</p>
                            <h2 className="font-serif text-3xl md:text-5xl font-semibold mb-6">Where your order stands.</h2>
                            <p className="font-sans text-base md:text-lg text-white/70 leading-relaxed max-w-2xl mx-auto mb-10">
                                Your estimated delivery date lives on your account. Log in with the email address on your order to see your live status and manage your reservation.
                            </p>
                            <Link href="/my-reservation" className="group inline-flex items-center justify-center gap-3 border border-white bg-white px-8 py-4 font-sans text-xs font-bold uppercase tracking-widest text-black transition-all hover:bg-neutral-200 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                Check My Order Status
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                            <p className="font-sans text-xs text-white/40 mt-6">
                                Questions? Email <a href="mailto:support@dreamplaypianos.com" className="text-white/70 underline">support@dreamplaypianos.com</a>.
                            </p>
                        </div>
                    </AnimatedSection>
                </section>

                {/* ═══ FOUNDER NOTE ═══ */}
                <section className="max-w-3xl mx-auto px-6 mt-24">
                    <AnimatedSection>
                        <div className="border-t border-white/10 pt-12">
                            <p className="font-sans text-base md:text-lg text-white/60 leading-relaxed mb-5">
                                To everyone who has pre-ordered so far: thank you. We are working on this every day, and we want this keyboard to be the best it can possibly be: a lifetime instrument. Getting to sit down and actually play the first prototype was a moment I will not forget, and I am excited to share the next one with you.
                            </p>
                            <p className="font-sans text-base text-white">
                                Lionel Yu
                                <span className="block text-white/40 text-sm mt-1">Founder, DreamPlay Pianos</span>
                            </p>
                        </div>
                    </AnimatedSection>
                </section>
            </main>

            <Footer />
        </div>
    );
}
