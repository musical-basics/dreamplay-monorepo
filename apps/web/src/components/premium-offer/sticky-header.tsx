"use client"

import { useEffect, useState, useCallback } from "react"
import { ArrowRight } from "lucide-react"

export function StickyHeader() {
  const [visible, setVisible] = useState(false)

  const handleScroll = useCallback(() => {
    // Show after scrolling past the hero section (~600px)
    const heroEnd = document.getElementById("hero")
    if (heroEnd) {
      const rect = heroEnd.getBoundingClientRect()
      setVisible(rect.bottom < 0)
    } else {
      setVisible(window.scrollY > 600)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- legacy behavior: sync scroll state on mount
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${visible
        ? "translate-y-0 opacity-100"
        : "-translate-y-full opacity-0 pointer-events-none"
        }`}
    >
      <div className="bg-neutral-900/80 backdrop-blur-md border-b border-white/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 lg:pl-24">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <span className="font-serif text-sm text-white tracking-wide md:text-base">
              DreamPlay One
            </span>
            <div className="hidden items-center gap-4 sm:flex">
              <span className="h-3 w-px bg-white/20" aria-hidden="true" />
              <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/40">
                $124,000+ Reserved
              </span>
              <span className="h-1 w-1 rounded-full bg-white/20" aria-hidden="true" />
              <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/40">
                208 Backers
              </span>
              <span className="h-1 w-1 rounded-full bg-white/20" aria-hidden="true" />
              <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/40">
                Batch 1: Aug 2027
              </span>
            </div>
          </div>

          {/* CTA */}
          <a
            href="/customize"
            className="group flex items-center gap-2 bg-white px-5 py-2 font-sans text-[10px] uppercase tracking-widest text-black transition-colors hover:bg-white/90 md:text-xs"
          >
            Pre-Order Now
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </header>
  )
}
