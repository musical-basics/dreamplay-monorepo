import { Playfair_Display, Inter } from "next/font/google"
import { Navbar } from "@/components/Navbar"
import Footer from "@/components/Footer"
import TestimonialsSection from "@/components/checkout/TestimonialsSection"
import { HowItWorksHero } from "@/components/how-it-works/hero-section"
import { CalculatorSection } from "@/components/how-it-works/calculator-section"
import { HiddenBarrierSection } from "@/components/how-it-works/hidden-barrier-section"
import { ScienceSection } from "@/components/how-it-works/science-section"
import { ResearchSection } from "@/components/how-it-works/research-section"
import { CtaSection } from "@/components/how-it-works/cta-section"
import { getHiddenProducts } from "@/actions/admin-actions"

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
})
const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
})

export default async function HiddenBarrierPage() {
    const hiddenProducts = await getHiddenProducts()
    return (
        <div className={`${playfair.variable} ${inter.variable} font-sans antialiased min-h-screen selection:bg-white/20 bg-black`}>
            <Navbar forceOpaque={true} darkMode={true} className="border-b border-white/10 bg-[#050505] backdrop-blur-md" />

            <main className="flex flex-col items-center">
                {/* The Hidden Barrier — full-width animated donut charts */}
                <HiddenBarrierSection />

                {/* The Science — biomechanics (right after Hidden Barrier) */}
                <ScienceSection />

                {/* Testimonials — integrated with biomechanics section */}
                <TestimonialsSection />

                {/* A Keyboard That Fits You + size cards */}
                <HowItWorksHero />

                {/* Hand Span Calculator */}
                <CalculatorSection />

                {/* Published Research */}
                <ResearchSection />

                {/* CTA */}
                <CtaSection hiddenProducts={hiddenProducts} />
            </main>

            <Footer />
        </div>
    )
}
