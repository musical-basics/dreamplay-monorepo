"use client"

import { cn } from "@/lib/utils"
import { Music, GraduationCap, Trophy, Headphones } from "lucide-react"

interface QuestionFourProps {
    selected: string | null
    onSelect: (value: "beginner" | "intermediate" | "professional" | "casual") => void
}

export function QuestionFour({ selected, onSelect }: QuestionFourProps) {
    const goals = [
        { value: "beginner" as const, icon: Music, label: "Starting Fresh", description: "Just beginning my piano journey or learning the basics" },
        { value: "intermediate" as const, icon: GraduationCap, label: "Building Skills", description: "Working on technique, taking lessons, or practicing regularly" },
        { value: "professional" as const, icon: Trophy, label: "Serious Performance", description: "Preparing for competitions, recitals, or professional work" },
        { value: "casual" as const, icon: Headphones, label: "Pure Expression", description: "I want to play freely, without the instrument getting in the way of the music I feel." },
    ]

    return (
        <section id="question-4" className="py-20 px-6 border-t border-border">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background text-sm font-semibold">
                        4
                    </span>
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Final Question
                    </span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-4">
                    What&apos;s your main goal?
                </h2>
                <p className="text-muted-foreground text-lg mb-10">
                    Understanding your musical goals helps us fine-tune our recommendation.
                </p>

                {!selected && (
                    <p className="text-sm font-medium text-neutral-400 mb-6 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        Select one to continue
                    </p>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                    {goals.map((goal) => {
                        const Icon = goal.icon
                        return (
                            <button
                                key={goal.value}
                                onClick={() => onSelect(goal.value)}
                                className={cn(
                                    "group relative p-6 rounded-2xl border-2 text-left transition-all duration-200",
                                    "hover:border-foreground hover:shadow-lg",
                                    selected === goal.value
                                        ? "border-foreground bg-foreground/5"
                                        : "border-border bg-background"
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className={cn(
                                            "flex items-center justify-center w-12 h-12 rounded-xl transition-colors",
                                            selected === goal.value
                                                ? "bg-foreground text-background"
                                                : "bg-muted text-foreground"
                                        )}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-foreground mb-1">{goal.label}</h3>
                                        <p className="text-muted-foreground text-sm">{goal.description}</p>
                                    </div>
                                </div>
                                {selected === goal.value && (
                                    <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                                        <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
