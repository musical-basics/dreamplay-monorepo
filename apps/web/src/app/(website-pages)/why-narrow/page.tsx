"use client";
import React, { useEffect, useState, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { InlineHandGuide } from "@/components/InlineHandGuide";

/**
 * 3D Glassmorphic Donut Chart — SVG-based with gradient strokes, drop shadows, and glass inner ring
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

  const uniqueId = `wn-donut-${percent}-${label.replace(/\s/g, '')}`;

  return (
    <div ref={ref} className="flex flex-col items-center">
      <div className="relative w-[220px] h-[220px] flex items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 drop-shadow-2xl">
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

          {/* Background ring */}
          <circle cx={cx} cy={cy} r={radius} fill="none"
            stroke="rgba(0,0,0,0.05)"
            strokeWidth={strokeWidth + 4} />

          {/* Empty (green) arc */}
          <circle cx={cx} cy={cy} r={radius} fill="none"
            stroke={`url(#${uniqueId}-empty)`}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="butt"
            filter={`url(#${uniqueId}-shadow)`} />

          {/* Filled (red) arc */}
          <circle cx={cx} cy={cy} r={radius} fill="none"
            stroke={`url(#${uniqueId}-filled)`}
            strokeWidth={strokeWidth}
            strokeDasharray={`${filledLength} ${emptyLength}`}
            strokeDashoffset={0}
            strokeLinecap="butt"
            filter={`url(#${uniqueId}-shadow)`} />
        </svg>

        {/* Glass inner circle */}
        <div className="absolute rounded-full" style={{
          width: size - strokeWidth * 2 - 16,
          height: size - strokeWidth * 2 - 16,
          background: "radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.8) 0%, rgba(245,245,245,0.95) 60%)",
          boxShadow: "inset 0 2px 8px rgba(255,255,255,0.8), inset 0 -4px 12px rgba(0,0,0,0.08), 0 0 16px rgba(0,0,0,0.05)",
        }} />

        {/* Percentage text */}
        <div className="absolute z-10 flex flex-col items-center">
          <span className="text-5xl font-bold text-[#c0392b]" style={{
            textShadow: "0 0 12px rgba(192,57,43,0.1), 0 1px 2px rgba(0,0,0,0.08)"
          }}>
            {Math.round(currentPercent)}%
          </span>
          {label && <span className="text-sm font-medium uppercase tracking-wide mt-1 text-neutral-500">{label}</span>}
        </div>
      </div>
    </div>
  );
};

export default function WhyNarrowPage() {

  return (
    <div className="min-h-screen">
      <Navbar forceOpaque={true} darkMode={true} className="border-b border-white/10 bg-[#050505] backdrop-blur-md" />
      <main>


        {/* ═══ SCIENCE SECTION (Hidden Barrier) — LIGHT ═══ */}
        <section id="science-section" className="w-full bg-neutral-50 text-black flex flex-col items-center py-24 md:py-40">

          <div className="w-full max-w-[80rem] px-6">
            <div className="text-center mb-16">
              <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-4">The Data</p>
              <h2 className="font-serif text-4xl md:text-5xl tracking-tight leading-tight text-black">The Hidden Barrier</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <div className="text-center mb-8">
                  <span className="font-serif text-6xl font-bold block text-[#ff2d55]">87%</span>
                  <span className="font-sans text-xl font-medium text-neutral-600">of females</span>
                  <p className="font-sans text-sm text-neutral-500 max-w-[18rem] mx-auto mt-2 leading-relaxed">Have hand spans smaller than the 8.5 inch minimum that standard keyboards expect.</p>
                </div>
                <div className="bg-white border border-neutral-200 rounded-none p-8 flex flex-col items-center hover:border-neutral-400 transition-all">
                  <DonutChart percent={87} label="" theme="light" />
                  <div className="flex gap-6 text-xs font-medium text-neutral-500 mt-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ff2d55]"></div>Too small
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#34c759]"></div>Comfortable
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-center mb-8">
                  <span className="font-serif text-6xl font-bold block text-[#ff2d55]">24%</span>
                  <span className="font-sans text-xl font-medium text-neutral-600">of males</span>
                  <p className="font-sans text-sm text-neutral-500 max-w-[18rem] mx-auto mt-2 leading-relaxed">Also fall below the comfortable reach threshold for a standard 6.5 inch keyboard.</p>
                </div>
                <div className="bg-white border border-neutral-200 rounded-none p-8 flex flex-col items-center hover:border-neutral-400 transition-all">
                  <DonutChart percent={24} label="" theme="light" />
                  <div className="flex gap-6 text-xs font-medium text-neutral-500 mt-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ff2d55]"></div>Too small
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#34c759]"></div>Comfortable
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-16 pt-12 border-t border-neutral-200 grid md:grid-cols-2 gap-8">
              <div>
                <div className="font-serif text-5xl font-bold text-black">8.5&quot;</div>
                <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-500 block mt-2 mb-2">The Threshold</span>
                <p className="font-sans text-base text-neutral-600 leading-relaxed">Minimum hand span needed to play a conventional 6.5 inch keyboard from Yamaha or Steinway with real comfort.</p>
              </div>
              <div>
                <div className="font-serif text-5xl font-bold text-black">25-30%</div>
                <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-500 block mt-2 mb-2">Larger Reach Required</span>
                <p className="font-sans text-base text-neutral-600 leading-relaxed">Hand span often needs to be at least one quarter larger than the octave just to reach 8ths, 9ths, and 10ths without strain.</p>
              </div>
            </div>
          </div>

          {/* ═══ INLINE PDF HAND GUIDE ═══ */}
          <div className="w-full max-w-[80rem] px-6 mt-2">
            <InlineHandGuide />
          </div>
        </section>


        {/* ═══ CTA — LIGHT ═══ */}
        <section className="w-full bg-white text-black flex flex-col items-center pb-32 border-t border-neutral-200">
          <div className="w-full max-w-[80rem] px-6 text-center pt-24">
            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-4">Get Started</p>
            <h2 className="font-serif text-4xl md:text-5xl tracking-tight leading-tight text-black mb-8">Don&apos;t let your instrument hold you back.</h2>
            <a href="/customize" className="group inline-flex items-center justify-center gap-2 bg-black text-white px-8 py-4 font-sans text-xs uppercase tracking-widest transition-colors hover:bg-neutral-800">
              Configure Yours
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
            </a>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
