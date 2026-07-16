"use client"

import Image from "next/image"

export function CrowdfundingSection() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      <Image
        src="/images/keyboards/Main-Product-In-Studio-1-1_1.avif"
        alt="DreamPlay One keyboard in studio"
        fill
        sizes="100vw"
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-black/65" />
      <div className="relative z-10 flex h-full min-h-screen flex-col justify-center px-8 md:px-16 lg:px-24">
        <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/70 md:text-xs">
          Now available to pre-order
        </p>
        <h1 className="mt-4 font-serif text-3xl leading-tight text-white md:text-5xl lg:text-6xl xl:text-7xl text-balance">
          The Pro Keyboard
          <br />
          for Hands That Don{"'"}t
          <br />
          Fit the Standard.
        </h1>
        <p className="mt-6 max-w-md font-sans text-sm leading-relaxed text-white/90 md:text-base">
          88 weighted keys. Narrower by design. Built for the 87% of women and
          24% of men whose hands were never the right size for a standard
          keyboard.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <a
            href="/customize"
            className="inline-block bg-white px-8 py-3 text-center text-xs font-sans uppercase tracking-widest text-black transition-colors hover:bg-white/90 md:text-sm"
          >
            Pre-Order Now
          </a>
          <a
            href="/how-it-works"
            className="inline-block border border-white/30 px-8 py-3 text-center text-xs font-sans uppercase tracking-widest text-white transition-colors hover:bg-white/10 md:text-sm"
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  )
}
