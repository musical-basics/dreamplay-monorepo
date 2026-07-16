"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

const benefits = [
    "88 fully-weighted hammer-action keys",
    "Available in DS5.5, DS6.0,\nor DS6.5 sizes",
    "Professional sound with 18 presets",
    "Bluetooth & USB MIDI connectivity",
]

export function LessonsSection() {
    const [isVisible, setIsVisible] = useState(false)
    const sectionRef = useRef<HTMLElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    setIsVisible(true)
                }
            },
            { threshold: 0.3 },
        )

        if (sectionRef.current) {
            observer.observe(sectionRef.current)
        }

        return () => observer.disconnect()
    }, [])

    return (
        <section
            ref={sectionRef}
            className="bg-white text-neutral-900 py-8 md:py-16 min-h-screen flex items-center justify-center"
        >
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-center max-w-5xl mx-auto">
                    <div
                        className={`relative transition-all duration-700 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"}`}
                    >
                        <div className="relative rounded-[30px] md:rounded-[50px] overflow-hidden aspect-[4/5] md:aspect-[3/4]">
                            <img
                                src="/images/intro-offer/person-playing-piano-hands-on-keys-warm-natural-li.jpg"
                                alt="Playing the DreamPlay One"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 text-center text-white">
                                <h3 className="text-2xl md:text-4xl font-sans font-semibold mb-2 md:mb-3">Did you know?</h3>
                                <p className="text-sm md:text-base leading-relaxed text-white/90 max-w-sm mx-auto">
                                    Traditional pianos are designed for handspans of 8.5&quot; or more, leaving behind most women and nearly a
                                    third of men.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`flex flex-col justify-center items-center text-center transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"}`}
                    >
                        <h2 className="text-2xl md:text-4xl lg:text-5xl font-semibold text-neutral-900 mb-3 md:mb-4 leading-tight">
                            Standard Piano Keys
                            <br className="hidden md:block" />
                            <span className="md:hidden"> </span>
                            Are Too Wide
                        </h2>

                        <p className="text-neutral-600 text-base md:text-lg mb-4 md:mb-6 leading-relaxed">
                            Stop over-stretching. DreamPlay One offers narrower keys designed for your handspan.
                        </p>

                        <ul className="grid grid-cols-2 gap-x-4 gap-y-2 md:gap-x-6 md:gap-y-3 max-w-md mx-auto">
                            {benefits.map((benefit, index) => (
                                <li
                                    key={index}
                                    className={`flex items-center justify-start gap-1.5 md:gap-2 min-h-[40px] md:min-h-[48px] transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                                        }`}
                                    style={{ transitionDelay: `${400 + index * 100}ms` }}
                                >
                                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-neutral-900 rounded-full shrink-0" />
                                    <span className="text-neutral-800 text-xs md:text-sm font-medium leading-snug whitespace-pre-line text-left">
                                        {benefit}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <Link
                            href="/customize"
                            className={`mt-6 md:mt-8 inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-neutral-900 text-white text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-105 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                                }`}
                            style={{ transitionDelay: "800ms" }}
                        >
                            Configure Yours
                            <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}
