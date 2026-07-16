"use client"

import { ArrowRight, ChevronDown } from "lucide-react"
import Link from "next/link"
import { useEffect, useState, useRef } from "react"

export function HeroSection() {
    const [isVisible, setIsVisible] = useState(false)
    const sectionRef = useRef<HTMLElement>(null)

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- legacy behavior: trigger entrance animation after mount
        setIsVisible(true)
    }, [])

    return (
        <section ref={sectionRef} className="relative h-screen flex items-center bg-neutral-900 overflow-hidden">
            <div className="absolute inset-0">
                <img
                    src="/images/marketing/dreamplay-one-hero.jpg"
                    alt="Pianist playing a narrow keyboard designed for small hands"
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-900/80 to-transparent" />
            </div>

            <div className="relative container mx-auto px-4 py-20">
                <div className="max-w-2xl">
                    {/* Title with slide-up animation */}
                    <h1
                        className={`text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 text-white transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                            }`}
                    >
                        The Premium Digital Piano for Small Hands
                    </h1>

                    <p
                        className={`text-xl md:text-2xl text-neutral-300 max-w-2xl mb-12 transition-all duration-1000 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                            }`}
                    >
                        Experience a narrow keyboard designed to eliminate overstretching, prevent hands injury, and let you play freely.
                    </p>

                    <Link
                        href="/customize"
                        className={`inline-flex items-center gap-3 bg-white text-neutral-900 rounded-full px-8 py-4 text-base font-medium hover:bg-neutral-100 transition-all duration-1000 delay-300 hover:scale-105 hover:shadow-xl ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                            }`}
                    >
                        Configure Yours
                        <span className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                            <ArrowRight className="w-4 h-4 text-white" />
                        </span>
                    </Link>

                    {/* Pricing context to prevent sticker shock */}
                    <div className={`mt-6 flex flex-col items-start gap-2 transition-all duration-1000 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
                        <div className="flex items-center gap-3">
                            <span className="bg-sky-500/20 text-sky-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-sky-500/30">
                                Founder&apos;s Batch
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/60">
                <span className="text-xs uppercase tracking-wider mb-2">Scroll</span>
                <ChevronDown className="w-5 h-5 animate-bounce" />
            </div>
        </section>
    )
}
