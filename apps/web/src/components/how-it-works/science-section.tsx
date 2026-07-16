"use client"

import { useState } from "react"
import Image from "next/image"

export function ScienceSection() {
    const [bioLightbox, setBioLightbox] = useState(false)

    return (
        <>
            {/* ─── Hero statement ─── */}
            <section className="w-full bg-white text-neutral-900">
                <div className="mx-auto max-w-4xl px-6 py-20 md:py-32 text-center">
                    <p className="font-sans text-xs uppercase tracking-[0.3em] text-neutral-400 mb-6">
                        Clinical Research
                    </p>
                    <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-neutral-900 mb-6">
                        How Standard Keys<br />Cause Hands Injury.
                    </h2>
                    <p className="font-sans text-lg md:text-xl text-neutral-500 leading-relaxed max-w-2xl mx-auto">
                        When small-handed pianists play octaves or large chords, they&apos;re forced into a state
                        called <strong className="text-neutral-900 font-semibold">hyperabduction</strong> — maximum stretch that causes real injury.
                    </p>
                </div>
            </section>

            {/* ─── Biomechanical visual ─── */}
            <section className="w-full bg-neutral-50">
                <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
                    <button
                        onClick={() => setBioLightbox(true)}
                        className="group relative block w-full overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/10 transition-transform duration-500 hover:scale-[1.01]"
                    >
                        <Image
                            src="/images/hands/Biomechanical Impact on Small Hands copy.png"
                            alt="Diagram showing how wide piano keys cause hands injury in pianists with small hands"
                            width={1200}
                            height={900}
                            className="w-full h-auto group-hover:brightness-[1.02] transition-all duration-500 object-contain"
                        />
                    </button>
                    <p className="text-center font-sans text-sm text-neutral-400 mt-4 cursor-pointer hover:text-neutral-600 transition-colors" onClick={() => setBioLightbox(true)}>
                        Tap to enlarge
                    </p>
                </div>
            </section>

            {/* ─── The problem vs. the fix — side by side ─── */}
            <section className="w-full bg-white">
                <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
                    <div className="grid md:grid-cols-2 gap-5 md:gap-8">
                        {/* Problem side */}
                        <div className="border border-neutral-200 rounded-lg p-6 md:p-8 border-l-4 border-l-red-500">
                            <p className="font-sans text-xs font-bold uppercase tracking-[0.25em] text-red-500 mb-4">The Problem</p>
                            <h3 className="font-serif text-2xl md:text-3xl text-neutral-900 leading-snug mb-4">
                                Fingers splay flat.<br />The hand arch collapses.
                            </h3>
                            <p className="font-sans text-base text-neutral-600 leading-relaxed">
                                Severe <strong className="text-neutral-900 font-semibold">ulnar deviation</strong> — the wrist bends sharply toward the pinky, destroying the natural bridge of the hand.
                            </p>
                        </div>

                        {/* Solution side */}
                        <div className="border border-neutral-200 rounded-lg p-6 md:p-8 border-l-4 border-l-emerald-500">
                            <p className="font-sans text-xs font-bold uppercase tracking-[0.25em] text-emerald-500 mb-4">The Fix</p>
                            <h3 className="font-serif text-2xl md:text-3xl text-neutral-900 leading-snug mb-4">
                                Natural arch maintained.<br />Wrist stays neutral.
                            </h3>
                            <p className="font-sans text-base text-neutral-600 leading-relaxed">
                                Full mechanical leverage is restored — producing a <strong className="text-neutral-900 font-semibold">richer, more powerful tone</strong> with zero strain.
                            </p>
                            <p className="font-sans text-base text-neutral-600 leading-relaxed mt-4">
                                Ergonomics isn&apos;t just about preventing injury. It&apos;s about <strong className="text-neutral-900 font-semibold">expression</strong>. By restoring your natural hand arch, we remove the physical barrier between your soul and your sound.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Hero stats ─── */}
            <section className="w-full bg-neutral-950 text-white">
                <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 text-center">
                        {/* Stat 1 */}
                        <div className="border border-white/15 rounded-lg p-8 md:p-10">
                            <div className="font-sans text-5xl md:text-6xl font-bold tracking-tight mb-3">
                                86<span className="text-red-500">%</span>
                            </div>
                            <p className="font-sans text-sm md:text-base text-white/60 leading-relaxed">
                                of university piano majors experience <strong className="text-white font-semibold">active pain</strong> while playing
                            </p>
                        </div>

                        {/* Stat 2 */}
                        <div className="border border-white/15 rounded-lg p-8 md:p-10">
                            <div className="font-sans text-5xl md:text-6xl font-bold tracking-tight mb-3">
                                3<span className="text-red-500">×</span>
                            </div>
                            <p className="font-sans text-sm md:text-base text-white/60 leading-relaxed">
                                higher risk of <strong className="text-white font-semibold">tendonitis, focal dystonia</strong> and carpal tunnel syndrome
                            </p>
                        </div>

                        {/* Stat 3 */}
                        <div className="border border-white/15 rounded-lg p-8 md:p-10">
                            <div className="font-sans text-4xl md:text-5xl font-bold tracking-tight text-emerald-400 mb-3">
                                Proven
                            </div>
                            <p className="font-sans text-sm md:text-base text-white/60 leading-relaxed">
                                Narrower keyboards show a <strong className="text-white font-semibold">drastic reduction</strong> in muscle fatigue via EMG
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Sources (minimal) ─── */}
            <section className="w-full bg-neutral-50">
                <div className="mx-auto max-w-4xl px-6 py-10 md:py-14">
                    <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-300 mb-4">Peer-reviewed sources</p>
                    <div className="space-y-1">
                        <p className="font-sans text-xs text-neutral-400">Yoshimura et al. (2006) · Sakai (2008) · Wristen (2000)</p>
                        <p className="font-sans text-[11px] text-neutral-300 italic">Medical Problems of Performing Artists</p>
                    </div>
                </div>
            </section>

            {/* Lightbox */}
            {bioLightbox && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-pointer"
                    onClick={() => setBioLightbox(false)}
                >
                    <div className="relative max-w-5xl w-full mx-4 md:mx-8">
                        <Image
                            src="/images/hands/Biomechanical Impact on Small Hands copy.png"
                            alt="Diagram showing how wide piano keys cause hands injury in pianists with small hands"
                            width={1200}
                            height={900}
                            className="w-full h-auto object-contain"
                        />
                        <p className="text-center font-sans text-xs text-white/50 mt-4">Click anywhere to close</p>
                    </div>
                </div>
            )}
        </>
    )
}
