"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Check, ArrowDown } from "lucide-react"
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

export function InlineBuyersGuide() {
    const [currentStep, setCurrentStep] = useState(1)
    const [profile, setProfile] = useState<UserProfile>({
        buyingFor: "myself",
        demographic: null,
        handSize: null,
        goal: null,
    })
    const [sectionInView, setSectionInView] = useState(false)
    const sectionRef = useRef<HTMLElement>(null)

    useEffect(() => {
        const el = sectionRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => setSectionInView(entry?.isIntersecting ?? false),
            { threshold: 0.05 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    const updateProfile = (key: keyof UserProfile, value: string) => {
        setProfile((prev) => ({ ...prev, [key]: value }))
    }

    const nextStep = () => {
        setCurrentStep((prev) => {
            const next = prev + 1
            setTimeout(() => {
                const el = document.getElementById(`guide-question-${next}`)
                if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "start" })
                }
            }, 150)
            return next
        })
    }

    const startGuide = () => {
        setCurrentStep(1)
        setTimeout(() => {
            const element = document.getElementById("guide-question-1")
            element?.scrollIntoView({ behavior: "smooth" })
        }, 100)
    }

    const scrollToStep = (step: number) => {
        const element = document.getElementById(`guide-question-${step}`)
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
        <section ref={sectionRef} className="relative" style={{
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
            {/* Fixed Journey Timeline - far right (desktop only) */}
            {currentStep >= 1 && sectionInView && (
                <aside className="hidden xl:block fixed right-8 top-1/2 -translate-y-1/2 z-40 w-48">
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-neutral-200 shadow-lg p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-4">
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
                                            isAvailable ? "cursor-pointer hover:bg-neutral-100" : "cursor-default opacity-40",
                                            isCurrent && "bg-neutral-100"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-semibold transition-all",
                                                isCompleted
                                                    ? "bg-black text-white"
                                                    : isCurrent
                                                        ? "bg-blue-500 text-white"
                                                        : "bg-neutral-200 text-neutral-500"
                                            )}
                                        >
                                            {isCompleted ? <Check className="w-3 h-3" /> : step.id}
                                        </div>
                                        <p className={cn(
                                            "text-xs font-medium truncate",
                                            isCompleted || isCurrent ? "text-neutral-900" : "text-neutral-500"
                                        )}>
                                            {step.short}
                                        </p>
                                    </button>
                                )
                            })}
                        </nav>

                        <div className="mt-4 pt-4 border-t border-neutral-200">
                            <div className="flex justify-between text-[10px] text-neutral-500 mb-1.5">
                                <span>Progress</span>
                                <span>{completedStep}/4</span>
                            </div>
                            <div className="h-1 bg-neutral-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-black rounded-full transition-all duration-500"
                                    style={{ width: `${(completedStep / 4) * 100}%` }}
                                />
                            </div>
                        </div>

                        {completedStep === 4 && (
                            <button
                                onClick={() => {
                                    const el = document.getElementById("guide-recommendation")
                                    el?.scrollIntoView({ behavior: "smooth" })
                                }}
                                className="mt-3 w-full px-3 py-2 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors"
                            >
                                View Recommendation →
                            </button>
                        )}
                    </div>
                </aside>
            )}

            {/* Mobile progress bar */}
            {currentStep >= 1 && (
                <div className="xl:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-neutral-200 px-6 py-3">
                    <div className="flex items-center gap-3 max-w-4xl mx-auto">
                        <span className="text-xs font-medium text-neutral-500 whitespace-nowrap">
                            Step {Math.min(completedStep + 1, 4)} of 4
                        </span>
                        <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-black rounded-full transition-all duration-500"
                                style={{ width: `${(completedStep / 4) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Hero */}
            <div className="bg-neutral-100 px-6 pt-12 pb-16">
                <div className="max-w-4xl mx-auto text-center">
                    <p className="font-sans text-sm uppercase tracking-[0.3em] text-neutral-500 mb-4">
                        Personalize Your Experience
                    </p>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 mb-4 font-serif">
                        DreamPlay Buyer&apos;s Guide
                    </h2>
                    <p className="text-base sm:text-lg text-neutral-500 mb-8 font-medium">
                        Answer 4 simple questions and we&apos;ll recommend the perfect keyboard size for your hands.
                    </p>
                    {currentStep === 0 && (
                        <div className="flex flex-col items-center gap-2">
                            <Button
                                size="lg"
                                className="text-base px-8 py-6 rounded-full"
                                onClick={startGuide}
                            >
                                Start the Guide
                                <ArrowDown className="ml-2 w-4 h-4" />
                            </Button>
                            <span className="text-xs text-neutral-500">4 questions · about 2 minutes</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Q1 */}
            {currentStep >= 1 && (
                <div id="guide-question-1" className="bg-neutral-100">
                    <QuestionOne
                        selected={profile.buyingFor}
                        onSelect={(value) => {
                            updateProfile("buyingFor", value)
                            nextStep()
                        }}
                    />
                </div>
            )}

            {/* Q2 */}
            {currentStep >= 2 && (
                <div id="guide-question-2" className="bg-white">
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

            {/* Q3 */}
            {currentStep >= 3 && (
                <div id="guide-question-3" className="bg-neutral-100">
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

            {/* Q4 */}
            {currentStep >= 4 && (
                <div id="guide-question-4" className="bg-white">
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
                <div id="guide-recommendation" className="bg-neutral-100">
                    <RecommendationSection profile={profile} />
                </div>
            )}
        </section>
    )
}
