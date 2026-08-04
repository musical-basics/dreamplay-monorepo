"use client";

import React, { useEffect, useRef, useState } from "react";

interface BackgroundVideoProps {
    posterUrl: string;
    videoMp4: string;
    videoWebm: string;
}

/**
 * Self-contained port of the legacy WebflowBackgroundVideo component
 * (autoplaying, looping background clip with a play/pause control),
 * rewritten without any webflow.js / webflow CSS dependencies.
 */
export default function BackgroundVideo({
    posterUrl,
    videoMp4,
    videoWebm,
}: BackgroundVideoProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const attemptPlay = () => {
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setIsPlaying(true))
                    .catch(() => setIsPlaying(false));
            }
        };

        // Play/pause based on viewport visibility.
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        attemptPlay();
                    } else {
                        video.pause();
                        setIsPlaying(false);
                    }
                });
            },
            { threshold: 0.1 }
        );

        observer.observe(video);

        return () => {
            observer.unobserve(video);
            observer.disconnect();
        };
    }, []);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.play().catch(() => setIsPlaying(false));
            setIsPlaying(true);
        } else {
            video.pause();
            setIsPlaying(false);
        }
    };

    return (
        <div className="absolute inset-0 h-full w-full">
            <video
                ref={videoRef}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                poster={posterUrl}
                className="absolute inset-0 h-full w-full object-cover"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            >
                <source src={videoMp4} type="video/mp4" />
                <source src={videoWebm} type="video/webm" />
            </video>

            <button
                type="button"
                aria-label={isPlaying ? "Pause video" : "Play video"}
                onClick={togglePlay}
                className="absolute bottom-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
            >
                {isPlaying ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                        <rect x="2" y="1" width="3.5" height="12" rx="1" />
                        <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
                    </svg>
                ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                        <path d="M3 1.5v11a1 1 0 0 0 1.54.84l8.13-5.5a1 1 0 0 0 0-1.68L4.54.66A1 1 0 0 0 3 1.5Z" />
                    </svg>
                )}
            </button>
        </div>
    );
}
