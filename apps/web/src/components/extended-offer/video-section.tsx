"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import Image from "next/image"
import { Play } from "lucide-react"

const VIDEO_SOURCES = [
  "https://pub-ae162277c7104eb2b558af08104deafc.r2.dev/Final%204k%20Video%20DreamPlay%20Intro.mp4",
  "/videos/Clip 2.mp4",
]

export function VideoSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isNearViewport, setIsNearViewport] = useState(false)

  // Lazy-load: only inject <source> when section is within 200px of viewport
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsNearViewport(true)
          observer.disconnect()
        }
      },
      { rootMargin: "200px" },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const playNextVideo = useCallback(() => {
    const nextIndex = (currentIndex + 1) % VIDEO_SOURCES.length
    setCurrentIndex(nextIndex)
    if (videoRef.current) {
      videoRef.current.src = VIDEO_SOURCES[nextIndex] ?? ""
      videoRef.current.load()
      videoRef.current.play()
    }
  }, [currentIndex])

  function handlePlay() {
    if (videoRef.current) {
      videoRef.current.src = VIDEO_SOURCES[0] ?? ""
      videoRef.current.load()
      videoRef.current.play()
      setIsPlaying(true)
      setCurrentIndex(0)
    }
  }

  return (
    <section ref={sectionRef} className="relative leading-[0] -mt-px bg-neutral-200">
      <div className="relative w-full min-h-[60vh] md:min-h-0 md:aspect-video">
        <video
          ref={videoRef}
          className="h-full w-full object-cover block"
          controls={isPlaying}
          playsInline
          preload="none"
          poster="/images/marketing/video-thumbnail-piano.png"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={playNextVideo}
        >
          {isNearViewport && (
            <source
              src={VIDEO_SOURCES[0]}
              type="video/mp4"
            />
          )}
          Your browser does not support the video element.
        </video>

        {!isPlaying && (
          <>
            <Image
              src="/images/marketing/video-thumbnail-piano.png"
              alt="DreamPlay Intro Video"
              fill
              className="object-cover"
              priority={false}
            />
            <button
              onClick={handlePlay}
              className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center transition-colors hover:bg-white/5"
              aria-label="Play DreamPlay intro video"
            >
              <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-sm transition-transform hover:scale-110 md:h-24 md:w-24">
                <Play className="ml-1 h-8 w-8 fill-white text-white md:h-10 md:w-10" />
              </span>
            </button>
          </>
        )}
      </div>
    </section>
  )
}

