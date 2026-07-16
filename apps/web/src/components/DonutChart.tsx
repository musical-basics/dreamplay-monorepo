"use client";
import React, { useEffect, useState, useRef } from "react";

/**
 * Donut Chart — Red/Green split with animated fill
 */
const DonutChart = ({ percent, label, theme = "light" }: { percent: number; label: string; theme?: "light" | "dark" }) => {
    const [currentPercent, setCurrentPercent] = useState(0);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) {
                const target = percent;
                const duration = 1500;
                const startTime = performance.now();

                const animate = (time: number) => {
                    const elapsed = time - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const ease = 1 - Math.pow(1 - progress, 4);
                    setCurrentPercent(target * ease);
                    if (progress < 1) requestAnimationFrame(animate);
                };
                requestAnimationFrame(animate);
                observer.disconnect();
            }
        }, { threshold: 0.5 });

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [percent]);

    const size = 220;
    const strokeWidth = 28;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const cx = size / 2;
    const cy = size / 2;

    const filledLength = (currentPercent / 100) * circumference;
    const emptyLength = circumference - filledLength;

    const uniqueId = `donut-${percent}-${label.replace(/\s/g, '')}`;

    return (
        <div ref={ref} className="flex flex-col items-center w-full">
            <div className="relative w-full max-w-[220px] aspect-square flex items-center justify-center">
                <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 drop-shadow-2xl">
                    <defs>
                        <filter id={`${uniqueId}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(0,0,0,0.5)" />
                            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="rgba(0,0,0,0.3)" />
                        </filter>
                        <linearGradient id={`${uniqueId}-filled`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#e74c3c" />
                            <stop offset="40%" stopColor="#c0392b" />
                            <stop offset="100%" stopColor="#8b1a1a" />
                        </linearGradient>
                        <linearGradient id={`${uniqueId}-empty`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#2ecc71" />
                            <stop offset="40%" stopColor="#1e7a3a" />
                            <stop offset="100%" stopColor="#0d4d22" />
                        </linearGradient>
                    </defs>

                    <circle
                        cx={cx} cy={cy} r={radius}
                        fill="none"
                        stroke={theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.05)"}
                        strokeWidth={strokeWidth + 4}
                    />
                    <circle
                        cx={cx} cy={cy} r={radius}
                        fill="none"
                        stroke={`url(#${uniqueId}-empty)`}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${circumference}`}
                        strokeDashoffset={0}
                        strokeLinecap="butt"
                        filter={`url(#${uniqueId}-shadow)`}
                    />
                    <circle
                        cx={cx} cy={cy} r={radius}
                        fill="none"
                        stroke={`url(#${uniqueId}-filled)`}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${filledLength} ${emptyLength}`}
                        strokeDashoffset={0}
                        strokeLinecap="butt"
                        filter={`url(#${uniqueId}-shadow)`}
                    />
                </svg>

                <div
                    className="absolute rounded-full"
                    style={{
                        width: '60%',
                        height: '60%',
                        background: theme === "dark"
                            ? "radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.06) 0%, rgba(10,10,15,0.95) 60%)"
                            : "radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.8) 0%, rgba(245,245,245,0.95) 60%)",
                        boxShadow: theme === "dark"
                            ? "inset 0 2px 8px rgba(255,255,255,0.04), inset 0 -4px 12px rgba(0,0,0,0.6), 0 0 20px rgba(0,0,0,0.3)"
                            : "inset 0 2px 8px rgba(255,255,255,0.6), inset 0 -4px 12px rgba(0,0,0,0.1), 0 0 20px rgba(0,0,0,0.05)",
                    }}
                />

                <div className="absolute z-10 flex flex-col items-center">
                    <span
                        className="text-3xl md:text-5xl font-bold text-[#c0392b]"
                        style={{
                            textShadow: theme === "dark"
                                ? "0 0 20px rgba(192,57,43,0.3), 0 2px 4px rgba(0,0,0,0.5)"
                                : "0 0 12px rgba(192,57,43,0.15), 0 1px 2px rgba(0,0,0,0.1)"
                        }}
                    >
                        {Math.round(currentPercent)}%
                    </span>
                    {label && <span className={`text-sm font-medium uppercase tracking-wide mt-1 ${theme === "light" ? "text-neutral-500" : "text-white/50"}`}>{label}</span>}
                </div>
            </div>
        </div>
    );
};

export default DonutChart;
