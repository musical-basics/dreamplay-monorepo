"use client"

import { useState, useEffect, useRef } from "react"

const BG_VIDEO = "https://pub-ae162277c7104eb2b558af08104deafc.r2.dev/DreamPlay%20Hero%20720p%20Video%20Hero%201%20Loop%20(Top%20Hero).mp4"

export function CrowdfundingSection() {
  const [textSlide, setTextSlide] = useState(0)

  const totalSlides = 4

  useEffect(() => {
    const timer = setInterval(() => {
      setTextSlide((prev) => (prev + 1) % totalSlides)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const scrollToVideo = () => {
    const el = document.getElementById("video")
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <>
      {/* Fixed video background — stays pinned to viewport top */}
      <div className="fixed inset-x-0 top-0 z-0 min-h-screen md:min-h-0 md:aspect-video overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={BG_VIDEO} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-black/[0.02] to-transparent" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.25) 100%)' }} />
        <div className="absolute inset-0 bg-black/[0.15]" />
      </div>

      {/* Scrollable content overlay */}
      <section className="relative z-[1] min-h-screen md:min-h-0 md:aspect-video overflow-hidden">

        <div
          className="relative z-10 flex h-full min-h-screen md:min-h-0 flex-col justify-center px-8 md:px-16 lg:px-24"
          style={{
            textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 0 30px rgba(0,0,0,0.4)',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
          }}
        >
          <div className="relative min-h-[280px] md:min-h-[320px]">
            {/* Slide 1: Headline */}
            <div
              className={`absolute inset-0 transition-all duration-500 ease-in-out ${textSlide === 0
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-4 pointer-events-none"
                }`}
            >
              <p className="font-sans text-sm font-bold uppercase tracking-[0.3em] text-white/70 md:text-lg">
                Now available to pre-order
              </p>
              <h1 className="mt-4 font-serif text-2xl leading-tight text-white md:text-4xl lg:text-5xl text-balance">
                The Pro Keyboard
                <br />
                for Hands That Don{"'"}t
                <br />
                Fit the Standard.
              </h1>
            </div>

            {/* Slide 2: Stat */}
            <div
              className={`absolute inset-0 transition-all duration-500 ease-in-out ${textSlide === 1
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4 pointer-events-none"
                }`}
            >
              <p className="font-sans text-sm font-bold uppercase tracking-[0.3em] text-white/60 md:text-lg">
                The reality
              </p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-serif text-[6rem] leading-none text-white md:text-[10rem]">55</span>
                <span className="font-serif text-4xl text-white/60 md:text-6xl">%</span>
              </div>
              <p className="mt-4 font-sans text-base font-medium text-white/80 md:text-xl max-w-md">
                of pianists have hands too small<br />for a standard keyboard.
              </p>
            </div>

            {/* Slide 3: Mantra */}
            <div
              className={`absolute inset-0 transition-all duration-500 ease-in-out ${textSlide === 2
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4 pointer-events-none"
                }`}
            >
              <p className="font-sans text-sm font-bold uppercase tracking-[0.3em] text-white/70 md:text-lg">
                Your professional journey
              </p>
              <h2 className="mt-4 font-serif text-2xl leading-tight text-white md:text-4xl lg:text-5xl text-balance">
                Start on the DS6.0.
                <br />
                Perform on Any Stage.
              </h2>
              <p className="mt-5 max-w-md font-sans text-base font-medium leading-relaxed text-white/80 md:text-xl">
                Embark on your professional journey the right way:
                perform live without strain on any stage.
              </p>
            </div>

            {/* Slide 4: Learning App */}
            <div
              className={`absolute inset-0 transition-all duration-500 ease-in-out ${textSlide === 3
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4 pointer-events-none"
                }`}
            >
              <p className="font-sans text-sm font-bold uppercase tracking-[0.3em] text-white/70 md:text-lg">
                Learn faster. Play more.
              </p>
              <h2 className="mt-4 font-sans text-2xl leading-tight text-white md:text-4xl lg:text-5xl text-balance">
                DreamPlay Learning
                <br />
                Makes Practice Fun.
              </h2>
              <p className="mt-5 max-w-md font-sans text-base font-medium leading-relaxed text-white/80 md:text-xl">
                Our interactive app guides you note-by-note with light-up keys,
                real-time feedback, and a library of songs, from beginner to virtuoso.
              </p>
            </div>
          </div>

          {/* Slide dots */}
          <div className="mt-6 flex gap-2">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                onClick={() => setTextSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${textSlide === i ? "w-6 bg-white" : "w-1.5 bg-white/40"
                  }`}
                aria-label={`Show slide ${i + 1}`}
              />
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <a
              href="/customize"
              className="inline-block bg-white px-8 py-3 text-center text-xs font-sans font-medium uppercase tracking-widest text-black transition-colors hover:bg-white/90 md:text-sm"
            >
              Pre-Order Now
            </a>
            <button
              onClick={scrollToVideo}
              className="group inline-flex items-center justify-center gap-2 border border-white/40 bg-black px-8 py-3 text-center text-xs font-sans font-medium uppercase tracking-widest text-white transition-colors hover:bg-neutral-900 md:text-sm cursor-pointer"
              style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/40">
                <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-2.5 w-2.5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              Watch Video
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
