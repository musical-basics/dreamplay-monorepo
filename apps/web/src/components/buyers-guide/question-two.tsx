"use client"

import { cn } from "@/lib/utils"

interface QuestionTwoProps {
    selected: string | null
    buyingFor: "myself" | "someone-else" | null
    onSelect: (value: "adult-female" | "adult-male" | "child") => void
}

export function QuestionTwo({ selected, buyingFor, onSelect }: QuestionTwoProps) {
    const isGift = buyingFor === "someone-else"

    return (
        <section id="question-2" className="py-20 px-6 border-t border-border">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background text-sm font-semibold">
                        2
                    </span>
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Question Two
                    </span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-4">
                    {isGift ? "Who will be playing?" : "Tell us about yourself"}
                </h2>
                <p className="text-muted-foreground text-lg mb-10">
                    {isGift
                        ? "This helps us tailor our recommendations to the recipient."
                        : "Different demographics have different typical hand sizes. This helps us guide you better."
                    }
                </p>

                {!selected && (
                    <p className="text-sm font-medium text-neutral-400 mb-6 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        Select one to continue
                    </p>
                )}

                <div className="grid gap-4">
                    {(["adult-female", "adult-male", "child"] as const).map((value) => {
                        const labels: Record<"adult-female" | "adult-male" | "child", { self: string; gift: string; sub: string }> = {
                            "adult-female": { self: "I'm an Adult Woman", gift: "Adult Woman", sub: "Age 18 and above" },
                            "adult-male": { self: "I'm an Adult Man", gift: "Adult Man", sub: "Age 18 and above" },
                            "child": { self: "I'm a Young Pianist", gift: "Child or Teen", sub: "Ages 7-17 years old" },
                        }
                        const l = labels[value]
                        return (
                            <button
                                key={value}
                                onClick={() => onSelect(value)}
                                className={cn(
                                    "group relative p-6 rounded-2xl border-2 text-left transition-all duration-200",
                                    "hover:border-foreground hover:shadow-lg",
                                    selected === value
                                        ? "border-foreground bg-foreground/5"
                                        : "border-border bg-background"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-semibold text-foreground mb-1">
                                            {isGift ? l.gift : l.self}
                                        </h3>
                                        <p className="text-muted-foreground text-sm">{l.sub}</p>
                                    </div>
                                    <div className={cn(
                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                        selected === value ? "border-foreground bg-foreground" : "border-muted-foreground"
                                    )}>
                                        {selected === value && (
                                            <svg className="w-4 h-4 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
