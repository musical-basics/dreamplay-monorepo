"use client"

import { useRef, useState, useEffect } from "react"

interface LazyVideoProps {
    src: string
    className?: string
    /** Offset before viewport at which to begin loading. Default "200px". */
    rootMargin?: string
    /** Start playback at this time (seconds). Default 0. */
    startAt?: number
}

/**
 * Lazy-loading autoplay video for the Learn page.
 * - Does NOT fetch the video until within `rootMargin` of viewport.
 * - Pauses when scrolled out of view to save CPU/battery.
 */
export function LazyVideo({
    src,
    className = "",
    rootMargin = "200px",
    startAt = 0,
}: LazyVideoProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isNearViewport, setIsNearViewport] = useState(false)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    if (!isNearViewport) setIsNearViewport(true)

                    const video = videoRef.current
                    if (video) {
                        video.play().catch(() => { /* autoplay may be blocked */ })
                    }
                } else {
                    const video = videoRef.current
                    if (video && !video.paused) {
                        video.pause()
                    }
                }
            },
            { rootMargin },
        )

        observer.observe(container)
        return () => observer.disconnect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isNearViewport, rootMargin])

    return (
        <div ref={containerRef} className={className}>
            <video
                ref={(el) => {
                    videoRef.current = el
                    if (el && startAt > 0 && !el.dataset.startApplied) {
                        el.dataset.startApplied = "true"
                        el.currentTime = startAt
                    }
                }}
                autoPlay
                muted
                loop
                playsInline
                preload={isNearViewport ? "auto" : "none"}
                className="h-full w-full object-cover"
            >
                {isNearViewport && <source src={src} type="video/mp4" />}
            </video>
        </div>
    )
}
