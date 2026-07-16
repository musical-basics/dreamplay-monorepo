import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AnimatedSection } from "@/components/animated-section";
import { ArrowRight } from "lucide-react";

export const metadata = {
    title: "June 2026 Production Update | DreamPlay Pianos",
    description:
        "The first full DreamPlay One prototype is being built. Here is where your order stands, the road to delivery, and your options.",
};

const renders = [
    { src: "/images/product-updates/june-2026-render-front.jpg", alt: "DreamPlay One front design render with full-length LED guide array" },
    { src: "/images/product-updates/june-2026-render-wood.jpg", alt: "DreamPlay One design render exploring a premium wood-finish enclosure" },
    { src: "/images/product-updates/june-2026-render-front-alt.jpg", alt: "DreamPlay One front elevation render" },
];

const roadmap = [
    {
        when: "End of July 2026",
        title: "Working prototype complete",
        body: "We expect the first fully functional prototype to be finished, with the key action, sensors and electronics all working together.",
    },
    {
        when: "August 2026",
        title: "Video, in your hands",
        body: "Once the prototype is working, we will share real video of the keyboard being played — so you can see and hear it for yourself, not renders.",
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
        body: "Based on this timeline, we now estimate your DreamPlay One will be delivered in January 2027.",
        highlight: true,
    },
];

export default function JuneUpdatePage() {
    return (
        <div className="min-h-screen font-sans bg-[#050505] text-white selection:bg-blue-500/20">
            <Navbar forceOpaque={true} darkMode={true} className="border-b border-white/10 bg-[#050505] backdrop-blur-md" />

            <main className="pt-32 pb-24 overflow-hidden">
                {/* ═══ HERO ═══ */}
                <section className="max-w-3xl mx-auto px-6 text-center mb-14">
                    <AnimatedSection>
                        <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-blue-400 font-bold mb-4">
                            Production Update · June 2026
                        </p>
                        <h1 className="font-serif text-4xl md:text-6xl font-semibold tracking-tight leading-tight mb-6">
                            The first prototype is being built right now.
                        </h1>
                        <p className="font-sans text-base md:text-lg text-white/60 leading-relaxed">
                            It is June, and our factory has begun building the very first full prototype of the DreamPlay One. Here is an honest look at where your order stands and what happens next.
                        </p>
                    </AnimatedSection>
                </section>

                {/* ═══ HERO IMAGE ═══ */}
                <section className="max-w-4xl mx-auto px-6 mb-20">
                    <AnimatedSection>
                        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                            <Image
                                src="/images/product-updates/june-2026-prototype-keybed.jpg"
                                alt="The first DreamPlay One prototype keybed on the workbench"
                                fill
                                quality={90}
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 896px"
                                priority
                            />
                        </div>
                        <p className="font-sans text-xs text-white/40 mt-3 text-center">
                            The first prototype keybed, on the bench at our factory this month.
                        </p>
                    </AnimatedSection>
                </section>

                {/* ═══ WHAT WE'RE BUILDING ═══ */}
                <section className="max-w-3xl mx-auto px-6 mb-20">
                    <AnimatedSection>
                        <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-6">Real DS6.0 keys. Internals built oversized on purpose.</h2>
                        <p className="font-sans text-base md:text-lg text-white/60 leading-relaxed mb-5">
                            To be clear about what this is: the keys themselves are the real, final DS6.0 size — exactly the narrow keys you reserved. The keys are not changing. What we have deliberately built larger is everything inside.
                        </p>
                        <p className="font-sans text-base md:text-lg text-white/60 leading-relaxed">
                            By scaling up the internals — the circuit boards, the sensor array and the electronics — for this first prototype, our engineers get the room they need to probe, measure and validate every core system, including the key action, before we condense it all into the slim final enclosure. Prove it works first, then miniaturize it. That is the difference between rushing a product and building one worthy of the DreamPlay name.
                        </p>
                    </AnimatedSection>
                </section>

                {/* ═══ RENDER GALLERY ═══ */}
                <section className="max-w-5xl mx-auto px-6 mb-24">
                    <AnimatedSection>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {renders.map((r) => (
                                <div key={r.src} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-white/5">
                                    <Image src={r.src} alt={r.alt} fill quality={85} className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                                </div>
                            ))}
                        </div>
                        <p className="font-sans text-xs text-white/40 mt-3 text-center">
                            Current design renders. The prototype on the bench is how we prove these systems work before final tooling.
                        </p>
                    </AnimatedSection>
                </section>

                {/* ═══ ROADMAP ═══ */}
                <section className="max-w-3xl mx-auto px-6 mb-24">
                    <AnimatedSection>
                        <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-blue-400 font-bold mb-4 text-center">The road to delivery</p>
                        <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-12 text-center">What happens next</h2>
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

                {/* ═══ ORDER STATUS + OPTIONS CTA ═══ */}
                <section className="px-6 max-w-4xl mx-auto">
                    <AnimatedSection>
                        <div className="relative border border-blue-500/30 bg-gradient-to-b from-blue-900/10 to-transparent p-8 md:p-16 text-center overflow-hidden rounded-2xl shadow-2xl">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
                            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-blue-400 font-bold mb-4">Your order</p>
                            <h2 className="font-serif text-3xl md:text-5xl font-semibold mb-6">Check your status, choose your path.</h2>
                            <p className="font-sans text-base md:text-lg text-white/70 leading-relaxed max-w-2xl mx-auto mb-6">
                                Your estimated delivery date now lives on your account. Log in with the email address on your order to see your live status and choose what you would like to do:
                            </p>
                            <div className="font-sans text-sm text-white/60 leading-relaxed max-w-xl mx-auto mb-10 space-y-2 text-left sm:text-center">
                                <p><strong className="text-white">Keep your reservation</strong> — ship as soon as it is ready, at the price you originally paid.</p>
                                <p><strong className="text-white">Upgrade to DreamPlay One Pro</strong> — for a flat $200 more, as an early supporter.</p>
                                <p><strong className="text-white">Request a full refund</strong> — no questions asked, if you would rather not wait.</p>
                            </div>
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
                                Building a brand-new instrument from the ground up takes longer than a typical product, and I would rather be honest with you about the timeline than rush something unworthy of the DreamPlay name. Thank you for believing in this before it was easy or obvious.
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
