import type { ReactNode } from "react"
import { Playfair_Display, Inter } from "next/font/google"
import { Navbar } from "@/components/Navbar"
import { FeaturesGridSection } from "@/components/intro-offer/features-grid-section"
import { FeaturesPianoSection } from "@/components/intro-offer/features-piano-section"
import Footer from "@/components/Footer"
import Link from "next/link"
import { UrgencySubtext } from "@/components/UrgencySubtext"
import { SizeVisualSection } from "@/components/premium-offer/size-visual-section"
import { SpecsSection } from "@/components/premium-offer/specs-section"

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata = {
    title: "Product Information — DreamPlay One",
    description: "Complete technical specifications, physical geometry, and comparison between the DreamPlay One and DreamPlay One Pro.",
}

/* ── Deep Dive Geometry Data ────────────────────────────────────────── */

const whiteKeyData = [
    { c1: "Octave Width", c2: '6.500" (165.1 mm)', c3: '6.000" (152.4 mm)', c4: '5.538" (140.7 mm)' },
    { c1: "White Key Width (Front)", c2: '0.929" (23.6 mm)', c3: '0.857" (21.8 mm)', c4: '0.791" (20.1 mm)' },
]

const blackKeyData = [
    { c1: "Center-to-Center (1/6 Octave)", c2: '1.083" (27.5 mm)', c3: '1.000" (25.4 mm)', c4: '0.923" (23.4 mm)' },
    { c1: "Black Key Width (TOP)", c2: '0.375" (9.5 mm)', c3: '0.346" (8.8 mm)', c4: '0.320" (8.1 mm)' },
    { c1: "Black Key Width (BASE)", c2: '0.500" (12.7 mm)', c3: '0.375" (9.5 mm)', c4: '0.336" (8.5 mm)' },
    { c1: "Top-to-Base Ratio", c2: '0.750', c3: '0.922', c4: '0.952' },
    { c1: "Key Draft Angle (Slant)", c2: '6.48° (Heavy Slant)', c3: '1.51° (Near-Vertical)', c4: '0.83° (Virtually Straight)' },
    { c1: "Gap Between TOPS (Visual Space)", c2: '18.0 mm', c3: '16.6 mm', c4: '15.3 mm' },
    { c1: "Gap Between BASES (Playable Space)", c2: '14.8 mm', c3: '15.9 mm', c4: '14.9 mm' },
]

const chassisData = [
    { c1: "Active 88-Keybed Length", c2: '~48.29" (1227 mm)', c3: '44.53" (1131 mm)', c4: '41.14" (1045 mm)' },
    { c1: "Total Chassis Length", c2: 'TBD', c3: '48.27" (1226 mm)', c4: '48.27" (1226 mm)' },
    { c1: "Total Chassis Width", c2: 'TBD', c3: '11.65" (296 mm)', c4: '11.65" (296 mm)' },
    { c1: "Chassis Height", c2: 'TBD', c3: '5.9" (150 mm)', c4: '5.9" (150 mm)' },
    { c1: "Shipping Box (est.)", c2: '—', c3: '57–59" × 15–17" × 9–11"', c4: '57–59" × 15–17" × 9–11"' },
    { c1: "Total Shipping Weight (est.)", c2: '—', c3: '31–39 lbs (14–18 kg)', c4: '31–39 lbs (14–18 kg)' },
]

/* ── Hardware Spec Data (DreamPlay One vs Pro) ────────────────────────── */

const keySpecs = [
    { label: "Starting Price", one: "$999", pro: "$1,899" },
    { label: "Keyboard Versions", one: "DS5.5 or DS6.0", pro: "DS5.5 or DS6.0" },
    { label: "Chassis Structure", one: "Identical across models", pro: "Identical across models" },
    { label: "Key Sensor Technology", one: "Dual-Sensor", pro: "Triple-Sensor (Pro Action)" },
    { label: "Polyphony", one: "192 Notes", pro: "256 Notes" },
    { label: "Onboard Sounds", one: "18 Presets", pro: "230 Presets" },
    { label: "LED Learning System", one: "Above every key", pro: "Above AND within every key" },
    { label: "Action Style", one: "Weighted Hammer Action", pro: "Graded Hammer Action" },
]

const speakerSpecs = [
    { label: "Total Output Power", one: "30W", pro: "40W" },
    { label: "Configuration", one: "2.0 Channel Stereo", pro: "2.0 Channel Stereo" },
    { label: "Power Allocation", one: "(10W + 5W) × 2 channels", pro: "(15W + 5W) × 2 channels" },
    { label: "Woofer Power", one: "10W per channel", pro: "15W per channel" },
    { label: "Tweeter Power", one: "5W per channel", pro: "5W per channel" },
    { label: "Woofer Dimensions", one: "53 mm (W) × 93 mm (L)", pro: "53 mm (W) × 93 mm (L)" },
    { label: "Tweeter Dimensions", one: "Φ31 mm", pro: "Φ31 mm" },
]

const connectivitySpecs = [
    { label: "Headphone Jacks", one: "1× 3.5 mm output", pro: '1× 3.5 mm + 1× 6.35 mm (¼") output' },
    { label: "MIDI", one: "USB-MIDI (Type-C)", pro: "USB-MIDI (Type-C)" },
    { label: "Bluetooth", one: "Audio & MIDI Streaming", pro: "Audio & MIDI Streaming" },
    { label: "Aux In/Out", one: "3.5 mm stereo", pro: "3.5 mm stereo" },
    { label: "Sustain Pedal", one: '6.35 mm (¼") jack', pro: '6.35 mm (¼") jack + Triple Pedal Support' },
]

const features = [
    {
        title: "Ergonomic DS Standard Sizing",
        description: "Available in DS5.5 (7/8ths) and DS6.0 (15/16ths) sizes, matching the keyboard to your hand span and reducing stretching-related strain.",
    },
    {
        title: "Authentic Weighted Keys",
        description: "Every note responds to your touch with the dynamic range you'd expect from an acoustic piano, mapping perfectly to your muscle memory.",
    },
    {
        title: "Interactive LED Learning System",
        description: "Built-in key lights guide your fingers as you learn, seamlessly connecting with learning apps to accelerate your progress. Toggle them off for a classic look.",
    },
]

/* ── Competitor Comparison Data ────────────────────────────────────────── */

const check = <span className="text-emerald-500 font-bold">✓ Yes</span>
const cross = <span className="text-neutral-400 font-medium">✕ No</span>

const p125Comparison = [
    { feature: "Market Price", dreamplay: "$999", competitor: "$649" },
    { feature: "Key Width", dreamplay: "Ergonomic (DS5.5 / DS6.0)", competitor: "Standard Wide Only (DS6.5)" },
    { feature: "Speaker Power", dreamplay: "30W (2x15W)", competitor: "14W (2x7W)" },
    { feature: "LED Learning Lights", dreamplay: check, competitor: cross },
    { feature: "Key Sensors", dreamplay: "Dual-Sensor", competitor: "Dual-Sensor" },
    { feature: "Polyphony", dreamplay: "192 Notes", competitor: "192 Notes" },
]

const p525Comparison = [
    { feature: "Market Price", dreamplay: "$1,899", competitor: "$1,599" },
    { feature: "Key Width", dreamplay: "Ergonomic (DS5.5 / DS6.0)", competitor: "Standard Wide Only (DS6.5)" },
    { feature: "LED Learning Lights", dreamplay: "✓ Yes (Above & Within Keys)", competitor: cross },
    { feature: "Key Sensors", dreamplay: "Triple-Sensor", competitor: "Triple-Sensor" },
    { feature: "Polyphony", dreamplay: "256 Notes", competitor: "256 Notes" },
    { feature: "Headphone Outputs", dreamplay: "2", competitor: "2" },
]

const genericComparison = [
    { feature: "Market Price", one: "$999", pro: "$1,899", competitor: "$2,499+" },
    { feature: "Build Design", one: "Custom Narrow Tooling", pro: "Custom Narrow Tooling", competitor: "Retrofitted OEM Parts" },
    { feature: "Key Sensors", one: "Dual-Sensor", pro: "Triple-Sensor", competitor: "Dual-Sensor" },
    { feature: "Interactive LEDs", one: "✓ Above Keys", pro: "✓ Above & Within Keys", competitor: "✕ None" },
    { feature: "Smart App Integration", one: check, pro: check, competitor: cross },
    { feature: "Bench & Stand", one: "Included in Bundle", pro: "Included in Bundle", competitor: "Not Included" },
]

/* ── Components ──────────────────────────────────────────────── */

function FourColTable({ title, subtitle, col1, col2, col3, col4, data, note, dark }: { title: string, subtitle: string, col1: string, col2: string, col3: string, col4: string, data: { c1: ReactNode, c2: ReactNode, c3: ReactNode, c4: ReactNode }[], note?: string, dark?: boolean }) {
    return (
        <div className={`border p-6 md:p-10 mb-8 shadow-sm ${dark ? 'bg-[#0a0a0f] border-neutral-800' : 'bg-white border-neutral-200'}`}>
            <div className="mb-8">
                <h3 className={`font-serif text-2xl md:text-3xl ${dark ? 'text-white' : 'text-neutral-900'}`}>{title}</h3>
                <p className={`font-sans text-sm mt-2 ${dark ? 'text-neutral-400' : 'text-neutral-500'}`}>{subtitle}</p>
            </div>

            {/* Desktop Header */}
            <div className={`hidden md:grid grid-cols-12 gap-4 pb-4 border-b ${dark ? 'border-neutral-800' : 'border-neutral-300'}`}>
                <div className={`col-span-3 font-sans text-[10px] uppercase tracking-[0.2em] ${dark ? 'text-neutral-500' : 'text-neutral-500'}`}>{col1}</div>
                <div className={`col-span-3 font-sans text-xs font-bold uppercase tracking-wider ${dark ? 'text-neutral-400' : 'text-black'}`}>{col2}</div>
                <div className={`col-span-3 font-sans text-xs font-bold uppercase tracking-wider ${dark ? 'text-[#4a9eff]' : 'text-[#0066cc]'}`}>{col3}</div>
                <div className={`col-span-3 font-sans text-xs font-bold uppercase tracking-wider ${dark ? 'text-white' : 'text-black'}`}>{col4}</div>
            </div>

            {/* Table Rows */}
            {data.map((row, i) => (
                <div key={i} className={`flex flex-col gap-2 py-5 md:grid md:grid-cols-12 md:gap-4 md:items-center border-b last:border-0 ${dark ? 'border-neutral-800' : 'border-neutral-100'}`}>
                    <div className={`col-span-12 md:col-span-3 font-sans text-xs uppercase tracking-[0.2em] md:text-sm mb-2 md:mb-0 ${dark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        {row.c1}
                    </div>

                    {/* Mobile Labels + Values */}
                    <div className="col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-4 md:col-span-9 md:grid-cols-3">
                        <div>
                            <div className={`md:hidden font-sans text-[10px] uppercase tracking-wider font-bold mb-1 ${dark ? 'text-neutral-400' : 'text-black'}`}>{col2}</div>
                            <div className={`font-sans text-sm md:text-base ${dark ? 'text-neutral-300' : 'text-neutral-600'}`}>{row.c2}</div>
                        </div>
                        <div>
                            <div className={`md:hidden font-sans text-[10px] uppercase tracking-wider font-bold mb-1 ${dark ? 'text-[#4a9eff]' : 'text-[#0066cc]'}`}>{col3}</div>
                            <div className={`font-sans text-sm md:text-base font-medium ${dark ? 'text-[#4a9eff]' : 'text-[#0066cc]'}`}>{row.c3}</div>
                        </div>
                        <div>
                            <div className={`md:hidden font-sans text-[10px] uppercase tracking-wider font-bold mb-1 ${dark ? 'text-white' : 'text-black'}`}>{col4}</div>
                            <div className={`font-sans text-sm md:text-base font-medium ${dark ? 'text-white' : 'text-neutral-900'}`}>{row.c4}</div>
                        </div>
                    </div>
                </div>
            ))}
            {note && <p className={`mt-6 font-sans text-xs italic leading-relaxed ${dark ? 'text-neutral-500' : 'text-neutral-500'}`}>{note}</p>}
        </div>
    )
}

function SpecTable({ specs, note, light }: { specs: { label: string; one: string; pro: string }[]; note?: string; light?: boolean }) {
    return (
        <div className="w-full">
            {/* Table Header */}
            <div className={`hidden md:grid grid-cols-12 gap-4 pb-4 border-b ${light ? 'border-neutral-300' : 'border-neutral-800'}`}>
                <div className="col-span-4 font-sans text-xs uppercase tracking-[0.2em] text-transparent">Feature</div>
                <div className={`col-span-4 font-sans text-sm font-bold uppercase tracking-wider ${light ? 'text-neutral-900' : 'text-white'}`}>DreamPlay One</div>
                <div className="col-span-4 font-sans text-sm font-bold uppercase tracking-wider text-[#4a9eff]">DreamPlay One Pro</div>
            </div>

            {/* Table Rows */}
            {specs.map((spec) => (
                <div
                    key={spec.label}
                    className={`flex flex-col gap-2 py-5 md:grid md:grid-cols-12 md:gap-4 md:items-center ${light
                        ? `border-b border-neutral-200`
                        : `border-b border-neutral-800`
                        }`}
                >
                    <div className={`col-span-4 font-sans text-xs uppercase tracking-[0.2em] md:text-sm ${light ? "text-neutral-500" : "text-neutral-400"}`}>
                        {spec.label}
                    </div>

                    <div className="md:hidden font-sans text-[10px] uppercase tracking-wider font-bold mt-2 text-neutral-500">DreamPlay One</div>
                    <div className={`col-span-4 font-sans text-sm md:text-base ${light ? "text-neutral-900" : "text-white"}`}>
                        {spec.one}
                    </div>

                    <div className="md:hidden font-sans text-[10px] uppercase tracking-wider font-bold mt-2 text-[#4a9eff]">DreamPlay One Pro</div>
                    <div className={`col-span-4 font-sans text-sm font-medium md:text-base text-[#4a9eff]`}>
                        {spec.pro}
                    </div>
                </div>
            ))}
            {note && (
                <p className={`mt-6 text-xs italic ${light ? "text-neutral-500" : "text-neutral-400"}`}>{note}</p>
            )}
        </div>
    )
}

function ComparisonTable2Col({ title, subtitle, dreamplayName, competitorName, data }: { title: string, subtitle: string, dreamplayName: string, competitorName: string, data: { feature: ReactNode, dreamplay: ReactNode, competitor: ReactNode }[] }) {
    return (
        <div className="bg-white border border-neutral-200 p-6 md:p-10 mb-12">
            <div className="mb-8">
                <h3 className="font-serif text-2xl md:text-3xl text-neutral-900">{title}</h3>
                <p className="font-sans text-sm text-neutral-500 mt-2">{subtitle}</p>
            </div>

            <div className="grid grid-cols-12 gap-4 pb-4 border-b border-neutral-300">
                <div className="col-span-4 font-sans text-[10px] uppercase tracking-[0.2em] text-neutral-500 hidden md:block">Feature</div>
                <div className="col-span-6 md:col-span-4 font-sans text-sm font-bold uppercase tracking-wider text-black">{dreamplayName}</div>
                <div className="col-span-6 md:col-span-4 font-sans text-sm font-bold uppercase tracking-wider text-neutral-400">{competitorName}</div>
            </div>

            {data.map((row, i) => (
                <div key={i} className="flex flex-col gap-2 py-5 md:grid md:grid-cols-12 md:gap-4 md:items-center border-b border-neutral-100 last:border-0">
                    <div className="col-span-12 md:col-span-4 font-sans text-xs uppercase tracking-[0.2em] md:text-sm text-neutral-500 mb-2 md:mb-0">
                        {row.feature}
                    </div>
                    <div className="col-span-12 grid grid-cols-2 md:col-span-8 md:grid-cols-2 gap-4">
                        <div className="font-sans text-sm md:text-base text-neutral-900 font-medium">{row.dreamplay}</div>
                        <div className="font-sans text-sm md:text-base text-neutral-500">{row.competitor}</div>
                    </div>
                </div>
            ))}
        </div>
    )
}

function ComparisonTable3Col({ title, subtitle, data }: { title: string, subtitle: string, data: { feature: ReactNode, one: ReactNode, pro: ReactNode, competitor: ReactNode }[] }) {
    return (
        <div className="bg-neutral-50 border border-neutral-200 p-6 md:p-10">
            <div className="mb-8">
                <h3 className="font-serif text-2xl md:text-3xl text-neutral-900">{title}</h3>
                <p className="font-sans text-sm text-neutral-500 mt-2">{subtitle}</p>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-neutral-300">
                <div className="col-span-3 font-sans text-[10px] uppercase tracking-[0.2em] text-neutral-500">Feature</div>
                <div className="col-span-3 font-sans text-xs font-bold uppercase tracking-wider text-black">DP One</div>
                <div className="col-span-3 font-sans text-xs font-bold uppercase tracking-wider text-[#4a9eff]">DP One Pro</div>
                <div className="col-span-3 font-sans text-xs font-bold uppercase tracking-wider text-neutral-400">Our Competitors</div>
            </div>

            {data.map((row, i) => (
                <div key={i} className="flex flex-col gap-2 py-5 md:grid md:grid-cols-12 md:gap-4 md:items-center border-b border-neutral-200 last:border-0">
                    <div className="col-span-12 md:col-span-3 font-sans text-xs uppercase tracking-[0.2em] md:text-sm text-neutral-500 mb-2 md:mb-0">
                        {row.feature}
                    </div>

                    {/* Mobile Labels + Values */}
                    <div className="col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-4 md:col-span-9 md:grid-cols-3">
                        <div>
                            <div className="md:hidden font-sans text-[10px] uppercase tracking-wider font-bold mb-1 text-black">DP One</div>
                            <div className="font-sans text-sm md:text-base text-neutral-900">{row.one}</div>
                        </div>
                        <div>
                            <div className="md:hidden font-sans text-[10px] uppercase tracking-wider font-bold mb-1 text-[#4a9eff]">DP One Pro</div>
                            <div className="font-sans text-sm md:text-base text-[#4a9eff] font-medium">{row.pro}</div>
                        </div>
                        <div>
                            <div className="md:hidden font-sans text-[10px] uppercase tracking-wider font-bold mb-1 text-neutral-400">Our Competitors</div>
                            <div className="font-sans text-sm md:text-base text-neutral-500">{row.competitor}</div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

import ProductJsonLd from "@/components/ProductJsonLd"

/* ── Page ──────────────────────────────────────────────── */

export default function ProductInformationPage() {
    return (
        <div className={`${playfair.variable} ${inter.variable} font-sans antialiased`}>
            <ProductJsonLd />
            <Navbar />
            <main>
                {/* Hero */}
                <section className="bg-neutral-950 pt-32 pb-20 md:pt-40 md:pb-28">
                    <div className="mx-auto max-w-6xl px-6 text-center">
                        <p className="font-sans text-xs uppercase tracking-[0.3em] text-neutral-400 mb-4">
                            Product Information
                        </p>
                        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight text-white mb-6 text-balance">
                            Tech Specs & Geometry
                        </h1>
                        <p className="font-sans text-base md:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                            Dive into the exact dimensions, electronics, and engineering that make DreamPlay the world&apos;s first professionally-scaled ergonomic digital piano line.
                        </p>
                    </div>
                </section>

                {/* Size Visual Section — Find Your Perfect Fit */}
                <SizeVisualSection />

                {/* Features Overview — LIGHT */}
                <section className="bg-white">
                    <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
                        <div className="mb-16 text-center md:text-left">
                            <p className="font-sans text-xs uppercase tracking-[0.3em] text-neutral-500 mb-4">
                                Standard Across All Models
                            </p>
                            <h2 className="font-serif text-3xl md:text-4xl leading-tight text-neutral-900">
                                The DreamPlay Foundation
                            </h2>
                        </div>
                        <div className="grid gap-8 md:grid-cols-3">
                            {features.map((f) => (
                                <div key={f.title} className="border border-neutral-200 bg-neutral-50 p-6 md:p-8 hover:border-neutral-400 transition-colors">
                                    <h3 className="font-serif text-lg text-neutral-900 mb-3">{f.title}</h3>
                                    <p className="font-sans text-sm text-neutral-500 leading-relaxed">{f.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* All the Features You Need */}
                <FeaturesGridSection />

                {/* Everything You Need, Built In */}
                <FeaturesPianoSection />

                {/* Technical Details — Dimensions Image + Specs from Premium Offer */}
                <SpecsSection />

                {/* ── THE SCIENCE OF FIT (Vertical Walls vs Funnel) ── */}
                <section className="bg-[#050505] border-t border-neutral-800 py-24 md:py-32">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="mb-16">
                            <p className="font-sans text-xs uppercase tracking-[0.3em] text-[#4a9eff] mb-4 font-semibold">
                                The Science of Fit
                            </p>
                            <h2 className="font-serif text-4xl md:text-5xl leading-tight text-white mb-8">
                                Advanced Ergonomic Geometry
                            </h2>
                            <p className="font-sans text-base md:text-lg text-neutral-400 max-w-3xl leading-relaxed mt-4">
                                Most manufacturers hide their exact key dimensions. We publish ours openly because we engineered them down to the micrometer specifically for your hands.
                            </p>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
                            <div>
                                <h3 className="font-serif text-3xl text-white mb-6">The &quot;Forgiveness Funnel&quot; vs. The &quot;Elevator Shaft&quot;</h3>
                                <p className="font-sans text-neutral-400 mb-5 leading-relaxed">
                                    Take a close look at a standard acoustic piano. The black keys aren&apos;t straight blocks; they are shaped like pyramids with a heavy outward slope (a 6.48° draft angle) towards the base.
                                </p>
                                <p className="font-sans text-neutral-400 mb-5 leading-relaxed">
                                    This traditional shape acts as a <strong>&quot;forgiveness funnel.&quot;</strong> When small-handed pianists stretch to reach large chords, their fingers naturally splay out and flatten, striking the keys at a severe diagonal angle. The heavy slant acts as a funnel to catch sloppy, angled finger strikes. But this design severely chokes the physical space available for your fingers at the bottom of the keybed. The slanted key is essentially a band-aid for an ergonomic problem caused by the piano itself.
                                </p>
                                <p className="font-sans text-neutral-400 mb-5 leading-relaxed">
                                    David Steinbuhler, creator of the DS Standard, engineered a brilliant solution for the narrower sizes: he practically eliminated the taper. On the DS5.5 and DS6.0, the black keys feature nearly vertical walls. The DS5.5 features a virtually invisible 0.83° slope, acting like an <strong>&quot;elevator shaft.&quot;</strong>
                                </p>
                            </div>
                            <div className="bg-neutral-900 border border-neutral-800 p-8 md:p-12 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#4a9eff] to-emerald-400" />
                                <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#4a9eff] mb-4 font-bold">The Biomechanical Paradox</h4>
                                <p className="font-serif text-xl italic text-white leading-relaxed mb-8">
                                    Because the octave is perfectly matched to your hand, you no longer have to stretch. Your hands stay relaxed in a proper &quot;dome&quot; shape, allowing your fingers to descend perfectly vertically. You don&apos;t need a forgiving funnel anymore!
                                </p>
                                <p className="font-sans text-sm text-neutral-300 leading-relaxed mb-6">
                                    By standing the walls up straight, we preserve an incredibly spacious playing gap between the black keys.
                                </p>
                                <div className="space-y-4 pt-6 border-t border-neutral-800">
                                    <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                                        <span className="font-sans text-sm text-neutral-500">Standard Piano Gap at Base</span>
                                        <span className="font-mono text-sm text-neutral-400">14.8 mm</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                                        <span className="font-sans text-sm text-white font-bold">DreamPlay DS5.5 Gap at Base</span>
                                        <span className="font-mono text-sm text-white font-bold">14.9 mm</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-1">
                                        <span className="font-sans text-sm text-[#4a9eff] font-bold">DreamPlay DS6.0 Gap at Base</span>
                                        <span className="font-mono text-sm text-[#4a9eff] font-bold">15.9 mm</span>
                                    </div>
                                </div>
                                <p className="font-sans text-xs text-neutral-500 mt-6 leading-relaxed">
                                    <strong>The Result:</strong> Despite being a much smaller keyboard overall, the physical gap where your fingers depress the keys on our narrower sizes is actually <em>wider</em> than the gap on a full-sized 6.5&quot; acoustic piano!
                                </p>
                            </div>
                        </div>

                        <FourColTable
                            title="White Key Dimensions"
                            subtitle="The foundational spacing of the octave."
                            col1="Dimension"
                            col2="Standard (DS6.5)"
                            col3="DreamPlay DS6.0"
                            col4="DreamPlay DS5.5"
                            data={whiteKeyData}
                            dark
                        />

                        <FourColTable
                            title="Black Key Dimensions"
                            subtitle="Engineered for perfect finger clearance utilizing near-vertical sidewalls."
                            col1="Dimension"
                            col2="Standard (DS6.5)"
                            col3="DreamPlay DS6.0"
                            col4="DreamPlay DS5.5"
                            data={blackKeyData}
                            dark
                            note="* Key draft angle and gaps are calculated based on an estimated 0.52 to 0.57 inch exposed black key height."
                        />

                        <FourColTable
                            title="Chassis & Footprint"
                            subtitle="The exterior dimensions of the instrument."
                            col1="Dimension"
                            col2="Standard (DS6.5)"
                            col3="DreamPlay DS6.0"
                            col4="DreamPlay DS5.5"
                            data={chassisData}
                            dark
                            note="* Note: Both the DreamPlay One and the upcoming DreamPlay One Pro utilize the exact same exterior chassis structure, providing a sleek, unified footprint. The Pro model includes upgraded internal components such as larger 40W speakers and a Triple-Sensor action."
                        />
                    </div>
                </section>

                {/* Hardware Specifications (One vs Pro) */}
                <section className="bg-white border-t border-neutral-200">
                    <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
                        <div className="mb-12">
                            <p className="font-sans text-xs uppercase tracking-[0.3em] text-[#0066cc] mb-4">
                                Head to Head
                            </p>
                            <h2 className="font-serif text-3xl md:text-4xl leading-tight text-neutral-900">
                                Model Hardware Specifications
                            </h2>
                        </div>
                        <SpecTable
                            specs={keySpecs}
                            note="* The DreamPlay One Pro is currently in active development. Pricing and hardware specifications are subject to slight changes before mass production."
                            light
                        />
                    </div>
                </section>

                {/* Speaker Specifications — LIGHT (Side by Side) */}
                <section className="bg-neutral-50 border-t border-neutral-200">
                    <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
                        <div className="mb-12">
                            <p className="font-sans text-xs uppercase tracking-[0.3em] text-neutral-500 mb-4">
                                Audio
                            </p>
                            <h2 className="font-serif text-3xl md:text-4xl leading-tight text-neutral-900">
                                Speaker System
                            </h2>
                        </div>
                        <SpecTable
                            specs={speakerSpecs}
                            light
                        />
                    </div>
                </section>

                {/* Connectivity Specifications (Side by Side) */}
                <section className="bg-white border-t border-neutral-200">
                    <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
                        <div className="mb-12">
                            <p className="font-sans text-xs uppercase tracking-[0.3em] text-[#0066cc] mb-4">
                                I/O
                            </p>
                            <h2 className="font-serif text-3xl md:text-4xl leading-tight text-neutral-900">
                                Connectivity
                            </h2>
                        </div>
                        <SpecTable specs={connectivitySpecs} light />
                    </div>
                </section>

                {/* COMPETITIVE ANALYSIS */}
                <section className="bg-neutral-50 py-24 md:py-32 border-t border-neutral-200">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="mb-16 text-center">
                            <p className="font-sans text-xs uppercase tracking-[0.3em] text-neutral-500 mb-4">
                                Market Comparison
                            </p>
                            <h2 className="font-serif text-4xl md:text-5xl leading-tight text-neutral-900">
                                How We Stack Up
                            </h2>
                            <p className="font-sans text-base md:text-lg text-neutral-500 max-w-2xl mx-auto leading-relaxed mt-4">
                                We engineered the DreamPlay series to go toe-to-toe with the world&apos;s leading standard-sized digital pianos, while destroying the narrow-key competition on price.
                            </p>
                        </div>

                        <ComparisonTable2Col
                            title="The Entry-Level Clash"
                            subtitle="Comparing the standard base models."
                            dreamplayName="DreamPlay One"
                            competitorName="Yamaha P125"
                            data={p125Comparison}
                        />

                        <ComparisonTable2Col
                            title="The Pro-Level Clash"
                            subtitle="Comparing the premium upgraded models."
                            dreamplayName="DreamPlay One Pro"
                            competitorName="Yamaha P525"
                            data={p525Comparison}
                        />

                        <ComparisonTable3Col
                            title="The Narrow-Key Industry"
                            subtitle="Why pay double for retrofitted parts when you can get custom tooling?"
                            data={genericComparison}
                        />
                    </div>
                </section>

                {/* CTA */}
                <section className="bg-neutral-950 border-t border-neutral-800 py-24 md:py-32 text-center">
                    <div className="mx-auto max-w-6xl px-6">
                        <p className="font-sans text-xs uppercase tracking-[0.3em] text-[#0066cc] mb-4">
                            Get Started
                        </p>
                        <h2 className="font-serif text-3xl md:text-4xl leading-tight text-white mb-8">
                            Ready to play without limits?
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/customize"
                                className="inline-flex items-center justify-center gap-2 border border-white bg-white px-8 py-4 font-sans text-xs uppercase tracking-widest text-black transition-colors hover:bg-white/90"
                            >
                                Reserve Now
                            </Link>
                            <Link
                                href="/how-it-works"
                                className="inline-flex items-center justify-center gap-2 border border-neutral-600 px-8 py-4 font-sans text-xs uppercase tracking-widest text-white transition-colors hover:border-white"
                            >
                                How It Works
                            </Link>
                        </div>
                        <UrgencySubtext />
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    )
}
