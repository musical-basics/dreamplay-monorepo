"use client"

import { useEffect, useRef, useState } from "react"
import { AbCtaLink } from "@/components/ab/AbCtaLink"

const PREORDER_URL = "/customize"

export function GuaranteeSection() {
    const [isVisible, setIsVisible] = useState(false)
    const sectionRef = useRef<HTMLElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    setIsVisible(true)
                }
            },
            { threshold: 0.3 },
        )

        if (sectionRef.current) {
            observer.observe(sectionRef.current)
        }

        return () => observer.disconnect()
    }, [])

    const steps = [
        { number: "1", title: "Pre-order your DreamPlay One today", isClickable: true },
        { number: "2", title: "Enjoy it for 90 days, risk-free" },
        { number: "3", title: "Not for you? Get a full refund" },
    ]

    return (
        <section ref={sectionRef} className="py-10 md:py-20 bg-white min-h-screen flex items-center">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <p
                        className={`text-neutral-500 text-xs md:text-sm uppercase tracking-wider mb-2 md:mb-4 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                    >
                        Why We&apos;re Doing This
                    </p>
                    <h2
                        className={`text-2xl md:text-5xl font-semibold text-neutral-900 mb-3 md:mb-6 leading-tight transition-all duration-700 delay-100 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                    >
                        Playing the piano
                        <br />
                        doesn&apos;t have to hurt
                    </h2>
                    <p
                        className={`text-neutral-600 text-sm md:text-lg mb-8 md:mb-16 max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                    >
                        Test your DreamPlay One for 90 days. If it doesn&apos;t change your playing experience, we&apos;ll give you a full
                        refund. Zero risk.
                    </p>

                    <div className="max-w-3xl mx-auto">
                        {/* Desktop timeline - elegant horizontal layout */}
                        <div className="hidden md:flex items-start justify-between relative">
                            <div
                                className={`absolute top-5 left-[20%] right-[20%] h-[1px] bg-gradient-to-r from-transparent via-sky-200 to-transparent transition-all duration-1000 delay-500 ${isVisible ? "opacity-100" : "opacity-0"}`}
                            />

                            {steps.map((step, index) => (
                                <div
                                    key={step.number}
                                    className={`transition-all duration-500 flex-1 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                                    style={{ transitionDelay: `${300 + index * 150}ms` }}
                                >
                                    <StepCard {...step} href={step.isClickable ? PREORDER_URL : undefined} />
                                </div>
                            ))}
                        </div>

                        {/* Mobile timeline - compact vertical layout */}
                        <div className="flex md:hidden flex-col items-center relative gap-4">
                            <div
                                className={`absolute top-4 bottom-4 left-1/2 -translate-x-1/2 w-[1px] bg-gradient-to-b from-transparent via-sky-200 to-transparent z-0 transition-all duration-1000 delay-500 ${isVisible ? "opacity-80" : "opacity-0"}`}
                            />

                            {steps.map((step, index) => (
                                <div
                                    key={step.number}
                                    className={`transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                                    style={{ transitionDelay: `${300 + index * 150}ms` }}
                                >
                                    <StepCardMobile {...step} href={step.isClickable ? PREORDER_URL : undefined} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <p
                        className={`text-[10px] md:text-xs text-neutral-400 mt-6 md:mt-12 transition-all duration-700 delay-700 ${isVisible ? "opacity-100" : "opacity-0"}`}
                    >
                        Refund excludes original shipping costs. Piano must be returned in original condition.
                    </p>
                </div>
            </div>
        </section>
    )
}

function StepCard({
    number,
    title,
    isClickable,
    href,
}: { number: string; title: string; isClickable?: boolean; href?: string }) {
    const content = (
        <div className="flex flex-col items-center relative z-10">
            <div className="w-10 h-10 rounded-full bg-sky-500 mb-4 flex items-center justify-center shadow-lg">
                <span className="text-sm font-semibold text-white">{number}</span>
            </div>
            <p
                className={`text-neutral-700 text-sm font-medium max-w-[160px] leading-snug ${isClickable ? "group-hover:text-neutral-900 transition-colors" : ""}`}
            >
                {title}
            </p>
        </div>
    )

    if (isClickable && href) {
        return (
            <AbCtaLink cta="special_offer_guarantee" href={href} className="group no-underline block">
                {content}
            </AbCtaLink>
        )
    }

    return content
}

function StepCardMobile({
    number,
    title,
    isClickable,
    href,
}: {
    number: string
    title: string
    isClickable?: boolean
    href?: string
}) {
    const content = (
        <div className="flex flex-col items-center relative z-10 bg-white px-3 py-1">
            <div className="w-8 h-8 rounded-full bg-sky-500 mb-2 flex items-center justify-center shadow-md">
                <span className="text-xs font-semibold text-white">{number}</span>
            </div>
            <p
                className={`text-neutral-700 text-xs font-medium max-w-[180px] text-center leading-snug ${isClickable ? "group-hover:text-neutral-900 transition-colors" : ""}`}
            >
                {title}
            </p>
        </div>
    )

    if (isClickable && href) {
        return (
            <AbCtaLink cta="special_offer_guarantee_mobile" href={href} className="group no-underline block">
                {content}
            </AbCtaLink>
        )
    }

    return content
}
