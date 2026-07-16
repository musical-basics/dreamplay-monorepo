"use client"

import { cn } from "@/lib/utils"
import { Info } from "lucide-react"
import { useState } from "react"

interface QuestionThreeProps {
    selected: string | null
    demographic: "adult-female" | "adult-male" | "child" | null
    onSelect: (value: "small" | "average" | "large") => void
}

export function QuestionThree({ selected, demographic, onSelect }: QuestionThreeProps) {
    const [showMeasure, setShowMeasure] = useState(false)

    const getHandSizeRanges = () => {
        if (demographic === "child") {
            return {
                small: { label: "Small Children's Hand", range: "Under 5.5 inches", icon: "🤚" },
                average: { label: "Average Children's Hand", range: "5.5 - 7 inches", icon: "✋" },
                large: { label: "Larger Children's Hand", range: "Over 7 inches", icon: "🖐️" },
            }
        }
        return {
            small: { label: "Smaller Hands", range: "Under 7.6 inches", icon: "🤚" },
            average: { label: "Average Hands", range: "7.6 - 8.5 inches", icon: "✋" },
            large: { label: "Larger Hands", range: "Over 8.5 inches", icon: "🖐️" },
        }
    }

    const ranges = getHandSizeRanges()

    return (
        <section id="question-3" className="py-20 px-6 border-t border-border">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background text-sm font-semibold">
                        3
                    </span>
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Question Three
                    </span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-4">
                    What&apos;s your hand size?
                </h2>
                <p className="text-muted-foreground text-lg mb-6">
                    {demographic === "child"
                        ? "Measure the child's hand span from thumb tip to pinky tip with fingers spread wide."
                        : "Measure from the tip of your thumb to the tip of your pinky with your hand spread wide."
                    }
                </p>

                <button
                    onClick={() => setShowMeasure(!showMeasure)}
                    className="flex items-center gap-2 text-sm text-accent hover:underline mb-8"
                >
                    <Info className="w-4 h-4" />
                    {showMeasure ? "Hide measurement guide" : "How do I measure my hand?"}
                </button>

                {showMeasure && (
                    <div className="mb-8 p-6 rounded-2xl bg-muted border border-border">
                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                            <div className="flex-1">
                                <h4 className="font-semibold text-foreground mb-3">How to Measure Your Hand Span</h4>
                                <ol className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex gap-2"><span className="font-medium text-foreground">1.</span> Place your hand flat on a table or ruler</li>
                                    <li className="flex gap-2"><span className="font-medium text-foreground">2.</span> Spread your fingers as wide as comfortable</li>
                                    <li className="flex gap-2"><span className="font-medium text-foreground">3.</span> Measure from the tip of your thumb to the tip of your pinky</li>
                                    <li className="flex gap-2"><span className="font-medium text-foreground">4.</span> Record the measurement in inches</li>
                                </ol>
                            </div>
                            <div className="w-full sm:w-48 h-32 bg-background rounded-xl flex items-center justify-center border border-border">
                                <span className="text-6xl">📏</span>
                            </div>
                        </div>
                    </div>
                )}

                {!selected && (
                    <p className="text-sm font-medium text-neutral-400 mb-6 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        Select one to continue
                    </p>
                )}

                <div className="grid sm:grid-cols-3 gap-4">
                    {(["small", "average", "large"] as const).map((size) => (
                        <button
                            key={size}
                            onClick={() => onSelect(size)}
                            className={cn(
                                "group relative p-6 rounded-2xl border-2 text-center transition-all duration-200",
                                "hover:border-foreground hover:shadow-lg",
                                selected === size
                                    ? "border-foreground bg-foreground/5"
                                    : "border-border bg-background"
                            )}
                        >
                            <div className="text-4xl mb-4">{ranges[size].icon}</div>
                            <h3 className="text-lg font-semibold text-foreground mb-1">{ranges[size].label}</h3>
                            <p className="text-muted-foreground text-sm">{ranges[size].range}</p>
                            {selected === size && (
                                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                                    <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                <p className="text-sm text-muted-foreground text-center mt-6">
                    Not sure? That&apos;s okay—our recommendations are flexible, and we have a hassle-free exchange policy.
                </p>
            </div>
        </section>
    )
}
