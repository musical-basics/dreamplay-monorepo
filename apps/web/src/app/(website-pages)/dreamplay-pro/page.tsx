import Image from "next/image"
import Link from "next/link"
import { Navbar } from "@/components/Navbar"
import Footer from "@/components/Footer"
import { formatOneProTargetDeliveryDate } from "@/lib/one-pro-delivery"

export const dynamic = "force-dynamic"

export const metadata = {
    title: "DreamPlay One Pro - 88-Key Graded Hammer Digital Piano | DS5.5 & DS6.0",
    description:
        "The DreamPlay One Pro features graded hammer action, triple-sensor keys, 256-note polyphony, 230 sounds, and an advanced LED learning system. Starting at $1,899.",
    alternates: {
        canonical: "https://dreamplaypianos.com/dreamplay-pro",
    },
}

const engineeringPillars = [
    {
        title: "Triple-Sensor Pro Action",
        body: "Three sensors per key track hammer velocity, not just depression. Repeated notes and trills respond like a concert grand's escapement.",
    },
    {
        title: "Graded Hammer System",
        body: "Heavier touch in the bass yielding to a lighter touch in the treble. Synthetic ivory and ebony surfaces absorb moisture for sustained grip.",
    },
    {
        title: "256-Note Polyphony",
        body: "No voice is dropped under heavy sustain. 230 meticulously sampled onboard sounds covering grands, strings, organs, and more.",
    },
    {
        title: "Dual-Axis LED Guidance",
        body: "LEDs above and within every key. Invisible until commanded, then illuminating complex pieces with precise visual telemetry.",
    },
    {
        title: "40W Stereo Array",
        body: "Upward-firing transducers map acoustic resonance to the player's perspective, mimicking the soundboard reflection of a grand.",
    },
    {
        title: "Unbound Connectivity",
        body: "High-fidelity Bluetooth MIDI and Audio, USB Type-C, triple pedal support, and dual headphone jacks (3.5mm and 6.35mm).",
    },
]

const variants = [
    { name: "DreamPlay One Pro - DS5.5 - Nightmare Black", size: "DS5.5", color: "Nightmare Black", package: "Keyboard Only", price: "$1,899" },
    { name: "DreamPlay One Pro - DS5.5 - Aztec Gold", size: "DS5.5", color: "Aztec Gold", package: "Keyboard Only", price: "$1,899" },
    { name: "DreamPlay One Pro - DS6.0 - Nightmare Black", size: "DS6.0", color: "Nightmare Black", package: "Keyboard Only", price: "$1,899" },
    { name: "DreamPlay One Pro - DS6.0 - Aztec Gold", size: "DS6.0", color: "Aztec Gold", package: "Keyboard Only", price: "$1,899" },
    { name: "DreamPlay One Pro Premium Bundle - DS5.5 - Nightmare Black", size: "DS5.5", color: "Nightmare Black", package: "Premium Bundle", price: "$1,999" },
    { name: "DreamPlay One Pro Premium Bundle - DS5.5 - Aztec Gold", size: "DS5.5", color: "Aztec Gold", package: "Premium Bundle", price: "$1,999" },
    { name: "DreamPlay One Pro Premium Bundle - DS6.0 - Nightmare Black", size: "DS6.0", color: "Nightmare Black", package: "Premium Bundle", price: "$1,999" },
    { name: "DreamPlay One Pro Premium Bundle - DS6.0 - Aztec Gold", size: "DS6.0", color: "Aztec Gold", package: "Premium Bundle", price: "$1,999" },
]

const comparisonRows = [
    { label: "Price", one: "$999", pro: "$1,899" },
    { label: "Action", one: "Weighted Hammer", pro: "Graded Hammer" },
    { label: "Key Sensors", one: "Dual-Sensor", pro: "Triple-Sensor (Pro Action)" },
    { label: "Polyphony", one: "192 Notes", pro: "256 Notes" },
    { label: "Onboard Sounds", one: "18 Presets", pro: "230 Presets" },
    { label: "LED System", one: "Above every key", pro: "Above and within every key" },
    { label: "Speakers", one: "30W Stereo", pro: "40W Stereo" },
    { label: "Pedal Support", one: "Single sustain", pro: "Triple pedal" },
    { label: "Headphone", one: "1x 3.5mm", pro: "1x 3.5mm + 1x 6.35mm" },
    { label: "Colors", one: "Midnight Black, Pearl White", pro: "Nightmare Black, Aztec Gold" },
]

const keyboardOnlyIncludes = [
    "DreamPlay One Pro 88-key keyboard",
    "Sustain pedal",
    "DreamPlay Learn app (lifetime access)",
    "Power adapter and USB-C cable",
]

const premiumBundleIncludes = [
    "DreamPlay One Pro 88-key keyboard",
    "Matched furniture stand",
    "Triple pedal unit (damper, sostenuto, soft)",
    "Padded bench",
    "DreamPlay Learn app (lifetime access)",
]

export default function DreamPlayProPage() {
    const targetDeliveryDate = formatOneProTargetDeliveryDate()
    const productJsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "DreamPlay One Pro",
        description:
            "DreamPlay One Pro is an 88-key digital piano with graded hammer action, triple-sensor key detection, 256-note polyphony, and an advanced LED learning system.",
        image: [
            "https://dreamplaypianos.com/images/pro/nightmare-black-angled.jpg",
            "https://dreamplaypianos.com/images/pro/aztec-gold-full.jpg",
        ],
        brand: { "@type": "Brand", name: "DreamPlay Pianos" },
        offers: {
            "@type": "Offer",
            url: "https://dreamplaypianos.com/dreamplay-pro",
            priceCurrency: "USD",
            price: "1899",
            availability: "https://schema.org/PreOrder",
            itemCondition: "https://schema.org/NewCondition",
        },
    }

    return (
        <div className="bg-neutral-950 text-neutral-50">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
            />

            <Navbar forceOpaque={true} darkMode={true} className="border-b border-white/10 bg-neutral-950" />

            <main className="pt-16">
                {/* Hero — cinematic flagship reveal */}
                <section className="relative flex min-h-[92vh] flex-col justify-end overflow-hidden bg-neutral-950 px-6 pb-20 pt-24 md:px-16">
                    <div className="absolute inset-0 z-0">
                        <Image
                            src="/images/pro/aztec-gold-full.jpg"
                            alt="DreamPlay One Pro in Aztec Gold, cinematic lighting"
                            fill
                            priority
                            quality={95}
                            className="object-cover opacity-60"
                            sizes="100vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/30" />
                        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/70 via-transparent to-transparent" />
                    </div>

                    <div className="relative z-10 mx-auto w-full max-w-[1600px]">
                        <p className="mb-6 font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-[#c5a059]">
                            Flagship Instrument
                        </p>
                        <h1 className="max-w-4xl font-serif text-5xl font-medium leading-[1.05] md:text-7xl lg:text-8xl">
                            The absolute
                            <br />
                            <span className="italic text-white/70">standard.</span>
                        </h1>
                        <p className="mt-8 max-w-xl font-sans text-sm font-light leading-relaxed text-white/70 md:text-base">
                            An uncompromising approach to touch, tone, and technology. DreamPlay One Pro pairs pro-grade
                            triple-sensor action and a 40W stereo array with severe, purposeful minimalism.
                        </p>

                        <div className="mt-12 flex flex-wrap items-end gap-8">
                            <div>
                                <span className="mb-3 block font-sans text-[10px] uppercase tracking-[0.25em] text-white/40">
                                    Finishes
                                </span>
                                <div className="flex gap-3">
                                    <div className="flex items-center gap-2.5 border border-white/20 px-4 py-2">
                                        <span className="h-2.5 w-2.5 bg-[#0a0a0a] ring-1 ring-white/30" />
                                        <span className="font-sans text-xs tracking-wide text-white/90">Nightmare Black</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 border border-white/20 px-4 py-2">
                                        <span className="h-2.5 w-2.5 bg-[#c5a059]" />
                                        <span className="font-sans text-xs tracking-wide text-white/90">Aztec Gold</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href="/customize?product=pro"
                                    className="bg-white px-7 py-4 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-neutral-950 transition hover:bg-[#c5a059] hover:text-neutral-950"
                                >
                                    Reserve DreamPlay One Pro
                                </Link>
                                <Link
                                    href="/how-it-works"
                                    className="border border-white/30 px-7 py-4 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:border-white hover:bg-white/5"
                                >
                                    Find your size
                                </Link>
                            </div>
                        </div>

                        <div className="mt-16 flex items-center gap-8 font-sans text-[10px] uppercase tracking-[0.25em] text-white/40">
                            <span>From $1,899</span>
                            <span className="h-px w-8 bg-white/20" />
                            <span>Target delivery {targetDeliveryDate}</span>
                        </div>
                    </div>
                </section>

                {/* Reassurance bar */}
                <div className="flex flex-col items-center justify-between gap-3 border-y border-white/10 bg-neutral-900 px-6 py-5 font-sans text-[10px] uppercase tracking-[0.25em] text-white/55 md:flex-row md:px-16">
                    <span>Target delivery {targetDeliveryDate}</span>
                    <span className="hidden h-px w-10 bg-white/10 md:block" />
                    <span>DS5.5 and DS6.0</span>
                    <span className="hidden h-px w-10 bg-white/10 md:block" />
                    <span>Nightmare Black or Aztec Gold</span>
                </div>

                {/* Engineering grid — light section */}
                <section id="engineering" className="border-b border-black/10 bg-neutral-50 py-28 text-neutral-950 md:py-32">
                    <div className="mx-auto max-w-[1600px] px-6 md:px-16">
                        <div className="grid grid-cols-1 gap-0 lg:grid-cols-12">
                            <div className="mb-16 lg:col-span-4 lg:mb-0 lg:pr-16">
                                <p className="mb-6 font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-500">
                                    01. Engineering
                                </p>
                                <h2 className="mb-6 font-serif text-4xl leading-tight md:text-5xl">
                                    Built for
                                    <br />
                                    <span className="italic text-neutral-500">the player.</span>
                                </h2>
                                <p className="mb-10 font-sans text-sm font-light leading-relaxed text-neutral-600">
                                    Every component is tuned to how the instrument feels and sounds. No cosmetic flourishes.
                                </p>
                                <div className="relative aspect-[4/5] overflow-hidden border border-black/10 bg-neutral-100">
                                    <Image
                                        src="/images/pro/built-for-the-player.jpg"
                                        alt="DreamPlay One Pro key detail"
                                        fill
                                        quality={90}
                                        className="object-cover grayscale"
                                        sizes="(max-width: 1024px) 100vw, 33vw"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 border-l-0 border-t border-black/10 lg:col-span-8 md:grid-cols-2 md:border-l md:border-black/10">
                                {engineeringPillars.map((pillar, idx) => {
                                    const isLast = idx === engineeringPillars.length - 1
                                    return (
                                        <div
                                            key={pillar.title}
                                            className={`group border-b border-r-0 border-black/10 p-8 transition-colors hover:bg-black/[0.03] md:border-r md:p-10 ${
                                                isLast ? "bg-neutral-950 text-neutral-50 hover:bg-neutral-900" : ""
                                            }`}
                                        >
                                            <span
                                                className={`mb-6 block font-serif text-3xl italic ${
                                                    isLast ? "text-white/25" : "text-neutral-300"
                                                }`}
                                            >
                                                {String(idx + 1).padStart(2, "0")}
                                            </span>
                                            <h3
                                                className={`mb-3 font-sans text-xs font-semibold uppercase tracking-[0.2em] ${
                                                    isLast ? "text-[#c5a059]" : "text-neutral-950"
                                                }`}
                                            >
                                                {pillar.title}
                                            </h3>
                                            <p
                                                className={`font-sans text-sm font-light leading-relaxed ${
                                                    isLast ? "text-white/65" : "text-neutral-600"
                                                }`}
                                            >
                                                {pillar.body}
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Scale / Ergonomics — dark */}
                <section id="scale" className="border-b border-white/10 bg-neutral-900 py-28 text-neutral-50 md:py-32">
                    <div className="mx-auto max-w-[1600px] px-6 md:px-16">
                        <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
                            <div>
                                <p className="mb-6 font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">
                                    02. Ergonomics
                                </p>
                                <h2 className="mb-6 font-serif text-4xl leading-tight md:text-5xl">
                                    Two sizes,
                                    <br />
                                    <span className="italic text-[#c5a059]">one for your hands.</span>
                                </h2>
                                <p className="mb-12 max-w-md font-sans text-sm font-light leading-relaxed text-white/60">
                                    DreamPlay One Pro comes in two key widths so you can play without straining — whatever the span of your hand.
                                </p>

                                <div className="flex flex-col gap-5">
                                    <div className="group relative flex items-center justify-between overflow-hidden border border-white/15 bg-neutral-950 px-8 py-6 transition-colors hover:border-[#c5a059]/50">
                                        <span className="absolute right-0 top-0 h-full w-1 bg-[#c5a059]" />
                                        <div>
                                            <h3 className="mb-1 font-serif text-2xl">DS5.5</h3>
                                            <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/45">
                                                Ergonomic specification
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-sans text-xl font-light">140.7mm</span>
                                            <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/35">
                                                Octave span
                                            </span>
                                        </div>
                                    </div>

                                    <div className="group flex items-center justify-between border border-white/15 px-8 py-6 transition-colors hover:border-white/35">
                                        <div>
                                            <h3 className="mb-1 font-serif text-2xl">DS6.0</h3>
                                            <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/45">
                                                Concert specification
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-sans text-xl font-light">152.4mm</span>
                                            <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/35">
                                                Octave span
                                            </span>
                                        </div>
                                    </div>

                                    <p className="font-sans text-[11px] font-light italic text-white/40">
                                        The DS5.5 scale allows pianists with smaller spans to execute tenth intervals
                                        with the relaxed facility of a larger hand.
                                    </p>
                                </div>
                            </div>

                            <div className="relative aspect-square overflow-hidden border border-white/10 bg-neutral-950">
                                <Image
                                    src="/images/pro/nightmare-black-angled.png"
                                    alt="DreamPlay One Pro in Nightmare Black"
                                    fill
                                    quality={95}
                                    className="object-cover opacity-80"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-transparent" />
                                <div className="absolute left-6 top-6 font-sans text-[10px] uppercase tracking-[0.25em] text-white/60">
                                    Tactile scale
                                </div>
                                <div className="absolute bottom-6 left-6 right-6 flex justify-between border-t border-dashed border-white/25 pt-3 font-mono text-[9px] text-white/50">
                                    <span>0mm</span>
                                    <span>140.7</span>
                                    <span>152.4mm</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Ecosystem / Learn app */}
                <section className="border-b border-white/10 bg-neutral-950 py-28 text-neutral-50 md:py-32">
                    <div className="mx-auto max-w-5xl px-6 text-center md:px-16">
                        <p className="mb-6 font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-white/35">
                            03. Ecosystem
                        </p>
                        <h2 className="mb-8 font-serif text-4xl leading-tight md:text-6xl">
                            Seamless sync.
                            <br />
                            <span className="italic text-white/60">Infinite flow.</span>
                        </h2>
                        <p className="mx-auto mb-16 max-w-2xl font-sans text-sm font-light leading-relaxed text-white/55">
                            Lifetime access to the DreamPlay Learn app is included with every DreamPlay One Pro. Falling notes,
                            sheet music mode, wait-for-correct, tempo control, and section looping — synced to the
                            keybed LEDs in real time.
                        </p>

                        <div className="relative mx-auto aspect-[16/10] max-w-4xl overflow-hidden border border-white/10 bg-neutral-900">
                            <Image
                                src="/images/learn/falling-notes-mode.png"
                                alt="DreamPlay Learn app with falling notes mode"
                                fill
                                className="object-cover"
                                sizes="(max-width: 1024px) 100vw, 960px"
                            />
                        </div>
                    </div>
                </section>

                {/* Specs / Comparison — light */}
                <section id="specs" className="border-b border-black/10 bg-neutral-50 py-28 text-neutral-950 md:py-32">
                    <div className="mx-auto max-w-[1600px] px-6 md:px-16">
                        <div className="flex flex-col gap-16 lg:flex-row">
                            <div className="lg:w-1/3">
                                <p className="mb-6 font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-500">
                                    04. Specs
                                </p>
                                <h2 className="mb-6 font-serif text-4xl leading-tight">
                                    Every spec,
                                    <br />
                                    <span className="italic text-neutral-500">side by side.</span>
                                </h2>
                                <p className="font-sans text-sm font-light leading-relaxed text-neutral-600">
                                    Compare the Pro to the original One, and see every variant in one place.
                                </p>
                            </div>

                            <div className="lg:w-2/3">
                                <h3 className="mb-5 font-sans text-[11px] font-semibold uppercase tracking-[0.25em] text-neutral-500">
                                    Lineage comparison
                                </h3>
                                <div className="mb-16 overflow-x-auto border border-black/10 bg-white">
                                    <table className="w-full min-w-[680px] border-collapse font-sans text-sm">
                                        <thead>
                                            <tr className="border-b border-black/10 bg-neutral-100 text-left">
                                                <th className="px-5 py-4 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                                                    Parameter
                                                </th>
                                                <th className="px-5 py-4 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                                                    DreamPlay One
                                                </th>
                                                <th className="px-5 py-4 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a38241]">
                                                    DreamPlay One Pro
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {comparisonRows.map((row) => (
                                                <tr key={row.label} className="border-b border-black/5 align-top last:border-b-0">
                                                    <td className="px-5 py-4 font-sans text-xs font-medium uppercase tracking-wide text-neutral-800">
                                                        {row.label}
                                                    </td>
                                                    <td className="px-5 py-4 font-sans text-sm font-light text-neutral-600">
                                                        {row.one}
                                                    </td>
                                                    <td className="px-5 py-4 font-sans text-sm font-medium text-neutral-950">
                                                        {row.pro}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <h3 className="mb-5 font-sans text-[11px] font-semibold uppercase tracking-[0.25em] text-neutral-500">
                                    Variant matrix
                                </h3>
                                <div className="overflow-x-auto border border-black/10 bg-white">
                                    <table className="w-full min-w-[920px] border-collapse font-sans text-sm">
                                        <thead>
                                            <tr className="border-b border-black/10 bg-neutral-100 text-left">
                                                <th className="px-5 py-4 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                                                    Variant
                                                </th>
                                                <th className="px-5 py-4 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                                                    Size
                                                </th>
                                                <th className="px-5 py-4 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                                                    Color
                                                </th>
                                                <th className="px-5 py-4 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                                                    Package
                                                </th>
                                                <th className="px-5 py-4 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                                                    Price
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {variants.map((variant) => (
                                                <tr key={variant.name} className="border-b border-black/5 align-top last:border-b-0">
                                                    <td className="px-5 py-4 font-sans text-sm text-neutral-800">{variant.name}</td>
                                                    <td className="px-5 py-4 font-sans text-sm font-light text-neutral-600">{variant.size}</td>
                                                    <td className="px-5 py-4 font-sans text-sm font-light text-neutral-600">{variant.color}</td>
                                                    <td className="px-5 py-4 font-sans text-sm font-light text-neutral-600">{variant.package}</td>
                                                    <td className="px-5 py-4 font-sans text-sm font-medium text-neutral-950">{variant.price}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing — dark, flagship moment */}
                <section id="reserve" className="bg-neutral-950 py-28 text-neutral-50 md:py-32">
                    <div className="mx-auto max-w-6xl px-6 md:px-16">
                        <div className="mb-20 text-center">
                            <p className="mb-4 font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-white/35">
                                05. Acquisition
                            </p>
                            <h2 className="font-serif text-5xl leading-tight md:text-7xl">
                                Configure
                                <br />
                                <span className="italic text-[#c5a059]">the apparatus.</span>
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Tier 1: Keyboard Only */}
                            <div className="flex flex-col justify-between border border-white/15 bg-neutral-900/40 p-10 transition-colors hover:border-white/30">
                                <div>
                                    <h3 className="mb-2 font-serif text-3xl">Instrument Standard</h3>
                                    <p className="mb-8 border-b border-white/10 pb-5 font-sans text-[11px] uppercase tracking-[0.2em] text-white/45">
                                        Keyboard only
                                    </p>

                                    <div className="mb-2 font-serif text-5xl font-light tracking-tight">
                                        $1,899
                                        <span className="ml-2 font-sans text-sm italic tracking-normal text-white/35">USD</span>
                                    </div>
                                    <p className="mb-10 font-sans text-xs text-white/45">
                                        Target delivery: {targetDeliveryDate}. Preorder configured for checkout.
                                    </p>

                                    <ul className="mb-12 space-y-3 font-sans text-sm font-light text-white/70">
                                        {keyboardOnlyIncludes.map((item) => (
                                            <li key={item} className="flex items-start gap-3">
                                                <span className="mt-[9px] h-px w-4 bg-[#c5a059]" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <Link
                                    href="/customize?product=pro"
                                    className="block border border-white/30 py-4 text-center font-sans text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-neutral-950"
                                >
                                    Reserve Standard
                                </Link>
                            </div>

                            {/* Tier 2: Premium Bundle */}
                            <div className="relative flex flex-col justify-between border border-[#c5a059]/50 bg-neutral-950 p-10 shadow-[0_0_60px_rgba(197,160,89,0.06)] transition-colors hover:border-[#c5a059]">
                                <div className="absolute right-10 top-0 -translate-y-1/2 bg-[#c5a059] px-3 py-1 font-sans text-[9px] font-bold uppercase tracking-[0.25em] text-neutral-950">
                                    Flagship Configuration
                                </div>

                                <div>
                                    <h3 className="mb-2 font-serif text-3xl text-[#c5a059]">Premium Ecosystem</h3>
                                    <p className="mb-8 border-b border-[#c5a059]/20 pb-5 font-sans text-[11px] uppercase tracking-[0.2em] text-white/45">
                                        Keyboard · Stand · Triple pedal · Bench
                                    </p>

                                    <div className="mb-2 font-serif text-5xl font-light tracking-tight text-white">
                                        $1,999
                                        <span className="ml-2 font-sans text-sm italic tracking-normal text-white/35">USD</span>
                                    </div>
                                    <p className="mb-10 font-sans text-xs text-white/45">
                                        Target delivery: {targetDeliveryDate}. Preorder configured for checkout.
                                    </p>

                                    <ul className="mb-12 space-y-3 font-sans text-sm font-light text-white/80">
                                        {premiumBundleIncludes.map((item) => (
                                            <li key={item} className="flex items-start gap-3">
                                                <span className="mt-[9px] h-px w-4 bg-[#c5a059]" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <Link
                                    href="/customize?product=pro"
                                    className="block bg-[#c5a059] py-4 text-center font-sans text-xs font-bold uppercase tracking-[0.2em] text-neutral-950 transition hover:bg-white"
                                >
                                    Reserve Bundle
                                </Link>
                            </div>
                        </div>

                        <p className="mt-14 text-center font-sans text-[10px] uppercase tracking-[0.25em] text-white/35">
                            DreamPlay One Pro preorder handoff runs through secure checkout
                        </p>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="border-t border-white/10 bg-neutral-900 px-6 py-20 text-neutral-50 md:px-16">
                    <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                        <div>
                            <p className="mb-3 font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-[#c5a059]">
                                Now reserving
                            </p>
                            <h2 className="font-serif text-3xl md:text-4xl">DreamPlay One Pro is available to preorder.</h2>
                            <p className="mt-3 max-w-2xl font-sans text-sm font-light text-white/60">
                                Secure your size, finish, and package today. Target delivery is {targetDeliveryDate}.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/customize?product=pro"
                                className="bg-white px-7 py-4 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-neutral-950 transition hover:bg-[#c5a059]"
                            >
                                Start reservation
                            </Link>
                            <Link
                                href="/contact"
                                className="border border-white/30 px-7 py-4 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/5"
                            >
                                Contact sales
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
