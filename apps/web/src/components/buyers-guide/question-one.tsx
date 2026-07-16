"use client"

import { User, Gift } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuestionOneProps {
    selected: string | null
    onSelect: (value: "myself" | "someone-else") => void
}

export function QuestionOne({ selected, onSelect }: QuestionOneProps) {
    return (
        <section id="question-1" className="py-20 px-6 border-t border-border">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background text-sm font-semibold">
                        1
                    </span>
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Question One
                    </span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-4">
                    Who is this keyboard for?
                </h2>
                <p className="text-muted-foreground text-lg mb-10">
                    Let us know if you&apos;re shopping for yourself or someone special.
                </p>

                {!selected && (
                    <p className="text-sm font-medium text-neutral-400 mb-6 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        Select one to continue
                    </p>
                )}

                <div className="grid grid-cols-2 gap-6">
                    <button
                        onClick={() => onSelect("myself")}
                        className={cn(
                            "group relative flex flex-col items-center justify-center text-center aspect-square rounded-2xl border-2 p-8 transition-all duration-200 cursor-pointer",
                            "hover:shadow-xl hover:border-neutral-900 hover:bg-neutral-900 hover:text-white",
                            selected === "myself"
                                ? "border-neutral-900 bg-neutral-900 text-white shadow-xl"
                                : "border-border bg-background text-foreground"
                        )}
                    >
                        <div
                            className={cn(
                                "flex items-center justify-center w-16 h-16 rounded-2xl mb-5 transition-colors",
                                selected === "myself" ? "bg-white/15 text-white" : "bg-muted text-foreground group-hover:bg-white/15 group-hover:text-white"
                            )}
                        >
                            <User className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">For Myself</h3>
                        <p className={cn(
                            "text-sm font-medium leading-relaxed",
                            selected === "myself" ? "text-white/70" : "text-muted-foreground group-hover:text-white/70"
                        )}>
                            I&apos;m looking for a keyboard that fits my own hands
                        </p>
                        {selected === "myself" && (
                            <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                                <svg className="w-4 h-4 text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                    </button>

                    <button
                        onClick={() => onSelect("someone-else")}
                        className={cn(
                            "group relative flex flex-col items-center justify-center text-center aspect-square rounded-2xl border-2 p-8 transition-all duration-200 cursor-pointer",
                            "hover:shadow-xl hover:border-neutral-900 hover:bg-neutral-900 hover:text-white",
                            selected === "someone-else"
                                ? "border-neutral-900 bg-neutral-900 text-white shadow-xl"
                                : "border-border bg-background text-foreground"
                        )}
                    >
                        <div
                            className={cn(
                                "flex items-center justify-center w-16 h-16 rounded-2xl mb-5 transition-colors",
                                selected === "someone-else" ? "bg-white/15 text-white" : "bg-muted text-foreground group-hover:bg-white/15 group-hover:text-white"
                            )}
                        >
                            <Gift className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">For Someone Else</h3>
                        <p className={cn(
                            "text-sm font-medium leading-relaxed",
                            selected === "someone-else" ? "text-white/70" : "text-muted-foreground group-hover:text-white/70"
                        )}>
                            I&apos;m buying this as a gift for a child, partner, or friend
                        </p>
                        {selected === "someone-else" && (
                            <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                                <svg className="w-4 h-4 text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </section>
    )
}
