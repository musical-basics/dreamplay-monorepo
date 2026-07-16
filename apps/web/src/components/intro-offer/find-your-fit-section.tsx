"use client"

import { useState, useEffect, useRef } from "react"

type KeySize = "ds55" | "ds60" | "ds65"

const sizeData = {
    ds55: {
        name: "DS5.5",
        octaveSpan: '5.5"',
        octaveSpanCm: "14.1 cm",
        totalWidth: '41.14"',
        totalWidthCm: "104.5 cm",
        handSpan: '<7.6"',
        handSpanRange: '6.0" - 7.5"',
        ratio: "7/8",
        description: "Ideal for smaller hands",
        whoItsFor: "Most women & children",
        percentageBenefit: "87% of women",
        highlightBars: [0, 1, 2],
    },
    ds60: {
        name: "DS6.0",
        octaveSpan: '6.0"',
        octaveSpanCm: "15.2 cm",
        totalWidth: '44.57"',
        totalWidthCm: "113.2 cm",
        handSpan: '7.6"–8.5"',
        handSpanRange: '7.5" - 8.5"',
        ratio: "15/16",
        description: "Universal size",
        whoItsFor: "Medium hands",
        percentageBenefit: "23% of men",
        highlightBars: [3, 4],
    },
    ds65: {
        name: "DS6.5",
        octaveSpan: '6.5"',
        octaveSpanCm: "16.5 cm",
        totalWidth: '48.29"',
        totalWidthCm: "122.7 cm",
        handSpan: '8.5"+',
        handSpanRange: '8.5" and above',
        ratio: "Standard",
        description: "Conventional size",
        whoItsFor: "Larger hands",
        percentageBenefit: "Fits 13% of pianists",
        highlightBars: [5, 6],
    },
}

export function FindYourFitSection() {
    const [activeSize, setActiveSize] = useState<KeySize>("ds55")
    const [isVisible, setIsVisible] = useState(false)
    const sectionRef = useRef<HTMLElement>(null)
    const currentSize = sizeData[activeSize]

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    setIsVisible(true)
                }
            },
            { threshold: 0.2 },
        )

        if (sectionRef.current) {
            observer.observe(sectionRef.current)
        }

        return () => observer.disconnect()
    }, [])

    return (
        <section
            ref={sectionRef}
            className="bg-neutral-950 text-white py-8 md:py-16 border-t border-white/10 min-h-screen flex flex-col justify-center"
        >
            <div className="container mx-auto px-4">
                <div
                    className={`text-center mb-4 md:mb-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                >
                    <h2 className="text-xl md:text-4xl lg:text-5xl font-medium tracking-tight mb-1 md:mb-2">Find Your Fit</h2>
                    <p className="text-white/50 text-xs md:text-base max-w-xl mx-auto">
                        Choose the key size that matches your hand span
                    </p>
                </div>

                <div
                    className={`flex justify-center mb-4 md:mb-8 transition-all duration-700 delay-100 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
                >
                    <div className="inline-flex bg-white/5 rounded-full p-1">
                        {(["ds55", "ds60", "ds65"] as KeySize[]).map((size) => (
                            <button
                                key={size}
                                onClick={() => setActiveSize(size)}
                                className={`px-3 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all ${activeSize === size
                                    ? "bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-lg"
                                    : "text-white/70 hover:text-white"
                                    }`}
                            >
                                {sizeData[size].name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 max-w-4xl mx-auto mb-4 md:mb-6">
                    {[
                        { value: currentSize.octaveSpan, label: "Octave Span", description: currentSize.octaveSpanCm },
                        { value: currentSize.handSpan, label: "Hand Span", description: "Recommended" },
                        { value: "88", label: "Keys", description: "Full range" },
                        { value: currentSize.ratio, label: "Size Ratio", description: currentSize.description },
                    ].map((spec, index) => (
                        <div
                            key={spec.label}
                            className={`transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                            style={{ transitionDelay: `${200 + index * 100}ms` }}
                        >
                            <SpecCard {...spec} />
                        </div>
                    ))}
                </div>

                {/* Info card */}
                <div
                    className={`max-w-2xl mx-auto mb-4 md:mb-8 transition-all duration-700 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                >
                    <div className="bg-white/5 rounded-xl md:rounded-2xl p-3 md:p-4 grid grid-cols-3 gap-2 md:gap-4 text-center border border-sky-500/20">
                        <div className="flex flex-col items-center justify-center">
                            <p className="text-sky-400/60 text-[10px] md:text-xs uppercase tracking-wider mb-0.5">Best For</p>
                            <p className="text-white text-xs md:text-base font-medium">{currentSize.whoItsFor}</p>
                        </div>
                        <div className="flex flex-col items-center justify-center border-x border-sky-500/20 px-2">
                            <p className="text-sky-400/60 text-[10px] md:text-xs uppercase tracking-wider mb-0.5">Hand Span Range</p>
                            <p className="text-white text-xs md:text-base font-medium">{currentSize.handSpanRange}</p>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <p className="text-sky-400/60 text-[10px] md:text-xs uppercase tracking-wider mb-0.5">Keyboard Width</p>
                            <p className="text-white text-xs md:text-base font-medium">
                                {currentSize.totalWidth}{" "}
                                <span className="text-white/50 text-[10px] md:text-xs">({currentSize.totalWidthCm})</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Hand span visualization */}
                <div
                    className={`max-w-2xl mx-auto transition-all duration-700 delay-600 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                >
                    <h3 className="text-center text-white/40 text-[10px] md:text-xs uppercase tracking-[0.2em] mb-3 md:mb-6">
                        Hand Span Distribution
                    </h3>
                    <HandSpanGraph activeSize={activeSize} highlightBars={currentSize.highlightBars} />
                    <div className="text-center mt-6">
                        <p className="text-white/60 text-xs md:text-sm">
                            All models are built to the International DS Standard.{" "}
                            <a href="/about-us/ds-standard" className="text-sky-400 hover:text-sky-300 underline transition-colors">
                                Learn More
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}

function SpecCard({ value, label, description }: { value: string; label: string; description: string }) {
    return (
        <div className="text-center p-2 md:p-4 rounded-lg md:rounded-xl border border-sky-500/10 hover:border-sky-500/30 transition-all flex flex-col items-center justify-center bg-white/[0.02] hover:bg-white/[0.04]">
            <div className="text-lg md:text-3xl font-light mb-0.5 md:mb-1 transition-all bg-gradient-to-r from-sky-300 to-blue-400 bg-clip-text text-transparent">
                {value}
            </div>
            <div className="text-white/90 font-medium text-[10px] md:text-sm">{label}</div>
            <div className="text-white/40 text-[9px] md:text-xs">{description}</div>
        </div>
    )
}

function HandSpanGraph({ activeSize, highlightBars }: { activeSize: KeySize; highlightBars: number[] }) {
    const bars = [
        { range: '6.0-6.5"', percent: 8, width: 32 },
        { range: '6.5-7.0"', percent: 15, width: 48 },
        { range: '7.0-7.5"', percent: 22, width: 64 },
        { range: '7.5-8.0"', percent: 25, width: 72 },
        { range: '8.0-8.5"', percent: 18, width: 56 },
        { range: '8.5-9.0"', percent: 9, width: 40 },
        { range: '9.0+"', percent: 3, width: 20 },
    ]

    const getBarStyle = (index: number) => {
        const isSelected = highlightBars.includes(index)
        const isDS55Zone = index <= 2
        const isDS60Zone = index >= 3 && index <= 4
        const isDS65Zone = index >= 5

        if (isSelected) return "bg-gradient-to-r from-sky-400 to-blue-500"

        if (activeSize === "ds55") {
            if (isDS60Zone) return "bg-gradient-to-r from-sky-400/40 to-blue-500/40"
            if (isDS65Zone) return "bg-white/20"
        } else if (activeSize === "ds60") {
            if (isDS55Zone) return "bg-gradient-to-r from-sky-400/40 to-blue-500/40"
            if (isDS65Zone) return "bg-white/20"
        } else if (activeSize === "ds65") {
            if (isDS60Zone) return "bg-gradient-to-r from-sky-400/40 to-blue-500/40"
            if (isDS55Zone) return "bg-gradient-to-r from-sky-400/30 to-blue-500/30"
        }

        return "bg-white/20"
    }

    return (
        <div className="space-y-1.5 md:space-y-2">
            {bars.map((bar, index) => (
                <div key={bar.range} className="flex items-center gap-2 md:gap-3">
                    <span className="text-white/50 text-[9px] md:text-xs w-12 md:w-16 text-right shrink-0">{bar.range}</span>
                    <div className="flex-1 h-3 md:h-5 bg-white/10 rounded-sm relative overflow-hidden">
                        <div
                            className={`h-full rounded-sm transition-all duration-500 ${getBarStyle(index)}`}
                            style={{ width: `${bar.width}%` }}
                        />
                    </div>
                    <span className="text-white/50 text-[9px] md:text-xs w-6 md:w-8 shrink-0">{bar.percent}%</span>
                </div>
            ))}

            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 mt-3 md:mt-6 pt-3 md:pt-4">
                <div className="flex items-center gap-1 md:gap-1.5">
                    <div className="w-2 h-2 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full" />
                    <span className="text-white/60 text-[9px] md:text-xs">Selected size</span>
                </div>
                <div className="flex items-center gap-1 md:gap-1.5">
                    <div className="w-2 h-2 bg-gradient-to-r from-sky-400/40 to-blue-500/40 rounded-full" />
                    <span className="text-white/60 text-[9px] md:text-xs">Other DreamPlay</span>
                </div>
                <div className="flex items-center gap-1 md:gap-1.5">
                    <div className="w-2 h-2 bg-white/20 rounded-full" />
                    <span className="text-white/60 text-[9px] md:text-xs">Standard only</span>
                </div>
            </div>
        </div>
    )
}
