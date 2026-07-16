"use client"

import { useState, useRef, useCallback, lazy, Suspense } from "react"
import { ChevronRight, ArrowRight, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { QuestionOne } from "@/components/buyers-guide/question-one"
import type { UserProfile } from "@/components/buyers-guide/recommendation-section"

// Lazy-load steps 2-4 and their info sections + recommendation
const QuestionTwo = lazy(() => import("@/components/buyers-guide/question-two").then(m => ({ default: m.QuestionTwo })))
const InfoSectionOne = lazy(() => import("@/components/buyers-guide/info-section-one").then(m => ({ default: m.InfoSectionOne })))
const QuestionThree = lazy(() => import("@/components/buyers-guide/question-three").then(m => ({ default: m.QuestionThree })))
const InfoSectionTwo = lazy(() => import("@/components/buyers-guide/info-section-two").then(m => ({ default: m.InfoSectionTwo })))
const QuestionFour = lazy(() => import("@/components/buyers-guide/question-four").then(m => ({ default: m.QuestionFour })))
const InfoSectionThree = lazy(() => import("@/components/buyers-guide/info-section-three").then(m => ({ default: m.InfoSectionThree })))
const RecommendationSection = lazy(() => import("@/components/buyers-guide/recommendation-section").then(m => ({ default: m.RecommendationSection })))

const journeySteps = [
    { id: 1, label: "Who is this for?", short: "Buying For" },
    { id: 2, label: "Your demographic", short: "About You" },
    { id: 3, label: "Your hand size", short: "Hand Size" },
    { id: 4, label: "Your goals", short: "Goals" },
]

// Total horizontal panels: Intro(0) + Q1(1) + Q2(2) + Q3(3) + Q4(4) + Recommendation(5)
const TOTAL_PANELS = 6

function PanelLoader() {
    return (
        <div className="flex items-center justify-center w-full h-full min-h-[300px]">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
    )
}

export function HorizontalBuyersGuide() {
    const [currentPanel, setCurrentPanel] = useState(0)
    const [currentStep, setCurrentStep] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const [profile, setProfile] = useState<UserProfile>({
        buyingFor: null,
        demographic: null,
        handSize: null,
        goal: null,
    })

    const updateProfile = (key: keyof UserProfile, value: string) => {
        setProfile((prev) => ({ ...prev, [key]: value }))
    }

    const goToPanel = useCallback((panel: number) => {
        setCurrentPanel(Math.max(0, Math.min(panel, TOTAL_PANELS - 1)))
    }, [])

    const getCompletedStep = () => {
        if (profile.goal) return 4
        if (profile.handSize) return 3
        if (profile.demographic) return 2
        if (profile.buyingFor) return 1
        return 0
    }

    const completedStep = getCompletedStep()

    const startGuide = () => {
        setCurrentStep(1)
        goToPanel(1)
    }

    // Light-theme CSS vars for the buyer's guide sub-components
    const lightThemeVars = {
        '--background': '0 0% 100%',
        '--foreground': '0 0% 9%',
        '--card': '0 0% 100%',
        '--card-foreground': '0 0% 9%',
        '--muted': '220 10% 93%',
        '--muted-foreground': '0 0% 45%',
        '--border': '0 0% 90%',
        '--accent': '220 50% 50%',
        '--accent-foreground': '0 0% 98%',
        '--primary': '0 0% 9%',
        '--primary-foreground': '0 0% 98%',
    } as React.CSSProperties

    return (
        <section
            className="h-screen relative overflow-hidden bg-black"
            style={{ scrollSnapAlign: "start" }}
        >
            {/* Progress dots at the top */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {Array.from({ length: TOTAL_PANELS }).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => {
                            // Only allow navigation to panels the user has unlocked
                            if (i === 0 || i <= currentStep) goToPanel(i)
                        }}
                        className={`h-2 rounded-full transition-all ${currentPanel === i
                                ? "bg-white w-6"
                                : i <= currentStep
                                    ? "bg-white/50 w-2 cursor-pointer hover:bg-white/70"
                                    : "bg-white/20 w-2 cursor-default"
                            }`}
                        aria-label={`Panel ${i + 1}`}
                    />
                ))}
            </div>

            {/* Step progress indicator — top right (desktop) */}
            {currentStep >= 1 && (
                <div className="hidden lg:block absolute top-6 right-8 z-20">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 px-4 py-3">
                        <div className="flex items-center gap-3">
                            {journeySteps.map((step) => {
                                const isCompleted = completedStep >= step.id
                                const isCurrent = currentStep >= step.id && completedStep < step.id
                                return (
                                    <div key={step.id} className="flex items-center gap-1.5">
                                        <div
                                            className={cn(
                                                "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold",
                                                isCompleted
                                                    ? "bg-white text-black"
                                                    : isCurrent
                                                        ? "bg-white/30 text-white"
                                                        : "bg-white/10 text-white/30"
                                            )}
                                        >
                                            {isCompleted ? <Check className="w-3 h-3" /> : step.id}
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-medium",
                                            isCompleted || isCurrent ? "text-white/80" : "text-white/30"
                                        )}>
                                            {step.short}
                                        </span>
                                        {step.id < 4 && (
                                            <div className={cn(
                                                "w-4 h-px mx-1",
                                                isCompleted ? "bg-white/40" : "bg-white/10"
                                            )} />
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Horizontal sliding container */}
            <div
                ref={containerRef}
                className="h-full flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentPanel * 100}%)` }}
            >
                {/* ─── Panel 0: Intro ─── */}
                <div className="h-full w-full flex-shrink-0 relative flex items-center justify-center bg-neutral-950 px-6">
                    <div className="text-center max-w-2xl">
                        <p className="font-sans text-xs uppercase tracking-[0.3em] text-white/50 mb-4">
                            Find Your Perfect Fit
                        </p>
                        <h2 className="font-serif text-4xl md:text-6xl text-white mb-4">
                            Buyer&apos;s Guide
                        </h2>
                        <p className="font-sans text-base text-white/60 mb-10 max-w-lg mx-auto">
                            Answer 4 quick questions and we&apos;ll recommend the perfect keyboard size for your hands.
                        </p>
                        <button
                            onClick={startGuide}
                            className="inline-flex items-center gap-2 bg-white px-10 py-5 font-sans text-sm uppercase tracking-widest text-black hover:bg-white/90 transition-colors cursor-pointer"
                        >
                            Start the Guide
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <p className="mt-4 font-sans text-xs text-white/40">
                            4 questions · about 2 minutes
                        </p>
                    </div>

                    {/* Arrow to first question */}
                    <button
                        onClick={startGuide}
                        className="absolute right-4 md:right-8 bottom-6 md:bottom-8 z-20 flex items-center gap-2 group cursor-pointer"
                    >
                        <span className="font-sans text-xs uppercase tracking-[0.2em] text-white/60 group-hover:text-white transition-colors">
                            Start
                        </span>
                        <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                    </button>
                </div>

                {/* ─── Panel 1: Question One (eagerly loaded) ─── */}
                <div className="h-full w-full flex-shrink-0 relative bg-white overflow-y-auto">
                    <div className="min-h-full flex items-center" style={lightThemeVars}>
                        <div className="w-full py-8">
                            <QuestionOne
                                selected={profile.buyingFor}
                                onSelect={(value) => {
                                    updateProfile("buyingFor", value)
                                    setCurrentStep((prev) => Math.max(prev, 2))
                                    goToPanel(2)
                                }}
                            />
                        </div>
                    </div>
                    {/* Nav buttons */}
                    <button
                        onClick={() => goToPanel(0)}
                        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/10 hover:bg-black/20 transition-colors cursor-pointer rotate-180"
                        aria-label="Previous"
                    >
                        <ChevronRight className="w-6 h-6 text-black" />
                    </button>
                </div>

                {/* ─── Panel 2: Info Section One + Question Two (lazy) ─── */}
                <div className="h-full w-full flex-shrink-0 relative bg-white overflow-y-auto">
                    {currentStep >= 2 && (
                        <div className="min-h-full flex items-center" style={lightThemeVars}>
                            <div className="w-full py-8">
                                <Suspense fallback={<PanelLoader />}>
                                    <InfoSectionOne buyingFor={profile.buyingFor} />
                                    <QuestionTwo
                                        selected={profile.demographic}
                                        buyingFor={profile.buyingFor}
                                        onSelect={(value) => {
                                            updateProfile("demographic", value)
                                            setCurrentStep((prev) => Math.max(prev, 3))
                                            goToPanel(3)
                                        }}
                                    />
                                </Suspense>
                            </div>
                        </div>
                    )}
                    {currentStep >= 2 && (
                        <button
                            onClick={() => goToPanel(1)}
                            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/10 hover:bg-black/20 transition-colors cursor-pointer rotate-180"
                            aria-label="Previous"
                        >
                            <ChevronRight className="w-6 h-6 text-black" />
                        </button>
                    )}
                </div>

                {/* ─── Panel 3: Info Section Two + Question Three (lazy) ─── */}
                <div className="h-full w-full flex-shrink-0 relative bg-white overflow-y-auto">
                    {currentStep >= 3 && (
                        <div className="min-h-full flex items-center" style={lightThemeVars}>
                            <div className="w-full py-8">
                                <Suspense fallback={<PanelLoader />}>
                                    <InfoSectionTwo demographic={profile.demographic} />
                                    <QuestionThree
                                        selected={profile.handSize}
                                        demographic={profile.demographic}
                                        onSelect={(value) => {
                                            updateProfile("handSize", value)
                                            setCurrentStep((prev) => Math.max(prev, 4))
                                            goToPanel(4)
                                        }}
                                    />
                                </Suspense>
                            </div>
                        </div>
                    )}
                    {currentStep >= 3 && (
                        <button
                            onClick={() => goToPanel(2)}
                            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/10 hover:bg-black/20 transition-colors cursor-pointer rotate-180"
                            aria-label="Previous"
                        >
                            <ChevronRight className="w-6 h-6 text-black" />
                        </button>
                    )}
                </div>

                {/* ─── Panel 4: Info Section Three + Question Four (lazy) ─── */}
                <div className="h-full w-full flex-shrink-0 relative bg-white overflow-y-auto">
                    {currentStep >= 4 && (
                        <div className="min-h-full flex items-center" style={lightThemeVars}>
                            <div className="w-full py-8">
                                <Suspense fallback={<PanelLoader />}>
                                    <InfoSectionThree handSize={profile.handSize} demographic={profile.demographic} />
                                    <QuestionFour
                                        selected={profile.goal}
                                        onSelect={(value) => {
                                            updateProfile("goal", value)
                                            setCurrentStep((prev) => Math.max(prev, 5))
                                            goToPanel(5)
                                        }}
                                    />
                                </Suspense>
                            </div>
                        </div>
                    )}
                    {currentStep >= 4 && (
                        <button
                            onClick={() => goToPanel(3)}
                            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/10 hover:bg-black/20 transition-colors cursor-pointer rotate-180"
                            aria-label="Previous"
                        >
                            <ChevronRight className="w-6 h-6 text-black" />
                        </button>
                    )}
                </div>

                {/* ─── Panel 5: Recommendation (lazy) ─── */}
                <div className="h-full w-full flex-shrink-0 relative bg-white overflow-y-auto">
                    {currentStep >= 5 && (
                        <div className="min-h-full flex items-center" style={lightThemeVars}>
                            <div className="w-full py-8">
                                <Suspense fallback={<PanelLoader />}>
                                    <RecommendationSection profile={profile} />
                                </Suspense>
                            </div>
                        </div>
                    )}
                    {currentStep >= 5 && (
                        <button
                            onClick={() => goToPanel(4)}
                            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/10 hover:bg-black/20 transition-colors cursor-pointer rotate-180"
                            aria-label="Previous"
                        >
                            <ChevronRight className="w-6 h-6 text-black" />
                        </button>
                    )}
                </div>
            </div>
        </section>
    )
}
