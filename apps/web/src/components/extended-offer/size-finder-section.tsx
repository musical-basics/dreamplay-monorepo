"use client"

import { useState } from "react"
import Image from "next/image"
import { Hand, ArrowRight } from "lucide-react"

export function SizeFinderSection() {
  const [selectedSize, setSelectedSize] = useState<"ds55" | "ds60" | null>("ds55")

  return (
    <section id="size" className="relative bg-white">
      <div className="mx-auto max-w-6xl px-6 pb-12 md:pb-20">
        <div className="mb-8 max-w-2xl">
          <p className="font-sans text-sm uppercase tracking-[0.3em] text-neutral-500">
            Choose Your Fit
          </p>
          <h2 className="mt-2 font-serif text-3xl leading-tight text-neutral-900 md:text-4xl lg:text-5xl text-balance">
            Two sizes. One perfect fit.
          </h2>
          <p className="mt-3 font-sans text-sm font-medium leading-relaxed text-neutral-500 md:text-base">
            We use the official DS Standard sizes &mdash; the same standard
            adopted by top universities worldwide. This is a professional
            instrument, not a toy.
          </p>
        </div>

        {/* How to measure */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:gap-16">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Hand className="h-5 w-5 text-neutral-900" strokeWidth={1.5} />
              <h3 className="font-serif text-lg text-neutral-900 md:text-xl">
                How to Measure Your Hand
              </h3>
            </div>
            <p className="mt-2 font-sans text-sm font-medium leading-relaxed text-neutral-500 md:text-base">
              Place your hand flat on a table, fingers spread naturally. Measure
              from the tip of your thumb to the tip of your pinky. This is your
              hand span.
            </p>
          </div>
          <div className="relative flex-1 overflow-hidden rounded-sm">
            <Image
              src="/images/hands/Zone B Hand.jpg"
              alt="Hand demonstrating natural span measurement"
              width={600}
              height={340}
              className="w-full object-cover"
            />
          </div>
        </div>

        {/* Size cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={() => setSelectedSize("ds55")}
            className={`group flex flex-col items-start gap-4 border p-5 text-left transition-all duration-200 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 md:p-6 ${selectedSize === "ds55"
              ? "border-neutral-900 bg-neutral-900 text-white shadow-xl ring-2 ring-neutral-900 ring-offset-2"
              : "border-neutral-200 bg-white text-neutral-900 shadow-lg hover:border-neutral-900"
              }`}
          >
            <p
              className={`font-sans text-sm uppercase tracking-[0.3em] ${selectedSize === "ds55"
                ? "text-white/60"
                : "text-neutral-400"
                }`}
            >
              7/8ths Size
            </p>
            <h3 className="font-serif text-2xl md:text-3xl">DS5.5</h3>
            <p
              className={`font-sans text-sm font-medium leading-relaxed md:text-base ${selectedSize === "ds55"
                ? "text-white/70"
                : "text-neutral-400"
                }`}
            >
              Designed for pianists with hands under 7.6 inches. Play octaves
              and 9ths with ease, and even the occasional 10th interval
              comfortably.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`font-sans text-xs uppercase tracking-wider ${selectedSize === "ds55"
                  ? "text-white/80"
                  : "text-neutral-700"
                  }`}
              >
                {'Hand span < 7.6"'}
              </span>
              <ArrowRight
                className={`h-3 w-3 transition-transform group-hover:translate-x-1 ${selectedSize === "ds55"
                  ? "text-white/80"
                  : "text-neutral-700"
                  }`}
              />
            </div>
          </button>

          <button
            onClick={() => setSelectedSize("ds60")}
            className={`group flex flex-col items-start gap-4 border p-5 text-left transition-all duration-200 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 md:p-6 ${selectedSize === "ds60"
              ? "border-neutral-900 bg-neutral-900 text-white shadow-xl ring-2 ring-neutral-900 ring-offset-2"
              : "border-neutral-200 bg-white text-neutral-900 shadow-lg hover:border-neutral-900"
              }`}
          >
            <p
              className={`font-sans text-sm uppercase tracking-[0.3em] ${selectedSize === "ds60"
                ? "text-white/60"
                : "text-neutral-400"
                }`}
            >
              15/16ths Size
            </p>
            <h3 className="font-serif text-2xl md:text-3xl">DS6.0</h3>
            <p
              className={`font-sans text-sm font-medium leading-relaxed md:text-base ${selectedSize === "ds60"
                ? "text-white/70"
                : "text-neutral-400"
                }`}
            >
              Designed for pianists with hands between 7.6 and 8.5 inches. Play
              octaves and 9ths with ease, and the occasional 10th without
              strain.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`font-sans text-xs uppercase tracking-wider ${selectedSize === "ds60"
                  ? "text-white/80"
                  : "text-neutral-700"
                  }`}
              >
                {'Hand span 7.6" – 8.5"'}
              </span>
              <ArrowRight
                className={`h-3 w-3 transition-transform group-hover:translate-x-1 ${selectedSize === "ds60"
                  ? "text-white/80"
                  : "text-neutral-700"
                  }`}
              />
            </div>
          </button>
        </div>

        {selectedSize && (
          <div className="mt-8 border border-neutral-200 bg-neutral-50 p-6 md:p-8">
            <p className="font-sans text-sm font-medium leading-relaxed text-neutral-900 md:text-base">
              {selectedSize === "ds55" ? (
                <>
                  You are in {'"'}Zone A{'"'} of the pianists (under 7.6 inches
                  handspan). Our{" "}
                  <strong className="font-serif text-base md:text-lg">
                    DS5.5®
                  </strong>{" "}
                  model is your match. The active key width is 41.1{'"'} (1044
                  mm), approximately 7/8ths of a standard keyboard. With our
                  DS5.5 keyboard, you will find that octaves, 9ths, and even
                  10ths become comfortable.
                </>
              ) : (
                <>
                  You are in {'"'}Zone B{'"'} of the pianists (7.6–8.5 inches
                  handspan). Our{" "}
                  <strong className="font-serif text-base md:text-lg">
                    DS6.0®
                  </strong>{" "}
                  model is your match. The active key width is 44.53{'"'} (1131
                  mm), approximately 15/16ths of a standard keyboard. With our
                  DS6.0 keyboard, you will find that octaves and 9ths are
                  effortless and 10ths become reachable.
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
