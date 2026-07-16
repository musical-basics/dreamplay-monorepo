import Image from "next/image"

export function HowItWorksHero() {
    const sizes = [
        {
            model: "DS5.5",
            label: "7/8THS SIZE",
            desc: "Designed for pianists with hands under 7.6 inches. Play octaves and 9ths with ease.",
            keys: "88",
            width: "Narrowest",
            img: "/images/keyboards/ds55-white-narrow-keys-piano.png",
            recommended: false,
        },
        {
            model: "DS6.0",
            label: "15/16THS SIZE",
            desc: "Designed for pianists with hands between 7.6 and 8.5 inches. Play octaves effortlessly.",
            keys: "88",
            width: "Narrow",
            img: "/images/keyboards/ds60-black-narrow-keys-piano.png",
            recommended: true,
        },
        {
            model: "DS6.5",
            label: "STANDARD SIZE",
            desc: "For the small percentage with larger hands. Conventional sizing.",
            keys: "88",
            width: "Standard",
            img: "/images/keyboards/ds65-black-standard-digital-piano.png",
            recommended: false,
        },
    ]

    return (
        <section className="relative bg-black text-white py-12 md:py-28 w-full">
            <div className="mx-auto max-w-5xl px-4 md:px-6 text-center">
                <p className="font-sans text-xs uppercase tracking-[0.3em] text-white/40">
                    The Solution
                </p>
                <h2 className="mt-4 font-sans text-3xl leading-tight text-white md:text-4xl lg:text-5xl text-balance font-bold">
                    A Keyboard That Fits You.
                </h2>
                <p className="mt-4 md:mt-6 font-sans text-sm leading-relaxed text-white/60 max-w-2xl mx-auto md:text-base lg:text-lg">
                    Standard keyboards use a one-size-fits-all key width designed for large hands.
                    DreamPlay&apos;s DS Standard matches your biology — so you can finally play with comfort, power, and control.
                </p>

                {/* Size Cards — info only, hover to enlarge */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 mt-10 md:mt-14 text-left">
                    {sizes.map((s) => (
                        <div
                            key={s.model}
                            className={`relative flex flex-col bg-white text-neutral-900 rounded-sm overflow-hidden transition-transform duration-300 ease-out hover:scale-[1.04] hover:shadow-2xl hover:z-10 ${s.recommended ? 'ring-2 ring-white shadow-xl' : ''
                                }`}
                        >
                            {s.recommended && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                                    <span className="font-sans text-[10px] uppercase tracking-[0.2em] bg-neutral-800 text-white px-3 py-1.5 rounded-sm">
                                        Recommended
                                    </span>
                                </div>
                            )}
                            {/* Product image */}
                            <div className="bg-neutral-800 px-6 md:px-8 py-8 md:py-10 flex items-center justify-center min-h-[140px] md:min-h-[180px]">
                                <Image
                                    src={s.img}
                                    alt={`DreamPlay ${s.model}`}
                                    width={400}
                                    height={200}
                                    className="w-full h-auto object-contain max-h-[100px] md:max-h-[130px] drop-shadow-lg"
                                />
                            </div>
                            {/* Card body */}
                            <div className="flex flex-col flex-grow p-4 md:p-6">
                                <h3 className="font-sans text-xl md:text-2xl font-bold text-neutral-900 mb-1">{s.model}</h3>
                                <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-4">{s.label}</p>
                                <p className="font-sans text-sm text-neutral-500 leading-relaxed mb-4 md:mb-6 flex-grow">{s.desc}</p>
                                {/* Stats row */}
                                <div className="flex justify-between items-end border-t border-neutral-100 pt-4">
                                    <div>
                                        <div className="font-sans text-xl md:text-2xl font-bold text-neutral-900">{s.keys}</div>
                                        <div className="font-sans text-[10px] uppercase tracking-[0.15em] text-neutral-400">Keys</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-sans text-xl md:text-2xl font-bold text-neutral-900">{s.width}</div>
                                        <div className="font-sans text-[10px] uppercase tracking-[0.15em] text-neutral-400">Key Width</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
