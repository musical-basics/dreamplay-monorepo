"use client"

import { useState } from "react"
import Image from "next/image"
import { Check, ArrowDown } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import Footer from "@/components/Footer"
import { QuestionOne } from "@/components/buyers-guide/question-one"
import { InfoSectionOne } from "@/components/buyers-guide/info-section-one"
import { QuestionTwo } from "@/components/buyers-guide/question-two"
import { InfoSectionTwo } from "@/components/buyers-guide/info-section-two"
import { QuestionThree } from "@/components/buyers-guide/question-three"
import { InfoSectionThree } from "@/components/buyers-guide/info-section-three"
import { QuestionFour } from "@/components/buyers-guide/question-four"
import { RecommendationSection, UserProfile } from "@/components/buyers-guide/recommendation-section"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const journeySteps = [
    { id: 1, label: "Who is this for?", short: "Buying For" },
    { id: 2, label: "Your demographic", short: "About You" },
    { id: 3, label: "Your hand size", short: "Hand Size" },
    { id: 4, label: "Your goals", short: "Goals" },
]

export default function BuyersGuidePage() {
    const [currentStep, setCurrentStep] = useState(0)
    const [profile, setProfile] = useState<UserProfile>({
        buyingFor: null,
        demographic: null,
        handSize: null,
        goal: null,
    })

    const updateProfile = (key: keyof UserProfile, value: string) => {
        setProfile((prev) => ({ ...prev, [key]: value }))
    }

    const nextStep = () => {
        setCurrentStep((prev) => prev + 1)
        setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
        }, 100)
    }

    const startGuide = () => {
        setCurrentStep(1)
        setTimeout(() => {
            const element = document.getElementById("question-1")
            element?.scrollIntoView({ behavior: "smooth" })
        }, 100)
    }

    const scrollToStep = (step: number) => {
        const element = document.getElementById(`question-${step}`)
        element?.scrollIntoView({ behavior: "smooth" })
    }

    const getCompletedStep = () => {
        if (profile.goal) return 4
        if (profile.handSize) return 3
        if (profile.demographic) return 2
        if (profile.buyingFor) return 1
        return 0
    }

    const completedStep = getCompletedStep()

    return (
        <div className="min-h-screen bg-background buyers-guide-light" style={{
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
        } as React.CSSProperties}>
            <Navbar forceOpaque />

            {/* Fixed Journey Timeline - far right (desktop only) */}
            {currentStep >= 1 && (
                <aside className="hidden xl:block fixed right-8 top-1/2 -translate-y-1/2 z-40 w-48">
                    <div className="bg-background/95 backdrop-blur-sm rounded-2xl border border-border shadow-lg p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                            Your Progress
                        </p>
                        <nav className="space-y-0.5">
                            {journeySteps.map((step) => {
                                const isCompleted = completedStep >= step.id
                                const isCurrent = currentStep >= step.id && completedStep < step.id
                                const isAvailable = currentStep >= step.id

                                return (
                                    <button
                                        key={step.id}
                                        onClick={() => isAvailable && scrollToStep(step.id)}
                                        disabled={!isAvailable}
                                        className={cn(
                                            "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all",
                                            isAvailable ? "cursor-pointer hover:bg-muted" : "cursor-default opacity-40",
                                            isCurrent && "bg-muted"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-semibold transition-all",
                                                isCompleted
                                                    ? "bg-black text-white"
                                                    : isCurrent
                                                        ? "bg-accent text-accent-foreground"
                                                        : "bg-muted-foreground/20 text-muted-foreground"
                                            )}
                                        >
                                            {isCompleted ? <Check className="w-3 h-3" /> : step.id}
                                        </div>
                                        <p className={cn(
                                            "text-xs font-medium truncate",
                                            isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                                        )}>
                                            {step.short}
                                        </p>
                                    </button>
                                )
                            })}
                        </nav>

                        <div className="mt-4 pt-4 border-t border-border">
                            <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
                                <span>Progress</span>
                                <span>{completedStep}/4</span>
                            </div>
                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-black rounded-full transition-all duration-500"
                                    style={{ width: `${(completedStep / 4) * 100}%` }}
                                />
                            </div>
                        </div>

                        {completedStep === 4 && (
                            <button
                                onClick={() => {
                                    const el = document.getElementById("recommendation")
                                    el?.scrollIntoView({ behavior: "smooth" })
                                }}
                                className="mt-3 w-full px-3 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/90 transition-colors"
                            >
                                View Recommendation →
                            </button>
                        )}
                    </div>
                </aside>
            )}

            {/* Mobile progress bar */}
            {currentStep >= 1 && (
                <div className="xl:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-3">
                    <div className="flex items-center gap-3 max-w-4xl mx-auto">
                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                            Step {Math.min(completedStep + 1, 4)} of 4
                        </span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-black rounded-full transition-all duration-500"
                                style={{ width: `${(completedStep / 4) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <main>
                {/* Piano product showcase */}
                <section className="relative w-full overflow-hidden bg-muted pt-32">
                    <div className="max-w-4xl mx-auto px-6 py-12">
                        <div className="relative aspect-[21/9] rounded-2xl overflow-hidden shadow-2xl">
                            <Image
                                src="/images/keyboards/Piano Front 2.jpg"
                                alt="DreamPlay One kids piano with narrow keys and bench"
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                            <div className="absolute bottom-6 left-6 right-6 text-white">
                                <p className="text-sm font-medium tracking-wide uppercase opacity-80">DreamPlay Pianos</p>
                                <p className="text-lg sm:text-xl font-semibold">Designed to fit your hands perfectly</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Hero */}
                <section className="bg-background px-6 pt-12 pb-16">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
                            DreamPlay Buyer&apos;s Guide
                        </h1>
                        <p className="text-base sm:text-lg text-muted-foreground mb-8">
                            Answer 4 simple questions and we&apos;ll recommend the perfect keyboard size for your hands.
                        </p>
                        <div className="flex flex-col items-center gap-2">
                            <Button
                                size="lg"
                                className="text-base px-8 py-6 rounded-full"
                                onClick={startGuide}
                            >
                                Start the Guide
                                <ArrowDown className="ml-2 w-4 h-4" />
                            </Button>
                            <span className="text-xs text-muted-foreground">4 questions · about 2 minutes</span>
                        </div>
                    </div>
                </section>

                {/* Q1 group */}
                {currentStep >= 1 && (
                    <div className="bg-muted">
                        <QuestionOne
                            selected={profile.buyingFor}
                            onSelect={(value) => {
                                updateProfile("buyingFor", value)
                                nextStep()
                            }}
                        />
                    </div>
                )}

                {/* Q2 group */}
                {currentStep >= 2 && (
                    <div className="bg-background">
                        <InfoSectionOne buyingFor={profile.buyingFor} />
                        <QuestionTwo
                            selected={profile.demographic}
                            buyingFor={profile.buyingFor}
                            onSelect={(value) => {
                                updateProfile("demographic", value)
                                nextStep()
                            }}
                        />
                    </div>
                )}

                {/* Q3 group */}
                {currentStep >= 3 && (
                    <div className="bg-muted">
                        <InfoSectionTwo demographic={profile.demographic} />
                        <QuestionThree
                            selected={profile.handSize}
                            demographic={profile.demographic}
                            onSelect={(value) => {
                                updateProfile("handSize", value)
                                nextStep()
                            }}
                        />
                    </div>
                )}

                {/* Q4 group */}
                {currentStep >= 4 && (
                    <div className="bg-background">
                        <InfoSectionThree handSize={profile.handSize} demographic={profile.demographic} />
                        <QuestionFour
                            selected={profile.goal}
                            onSelect={(value) => {
                                updateProfile("goal", value)
                                nextStep()
                            }}
                        />
                    </div>
                )}

                {/* Recommendation */}
                {currentStep >= 5 && (
                    <div className="bg-muted">
                        <RecommendationSection profile={profile} />
                    </div>
                )}
            </main>

            <Footer />
        </div>
    )
}
