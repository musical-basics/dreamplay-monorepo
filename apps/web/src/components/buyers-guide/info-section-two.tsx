"use client"

import { useState, useMemo } from "react"
import { RefreshCw } from "lucide-react"
import { Slider } from "@/components/ui/slider"

interface InfoSectionTwoProps {
    demographic: "adult-female" | "adult-male" | "child" | null
}

function getHandSpanFeedback(value: number) {
    if (value < 7.6) {
        return {
            label: "Too small for standard",
            color: "bg-red-500",
            textColor: "text-red-600",
            recommendation: "DS5.5",
            description: "A reduced-size keyboard would significantly improve comfort and technique.",
        }
    }
    if (value < 8.5) {
        return {
            label: "Tight on standard",
            color: "bg-amber-500",
            textColor: "text-amber-600",
            recommendation: "DS6.0",
            description: "You'd benefit from slightly narrower keys for relaxed, accurate playing.",
        }
    }
    return {
        label: "Comfortable on standard",
        color: "bg-emerald-500",
        textColor: "text-emerald-600",
        recommendation: "Standard (6.5)",
        description: "Standard key width should work well for your hand size.",
    }
}

function HandSpanSliderCard({ stat, statLabel }: { stat: string; statLabel: string }) {
    const [handSpan, setHandSpan] = useState(7.5)
    const feedback = useMemo(() => getHandSpanFeedback(handSpan), [handSpan])
    const fillPercent = ((handSpan - 6) / (10 - 6)) * 100

    return (
        <div className="bg-card rounded-3xl p-8 border border-border">
            <div className="text-center mb-6">
                <div className="text-5xl sm:text-6xl font-bold text-foreground mb-2">{stat}</div>
                <p className="text-muted-foreground text-sm">{statLabel}</p>
            </div>

            <div className="space-y-5">
                <div className="text-center">
                    <div className="text-3xl font-bold text-foreground mb-1">{handSpan.toFixed(1)}&quot;</div>
                    <p className="text-xs text-muted-foreground">Drag to set your hand span</p>
                </div>

                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                    <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-150 ${feedback.color}`}
                        style={{ width: `${fillPercent}%` }}
                    />
                </div>

                <Slider
                    min={6}
                    max={10}
                    step={0.1}
                    value={[handSpan]}
                    onValueChange={([v]) => { if (v !== undefined) setHandSpan(v) }}
                    className="w-full"
                />

                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>6&quot;</span>
                    <span>7&quot;</span>
                    <span>8&quot;</span>
                    <span>9&quot;</span>
                    <span>10&quot;</span>
                </div>

                <div className="rounded-2xl bg-muted/70 p-4 text-center space-y-2 transition-all duration-200">
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full text-white ${feedback.color}`}>
                        {feedback.label}
                    </span>
                    <p className="text-sm text-muted-foreground">{feedback.description}</p>
                    <p className="text-sm font-medium text-foreground">
                        Recommended: <span className={feedback.textColor}>{feedback.recommendation}</span>
                    </p>
                </div>
            </div>
        </div>
    )
}

export function InfoSectionTwo({ demographic }: InfoSectionTwoProps) {
    if (demographic === "adult-female") {
        return (
            <section className="py-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h3 className="text-2xl sm:text-3xl font-semibold text-foreground mb-6">
                                The Hidden Barrier for Women Pianists
                            </h3>
                            <p className="text-muted-foreground leading-relaxed mb-6">
                                Standard keyboards were designed over 150 years ago based on a narrow
                                range of hand sizes—primarily those of adult men. Today, this one-size-fits-all
                                approach holds back the majority of pianists.
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                Studies note that <strong className="text-foreground">internationally acclaimed women
                                    pianists tend to have larger-than-average hands</strong>, which aligns with a repertoire
                                that often expects very wide reaches. This suggests that hand size, not talent,
                                may be filtering who succeeds.
                            </p>
                        </div>
                        <HandSpanSliderCard
                            stat="87%"
                            statLabel="of women have hands smaller than what standard keyboards expect"
                        />
                    </div>
                </div>
            </section>
        )
    }

    if (demographic === "adult-male") {
        return (
            <section className="py-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h3 className="text-2xl sm:text-3xl font-semibold text-foreground mb-6">
                                Hand Size Varies More Than You Think
                            </h3>
                            <p className="text-muted-foreground leading-relaxed mb-6">
                                While men typically have larger hands than women, there&apos;s enormous
                                variation—from below 7 inches to above 10 inches. Many adult men have
                                hand spans around 8 inches, which benefits significantly from the DS6.0.
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                The assumption that &quot;standard&quot; means &quot;fits everyone&quot; has held back
                                countless pianists. <strong className="text-foreground">Finding the right fit isn&apos;t
                                    about weakness—it&apos;s about optimization.</strong>
                            </p>
                        </div>
                        <HandSpanSliderCard
                            stat="24%"
                            statLabel="of men have hands smaller than what standard keyboards expect"
                        />
                    </div>
                </div>
            </section>
        )
    }

    if (demographic === "child") {
        return (
            <section className="py-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h3 className="text-2xl sm:text-3xl font-semibold text-foreground mb-6">
                                Growing Hands Need Growing Keyboards
                            </h3>
                            <p className="text-muted-foreground leading-relaxed mb-6">
                                Children aged 7-14 typically have hand spans well under 7.6 inches.
                                Forcing small hands onto standard-sized keys can create bad habits,
                                tension, and frustration that lasts a lifetime.
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                <strong className="text-foreground">The DS5.5 is specifically designed for
                                    developing pianists</strong>, allowing them to build proper technique without
                                strain—and they can upgrade as they grow.
                            </p>
                        </div>

                        <div className="bg-card rounded-3xl p-8 border border-border">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10">
                                    <RefreshCw className="w-6 h-6 text-accent" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-foreground mb-1">Upgrade Path</h4>
                                    <p className="text-muted-foreground text-sm">
                                        When your child outgrows the DS5.5, exchange it for a DS6.0—you only pay shipping costs.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-muted">
                                    <div>
                                        <p className="font-medium text-foreground">Ages 7-10</p>
                                        <p className="text-sm text-muted-foreground">Hand span typically under 6&quot;</p>
                                    </div>
                                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-foreground text-background">DS5.5</span>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-muted">
                                    <div>
                                        <p className="font-medium text-foreground">Ages 11-14</p>
                                        <p className="text-sm text-muted-foreground">Hand span typically 6-7.5&quot;</p>
                                    </div>
                                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-foreground text-background">DS5.5</span>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-muted">
                                    <div>
                                        <p className="font-medium text-foreground">Ages 15+</p>
                                        <p className="text-sm text-muted-foreground">Measure and reassess</p>
                                    </div>
                                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-muted-foreground text-background">DS6.0 or 6.5</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        )
    }

    return null
}
