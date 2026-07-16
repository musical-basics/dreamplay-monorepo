"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

export function CalculatorSection() {
    const [sliderValue, setSliderValue] = useState(50)
    const [result, setResult] = useState({
        val: 8.0,
        cm: 20.3,
        zone: "B",
        model: "DS6.0",
        desc: "The 'Goldilocks' size. Slightly narrower than standard, giving you the power of a concert pianist without the stretching fatigue.",
        reach: "Play 10ths with new ease",
        activeColor: "#f59e0b",
        activeTwColor: "text-amber-500",
    })

    const getRealValue = (percent: number) => {
        const visualZoneA_End = 33.33
        const visualZoneB_End = 66.66
        if (percent <= visualZoneA_End) {
            return 6.0 + (percent / visualZoneA_End) * (7.6 - 6.0)
        } else if (percent <= visualZoneB_End) {
            const relativeP = (percent - visualZoneA_End) / (visualZoneB_End - visualZoneA_End)
            return 7.6 + relativeP * (8.5 - 7.6)
        } else {
            const relativeP = (percent - visualZoneB_End) / (100 - visualZoneB_End)
            return 8.5 + relativeP * (10.0 - 8.5)
        }
    }

    /* eslint-disable react-hooks/set-state-in-effect -- legacy behavior: derive result state from slider value */
    useEffect(() => {
        const realVal = getRealValue(sliderValue)
        const cm = realVal * 2.54
        if (realVal < 7.6) {
            setResult({ val: realVal, cm, zone: "A", model: "DS5.5", desc: "Standard keys are physically too wide for you. The DS5.5 solves this by shrinking the octave, instantly removing tension.", reach: "Finally play 9ths and 10ths comfortably", activeColor: "#f43f5e", activeTwColor: "text-rose-500" })
        } else if (realVal <= 8.5) {
            setResult({ val: realVal, cm, zone: "B", model: "DS6.0", desc: "The 'Goldilocks' size. Slightly narrower than standard, giving you the power of a concert pianist without the stretching fatigue.", reach: "Play octaves with ease, 9ths and 10ths without stretching", activeColor: "#f59e0b", activeTwColor: "text-amber-500" })
        } else {
            setResult({ val: realVal, cm, zone: "C", model: "DS6.5", desc: "You fit the historical standard. Since your hands are naturally large, this model provides the traditional concert grand key width.", reach: "Enjoy premium feel keys, fun LEDs and guided learning", activeColor: "#2dd4bf", activeTwColor: "text-teal-400" })
        }
    }, [sliderValue])
    /* eslint-enable react-hooks/set-state-in-effect */

    return (
        <section className="w-full bg-black text-white py-12 md:py-24 px-4 md:px-6 flex justify-center">
            <div className="w-full max-w-6xl border border-white/10 p-4 md:p-16">
                <div className="text-center mb-10 md:mb-16">
                    <p className="font-sans text-xs uppercase tracking-[0.3em] text-white/40">Hand Span Calculator</p>
                    <h2 className="mt-4 font-sans text-3xl leading-tight text-white md:text-4xl lg:text-5xl text-balance font-bold">Find Your Perfect Size</h2>
                    <p className="mt-4 font-sans text-sm md:text-base leading-relaxed text-white/60 max-w-2xl mx-auto">
                        DreamPlay&apos;s DS Standard keyboards come in different sizes to match your biology.
                    </p>
                </div>

                <div className="grid lg:grid-cols-12 gap-6 md:gap-8">
                    {/* INPUT CARD */}
                    <div className="lg:col-span-7 border border-white/10 p-5 md:p-8 lg:p-10 bg-black flex flex-col">
                        <div className="flex items-center gap-3 mb-6 md:mb-8">
                            <div className="w-10 h-10 border border-white/10 flex items-center justify-center">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-white/60"><path d="M2 12h20M12 2v20" /></svg>
                            </div>
                            <div className="font-sans text-xl md:text-2xl font-semibold">Find Your Zone</div>
                        </div>

                        <div className="mb-8 md:mb-12">
                            <div className="flex justify-between items-end mb-4 md:mb-6">
                                <span className="font-sans text-xs md:text-sm uppercase tracking-[0.3em] text-white/40">Your hand span</span>
                                <div className={`text-3xl md:text-4xl font-bold ${result.activeTwColor} transition-colors duration-300`}>
                                    {result.val.toFixed(1)}&quot; <span className="text-white/40 text-base md:text-lg font-normal">/ {result.cm.toFixed(1)} cm</span>
                                </div>
                            </div>

                            {/* SLIDER */}
                            <div className="relative w-full h-12 flex items-center justify-center">
                                <div
                                    className="absolute left-0 right-0 h-3 blur-md opacity-60"
                                    style={{ background: 'linear-gradient(90deg, #f43f5e 0%, #f43f5e 33%, #f59e0b 33%, #f59e0b 66%, #2dd4bf 66%, #2dd4bf 100%)' }}
                                />
                                <div
                                    className="absolute left-0 right-0 h-1.5"
                                    style={{ background: 'linear-gradient(90deg, #f43f5e 0%, #f43f5e 33%, #f59e0b 33%, #f59e0b 66%, #2dd4bf 66%, #2dd4bf 100%)' }}
                                />
                                <input
                                    type="range" min="0" max="100" step="0.5"
                                    value={sliderValue}
                                    onChange={(e) => setSliderValue(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-transparent appearance-none cursor-pointer relative z-10"
                                />
                                <style jsx>{`
                  input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 24px; width: 24px; border-radius: 0;
                    background: #ffffff; cursor: pointer;
                    border: 3px solid ${result.activeColor};
                    box-shadow: 0 0 16px ${result.activeColor};
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                    margin-top: -10px;
                  }
                  input[type=range]::-moz-range-thumb {
                    height: 24px; width: 24px; border-radius: 0;
                    background: #ffffff; cursor: pointer;
                    border: 3px solid ${result.activeColor};
                    box-shadow: 0 0 16px ${result.activeColor};
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                    margin-top: -10px;
                  }
                  input[type=range]::-webkit-slider-runnable-track { background: transparent; height: 6px; }
                `}</style>
                            </div>
                            <div className="flex justify-between font-sans text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/40 mt-3 md:mt-4 px-1">
                                <span>Small (6 in)</span><span>Average (8 in)</span><span>Large (10 in)</span>
                            </div>
                            <p className="font-sans text-xs text-white/40 text-center mt-3 md:mt-4 italic">Drag the slider to find your zone.</p>
                        </div>

                        <div className="bg-[#0a0a0a] p-4 md:p-6 flex items-center gap-4 md:gap-6 mt-auto border border-white/10">
                            <div className="w-16 h-16 md:w-20 md:h-20 relative overflow-hidden bg-black flex-shrink-0">
                                <Image src="/images/hands/hand-size-comparison.jpg" alt="Hand span guide" fill className="object-cover opacity-80" />
                            </div>
                            <div>
                                <div className="font-sans text-sm md:text-base font-semibold mb-1 text-white">How to measure</div>
                                <p className="font-sans text-xs md:text-sm text-white/60 leading-relaxed">Spread your hand wide. Measure from the <strong>tip of the thumb</strong> to the <strong>tip of the pinky</strong>.</p>
                            </div>
                        </div>
                    </div>

                    {/* RESULT CARD */}
                    <div className="lg:col-span-5 border border-white/10 p-5 md:p-8 lg:p-10 bg-black flex flex-col">
                        <div className="font-sans text-xs md:text-sm uppercase tracking-[0.3em] text-white/40 mb-2">Your match</div>
                        <div className={`text-4xl md:text-5xl font-bold mb-2 ${result.activeTwColor} transition-colors duration-300`}>Zone {result.zone}</div>
                        <div className="font-sans text-xs md:text-sm text-white/40 mb-6 md:mb-8">Hand span range: {result.val < 7.6 ? '6.0 to 7.6 inches' : result.val <= 8.5 ? '7.6 to 8.5 inches' : '8.5 inches +'}</div>
                        <div className="font-sans text-5xl md:text-6xl font-bold text-white mb-2 tracking-tight">{result.model}</div>
                        <div className="text-white/60 font-medium text-base md:text-lg mb-6 md:mb-8">
                            Recommended model <br />
                            <a href="/about-us/ds-standard" className="font-sans text-sm underline hover:text-white transition-colors">Learn about the DS Standard</a>
                        </div>
                        <p className="font-sans text-sm md:text-base leading-relaxed text-white/60 mb-6 md:mb-8 flex-grow">{result.desc}</p>
                        <div className="mt-auto bg-[#0a0a0a] border border-white/10 p-4 md:p-5 flex items-center gap-3 md:gap-4">
                            <div className="w-10 h-10 border border-white/10 flex items-center justify-center text-green-500">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path d="M20 6 9 17l-5-5" /></svg>
                            </div>
                            <div>
                                <div className="font-sans text-[10px] md:text-xs uppercase tracking-[0.3em] text-white/40 mb-0.5">Capability Unlocked</div>
                                <div className="text-sm md:text-base font-semibold text-white">{result.reach}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
