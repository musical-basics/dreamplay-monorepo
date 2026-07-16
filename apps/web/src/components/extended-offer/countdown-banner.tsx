"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { FoundersBatchCapture } from "../FoundersBatchCapture"

const DEADLINE = new Date("2026-03-02T00:00:00-08:00").getTime() // March 2, 2026 midnight PST

function pad(n: number) {
    return n.toString().padStart(2, "0")
}

export function CountdownBanner() {
    const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number } | null>(null)
    const [expired, setExpired] = useState(false)
    const [isFoundersOpen, setIsFoundersOpen] = useState(false)

    useEffect(() => {
        function tick() {
            const now = Date.now()
            const diff = DEADLINE - now
            if (diff <= 0) {
                setExpired(true)
                setTimeLeft(null)
                return
            }
            const h = Math.floor(diff / (1000 * 60 * 60))
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const s = Math.floor((diff % (1000 * 60)) / 1000)
            setTimeLeft({ h, m, s })
        }
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [])

    if (expired) {
        return (
            <div
                className="bg-[#050505] border-b border-white/10 py-2.5 text-center flex items-center justify-center gap-2 w-full z-50 text-[10px] sm:text-xs text-white/70 uppercase tracking-[0.15em] font-sans font-medium"
            >
                <span className="text-white/90 font-bold uppercase tracking-wider">
              FINAL 48 HOURS TO SECURE THE DREAMPLAY ONE.
            </span>
            </div>
        )
    }

    return (
        <Link
            href="/customize"
            className="group bg-[#050505] border-b border-white/10 py-2.5 text-center flex items-center justify-center gap-2 sm:gap-3 w-full z-50 text-[10px] sm:text-xs text-white/80 uppercase tracking-[0.15em] font-sans font-medium hover:text-white transition-colors"
        >
            <span className="hidden sm:inline">Founder&apos;s Pricing ends in</span>
            <span className="sm:hidden">Ends in</span>
            {timeLeft && (
                <span className="inline-flex items-center gap-1 font-mono tracking-wider text-amber-400 text-[11px] sm:text-sm font-bold">
                    <span className="bg-amber-400/10 px-1.5 py-0.5 rounded">{pad(timeLeft.h)}h</span>
                    <span className="text-amber-400/40">:</span>
                    <span className="bg-amber-400/10 px-1.5 py-0.5 rounded">{pad(timeLeft.m)}m</span>
                    <span className="text-amber-400/40">:</span>
                    <span className="bg-amber-400/10 px-1.5 py-0.5 rounded">{pad(timeLeft.s)}s</span>
                </span>
            )}
            <span className="hidden md:inline text-white/50">| Reserve for $499 before $1,499 MSRP</span>
            <span className="md:hidden text-white/50">| $499 → $1,499</span>
        </Link>
    )
}
