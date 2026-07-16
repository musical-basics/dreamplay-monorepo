"use client"

import { useEffect, useState, useCallback } from "react"

const steps = [
  { number: 1, label: "Discover", sectionId: "hero" },
  { number: 2, label: "Features", sectionId: "features" },
  { number: 3, label: "Size", sectionId: "size" },
  { number: 4, label: "Specs", sectionId: "specs" },
  { number: 5, label: "Story", sectionId: "creator" },
  { number: 6, label: "Trust", sectionId: "trust" },
  { number: 7, label: "Reserve", sectionId: "pricing" },
]

const darkSections = new Set(["hero", "features", "creator", "pricing"])

export function StepNav() {
  const [activeStep, setActiveStep] = useState(1)
  const [isLight, setIsLight] = useState(true)

  const handleScroll = useCallback(() => {
    const probeY = window.scrollY + window.innerHeight * 0.45
    let current = 1
    let currentSectionId = "hero"

    for (const step of steps) {
      const el = document.getElementById(step.sectionId)
      if (el && el.offsetTop <= probeY) {
        current = step.number
        currentSectionId = step.sectionId
      }
    }

    setActiveStep(current)
    setIsLight(darkSections.has(currentSectionId))
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- legacy behavior: sync scroll state on mount
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  function handleClick(sectionId: string) {
    const el = document.getElementById(sectionId)
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <nav
      className="fixed left-0 top-0 z-50 hidden h-screen w-16 flex-col items-center justify-center lg:flex xl:w-20 transition-colors duration-700"
      aria-label="Page navigation"
    >
      <div
        className="relative flex flex-col items-center rounded-2xl px-1.5 py-5 overflow-hidden"
      >
        {/* Dark glass backdrop with faded top & bottom */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl bg-neutral-900/60 backdrop-blur-md"
          style={{
            maskImage: "linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)",
          }}
        />

        {/* Content above backdrop */}
        {steps.map((step, i) => {
          const isActive = activeStep === step.number
          const isVisited = step.number < activeStep

          return (
            <div key={step.number} className="relative z-10 flex flex-col items-center">
              {/* Thin connecting line */}
              {i > 0 && (
                <div
                  className={`h-5 w-px transition-colors duration-700 ${isActive || isVisited ? "bg-white/40" : "bg-white/10"
                    }`}
                />
              )}

              {/* Step */}
              <button
                onClick={() => handleClick(step.sectionId)}
                className="group flex flex-col items-center py-1"
                aria-current={isActive ? "step" : undefined}
                aria-label={`Step ${step.number}: ${step.label}`}
              >
                {/* Number — no border, just typography */}
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full font-serif text-base leading-none transition-all duration-700 ${isActive
                      ? "text-white bg-white/15 scale-110"
                      : isVisited
                        ? "text-white/50 group-hover:text-white/70"
                        : "text-white/20 group-hover:text-white/40"
                    }`}
                >
                  {step.number}
                </span>

                {/* Label — elegant small caps */}
                <span
                  className={`mt-1 max-w-[4rem] text-center font-sans text-[8.5px] font-medium uppercase tracking-[0.2em] leading-tight transition-all duration-700 ${isActive
                      ? "text-white opacity-100"
                      : isVisited
                        ? "text-white/50 opacity-100 group-hover:text-white/70"
                        : "text-white/20 opacity-100 group-hover:text-white/40"
                    }`}
                >
                  {step.label}
                </span>
              </button>
            </div>
          )
        })}
      </div>
    </nav>
  )
}
