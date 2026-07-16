"use client"

import { useEffect, useRef, useState } from "react"

export function VideoSection1() {
    const sectionRef = useRef<HTMLElement>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    setIsVisible(true)
                }
            },
            { threshold: 0.2 },
        )

        if (sectionRef.current) {
            observer.observe(sectionRef.current)
        }

        return () => observer.disconnect()
    }, [])

    return (
        <section
            ref={sectionRef}
            className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden"
        >
            {/* Background Video */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                poster="https://cdn.prod.website-files.com/68b99847f96fcca15429faec%2F690762e17fd3a46a62765937_Clip%204-poster-00001.jpg"
            >
                <source
                    src="https://cdn.prod.website-files.com/68b99847f96fcca15429faec%2F690762e17fd3a46a62765937_Clip%204-transcode.mp4"
                    type="video/mp4"
                />
                <source
                    src="https://cdn.prod.website-files.com/68b99847f96fcca15429faec%2F690762e17fd3a46a62765937_Clip%204-transcode.webm"
                    type="video/webm"
                />
            </video>

            {/* Overlay for better text visibility */}
            <div className="absolute inset-0 bg-black/30" />

            {/* Optional: Scroll indicator at bottom */}
            <div
                className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-700 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    }`}
            >
                <div className="w-6 h-10 rounded-full border-2 border-white/50 flex items-start justify-center p-2">
                    <div className="w-1 h-2 bg-white/70 rounded-full animate-bounce" />
                </div>
            </div>
        </section>
    )
}
