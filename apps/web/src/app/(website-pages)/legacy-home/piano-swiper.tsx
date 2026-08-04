"use client";

import React, { useState } from "react";

const SLIDES = [
    {
        src: "/images/keyboards/ds60-black-narrow-keys-piano.png",
        alt: "DreamPlay One in Black",
    },
    {
        src: "/images/keyboards/ds55-white-narrow-keys-piano.png",
        alt: "DreamPlay One in White",
    },
];

/**
 * Port of the legacy Swiper-based piano color slider (Black / White) as a
 * plain React component — no Swiper CDN bundle required. Mirrors the legacy
 * behavior of hiding the back arrow on the first slide and the next arrow on
 * the last slide.
 */
export default function PianoSwiper() {
    const [index, setIndex] = useState(0);
    const count = SLIDES.length;

    return (
        <div className="w-full max-w-[58rem]">
            <div className="relative overflow-hidden">
                <div
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${index * 100}%)` }}
                >
                    {SLIDES.map((slide) => (
                        <div key={slide.src} className="w-full flex-none">
                            <div className="relative w-full pt-[36.81%]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={slide.src}
                                    alt={slide.alt}
                                    className="absolute inset-0 h-full w-full object-contain"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Arrows */}
                {index > 0 && (
                    <button
                        type="button"
                        aria-label="Previous slide"
                        onClick={() => setIndex((i) => Math.max(0, i - 1))}
                        className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                )}
                {index < count - 1 && (
                    <button
                        type="button"
                        aria-label="Next slide"
                        onClick={() => setIndex((i) => Math.min(count - 1, i + 1))}
                        className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-center gap-2.5">
                {SLIDES.map((slide, i) => (
                    <button
                        key={slide.src}
                        type="button"
                        aria-label={`Go to slide ${i + 1}`}
                        onClick={() => setIndex(i)}
                        className={`h-2.5 w-2.5 rounded-full transition-colors ${
                            i === index ? "bg-[#010103]" : "bg-black/25 hover:bg-black/40"
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}
