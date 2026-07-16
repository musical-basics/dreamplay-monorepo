"use client"

interface InfoSectionThreeProps {
    handSize: "small" | "average" | "large" | null
    demographic: "adult-female" | "adult-male" | "child" | null
}

export function InfoSectionThree({ handSize, demographic }: InfoSectionThreeProps) {
    const getRecommendedModel = () => {
        if (demographic === "child") return "DS5.5"
        if (handSize === "small") return "DS5.5"
        if (handSize === "average") return "DS6.0"
        return "DS6.5"
    }

    const model = getRecommendedModel()

    return (
        <section className="py-16 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h3 className="text-2xl sm:text-3xl font-semibold text-foreground mb-4">
                        What the Right Fit Unlocks
                    </h3>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Based on your answers, here&apos;s how the <strong className="text-foreground">{model}</strong> could
                        transform your playing experience.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-card rounded-3xl p-8 border border-border">
                        <h4 className="text-lg font-semibold text-foreground mb-6">Reach Capability</h4>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-muted-foreground">Conventional (DS6.5)</span>
                                    <span className="text-sm font-medium text-foreground">
                                        {demographic === "child"
                                            ? (handSize === "large" ? "8" : handSize === "average" ? "7" : "6")
                                            : (handSize === "large" ? "10" : handSize === "average" ? "9" : "8")
                                        } Notes
                                    </span>
                                </div>
                                <div className="h-3 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-muted-foreground rounded-full"
                                        style={{
                                            width: demographic === "child"
                                                ? (handSize === "large" ? "80%" : handSize === "average" ? "70%" : "60%")
                                                : (handSize === "large" ? "100%" : handSize === "average" ? "90%" : "80%")
                                        }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-muted-foreground">{model} Model</span>
                                    <span className="text-sm font-medium text-foreground">
                                        {demographic === "child"
                                            ? (handSize === "large" ? "10" : handSize === "average" ? "9" : "8")
                                            : "10"
                                        } Notes
                                    </span>
                                </div>
                                <div className="h-3 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent rounded-full"
                                        style={{
                                            width: demographic === "child"
                                                ? (handSize === "large" ? "100%" : handSize === "average" ? "90%" : "80%")
                                                : "100%"
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-6">
                            Reach capability shows how many notes you can comfortably span in a single hand position.
                        </p>
                    </div>

                    <div className="bg-card rounded-3xl p-8 border border-border">
                        <h4 className="text-lg font-semibold text-foreground mb-6">Key Benefits</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-muted">
                                <div className="text-2xl font-bold text-foreground mb-1">-40%</div>
                                <p className="text-sm text-muted-foreground">Reduced hand strain</p>
                            </div>
                            <div className="p-4 rounded-xl bg-muted">
                                <div className="text-2xl font-bold text-foreground mb-1">+25%</div>
                                <p className="text-sm text-muted-foreground">More reach</p>
                            </div>
                            <div className="p-4 rounded-xl bg-muted">
                                <div className="text-2xl font-bold text-foreground mb-1">88</div>
                                <p className="text-sm text-muted-foreground">Full keys</p>
                            </div>
                            <div className="p-4 rounded-xl bg-muted">
                                <div className="text-2xl font-bold text-foreground mb-1">100%</div>
                                <p className="text-sm text-muted-foreground">Repertoire access</p>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-6">
                            All DreamPlay keyboards feature 88 weighted keys—just scaled to fit different hands.
                        </p>
                    </div>
                </div>

                <div className="mt-8 p-6 rounded-2xl border border-border bg-card">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                            <span className="text-2xl">📚</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-foreground mb-1">Research-Backed Design</h4>
                            <p className="text-sm text-muted-foreground">
                                Players report <strong className="text-foreground">relief from pain, faster technical progress,
                                    and greater comfort</strong> when they move to keyboards that match their hand span.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
