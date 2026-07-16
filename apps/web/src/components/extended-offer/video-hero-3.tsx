"use client"

import { LazyVideo } from "@/components/extended-offer/LazyVideo"

const BG_VIDEO = "https://pub-ae162277c7104eb2b558af08104deafc.r2.dev/DreamPlay%20Hero%20720p%20Video%20Hero%203%20Loop%20(Hand%20Sizes).mp4"

export function VideoHero3() {
    return (
        <section className="relative min-h-screen md:min-h-0 md:aspect-video overflow-hidden">
            <LazyVideo src={BG_VIDEO} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/[0.02] to-transparent" />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.15) 100%)' }} />
            <div className="absolute inset-0 bg-black/[0.15]" />

            <div
                className="relative z-10 flex h-full min-h-screen md:min-h-0 md:aspect-video flex-col justify-center px-8 md:px-16 lg:px-24"
                style={{
                    textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 0 30px rgba(0,0,0,0.4)',
                }}
            >
                <p className="font-sans text-sm font-bold uppercase tracking-[0.3em] text-white/70 md:text-lg">
                    Designed for You
                </p>
                <h2 className="mt-4 font-serif text-2xl leading-tight text-white md:text-4xl lg:text-5xl text-balance">
                    Find Your Perfect Fit.
                    <br />
                    Play Without Limits.
                </h2>
                <p className="mt-5 max-w-md font-sans text-base font-medium leading-relaxed text-white/80 md:text-xl">
                    Two professional sizes. One standard of excellence.
                    Choose the keyboard that matches your hands.
                </p>
            </div>
        </section>
    )
}
