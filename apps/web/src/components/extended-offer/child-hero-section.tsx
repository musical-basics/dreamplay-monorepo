"use client"

import Image from "next/image"
import { ArrowRight, ArrowDown } from "lucide-react"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { LazyVideo } from "@/components/extended-offer/LazyVideo"

const BG_VIDEO = "https://pub-ae162277c7104eb2b558af08104deafc.r2.dev/DreamPlay%20Hero%20720p%20Video%20Hero%202%20Loop%20(Child%2BMom%2BLearningApp).mp4"

export function ChildHeroSection() {
    return (
        <section className="relative leading-[0] bg-white">
            <div className="relative w-full min-h-screen md:min-h-0 md:aspect-video">
                <LazyVideo src={BG_VIDEO} />
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/10 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-black/[0.15]" />

                <div
                    className="absolute inset-0 z-10 flex flex-col justify-center px-8 md:px-16 lg:px-24"
                    style={{
                        textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 0 30px rgba(0,0,0,0.4)',
                    }}
                >
                    <p className="font-sans text-sm font-bold uppercase tracking-[0.3em] text-white/70 md:text-lg">
                        A Piano That Grows With Them
                    </p>
                    <h2 className="mt-4 font-serif text-2xl leading-tight text-white md:text-4xl lg:text-5xl text-balance">
                        The Perfect Kids Piano.
                        <br />
                        Built for Small Hands.
                    </h2>
                    <p className="mt-5 max-w-md font-sans text-base font-medium leading-relaxed text-white/80 md:text-xl">
                        Children deserve keys that actually fit. Start on the DS5.5,
                        upgrade when they grow.
                    </p>
                </div>
            </div>
        </section>
    )
}

export function ChildUpgradePath() {
    return (
        <section className="bg-[#fafaf8]">
            <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
                <div className="mb-10 max-w-2xl">
                    <p className="font-sans text-sm uppercase tracking-[0.3em] text-neutral-500">
                        The Growth Path
                    </p>
                    <h3 className="mt-3 font-serif text-2xl leading-tight text-neutral-900 md:text-3xl lg:text-4xl text-balance">
                        Start small. Upgrade when they&apos;re ready.
                    </h3>
                </div>

                <div className="flex flex-col md:flex-row md:items-stretch gap-6 md:gap-0">
                    <div className="flex-1 border border-neutral-200 bg-white p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 font-sans text-xs font-bold text-white">1</span>
                            <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-neutral-400">Start Here</span>
                        </div>
                        <h4 className="font-serif text-2xl text-neutral-900 md:text-3xl">DS5.5</h4>
                        <p className="mt-1 font-sans text-xs uppercase tracking-wider text-neutral-400">7/8ths Size</p>
                        <p className="mt-4 font-sans text-sm font-medium leading-relaxed text-neutral-600">
                            Perfect for children and petite adults with handspans under 7.6&quot;. The smaller keys
                            let young hands reach octaves comfortably, building <strong className="text-neutral-900">proper technique</strong> from
                            the very first lesson.
                        </p>
                    </div>

                    <div className="flex items-center justify-center md:px-4 py-2 md:py-0">
                        <ArrowRight className="hidden md:block h-6 w-6 text-neutral-300" />
                        <ArrowDown className="md:hidden h-6 w-6 text-neutral-300" />
                    </div>

                    <div className="flex-1 border border-neutral-200 bg-white p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-neutral-300 font-sans text-xs font-bold text-neutral-400">2</span>
                            <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-neutral-400">When They Grow</span>
                        </div>
                        <h4 className="font-serif text-2xl text-neutral-900 md:text-3xl">DS6.0</h4>
                        <p className="mt-1 font-sans text-xs uppercase tracking-wider text-neutral-400">15/16ths Size</p>
                        <p className="mt-4 font-sans text-sm font-medium leading-relaxed text-neutral-600">
                            As their hands grow past 7.6&quot;, they upgrade to the DS6.0, the universal size
                            used by top university programs. Same muscle memory, same relaxed technique, just more room.
                        </p>
                    </div>
                </div>

                <div className="mt-8">
                    <Accordion type="single" collapsible>
                        <AccordionItem value="upgrade-details" className="border-neutral-200">
                            <AccordionTrigger className="font-sans text-sm uppercase tracking-[0.15em] text-neutral-600 hover:no-underline hover:text-neutral-900 py-4">
                                Learn More About the Upgrade Path
                            </AccordionTrigger>
                            <AccordionContent className="font-sans text-sm font-medium leading-relaxed text-neutral-600 md:text-base">
                                <div className="flex flex-col gap-4 max-w-3xl">
                                    <p>
                                        <strong className="text-neutral-900">How the upgrade works:</strong> When your child outgrows
                                        the DS5.5, contact our team to arrange a keyboard swap. You&apos;ll only pay the difference in price
                                        between the two models. We handle the rest.
                                    </p>
                                    <p>
                                        <strong className="text-neutral-900">Why start on DS5.5?</strong> Standard 6.5&quot; octave
                                        keyboards force children to hyperextend their fingers, creating bad habits that are extremely hard
                                        to unlearn later. Starting on a properly sized keyboard builds the correct foundation: relaxed
                                        wrists, curved fingers, natural hand position.
                                    </p>
                                    <p>
                                        <strong className="text-neutral-900">When to upgrade:</strong> Most children transition between
                                        ages 12-16, when their handspan grows past 7.6&quot;. Some prefer to stay on the DS5.5 well into
                                        adulthood. Many professional female pianists have handspans in the DS5.5 range.
                                    </p>
                                    <p>
                                        <strong className="text-neutral-900">No lost progress:</strong> The transition from DS5.5 to
                                        DS6.0 is seamless. Both follow the DS Standard sizing system, so finger spacing ratios stay
                                        consistent. Your child won&apos;t need to &quot;re-learn&quot; anything.
                                    </p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>

                <div className="mt-8">
                    <a
                        href="/customize"
                        className="group inline-flex items-center gap-2 bg-neutral-900 px-8 py-4 font-sans text-xs uppercase tracking-widest text-white transition-colors hover:bg-neutral-800"
                    >
                        Start with DS5.5
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </a>
                </div>
            </div>
        </section>
    )
}
