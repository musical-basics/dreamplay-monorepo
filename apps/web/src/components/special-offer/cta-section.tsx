"use client"

import { ArrowRight } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { AbCtaLink } from "@/components/ab/AbCtaLink"
import { getCountdownDate } from "@/actions/admin-actions"

export function CTASection() {
    const [isVisible, setIsVisible] = useState(false)
    const sectionRef = useRef<HTMLElement>(null)
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    })

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

    const [targetDate, setTargetDate] = useState<number | null>(null)

    useEffect(() => {
        getCountdownDate().then((dateStr) => {
            const t = dateStr ? new Date(dateStr).getTime() : new Date("2026-01-19T21:00:00-08:00").getTime()
            setTargetDate(t)
        })
    }, [])

    useEffect(() => {
        if (!targetDate) return

        const timer = setInterval(() => {
            const now = new Date()
            const difference = targetDate - now.getTime()

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                })
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [targetDate])

    return (
        <section
            ref={sectionRef}
            className="bg-gradient-to-br from-sky-500 to-blue-600 text-white py-20 md:py-28 min-h-screen flex items-center"
        >
            <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <h2
                        className={`text-4xl md:text-5xl font-semibold mb-6 leading-tight transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                    >
                        Be the First to
                        <br />
                        Experience DreamPlay.
                    </h2>
                    <p
                        className={`text-white/80 text-lg mb-8 max-w-xl mx-auto transition-all duration-700 delay-100 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                    >
                        We&apos;ve finished the design. Now, we need your help to begin production. By reserving now, you&apos;re helping
                        bring a new standard of instrument to life.
                    </p>

                    {/* Countdown */}
                    <div
                        className={`flex items-center justify-center gap-4 md:gap-6 mb-10 transition-all duration-700 delay-200 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
                    >
                        <TimeBlock value={timeLeft.days} label="Days" />
                        <span className="text-white/40 text-2xl font-light">:</span>
                        <TimeBlock value={timeLeft.hours} label="Hours" />
                        <span className="text-white/40 text-2xl font-light">:</span>
                        <TimeBlock value={timeLeft.minutes} label="Min" />
                        <span className="text-white/40 text-2xl font-light">:</span>
                        <TimeBlock value={timeLeft.seconds} label="Sec" />
                    </div>

                    <AbCtaLink
                        cta="special_offer_final"
                        href="/customize"
                        className={`inline-flex items-center gap-3 bg-white text-neutral-900 rounded-full px-10 py-5 text-lg font-medium hover:bg-neutral-100 hover:scale-105 transition-all duration-500 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                    >
                        Configure Yours
                        <span className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                            <ArrowRight className="w-4 h-4 text-white" />
                        </span>
                    </AbCtaLink>

                    {/* Pricing */}
                    <div
                        className={`mt-8 mb-4 transition-all duration-700 delay-400 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                    >
                        <p className="text-white text-sm mb-3 font-medium">DreamPlay Bundle</p>
                        <div className="flex items-baseline justify-center gap-4">
                            <span className="text-5xl md:text-6xl font-semibold">$1,199</span>
                        </div>
                    </div>

                    <p
                        className={`text-white/50 text-sm mt-6 transition-all duration-700 delay-500 ${isVisible ? "opacity-100" : "opacity-0"}`}
                    >
                        Available in White or Black
                    </p>
                </div>
            </div>
        </section>
    )
}

function TimeBlock({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <span className="text-3xl md:text-4xl font-semibold text-white tabular-nums leading-none">
                {String(value).padStart(2, "0")}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-white/60 mt-1">{label}</span>
        </div>
    )
}
