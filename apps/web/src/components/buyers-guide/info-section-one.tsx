"use client"

import { BookOpen, Heart, TrendingUp } from "lucide-react"

interface InfoSectionOneProps {
    buyingFor: "myself" | "someone-else" | null
}

export function InfoSectionOne({ buyingFor }: InfoSectionOneProps) {
    return (
        <section className="py-16 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h3 className="text-2xl sm:text-3xl font-semibold text-foreground mb-4">
                        {buyingFor === "someone-else"
                            ? "A Gift That Truly Fits"
                            : "Why Size Matters in Piano"
                        }
                    </h3>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
                        {buyingFor === "someone-else"
                            ? "You're giving more than an instrument—you're giving the gift of comfortable, confident playing."
                            : "Standard keyboards were designed for a narrow range of hand sizes. Most pianists are playing on keyboards that don't fit them."
                        }
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-card rounded-2xl p-8 border border-border">
                        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                            <BookOpen className="w-6 h-6 text-accent" />
                        </div>
                        <h4 className="text-lg font-semibold text-foreground mb-2">Research-Backed</h4>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Decades of peer-reviewed studies show that properly sized keyboards reduce strain and improve performance.
                        </p>
                    </div>

                    <div className="bg-card rounded-2xl p-8 border border-border">
                        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                            <Heart className="w-6 h-6 text-accent" />
                        </div>
                        <h4 className="text-lg font-semibold text-foreground mb-2">Comfort First</h4>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Playing should feel natural. The right keyboard size eliminates unnecessary stretching and tension in your hands.
                        </p>
                    </div>

                    <div className="bg-card rounded-2xl p-8 border border-border">
                        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                            <TrendingUp className="w-6 h-6 text-accent" />
                        </div>
                        <h4 className="text-lg font-semibold text-foreground mb-2">Faster Progress</h4>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            When your hands fit the keys, you can focus on music—not struggling to reach the notes.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
