import { ArrowRight } from "lucide-react"
import { PricingSection } from "@/components/extended-offer/pricing-section"

export function CtaSection({ hiddenProducts = [] }: { hiddenProducts?: string[] }) {
    return (
        <>
            {/* Reserve your DreamPlay One — reuses the pricing cards */}
            <PricingSection hiddenProducts={hiddenProducts} />

            {/* Build your DreamPlay One — dark hero CTA */}
            <section className="relative w-full bg-black text-white overflow-hidden">
                {/* Radial glow */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'radial-gradient(ellipse 60% 50% at 50% 55%, rgba(255,255,255,0.06) 0%, transparent 70%)',
                    }}
                />

                <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-32 md:py-44 lg:py-52">
                    <span
                        className="inline-flex items-center gap-2 border border-white/15 px-4 py-1.5 rounded-full font-sans text-[10px] uppercase tracking-[0.25em] text-white/50 mb-8"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                        }}
                    >
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/40" />
                        Final Units Remaining in Batch
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/40" />
                    </span>

                    <h2 className="font-sans text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
                        Build your
                        <br />
                        <em className="font-serif italic">DreamPlay One.</em>
                    </h2>

                    <p className="mt-6 max-w-lg font-sans text-sm md:text-base leading-relaxed text-white/50">
                        In just a few steps, we&apos;ll help you discover the ideal keyboard size and finish
                        for your musical journey.
                    </p>

                    <a
                        href="/customize"
                        className="group mt-10 inline-flex items-center justify-center gap-2 border border-white/30 bg-white px-10 py-4 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-white/90 rounded-xl"
                        style={{
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                        }}
                    >
                        Start Customization
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </a>
                </div>
            </section>
        </>
    )
}
