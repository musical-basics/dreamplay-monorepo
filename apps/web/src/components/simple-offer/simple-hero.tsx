"use client"

import Image from "next/image"
import { Check } from "lucide-react"
import { AbCtaLink } from "@/components/ab/AbCtaLink"

/**
 * Hero for /simple-offer (A/B variation 5a) — the simplified, single-message
 * take on the premium-offer hero: one headline, three proof bullets, ONE
 * call-to-action. No secondary "learn more" path, no competing links.
 */
export function SimpleHero() {
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
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative z-10 flex h-full min-h-screen flex-col justify-center px-8 md:px-16 lg:px-24">
        <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/70 md:text-xs">
          Now available to pre-order
        </p>
        <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-white md:text-6xl xl:text-7xl text-balance">
          A Piano That Finally Fits Your Hands.
        </h1>
        <ul className="mt-8 space-y-3 font-sans text-sm text-white/90 md:text-base">
          {[
            "88 weighted keys — 1/16 narrower, so your hands reach what the music asks",
            "Backed by Stanford-cited ergonomics research",
            "100% money-back guarantee before your order ships",
          ].map((line) => (
            <li key={line} className="flex items-start gap-3">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span className="max-w-xl">{line}</span>
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <AbCtaLink
            cta="simple_offer_hero"
            href="/customize"
            className="inline-block bg-white px-10 py-4 text-center text-xs font-sans uppercase tracking-widest text-black transition-colors hover:bg-white/90 md:text-sm"
          >
            Reserve Yours Now
          </AbCtaLink>
        </div>
      </div>
    </section>
  )
}
