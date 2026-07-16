"use client"

import { useRef, useCallback, useState } from "react"

const BG_VIDEOS = [
  "https://pub-ae162277c7104eb2b558af08104deafc.r2.dev/Clip%203.m4v",
  "https://pub-ae162277c7104eb2b558af08104deafc.r2.dev/Clip%202.m4v",
]

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const handleEnded = useCallback(() => {
    const nextIndex = (currentIndex + 1) % BG_VIDEOS.length
    setCurrentIndex(nextIndex)
    if (videoRef.current) {
      videoRef.current.src = BG_VIDEOS[nextIndex] ?? ""
      videoRef.current.load()
      videoRef.current.play()
    }
  }, [currentIndex])

  return (
    <section className="relative min-h-screen overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover brightness-[0.7] contrast-[1.15] saturate-[0.85]"
        onEnded={handleEnded}
      >
        <source src={BG_VIDEOS[0]} type="video/mp4" />
      </video>
      {/* Cool dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-slate-900/30 to-black/40" />
      {/* Subtle cool wash */}
      <div className="absolute inset-0 bg-slate-900/15 mix-blend-overlay" />
      {/* Radial vignette */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />
    </section>
  )
}
