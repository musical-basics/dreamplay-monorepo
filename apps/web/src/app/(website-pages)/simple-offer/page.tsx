import { Playfair_Display, Inter } from "next/font/google"
import { Navbar } from "@/components/Navbar"
import { SimpleHero } from "@/components/simple-offer/simple-hero"
import { SocialProofBar } from "@/components/premium-offer/social-proof-bar"
import { HandComparisonSection } from "@/components/extended-offer/hand-comparison-section"
import { PricingSection } from "@/components/premium-offer/pricing-section"
import { GuaranteeSection } from "@/components/premium-offer/guarantee-section"
import Footer from "@/components/Footer"
import { getHiddenProducts } from "@/actions/admin-actions"

/**
 * /simple-offer — A/B variation 5a: the simplified, less-confusing cut of the
 * premium-offer page (1a). Five sections, one message, one CTA path:
 * hero → social proof → the core "hands don't fit" argument → pricing →
 * guarantee. Everything else (stats walls, video essays, size finder, specs,
 * creator story) is deliberately gone — the hypothesis is that fewer
 * decisions converts better. Served only via the /ab funnel; noindexed.
 */

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
    robots: { index: false, follow: false },
}

export default async function SimpleOfferPage() {
    const hiddenProducts = await getHiddenProducts()
    return (
        <div className={`${playfair.variable} ${inter.variable} font-sans antialiased`}>
            <Navbar />
            <main>
                <SimpleHero />
                <SocialProofBar />
                <HandComparisonSection />
                <PricingSection hiddenProducts={hiddenProducts} />
                <GuaranteeSection />
            </main>
            <Footer />
        </div>
    )
}
