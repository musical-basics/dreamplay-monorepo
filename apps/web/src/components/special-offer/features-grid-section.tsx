const MetronomeIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M6 22L12 4L18 22H6Z" />
        <path d="M12 14L17 5" strokeWidth="2" />
        <rect x="14.5" y="7" width="3" height="2" rx="0.5" fill="currentColor" />
    </svg>
)

const RecordIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
    </svg>
)

const PolyphonyIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M9 18V6l12-3v12" />
        <ellipse cx="6" cy="18" rx="3" ry="2" fill="currentColor" />
        <ellipse cx="18" cy="15" rx="3" ry="2" fill="currentColor" />
    </svg>
)

const DualSensorIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
    >
        <path d="M7 4C4 7 4 17 7 20" />
        <path d="M10 6C8 9 8 15 10 18" />
        <path d="M14 6C16 9 16 15 14 18" />
        <path d="M17 4C20 7 20 17 17 20" />
    </svg>
)

const MidiIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect x="1" y="6" width="22" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <text x="12" y="14.5" textAnchor="middle" fontSize="7" fill="currentColor" fontFamily="sans-serif" fontWeight="500">
            MIDI
        </text>
    </svg>
)

const PresetsIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" />
        <path d="M15.5 8.5c1 1 1.5 2.2 1.5 3.5s-.5 2.5-1.5 3.5" />
        <path d="M19 5c2.5 2.5 3.5 5 3.5 7s-1 4.5-3.5 7" />
    </svg>
)

const LcdIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="2" y="4" width="20" height="13" rx="1" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
    </svg>
)

const GrandPianoIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M2 16c0-1 .5-1.5 1-2l1-6c.3-1 1-2 2-2h10c1 0 1.5.3 2 1l3 3c.5.5 1 1.5 1 2.5V16c0 .5-.5 1-1 1h-1v2h-2v-2h-2v2h-2v-2H4c-.5 0-1-.5-1-1zm3-4h3v3H5v-3zm5 0h3v3h-3v-3zm5 0h3v3h-3v-3z" />
    </svg>
)

const HeadphoneAudioIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M3 18v-6a9 9 0 0118 0v6" />
        <path d="M21 18a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5z" fill="currentColor" />
        <path d="M3 18a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z" fill="currentColor" />
    </svg>
)

const WeightedKeysIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <rect x="2" y="4" width="2.5" height="16" rx="0.5" />
        <rect x="5.5" y="4" width="2.5" height="16" rx="0.5" />
        <rect x="9" y="4" width="2.5" height="16" rx="0.5" />
        <rect x="12.5" y="4" width="2.5" height="16" rx="0.5" />
        <rect x="16" y="4" width="2.5" height="16" rx="0.5" />
        <rect x="19.5" y="4" width="2.5" height="16" rx="0.5" />
    </svg>
)

const BluetoothIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M6.5 6.5l11 11L12 22V2l5.5 4.5-11 11" />
    </svg>
)

const LedLightIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M9 18h6" />
        <path d="M10 21h4" />
        <path
            d="M15 14c.6-1 1-2 1-3.5a4 4 0 10-8 0c0 1.5.4 2.5 1 3.5.4.6.5 1.2.5 2h5c0-.8.1-1.4.5-2z"
            fill="currentColor"
        />
        <path d="M12 2v2" />
        <path d="M4.9 4.9l1.4 1.4" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="M19.1 4.9l-1.4 1.4" />
    </svg>
)

const featuresGrid = [
    { icon: <MetronomeIcon className="w-5 h-5 md:w-6 md:h-6" />, label: "Built-in Metronome" },
    { icon: <RecordIcon className="w-5 h-5 md:w-6 md:h-6" />, label: "Recording & Playback" },
    { icon: <PolyphonyIcon className="w-5 h-5 md:w-6 md:h-6" />, label: "192-note Polyphony" },
    { icon: <DualSensorIcon className="w-5 h-5 md:w-6 md:h-6" />, label: "Dual-Sensor Velocity Keys" },
    { icon: <MidiIcon className="w-5 h-5 md:w-6 md:h-6" />, label: "MIDI Sequencing" },
    { icon: <PresetsIcon className="w-5 h-5 md:w-6 md:h-6" />, label: "18 Essential Presets" },
    { icon: <LcdIcon className="w-5 h-5 md:w-6 md:h-6" />, label: "Backlit LCD Screen" },
    { icon: <GrandPianoIcon className="w-5 h-5 md:w-6 md:h-6" />, label: "Grand Piano Sound" },
    { icon: <HeadphoneAudioIcon className="w-5 h-5 md:w-6 md:h-6" />, label: "Hi-Fi Speakers & Audio" },
    { icon: <WeightedKeysIcon className="w-5 h-5 md:w-6 md:h-6" />, label: "88 Weighted Keys" },
    { icon: <BluetoothIcon className="w-5 h-5 md:w-6 md:h-6" />, label: "Bluetooth Connectivity" },
    { icon: <LedLightIcon className="w-5 h-5 md:w-6 md:h-6" />, label: "LED Lighting For Every Key" },
]

export function FeaturesGridSection() {
    return (
        <section className="relative overflow-hidden bg-neutral-950 border-t border-neutral-800">
            <div className="mx-auto max-w-6xl px-6 py-20 md:py-28 lg:py-32">
                <div className="mb-16 max-w-2xl">
                    <p className="font-sans text-xs uppercase tracking-[0.3em] text-neutral-400">
                        Professional Grade
                    </p>
                    <h2 className="mt-4 font-serif text-3xl leading-tight text-white md:text-4xl lg:text-5xl text-balance">
                        All the Features You Need
                    </h2>
                </div>

                <div className="grid grid-cols-3 gap-px bg-neutral-800 md:grid-cols-4">
                    {featuresGrid.map((feature, index) => (
                        <div
                            key={index}
                            className="flex flex-col items-center gap-3 bg-neutral-950 p-6 md:p-8 lg:p-10 text-center"
                        >
                            <div className="text-white/70 [&>svg]:w-6 [&>svg]:h-6 md:[&>svg]:w-7 md:[&>svg]:h-7">{feature.icon}</div>
                            <p className="font-sans text-xs text-neutral-400 leading-tight md:text-sm">
                                {feature.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
