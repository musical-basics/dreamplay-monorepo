"use client"

import { useState, useEffect } from "react"
import { getCountdownDate } from "@/actions/admin-actions"

export function CountdownTimer() {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    })

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
                // Offer has expired
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [targetDate])

    return (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-4">
            <div className="container mx-auto px-4 flex flex-wrap items-center justify-center gap-6 md:gap-10">
                <span className="text-white/80 text-sm font-medium">Founder&apos;s Price Ends In:</span>
                <div className="flex items-center gap-4 md:gap-6">
                    <TimeBlock value={timeLeft.days} label="Days" />
                    <span className="text-white/40 text-2xl font-light">:</span>
                    <TimeBlock value={timeLeft.hours} label="Hours" />
                    <span className="text-white/40 text-2xl font-light">:</span>
                    <TimeBlock value={timeLeft.minutes} label="Min" />
                    <span className="text-white/40 text-2xl font-light">:</span>
                    <TimeBlock value={timeLeft.seconds} label="Sec" />
                </div>
            </div>
        </div>
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
