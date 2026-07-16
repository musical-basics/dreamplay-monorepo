"use client"

import { useRef, useState, useEffect } from "react"

interface LazyVideoProps {
    src: string
    className?: string
    /** Distance from viewport at which to begin loading. Default "200px". */
    rootMargin?: string
}

/**
 * A lazy-loading autoplay background video.
 *
 * - Does NOT set the `src` until the element is within `rootMargin` of the viewport.
 * - Autoplays (muted, looped, playsInline) when visible.
 * - Pauses when scrolled out of view to save CPU / battery.
 */
export function LazyVideo({
    src,
    className,
    rootMargin = "200px",
}: LazyVideoProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    // First intersection: inject the src so the browser starts downloading
                    if (!isLoaded) setIsLoaded(true)

                    // Play when visible
                    const video = videoRef.current
                    if (video) {
                        video.play().catch(() => {
                            /* autoplay may be blocked — ignore */
                        })
                    }
                } else {
                    // Pause when out of view
                    const video = videoRef.current
                    if (video && !video.paused) {
                        video.pause()
                    }
                }
            },
            { rootMargin },
        )

        observer.observe(container)

        return () => {
            observer.disconnect()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, rootMargin])

    return (
        <div ref={containerRef} className={className} style={{ width: "100%", height: "100%" }}>
            <video
                ref={videoRef}
                autoPlay
                muted
                loop
                playsInline
                preload={isLoaded ? "auto" : "none"}
                className="absolute inset-0 h-full w-full object-cover"
            >
                {isLoaded && <source src={src} type="video/mp4" />}
            </video>
        </div>
    )
}
