"use client";

import React, { useState } from "react";

interface Testimonial {
    quote: React.ReactNode;
    authorImage: string;
    authorName: string;
    authorLines: string[];
}

const TESTIMONIALS: Testimonial[] = [
    {
        quote: (
            <>
                I often witness pianists place their hands for the first time on a
                keyboard that better suits their hand span. How often the pianist
                spontaneously bursts into tears. A lifetime of struggling with a
                seemingly insurmountable problem vanishes in the moment they realize,
                &quot;It&apos;s not me that is the problem; it is the
                instrument!&quot; Following on that, the joy of possibility
                overwhelms them.
            </>
        ),
        authorImage: "/images/marketing/carol-leone.jpeg",
        authorName: "Dr. Carol Leone",
        authorLines: [
            "Chair of Piano Studies",
            "SMU Meadows School of the Arts in Dallas, Texas,",
        ],
    },
    {
        quote: (
            <>
                My favorite story is from a piano performance major, who
                couldn&apos;t believe that playing the piano didn&apos;t have to
                hurt. The instrument restored her joy for piano repertoire. She had
                been preparing to change over to harpsichord due to keyboard size
                issues. I will never forget the day she first played a Chopin ballade
                on the DS5.5. She literally could not stop beaming.
            </>
        ),
        authorImage: "/images/marketing/Kathryn-Ananda-Owens.png",
        authorName: "Kathryn-Ananda Owens",
        authorLines: ["Professor of Music - Piano", "St Olaf College, Minnesota"],
    },
    {
        quote: (
            <>
                I can play for much longer and continue to play every day. I
                don&apos;t get frustrated from the pain and from being limited in my
                playing.
                <br />
                <br />- Jen McCabe, <em>harmonypianostudio.com</em>
            </>
        ),
        authorImage: "/images/marketing/Jen-McCabe.png",
        authorName: "Jen McCabe",
        authorLines: [
            "Pianist, teacher, music director",
            "North Park, Chicago, IL",
        ],
    },
];

/**
 * Port of the legacy Webflow testimonial slider (w-slider) as a plain React
 * component — no webflow.js required.
 */
export default function TestimonialSlider() {
    const [index, setIndex] = useState(0);
    const count = TESTIMONIALS.length;

    const prev = () => setIndex((i) => (i - 1 + count) % count);
    const next = () => setIndex((i) => (i + 1) % count);

    const t = TESTIMONIALS[index] ?? TESTIMONIALS[0];
    if (!t) return null;

    return (
        <div className="relative w-full flex-1">
            <div className="w-full">
                <div className="w-full border-b border-[#e2e2e233] pb-10 lg:min-h-[26rem]">
                    <p className="text-xl font-medium leading-[1.6] tracking-[-0.32px] text-white md:text-2xl lg:text-[1.75rem]">
                        {t.quote}
                    </p>
                </div>
                <div className="mt-8 flex items-center gap-5">
                    <div className="h-20 w-20 flex-none overflow-hidden rounded-2xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={t.authorImage}
                            alt={t.authorName}
                            className="h-full w-full object-cover"
                            loading="lazy"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="text-lg font-medium text-white lg:text-xl">
                            {t.authorName}
                        </div>
                        <div>
                            {t.authorLines.map((line) => (
                                <div key={line} className="text-sm text-[#76767b]">
                                    {line}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="mt-8 flex items-center justify-between">
                <div className="flex gap-3">
                    {TESTIMONIALS.map((item, i) => (
                        <button
                            key={item.authorName}
                            type="button"
                            aria-label={`Go to testimonial ${i + 1}`}
                            onClick={() => setIndex(i)}
                            className={`h-2.5 w-2.5 rounded-full transition-colors ${
                                i === index ? "bg-white" : "bg-white/30 hover:bg-white/50"
                            }`}
                        />
                    ))}
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        aria-label="Previous testimonial"
                        onClick={prev}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white/10"
                    >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        aria-label="Next testimonial"
                        onClick={next}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white/10"
                    >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
