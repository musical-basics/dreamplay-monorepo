"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowRight, MousePointerClick } from "lucide-react"

const sizes = [
    {
        id: "ds55",
        model: "DS5.5",
        tagline: "7/8ths Size",
        octave: '5.5"',
        description: "Perfect for handspans under 7.6 inches.",
        detail: '5.5" octave, perfect for petite women and children with growing hands. This is our smallest size and we recommend it for pianists with handspans under 7.6". That being said, if you have thick fingers or prefer a size closer to the standard (6.5" octave), we recommend the DS6.0.',
        pianoImg: "/images/keyboards/ds55-white-narrow-keys-alt.png",
        handImg: "/images/hands/zone-a-small-hands-diagram.png",
        zone: "Zone A",
        dark: true,
    },
    {
        id: "ds60",
        model: "DS6.0",
        tagline: "15/16ths Size",
        octave: '6.0"',
        description: "Perfect for handspans between 7.6–8.5 inches.",
        detail: '6.0" octave, the "universal size." This size is recommended for anyone with 7.6 to 8.5" handspans (Zone B), but pianists in Zone A with 7.2–7.6" handspans also enjoy practicing on this size as it offers more room between the black keys. Pianists in Zone C with handspans from 8.6" to 9.0" also enjoy practicing improvements on this size because of the improved reach for demanding classical repertoire.',
        pianoImg: "/images/keyboards/ds60-black-narrow-keys-side.png",
        handImg: "/images/hands/zone-b-medium-hands-diagram.png",
        zone: "Zone B",
        highlight: true,
    },
    {
        id: "ds65",
        model: "DS6.5",
        tagline: "Full Size",
        octave: '6.5"',
        description: "Perfect for handspans over 8.5 inches.",
        detail: '6.5" octave, the "standard" or "conventional" size for those with an 8.6" or above handspan. This size is already readily available on the mass market. If you have a handspan under 9.0", we encourage you to try the DS6.0 instead. But if you want our LED functions and smart learning guide, or just like the way our keyboard looks, you are welcome to order this option.',
        pianoImg: "/images/keyboards/ds65-black-standard-digital-piano.png",
        handImg: "/images/hands/zone-c-standard-hands-diagram.png",
        zone: "Zone C",
        dark: true,
    },
]

export function SizeVisualSection() {
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const selectedSize = sizes.find(s => s.id === selectedId)

    return (
        <section className="relative overflow-hidden bg-[#f5f5f0]">
            <div className="mx-auto max-w-6xl px-6 py-20 md:py-28 lg:py-32">
                <div className="mb-16 max-w-2xl">
                    <p className="font-sans text-xs uppercase tracking-[0.3em] text-black/50">
                        Introducing the Sizes
                    </p>
                    <h2 className="mt-4 font-serif text-3xl leading-tight text-black md:text-4xl lg:text-5xl text-balance">
                        Find your perfect fit.
                    </h2>
                    <p className="mt-6 font-sans text-sm leading-relaxed text-black/60 md:text-base">
                        Three DS Standard sizes — the same standard adopted by top
                        universities worldwide. A professional instrument for every hand.
                    </p>
                </div>

                <div className="mb-6 flex items-center justify-end gap-2">
                    <MousePointerClick className="h-4 w-4 text-black/40 animate-pulse" strokeWidth={1.5} />
                    <span className="font-sans text-xs font-medium text-black/40 tracking-wide">Click each card for details</span>
                </div>

                <div className="grid gap-px md:grid-cols-3">
                    {sizes.map((size) => {
                        const isSelected = selectedId === size.id
                        const isDark = 'dark' in size && size.dark
                        return (
                            <button
                                key={size.id}
                                onClick={() => setSelectedId(isSelected ? null : size.id)}
                                className={`group flex flex-col text-left transition-all duration-300 cursor-pointer ${isDark ? 'bg-[#050505]' : 'bg-white'
                                    } ${isSelected
                                        ? isDark ? 'ring-1 ring-white/30 z-10' : 'ring-1 ring-black/30 z-10'
                                        : 'hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40 hover:z-10'
                                    }`}
                            >
                                {/* Piano Image */}
                                <div className={`relative flex h-48 items-center justify-center border-b p-6 md:h-56 transition-colors duration-300 ${isDark ? 'border-white/10' : 'border-black/10'
                                    }`}>
                                    <Image
                                        src={size.pianoImg}
                                        alt={`Piano ${size.model}`}
                                        width={500}
                                        height={333}
                                        className="object-contain max-h-full w-auto transition-transform duration-500 group-hover:scale-105"
                                    />
                                </div>

                                {/* Info */}
                                <div className="p-8 md:p-10">
                                    <p className={`font-sans text-[11px] uppercase tracking-[0.25em] font-semibold ${isDark ? 'text-white/60' : 'text-black/60'
                                        }`}>
                                        {size.tagline}
                                    </p>
                                    <h3 className={`mt-2 font-serif text-2xl md:text-3xl ${isDark ? 'text-white' : 'text-black'
                                        }`}>
                                        {size.model}
                                    </h3>
                                    <p className={`mt-3 font-sans text-sm leading-relaxed ${isDark ? 'text-white/60' : 'text-black/60'
                                        }`}>
                                        {size.description}
                                    </p>
                                    <div className="mt-4 flex items-center gap-2">
                                        <span className={`font-sans text-xs uppercase tracking-wider ${isDark ? 'text-white/50' : 'text-black/50'
                                            }`}>
                                            {size.octave} octave
                                        </span>
                                        <ArrowRight className={`h-3 w-3 transition-transform ${isDark ? 'text-white/50' : 'text-black/50'
                                            } ${isSelected ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                                    </div>
                                </div>

                                {/* Hand Zone Image */}
                                <div className="relative aspect-[3/2] w-full overflow-hidden">
                                    <Image
                                        src={size.handImg}
                                        alt={`Hand ${size.zone}`}
                                        width={904}
                                        height={603}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                </div>

                                {/* Zone Label */}
                                <div className={`border-t py-6 text-center ${isDark ? 'border-white/10' : 'border-black/10'
                                    }`}>
                                    <span className={`font-serif text-3xl md:text-4xl ${isDark ? 'text-white' : 'text-black'
                                        }`}>
                                        {size.zone}
                                    </span>
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* Detail Popout */}
                <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${selectedSize ? "max-h-96 opacity-100 mt-6" : "max-h-0 opacity-0 mt-0"
                        }`}
                >
                    {selectedSize && (
                        <div className="border border-black/10 bg-white p-8 md:p-10">
                            <div className="flex items-start gap-4">
                                <span className="mt-1 shrink-0 font-serif text-2xl text-black/80">
                                    {selectedSize.model}
                                </span>
                                <div className="h-px flex-1 mt-4 bg-black/10" />
                            </div>
                            <p className="mt-4 font-sans text-sm leading-relaxed text-black/70 md:text-base md:leading-relaxed max-w-3xl">
                                {selectedSize.detail}
                            </p>
                        </div>
                    )}
                </div>

                {/* CTA */}
                <div className="mt-12 flex justify-center">
                    <a
                        href="https://www.dropbox.com/scl/fi/9b72rbi4ga0pjterxyoan/DreamPlay-Infographic.pdf?rlkey=mc08i1ahn5tp3thdd0qjnag2d&st=olbh1t9w&dl=1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center justify-center gap-2 border border-black/30 px-8 py-4 font-sans text-xs uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white"
                    >
                        Download Our Hand-Measuring Guide
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </a>
                </div>
            </div>
        </section>
    )
}
