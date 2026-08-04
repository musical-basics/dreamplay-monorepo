"use client"
import { useState } from "react"
import { Bluetooth, Usb, Volume2, Music, Headphones, Piano } from "lucide-react"

type FeatureKey = "bluetooth" | "usb" | "presets" | "speakers" | "headphones" | "keys" | null

const featureData = {
    bluetooth: {
        icon: <Bluetooth className="w-4 h-4" />,
        label: "Bluetooth",
        description: "Connect wirelessly to your devices for seamless audio streaming and MIDI control.",
        position: { left: "32%", top: "38%" },
    },
    usb: {
        icon: <Usb className="w-4 h-4" />,
        label: "USB MIDI",
        description: "Direct USB connection for recording and integrating with your favorite music software.",
        position: { left: "36%", top: "38%" },
    },
    presets: {
        icon: <Music className="w-4 h-4" />,
        label: "18 Presets",
        description: "Choose from 18 professionally crafted instrument sounds including grand pianos and strings.",
        position: { left: "50%", top: "52%" },
    },
    speakers: {
        icon: <Volume2 className="w-4 h-4" />,
        label: "Hi-Fi Speakers",
        description: "Built-in high-fidelity speakers deliver rich, room-filling sound without external equipment.",
        position: { left: "16%", top: "48%" },
    },
    headphones: {
        icon: <Headphones className="w-4 h-4" />,
        label: "Headphone Output",
        description: "Dedicated headphone output for silent, private practice sessions.",
        position: { left: "14%", top: "38%" },
    },
    keys: {
        icon: <Piano className="w-4 h-4" />,
        label: "88 Weighted Keys",
        description: "Full-size weighted keys provide authentic piano feel and responsive touch dynamics.",
        position: { left: "50%", top: "70%" },
    },
}

export function FeaturesPianoSection() {
    const [activeFeature, setActiveFeature] = useState<FeatureKey>(null)

    const handleFeatureInteraction = (key: FeatureKey) => {
        setActiveFeature((prev) => (prev === key ? null : key))
    }

    return (
        <section className="relative overflow-hidden bg-white">
            <div className="mx-auto max-w-6xl px-6 py-20 md:py-28 lg:py-32">
                <div className="mb-12 md:mb-16 max-w-2xl">
                    <p className="font-sans text-xs uppercase tracking-[0.3em] text-neutral-500">
                        Our Features
                    </p>
                    <h2 className="mt-4 font-serif text-3xl leading-tight text-neutral-900 md:text-4xl lg:text-5xl text-balance">
                        Everything You Need, Built In
                    </h2>
                    <p className="mt-4 font-sans text-sm text-neutral-500 md:text-base">
                        <span className="hidden md:inline">Hover over</span>
                        <span className="md:hidden">Tap</span> a feature to learn more
                    </p>
                </div>

                <div className="relative max-w-4xl">
                    {/* Feature buttons */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-2 md:flex md:flex-wrap md:gap-3 mb-6 md:mb-8">
                        {(Object.keys(featureData) as FeatureKey[]).filter(Boolean).map((key) => {
                            const feature = featureData[key!]
                            return (
                                <button
                                    key={key}
                                    className={`flex items-center justify-center gap-1.5 md:gap-2 px-3 py-2 md:px-5 md:py-2.5 transition-all duration-200 font-sans text-[9px] sm:text-[10px] md:text-xs uppercase tracking-[0.1em] ${activeFeature === key
                                        ? "bg-neutral-900 text-white border border-neutral-900"
                                        : "bg-transparent text-neutral-500 border border-neutral-300 hover:border-neutral-900 hover:text-neutral-900"
                                        }`}
                                    onClick={() => handleFeatureInteraction(key)}
                                    onMouseEnter={() => setActiveFeature(key)}
                                    onMouseLeave={() => setActiveFeature(null)}
                                >
                                    <span className="flex-shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5 md:[&>svg]:w-4 md:[&>svg]:h-4">{feature.icon}</span>
                                    <span className="whitespace-nowrap font-medium">
                                        {feature.label}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Piano image with overlay */}
                    <div className="relative overflow-hidden border border-neutral-200">
                        <img
                            src="/images/keyboards/Main%20Product%20Grey%20Background.JPG"
                            alt="DreamPlay One Features"
                            className="w-full h-auto"
                        />

                        {activeFeature && (
                            <svg
                                className="absolute inset-0 w-full h-full pointer-events-none"
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                            >
                                <line
                                    x1="50"
                                    y1="0"
                                    x2={Number.parseFloat(featureData[activeFeature].position.left)}
                                    y2={Number.parseFloat(featureData[activeFeature].position.top)}
                                    stroke="#171717"
                                    strokeWidth="1"
                                    vectorEffect="non-scaling-stroke"
                                    opacity="0.4"
                                />
                                <circle
                                    cx={Number.parseFloat(featureData[activeFeature].position.left)}
                                    cy={Number.parseFloat(featureData[activeFeature].position.top)}
                                    r="0.8"
                                    fill="#171717"
                                />
                            </svg>
                        )}

                        {activeFeature && (
                            <div
                                className="absolute w-2 h-2 md:w-3 md:h-3 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                style={{
                                    left: featureData[activeFeature].position.left,
                                    top: featureData[activeFeature].position.top,
                                }}
                            >
                                <div className="absolute inset-0 bg-neutral-900 rounded-full animate-ping opacity-30" />
                                <div className="absolute inset-0 bg-neutral-900 rounded-full" />
                            </div>
                        )}
                    </div>

                    {/* Description area */}
                    <div className="h-[80px] md:h-[100px] mt-4 md:mt-6 flex items-start justify-start">
                        {activeFeature ? (
                            <div className="max-w-lg">
                                <h3 className="font-serif text-base text-neutral-900 md:text-lg mb-1">
                                    {featureData[activeFeature].label}
                                </h3>
                                <p className="font-sans text-sm text-neutral-500 leading-relaxed">
                                    {featureData[activeFeature].description}
                                </p>
                            </div>
                        ) : (
                            <p className="font-sans text-xs text-neutral-400 md:text-sm">Select a feature above</p>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}
