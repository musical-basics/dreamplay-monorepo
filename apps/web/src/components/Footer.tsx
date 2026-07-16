"use client";
import React, { useState } from "react";
import Link from "next/link";
import { subscribeToNewsletter } from "@/actions/email-actions";
import { WAITLIST_OFFER_BODY, WAITLIST_OFFER_HEADLINE, WAITLIST_OFFER_TAGS, WAITLIST_OFFER_TERMS } from "@/lib/waitlist-offer";

export default function Footer() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const links = [
    { text: "How It Works", href: "/how-it-works" },
    { text: "The Benefits", href: "/better-practice" },
    { text: "Our Story", href: "/our-story" },
    { text: "Production Timeline", href: "/production-timeline" },
    { text: "FAQ", href: "/information-and-policies/faq" },
    { text: "Shipping & Refunds", href: "/information-and-policies/shipping" },
    { text: "Contact Us", href: "/contact" },
    { text: "Blog", href: "https://blog.dreamplaypianos.com/blog" },
  ];

  const midPoint = Math.ceil(links.length / 2);
  const leftLinks = links.slice(0, midPoint);
  const rightLinks = links.slice(midPoint);

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("EMAIL") as HTMLInputElement).value;
    const fname = (form.elements.namedItem("FNAME") as HTMLInputElement).value;

    try {
      const res = await subscribeToNewsletter({
        email: email,
        first_name: fname,
        tags: ["Footer Form", ...WAITLIST_OFFER_TAGS]
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      setSuccess(true);
      localStorage.setItem("dp_user_email", email);
      if (res.id) localStorage.setItem("dp_subscriber_id", res.id);
      alert("You're on the DreamPlay Waitlist. We'll send updates by email.");

    } catch (error) {
      console.error("Subscription failed", error);
      alert("Something went wrong. Please try again.");
    }

    setLoading(false);

    setTimeout(() => {
      setSuccess(false);
      form.reset();
    }, 2000);
  };

  return (
    <footer className="relative overflow-hidden bg-[#050505] border-t border-white/[0.06]" style={{ fontFamily: "'Manrope', sans-serif" }}>
      {/* Subtle radial glow */}
      <div className="absolute -top-[40%] -right-[5%] w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(255,255,255,0.015)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-[5%] pt-24 pb-16">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.6fr_1.4fr] gap-12 md:gap-16">

          {/* Column 1: Brand */}
          <div>
            <Link href="/" className="inline-block mb-8">
              <img src="/images/logos/Logo.svg" alt="DreamPlay Logo" className="h-7 w-auto opacity-90" />
            </Link>
            <p className="text-[13px] leading-[1.8] text-white/[0.35] max-w-[280px] tracking-[0.01em] mb-8">
              Pianos designed for the human hand. Experience the joy of possibility without the strain.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 border border-white/[0.08] flex items-center justify-center text-white/30 transition-all duration-300 hover:text-white/80 hover:border-white/25" aria-label="Instagram">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.645.069 1.645.069 4.85s-.012 3.584-.069 4.85c-.148 3.252-1.667 4.771-4.919 4.919-1.266.058-1.644.069-4.85.069s-3.584-.012-4.85-.069c-3.252-.148-4.771-1.667-4.919-4.919-.058-1.265-.069-1.644-.069-4.85s.012-3.584.069-4.85c.148-3.252 1.667-4.771 4.919-4.919 1.265-.058 1.644-.069 4.85-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.073-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
                </svg>
              </a>
              <a href="#" className="w-9 h-9 border border-white/[0.08] flex items-center justify-center text-white/30 transition-all duration-300 hover:text-white/80 hover:border-white/25" aria-label="YouTube">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path>
                </svg>
              </a>
              <a href="#" className="w-9 h-9 border border-white/[0.08] flex items-center justify-center text-white/30 transition-all duration-300 hover:text-white/80 hover:border-white/25" aria-label="X (Twitter)">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"></path>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-normal mb-8">Explore</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-0">
              <ul className="list-none p-0 m-0 flex flex-col gap-5">
                {leftLinks.map((link, i) => (
                  <li key={i}>
                    {link.href.startsWith("http") ? (
                      <a href={link.href} className="text-white/50 text-[13px] tracking-[0.02em] no-underline transition-colors duration-300 hover:text-white/90">{link.text}</a>
                    ) : (
                      <Link href={link.href} className="text-white/50 text-[13px] tracking-[0.02em] no-underline transition-colors duration-300 hover:text-white/90">{link.text}</Link>
                    )}
                  </li>
                ))}
              </ul>
              <ul className="list-none p-0 m-0 flex flex-col gap-5">
                {rightLinks.map((link, i) => (
                  <li key={i}>
                    {link.href.startsWith("http") ? (
                      <a href={link.href} className="text-white/50 text-[13px] tracking-[0.02em] no-underline transition-colors duration-300 hover:text-white/90">{link.text}</a>
                    ) : (
                      <Link href={link.href} className="text-white/50 text-[13px] tracking-[0.02em] no-underline transition-colors duration-300 hover:text-white/90">{link.text}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 3: Waitlist Glass Card */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-10 transition-colors duration-300 hover:border-white/[0.15]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-normal mt-0 mb-4">DreamPlay Waitlist</p>
            <h2 className="font-serif text-2xl leading-tight text-white mb-4">{WAITLIST_OFFER_HEADLINE}</h2>
            <p className="text-[13px] leading-[1.7] text-white/[0.45] mb-0">{WAITLIST_OFFER_BODY}</p>
            <form onSubmit={handleSubscribe}>
              <div className="mt-5">
                <input type="text" name="FNAME" id="footer-fname" placeholder="First Name" required
                  className="w-full py-3.5 px-4 bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder-white/20 outline-none transition-colors duration-300 focus:border-white/30" style={{ fontFamily: "'Manrope', sans-serif" }} />
              </div>
              <div className="relative mt-3 flex flex-col gap-3 sm:block">
                <input type="email" name="EMAIL" id="footer-email" placeholder="email@address.com" required
                  className="w-full py-3.5 px-4 sm:pr-[138px] bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder-white/20 outline-none transition-colors duration-300 focus:border-white/30" style={{ fontFamily: "'Manrope', sans-serif" }} />
                <button type="submit" id="footer-submit-btn" disabled={loading}
                  className="w-full bg-white px-5 py-3.5 text-black border-none font-bold text-[10px] tracking-[0.15em] uppercase cursor-pointer transition-all duration-300 hover:bg-white/90 sm:absolute sm:right-1 sm:top-1 sm:bottom-1 sm:w-auto sm:py-0" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  {loading ? "..." : success ? "✓" : "Join Waitlist"}
                </button>
              </div>
              <p className="mt-4 text-[10px] leading-relaxed text-white/30">{WAITLIST_OFFER_TERMS}</p>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-[1200px] mx-auto mt-20 pt-8 border-t border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-5 text-[11px] tracking-[0.05em] text-white/20">
          <div>© 2026 DreamPlay Pianos. All rights reserved.</div>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-white/20 no-underline transition-colors duration-200 hover:text-white/50 text-[11px] tracking-[0.05em]">Privacy Policy</Link>
            <Link href="/terms" className="text-white/20 no-underline transition-colors duration-200 hover:text-white/50 text-[11px] tracking-[0.05em]">Terms of Service</Link>
            <Link href="#" className="text-white/20 no-underline transition-colors duration-200 hover:text-white/50 text-[11px] tracking-[0.05em]">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
