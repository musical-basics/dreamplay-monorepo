"use client"

import { useEffect, useRef, useState } from "react"

export function HiddenBarrierSection() {
    const sectionRef = useRef<HTMLDivElement>(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry?.isIntersecting) { setVisible(true); observer.disconnect() } },
            { threshold: 0.15 }
        )
        if (sectionRef.current) observer.observe(sectionRef.current)
        return () => observer.disconnect()
    }, [])

    const r = 78
    const circumference = 2 * Math.PI * r

    return (
        <section ref={sectionRef} className="w-full bg-black text-white pt-28 pb-16 md:pt-40 md:pb-36">
            <div className="max-w-5xl mx-auto px-4 md:px-6">
                {/* Heading */}
                <div className={`text-center mb-10 md:mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    <p className="font-sans text-xs uppercase tracking-[0.3em] text-white/40">The Data</p>
                    <h2 className="mt-4 font-sans text-2xl leading-tight text-white md:text-4xl lg:text-5xl text-balance font-bold">The Hidden Barrier</h2>
                </div>

                {/* Donut charts row — grid aligned with bottom stats */}
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-6 md:mb-8 transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    {/* Female stat */}
                    <div className="flex flex-col items-center text-center relative">
                        <div className="relative w-[180px] h-[180px] md:w-[220px] md:h-[220px] mb-4 md:mb-6">
                            <svg width="220" height="220" viewBox="0 0 220 220" className="transform -rotate-90">
                                <defs>
                                    <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
                                        <feGaussianBlur stdDeviation="4" result="blur" />
                                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                    </filter>
                                    <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
                                        <feGaussianBlur stdDeviation="4" result="blur" />
                                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                    </filter>
                                </defs>
                                {/* Track */}
                                <circle cx="110" cy="110" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="18" />
                                {/* Green (comfortable) arc */}
                                <circle cx="110" cy="110" r={r} fill="none" stroke="#4ade80" strokeWidth="18"
                                    strokeDasharray={`${0.13 * circumference} ${0.87 * circumference}`}
                                    strokeDashoffset={`${-0.87 * circumference}`}
                                    strokeLinecap="butt" filter="url(#glow-green)"
                                    style={{
                                        transition: 'stroke-dashoffset 1.4s ease-out, opacity 0.8s ease-out',
                                        opacity: visible ? 1 : 0,
                                        strokeDashoffset: visible ? `${-0.87 * circumference}` : `${circumference}`,
                                    }} />
                                {/* Red (affected) arc */}
                                <circle cx="110" cy="110" r={r} fill="none" stroke="#ef4444" strokeWidth="18"
                                    strokeDasharray={`${0.87 * circumference} ${0.13 * circumference}`}
                                    strokeLinecap="butt" filter="url(#glow-red)"
                                    style={{
                                        transition: 'stroke-dashoffset 1.4s ease-out, opacity 0.8s ease-out',
                                        opacity: visible ? 1 : 0,
                                        strokeDashoffset: visible ? '0' : `${circumference}`,
                                    }} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="font-sans text-4xl md:text-5xl font-bold tracking-tight text-white">87%</span>
                            </div>
                        </div>
                        <p className="font-sans text-sm md:text-base text-white/50">of Females</p>
                        {/* Divider — right edge on desktop, bottom on mobile */}
                        <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-56 bg-white/10" />
                        <div className="block md:hidden w-20 h-px bg-white/10 mx-auto mt-6" />
                    </div>

                    {/* Male stat */}
                    <div className="flex flex-col items-center text-center">
                        <div className="relative w-[180px] h-[180px] md:w-[220px] md:h-[220px] mb-4 md:mb-6">
                            <svg width="220" height="220" viewBox="0 0 220 220" className="transform -rotate-90">
                                {/* Track */}
                                <circle cx="110" cy="110" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="18" />
                                {/* Green (comfortable) arc */}
                                <circle cx="110" cy="110" r={r} fill="none" stroke="#4ade80" strokeWidth="18"
                                    strokeDasharray={`${0.76 * circumference} ${0.24 * circumference}`}
                                    strokeDashoffset={`${-0.24 * circumference}`}
                                    strokeLinecap="butt" filter="url(#glow-green)"
                                    style={{
                                        transition: 'stroke-dashoffset 1.4s ease-out 0.2s, opacity 0.8s ease-out 0.2s',
                                        opacity: visible ? 1 : 0,
                                        strokeDashoffset: visible ? `${-0.24 * circumference}` : `${circumference}`,
                                    }} />
                                {/* Red (affected) arc */}
                                <circle cx="110" cy="110" r={r} fill="none" stroke="#ef4444" strokeWidth="18"
                                    strokeDasharray={`${0.24 * circumference} ${0.76 * circumference}`}
                                    strokeLinecap="butt" filter="url(#glow-red)"
                                    style={{
                                        transition: 'stroke-dashoffset 1.4s ease-out 0.2s, opacity 0.8s ease-out 0.2s',
                                        opacity: visible ? 1 : 0,
                                        strokeDashoffset: visible ? '0' : `${circumference}`,
                                    }} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="font-sans text-4xl md:text-5xl font-bold tracking-tight text-white">24%</span>
                            </div>
                        </div>
                        <p className="font-sans text-sm md:text-base text-white/50">of Males</p>
                    </div>
                </div>

                {/* Shared subtitle */}
                <p className={`text-center font-sans text-xs md:text-sm text-white/30 mb-12 md:mb-24 transition-all duration-700 delay-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
                    can&apos;t comfortably reach standard piano keys
                </p>

                {/* Bottom stats — same container */}
                <div className={`border-t border-white/10 pt-10 md:pt-16 grid md:grid-cols-2 gap-8 md:gap-12 text-center md:text-left transition-all duration-700 delay-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    <div>
                        <div className="font-sans text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 md:mb-3">8.5&quot;</div>
                        <div className="font-sans text-xs uppercase tracking-[0.3em] text-white/40 mb-4">The Threshold</div>
                        <p className="font-sans text-sm md:text-base leading-relaxed text-white/60">
                            Minimum hand span needed to play a conventional 6.5 inch keyboard from Yamaha or Steinway with real comfort.
                        </p>
                    </div>
                    <div>
                        <div className="font-sans text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 md:mb-3">25–30%</div>
                        <div className="font-sans text-xs uppercase tracking-[0.3em] text-white/40 mb-4">Larger Reach Required</div>
                        <p className="font-sans text-sm md:text-base leading-relaxed text-white/60">
                            Hand span often needs to be at least one quarter larger than the octave just to reach 8ths, 9ths, and 10ths without strain.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
