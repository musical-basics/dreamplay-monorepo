"use client"

import { SpecialOfferHeader } from "@/components/special-offer/header"
import { HeroSection } from "@/components/special-offer/hero-section"
import { CountdownTimer } from "@/components/special-offer/countdown-timer"
import { FeaturesPianoSection } from "@/components/special-offer/features-piano-section"
import { FeaturesGridSection } from "@/components/special-offer/features-grid-section"
import { LessonsSection } from "@/components/special-offer/lessons-section"
import { FindYourFitSection } from "@/components/special-offer/find-your-fit-section"
import { GuaranteeSection } from "@/components/special-offer/guarantee-section"
import { CTASection } from "@/components/special-offer/cta-section"
import { VideoSection1 } from "@/components/special-offer/video-section-1"
import { VideoSection2 } from "@/components/special-offer/video-section-2"
import Footer from "@/components/Footer"

export function SpecialOfferPage() {
    return (
        <main className="relative">
            {/* The card-stacking parallax relies on html/body not clipping sticky sections */}
            <style>{`
                html, body {
                    overflow-x: visible !important;
                    overflow: visible !important;
                }
            `}</style>

            <SpecialOfferHeader />

            {/* Card-stacking parallax sections */}
            <div className="relative">
                {/* Section 1: Hero - STICKY */}
                <div className="sticky top-0 z-10 min-h-screen" id="hero">
                    <HeroSection />
                </div>

                {/* Section: Lessons (Woman with piano) - STICKY */}
                <div className="sticky top-0 z-[11] min-h-screen shadow-[0_-20px_50px_rgba(0,0,0,0.15)]" id="lessons">
                    <LessonsSection />
                </div>

                {/* Section: Find Your Fit - STICKY */}
                <div className="sticky top-0 z-[12] min-h-screen bg-neutral-950 shadow-[0_-10px_40px_rgba(0,0,0,0.4)]" id="find-your-fit">
                    <FindYourFitSection />
                </div>

                <div className="relative z-[13] bg-white shadow-[0_-20px_50px_rgba(0,0,0,0.3)]">
                    <CountdownTimer />
                </div>

                <div className="sticky top-0 z-[15] min-h-screen shadow-[0_-20px_50px_rgba(0,0,0,0.3)]" id="video-1">
                    <VideoSection1 />
                </div>

                {/* Section 2: Features Grid - STICKY */}
                <div className="sticky top-0 z-20 min-h-screen shadow-[0_-10px_30px_rgba(0,0,0,0.1)]" id="features-grid">
                    <FeaturesGridSection />
                </div>

                {/* Section 3: Video Section 2 - STICKY */}
                <div className="sticky top-0 z-[25] min-h-screen shadow-[0_-20px_50px_rgba(0,0,0,0.3)]" id="video-2">
                    <VideoSection2 />
                </div>

                {/* Section 4: Features Piano - STICKY */}
                <div className="sticky top-0 z-30 min-h-screen shadow-[0_-10px_30px_rgba(0,0,0,0.1)]" id="features-piano">
                    <FeaturesPianoSection />
                </div>

                {/* Section 7: Guarantee - STICKY */}
                <div className="sticky top-0 z-[60] min-h-screen shadow-[0_-20px_50px_rgba(0,0,0,0.15)]" id="guarantee">
                    <GuaranteeSection />
                </div>

                {/* Section 8: CTA - STICKY */}
                <div className="sticky top-0 z-[70] min-h-screen shadow-[0_-20px_50px_rgba(0,0,0,0.3)]" id="cta">
                    <CTASection />
                </div>

                {/* Footer - normal flow at the end */}
                <div className="relative z-[80]">
                    <Footer />
                </div>
            </div>
        </main>
    )
}
