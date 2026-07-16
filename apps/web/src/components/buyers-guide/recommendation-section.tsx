"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, ArrowRight, RefreshCw, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export type UserProfile = {
    buyingFor: "myself" | "someone-else" | null
    demographic: "adult-female" | "adult-male" | "child" | null
    handSize: "small" | "average" | "large" | null
    goal: "beginner" | "intermediate" | "professional" | "casual" | null
}

function getProductImage(model: string) {
    switch (model) {
        case "DS5.5":
            return "/products/DS5.5-white.png"
        case "DS6.0":
            return "/products/DS6.0-black.png"
        case "DS6.5":
            return "/products/DS6.5-black.png"
        case "DreamPlay Premium Bundle":
            return "/products/bundle.png"
        default:
            return "/products/DS6.0-black.png"
    }
}

interface RecommendationSectionProps {
    profile: UserProfile
}

export function RecommendationSection({ profile }: RecommendationSectionProps) {
    const getRecommendation = () => {
        const { demographic, handSize } = profile

        if (demographic === "child") {
            return {
                primary: "DS5.5",
                primaryName: "7/8ths Size",
                primaryDescription:
                    "Perfect for young pianists. The narrower keys allow developing hands to build proper technique without strain.",
                features: [
                    "Ideal for ages 7-14",
                    "88 fully weighted keys",
                    "Narrowest key width for smaller reaches",
                    "Upgrade path to DS6.0 when they grow",
                ],
                alternative1: {
                    model: "DS6.0",
                    name: "15/16ths Size",
                    reason: "For teens with larger hands or if the child is already approaching adult hand size",
                },
                alternative2: {
                    model: "DreamPlay Premium Bundle",
                    name: "Complete Setup",
                    reason: "Includes stand, bench, and sustain pedal—everything needed to start playing immediately",
                },
            }
        }

        if (demographic === "adult-female") {
            return {
                primary: "DS6.0",
                primaryName: "15/16ths Size",
                primaryDescription:
                    "The ideal fit for most women. Balanced spacing gives you more reach and control than standard keys while keeping a familiar feel.",
                features: [
                    "Designed for women's hand proportions",
                    "Reach octaves and 9ths comfortably",
                    "88 fully weighted keys",
                    "Reduced strain and tension",
                ],
                alternative1: {
                    model: "DS5.5",
                    name: "7/8ths Size",
                    reason: 'If you have particularly small hands (under 7" span) and want the narrowest keys available',
                },
                alternative2: {
                    model: "DreamPlay Premium Bundle",
                    name: "Complete Setup",
                    reason: "Get the complete setup with the bundle including stand, bench, and sustain pedal",
                },
            }
        }

        if (handSize === "small") {
            return {
                primary: "DS5.5",
                primaryName: "7/8ths Size",
                primaryDescription:
                    "Designed for pianists with hands under 7.6 inches. Play octaves and 9ths with ease, unlocking repertoire that may have felt impossible before.",
                features: [
                    'Perfect for hand spans under 7.6"',
                    "Reach 10 notes comfortably",
                    "88 fully weighted keys",
                    "Reduced strain and tension",
                ],
                alternative1: {
                    model: "DS6.0",
                    name: "15/16ths Size",
                    reason: "If you're on the border between small and average, or prefer slightly wider keys",
                },
                alternative2: {
                    model: "DreamPlay Premium Bundle",
                    name: "Complete Setup",
                    reason: "Get the complete setup with the bundle including stand, bench, and sustain pedal",
                },
            }
        }

        if (handSize === "average") {
            return {
                primary: "DS6.0",
                primaryName: "15/16ths Size",
                primaryDescription:
                    "Balanced spacing for moderate hands. Gain more reach and control than on a standard layout while keeping a familiar feel under your fingers.",
                features: [
                    'Ideal for 7.6" - 8.5" hand spans',
                    "Reach 10 notes comfortably",
                    "88 fully weighted keys",
                    "Familiar feel with better reach",
                ],
                alternative1: {
                    model: "DS5.5",
                    name: "7/8ths Size",
                    reason: "If comfort and reduced strain are your top priorities, or you're on the smaller end of average",
                },
                alternative2: {
                    model: "DreamPlay Premium Bundle",
                    name: "Complete Setup",
                    reason: "The most popular choice—includes everything you need to start playing immediately",
                },
            }
        }

        return {
            primary: "DS6.5",
            primaryName: "Standard Size",
            primaryDescription:
                "Conventional sizing for those with hand spans over 8.5 inches. The same key width you'll find on most acoustic pianos.",
            features: [
                "Standard key width",
                "88 fully weighted keys",
                "Familiar feel for experienced players",
                "Compatible with most repertoire fingerings",
            ],
            alternative1: {
                model: "DS6.0",
                name: "15/16ths Size",
                reason: "Even with larger hands, some pianists prefer slightly narrower keys for faster passages",
            },
            alternative2: {
                model: "DreamPlay Premium Bundle",
                name: "Complete Setup",
                reason: "Includes stand, bench, and sustain pedal for a complete practice setup",
            },
        }
    }

    const recommendation = getRecommendation()
    const isChild = profile.demographic === "child"

    return (
        <section id="recommendation" className="py-20 px-6 bg-black text-white">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-white/10 text-white/80 text-sm font-medium">
                        <Sparkles className="w-4 h-4" />
                        Your Personalized Recommendation
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-4">
                        We Recommend the {recommendation.primary}
                    </h2>
                    <p className="text-lg text-white/70 max-w-2xl mx-auto">
                        {recommendation.primaryDescription}
                    </p>
                </div>

                {/* Primary Recommendation Card */}
                <div className="bg-white text-gray-900 rounded-3xl p-8 md:p-12 mb-8">
                    <div className="relative w-full aspect-[16/7] mb-8 rounded-2xl overflow-hidden bg-muted">
                        <Image
                            src={getProductImage(recommendation.primary)}
                            alt={`DreamPlay ${recommendation.primary}`}
                            fill
                            className="object-contain p-4"
                        />
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-accent/10 text-accent text-sm font-medium">
                                <Check className="w-4 h-4" />
                                Best Match
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-2">
                                DreamPlay {recommendation.primary}
                            </h3>
                            <p className="text-muted-foreground mb-6">{recommendation.primaryName}</p>

                            <ul className="space-y-3 mb-8">
                                {recommendation.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-accent" />
                                        </div>
                                        <span className="text-gray-900">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button size="lg" className="rounded-full px-8" asChild>
                                    <Link href="/customize?product=one">
                                        Reserve Now
                                        <ArrowRight className="ml-2 w-4 h-4" />
                                    </Link>
                                </Button>
                                <Button size="lg" variant="outline" className="rounded-full px-8" asChild>
                                    <Link href="/product-information">
                                        Learn More
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="w-full lg:w-auto lg:min-w-[280px] p-6 rounded-2xl bg-muted">
                            <p className="text-sm text-muted-foreground mb-1">Price</p>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-4xl font-bold text-gray-900">$999</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">Keyboard only</p>

                            <div className="pt-4 border-t border-border space-y-2 text-sm text-muted-foreground">
                                <p className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-accent" />
                                    Ships October 2026
                                </p>
                                <p className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-accent" />
                                    100% refundable anytime
                                </p>
                                <p className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-accent" />
                                    Escrow protected
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Child Upgrade Path Banner */}
                {isChild && (
                    <div className="bg-white/10 rounded-2xl p-6 mb-8 border border-white/20">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                <RefreshCw className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold text-white mb-1">Growth-Friendly Upgrade Path</h4>
                                <p className="text-white/70 text-sm">
                                    When your child outgrows the DS5.5, exchange it for a DS6.0 and only pay shipping costs.
                                    We want their keyboard to grow with them.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Alternative Recommendations */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                        <div className="relative w-full aspect-[16/9] mb-4 rounded-xl overflow-hidden bg-white/5">
                            <Image
                                src={getProductImage(recommendation.alternative1.model)}
                                alt={recommendation.alternative1.model}
                                fill
                                className="object-contain p-3"
                            />
                        </div>
                        <p className="text-sm text-white/60 mb-2">Also Consider</p>
                        <h4 className="text-xl font-semibold text-white mb-1">
                            {recommendation.alternative1.model}
                        </h4>
                        <p className="text-sm text-white/60 mb-3">{recommendation.alternative1.name}</p>
                        <p className="text-white/80 text-sm mb-4">{recommendation.alternative1.reason}</p>
                        <Button variant="secondary" size="sm" className="rounded-full" asChild>
                            <Link href="/product-information">
                                Learn More
                            </Link>
                        </Button>
                    </div>

                    <div className={cn(
                        "rounded-2xl p-6 border",
                        "bg-white text-black border-white"
                    )}>
                        <div className="relative w-full aspect-[16/9] mb-4 rounded-xl overflow-hidden bg-muted">
                            <Image
                                src={getProductImage(recommendation.alternative2.model)}
                                alt={recommendation.alternative2.model}
                                fill
                                className="object-contain p-3"
                            />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm text-muted-foreground">Most Popular</p>
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-accent text-accent-foreground">
                                Best Value
                            </span>
                        </div>
                        <h4 className="text-xl font-semibold text-foreground mb-1">
                            {recommendation.alternative2.model}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">{recommendation.alternative2.name}</p>
                        <p className="text-muted-foreground text-sm mb-4">{recommendation.alternative2.reason}</p>
                        <Button size="sm" className="rounded-full" asChild>
                            <Link href="/customize">
                                View Bundle
                                <ArrowRight className="ml-2 w-3 h-3" />
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Confidence Message */}
                <div className="text-center mt-16 pt-8 border-t border-white/20">
                    <p className="text-white/60 text-sm max-w-xl mx-auto">
                        Not 100% sure? No problem. We offer hassle-free exchanges and a flexible return policy.
                        Your funds are held in escrow and fully refundable until your keyboard ships.
                    </p>
                </div>
            </div>
        </section>
    )
}
