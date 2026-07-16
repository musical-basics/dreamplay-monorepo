import { Playfair_Display, Inter } from "next/font/google"
import { Navbar } from "@/components/Navbar"
import { CrowdfundingSection } from "@/components/premium-offer/crowdfunding-section"
import { StatsSection } from "@/components/premium-offer/stats-section"
import { HeroSection } from "@/components/premium-offer/hero-section"
import { SocialProofBar } from "@/components/premium-offer/social-proof-bar"
import { VideoSection } from "@/components/premium-offer/video-section"
import { FeaturesSection } from "@/components/premium-offer/features-section"
import { SizeFinderSection } from "@/components/premium-offer/size-finder-section"
import { SizeVisualSection } from "@/components/premium-offer/size-visual-section"
import { SpecsSection } from "@/components/premium-offer/specs-section"
import { CreatorSection } from "@/components/premium-offer/creator-section"
import { TrustSection } from "@/components/premium-offer/trust-section"
import { PricingSection } from "@/components/premium-offer/pricing-section"
import { StanfordQuoteSection } from "@/components/premium-offer/stanford-quote-section"
import { GuaranteeSection } from "@/components/premium-offer/guarantee-section"
import { HeroImageSection } from "@/components/premium-offer/hero-image-section"
import { HandComparisonSection } from "@/components/extended-offer/hand-comparison-section"
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
        "The DreamPlay One is a premium digital piano with narrower keys designed to fit your hands — reducing strain, preventing injury, and unlocking pieces a standard keyboard puts out of reach.",
    alternates: {
        canonical: 'https://dreamplaypianos.com',
    },
}

export default async function OldPremiumOfferPage() {
    const hiddenProducts = await getHiddenProducts()
    return (
        <div className={`${playfair.variable} ${inter.variable} font-sans antialiased`}>
            <Navbar />
            <main>
                <section id="hero">
                    <CrowdfundingSection />
                    <StatsSection />
                    <HeroSection />
                    <SocialProofBar />
                    <VideoSection />
                </section>
                <HandComparisonSection />
                <FeaturesSection />
                <StanfordQuoteSection />
                <HeroImageSection />
                <SizeFinderSection />
                <SizeVisualSection />
                <SpecsSection />
                <CreatorSection />
                <TrustSection />
                <PricingSection hiddenProducts={hiddenProducts} />
                <GuaranteeSection />
            </main>
            <Footer />
        </div>
    )
}
