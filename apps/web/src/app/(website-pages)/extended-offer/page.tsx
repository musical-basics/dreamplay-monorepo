import { Playfair_Display, Inter } from "next/font/google"
import { Navbar } from "@/components/Navbar"
import { CrowdfundingSection } from "@/components/extended-offer/crowdfunding-section"
import { SocialProofBar } from "@/components/extended-offer/social-proof-bar"
import { InlineBuyersGuide } from "@/components/extended-offer/audience-fork-section"
import { ChildHeroSection, ChildUpgradePath } from "@/components/extended-offer/child-hero-section"
import { TradeInSection } from "@/components/extended-offer/trade-in-section"
import { TradeInFaqSection } from "@/components/extended-offer/trade-in-faq-section"
import { HandComparisonSection } from "@/components/extended-offer/hand-comparison-section"
import { VideoHero3 } from "@/components/extended-offer/video-hero-3"
import { SizeFinderSection } from "@/components/extended-offer/size-finder-section"
import { VideoSection } from "@/components/extended-offer/video-section"
import { FeaturesSection } from "@/components/extended-offer/features-section"
import { VideoHero4 } from "@/components/extended-offer/video-hero-4"
import { SizeVisualSection } from "@/components/extended-offer/size-visual-section"
import { SpecsSection } from "@/components/extended-offer/specs-section"
import { StanfordQuoteSection } from "@/components/extended-offer/stanford-quote-section"
import { CreatorSection } from "@/components/extended-offer/creator-section"
import { TrustSection } from "@/components/extended-offer/trust-section"
import { PricingSection } from "@/components/extended-offer/pricing-section"
import { GuaranteeSection } from "@/components/extended-offer/guarantee-section"
import Footer from "@/components/Footer"
import { getHiddenProducts } from "@/actions/admin-actions"

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
})
const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
})

export const metadata = {
    title: "DreamPlay One | A Piano That Fits Your Hands",
    description:
        "The DreamPlay One features narrower keys (DS5.5 & DS6.0) sized to fit your hands — play comfortably without overstretching, and reach pieces a standard keyboard puts out of range.",
    alternates: {
        canonical: 'https://dreamplaypianos.com',
    },
}

export default async function ExtendedOfferPage() {
    const hiddenProducts = await getHiddenProducts()
    return (
        <div className={`${playfair.variable} ${inter.variable} font-sans antialiased`}>
            <Navbar />
            <main>
                {/* ⚡ APPROACH — Hook in 3 seconds */}
                <CrowdfundingSection />
                {/* All sections below scroll OVER the sticky hero — each sticks and stacks */}
                <div className="relative z-10">
                    <div className="sticky top-0 z-[11]"><SocialProofBar /></div>

                    {/* Section 2 — Buyer's Guide (regular scroll) */}
                    <div className="relative z-[12] min-h-[100svh] md:min-h-screen flex flex-col justify-center bg-neutral-100">
                        <InlineBuyersGuide />
                    </div>

                    <div className="sticky top-0 z-[13] min-h-screen md:min-h-0 md:aspect-video">
                        <ChildHeroSection />
                    </div>

                    {/* Section 3b — Upgrade Path (regular scroll) */}
                    <div className="relative z-[13] bg-[#fafaf8]">
                        <ChildUpgradePath />
                    </div>

                    {/* Section 4 — Trade-In Upgrade */}
                    <div className="relative z-[14] bg-neutral-100">
                        <TradeInSection />
                    </div>

                    {/* Section 5 — Trade-In FAQ */}
                    <div className="relative z-[15] bg-neutral-50">
                        <TradeInFaqSection />
                    </div>

                    {/* Section 6 — Video Hero 3 */}
                    <div className="sticky top-0 z-[16] min-h-screen md:min-h-0 md:aspect-video overflow-hidden">
                        <VideoHero3 />
                    </div>

                    {/* Section 7+8 — Hand Comparison + Size Finder (merged) */}
                    <div className="relative z-[17] bg-white">
                        <HandComparisonSection />
                        <SizeFinderSection />
                    </div>

                    {/* Section 9 — Video Hero 4 */}
                    <div className="sticky top-0 z-[19] min-h-screen md:min-h-0 md:aspect-video overflow-hidden">
                        <VideoHero4 />
                    </div>

                    {/* Section 10+11 — Features + Specs (merged, regular scroll) */}
                    <div className="relative z-[20]" style={{ background: 'linear-gradient(to bottom, #000000 0%, #000000 60%, #020202 68%, #040404 75%, #070707 80%, #0a0a0a 85%, #0d0d0d 90%, #111111 94%, #141414 100%)' }}>
                        <FeaturesSection />
                        <SpecsSection />
                    </div>

                    {/* Section 12 — Size Visual (regular scroll) */}
                    <div className="relative z-[22] bg-[#f5f5f0]">
                        <SizeVisualSection />
                    </div>

                    {/* Section 13 — Stanford Quote (regular scroll) */}
                    <div className="relative z-[23] bg-foreground">
                        <StanfordQuoteSection />
                    </div>

                    {/* Section 14 — Trust (regular scroll, gradient) */}
                    <div className="relative z-[24]" style={{ background: 'linear-gradient(to bottom, #000000 0%, #000000 60%, #020202 68%, #040404 75%, #070707 80%, #0a0a0a 85%, #0d0d0d 90%, #111111 94%, #141414 100%)' }}>
                        <TrustSection />
                    </div>

                    {/* Section 15 — Product Video (sticky parallax) */}
                    <div className="sticky top-0 z-[25] min-h-[60vh] md:min-h-0 md:aspect-video bg-black overflow-hidden">
                        <section id="video"><VideoSection /></section>
                    </div>

                    {/* Section 16 — Creator */}
                    <div className="relative z-[26] bg-foreground">
                        <CreatorSection />
                    </div>

                    {/* Section 17 — Pricing (regular scroll) */}
                    <div className="relative z-[27] bg-foreground">
                        <PricingSection hiddenProducts={hiddenProducts} />
                    </div>

                    {/* Section 18 — Guarantee (regular scroll) */}
                    <div className="relative z-[28] bg-white">
                        <GuaranteeSection />
                    </div>
                </div>
            </main>

            {/* 🔄 EXTEND */}
            <Footer />
        </div>
    )
}
