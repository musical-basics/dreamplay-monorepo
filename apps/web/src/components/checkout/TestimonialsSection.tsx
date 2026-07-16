"use client";
import React, { useState } from "react";
import Image from "next/image";

const stories = [
    {
        quote: `"I often witness pianists place their hands for the first time on a keyboard that better suits their hand span. How often the pianist spontaneously bursts into tears. A lifetime of struggling with a seemingly insurmountable problem vanishes in the moment they realize, 'It's not me that is the problem; it is the instrument!' Following on that, the joy of possibility overwhelms them."`,
        avatar: "/images/marketing/carol-leone.png",
        name: "Dr. Carol Leone",
        role: "Chair of Piano Studies",
        school: "SMU Meadows School of the Arts"
    },
    {
        quote: `"I can play for much longer and continue to play every day. I don't get frustrated from the pain and from being limited in my playing."`,
        avatar: "/images/marketing/Jen-McCabe.png",
        name: "Jen McCabe",
        role: "Pianist, teacher, music director",
        school: "harmonypianostudio.com"
    },
    {
        quote: `"My favorite story is from a piano performance major, who couldn't believe that playing the piano didn't have to hurt. The instrument restored her joy for piano repertoire. She had been preparing to change over to harpsichord due to keyboard size issues. I will never forget the day she first played a Chopin ballade on the DS5.5. She literally could not stop beaming."`,
        avatar: "/images/marketing/Kathryn-Ananda-Owens.png",
        name: "Kathryn-Ananda Owens",
        role: "Professor of Music - Piano",
        school: "St Olaf College, Minnesota"
    }
];

export default function TestimonialsSection() {
    const [currentSlide, setCurrentSlide] = useState(0);

    const totalSlides = stories.length;
    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

    const story = stories[currentSlide];
    if (!story) return null;

    return (
        <section className="bg-neutral-100 text-black py-12 md:py-24 px-4 md:px-6">
            <div className="max-w-3xl mx-auto w-full">
                <div className="text-center mb-8 md:mb-12">
                    <span className="font-sans text-xs uppercase tracking-[0.3em] text-neutral-400 mb-3 block">Why We&apos;re Doing This</span>
                    <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl leading-tight text-black text-balance">Playing the piano<br />doesn&apos;t have to hurt</h2>
                </div>

                {/* Quote card */}
                <div className="bg-white rounded-sm shadow-lg shadow-black/5 border border-neutral-200/60 p-6 md:p-10 mb-8 md:mb-10">
                    <blockquote className="font-serif text-lg md:text-2xl lg:text-3xl leading-relaxed md:leading-tight text-neutral-800 text-center min-h-[100px] md:min-h-[140px] flex items-center justify-center">
                        <span className="transition-opacity duration-300">{story.quote}</span>
                    </blockquote>

                    {/* Attribution */}
                    <div className="flex items-center gap-4 justify-center border-t border-neutral-100 pt-6 mt-6 md:mt-8">
                        <div className="relative w-12 h-12 overflow-hidden bg-neutral-200 rounded-full flex-shrink-0">
                            <Image
                                src={story.avatar}
                                alt={story.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="text-left">
                            <h4 className="font-sans text-sm md:text-base font-bold text-black">{story.name}</h4>
                            <p className="font-sans text-xs md:text-sm text-neutral-500 leading-tight mt-0.5">{story.role}<br />{story.school}</p>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-6">
                    <div className="flex gap-2 items-center">
                        {stories.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentSlide(i)}
                                className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentSlide ? "bg-black scale-125" : "bg-black/20 hover:bg-black/40"}`}
                                aria-label={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={prevSlide} className="w-10 h-10 border border-black/20 flex items-center justify-center hover:bg-black hover:text-white transition-all" aria-label="Previous">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button onClick={nextSlide} className="w-10 h-10 border border-black/20 flex items-center justify-center hover:bg-black hover:text-white transition-all" aria-label="Next">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
