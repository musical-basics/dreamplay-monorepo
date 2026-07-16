"use client";
import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { subscribeToNewsletter } from "@/actions/email-actions";
import Link from "next/link";
import Image from "next/image";
import { WAITLIST_OFFER_BODY, WAITLIST_OFFER_HEADLINE, WAITLIST_OFFER_TAGS, WAITLIST_OFFER_TERMS } from "@/lib/waitlist-offer";

function InlineShippingCTA() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            const res = await subscribeToNewsletter({
                email,
                first_name: "",
                tags: WAITLIST_OFFER_TAGS,
            });
            if (!res.success) throw new Error(res.error || "Failed");
            localStorage.setItem("dp_user_email", email);
            if (res.id) localStorage.setItem("dp_subscriber_id", res.id);
            setIsDone(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section id="waitlist-offer" className="bg-[#0a0a0f] text-white py-20 border-y border-white/5">
            <div className="max-w-2xl mx-auto px-6 text-center reveal-el opacity-0 translate-y-8 transition-all duration-700">
                <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/40 mb-4">DreamPlay Waitlist</p>
                <h2 className="font-serif text-3xl md:text-4xl tracking-tight leading-tight text-white mb-4">
                    {WAITLIST_OFFER_HEADLINE}
                </h2>
                <p className="font-sans text-base text-white/50 leading-relaxed mb-10 max-w-lg mx-auto">
                    {WAITLIST_OFFER_BODY}
                </p>

                {!isDone ? (
                    <>
                        {error && (
                            <div className="mb-4 p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-sans">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                            <input
                                type="email"
                                required
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex-1 px-4 py-4 rounded-none border border-white/20 bg-transparent placeholder-white/30 text-white focus:ring-1 focus:ring-white focus:border-white outline-none transition-all font-sans text-sm"
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-white text-black font-sans text-xs uppercase tracking-widest font-bold px-6 py-4 rounded-none hover:bg-white/90 transition-colors disabled:opacity-70 cursor-pointer whitespace-nowrap"
                            >
                                {isLoading ? "..." : "Join Waitlist"}
                            </button>
                        </form>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mt-4">No spam. Unsubscribe anytime.</p>
                        <p className="text-[10px] text-white/30 leading-relaxed mt-3">{WAITLIST_OFFER_TERMS}</p>
                    </>
                ) : (
                    <div className="py-4">
                        <p className="text-lg font-serif text-white mb-2">Check your inbox.</p>
                        <p className="text-sm text-white/50">You&apos;re on the DreamPlay Waitlist. We&apos;ll email production updates and launch details.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
export default function ShippingPage() {
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('opacity-100', 'translate-y-0');
                    entry.target.classList.remove('opacity-0', 'translate-y-8');
                }
            });
        }, { threshold: 0.1 });

        const elements = document.querySelectorAll('.reveal-el');
        elements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    return (
        <div className="min-h-screen font-sans selection:bg-white/20">
            <Navbar forceOpaque={true} darkMode={true} className="border-b border-white/10 bg-[#050505] backdrop-blur-md" />

            <main>

                {/* ═══ REFUND POLICY — DARK ═══ */}
                <section className="bg-[#050505] text-white pt-32 pb-24">
                    <div className="max-w-4xl mx-auto px-6">
                        <div className="text-center mb-16 reveal-el opacity-0 translate-y-8 transition-all duration-700">
                            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-4">Zero Risk</p>
                            <h2 className="font-serif text-4xl md:text-5xl tracking-tight leading-tight text-white mb-6">Our Refund Promise</h2>
                            <p className="font-sans text-base text-white/60 max-w-2xl mx-auto leading-relaxed">
                                We are absolutely confident that you will love your DreamPlay One. Our refund policy reflects that confidence.
                            </p>
                        </div>

                        <div className="reveal-el opacity-0 translate-y-8 transition-all duration-700 delay-100 border border-white/10 bg-white/5 p-8 md:p-12 mb-8">
                            <div className="space-y-10">
                                <div className="flex gap-6 items-start">
                                    <div className="w-12 h-12 bg-white/10 rounded-none flex items-center justify-center flex-shrink-0 border border-white/10">
                                        <svg className="w-6 h-6 text-[#34c759]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    </div>
                                    <div>
                                        <h3 className="font-serif text-xl font-bold text-white mb-2">90-Day Full Refund</h3>
                                        <p className="font-sans text-sm text-white/60 leading-relaxed">
                                            If for any reason you are not completely satisfied with your DreamPlay One, return it within 90 days for a full refund — no questions asked. We want you to have plenty of time to experience the difference.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-6 items-start">
                                    <div className="w-12 h-12 bg-white/10 rounded-none flex items-center justify-center flex-shrink-0 border border-white/10">
                                        <svg className="w-6 h-6 text-[#34c759]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8 8-4-4m-4 4l4-4 4 4 8-8"></path></svg>
                                    </div>
                                    <div>
                                        <h3 className="font-serif text-xl font-bold text-white mb-2">Free Return Shipping</h3>
                                        <p className="font-sans text-sm text-white/60 leading-relaxed">
                                            We cover 100% of return shipping costs. You won&apos;t pay a cent to send it back. We believe in our product enough to take on that cost ourselves.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-6 items-start">
                                    <div className="w-12 h-12 bg-white/10 rounded-none flex items-center justify-center flex-shrink-0 border border-white/10">
                                        <svg className="w-6 h-6 text-[#34c759]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                                    </div>
                                    <div>
                                        <h3 className="font-serif text-xl font-bold text-white mb-2">Free Size Exchanges</h3>
                                        <p className="font-sans text-sm text-white/60 leading-relaxed">
                                            Not sure if the DS5.5 or DS6.0 is right for you? Try one, and if you decide you&apos;d prefer the other size, we&apos;ll exchange it for free — shipping included both ways.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="reveal-el opacity-0 translate-y-8 transition-all duration-700 delay-200 text-center border border-white/10 bg-white/[0.03] p-8">
                            <p className="font-serif text-lg md:text-xl text-white/80 italic leading-relaxed">
                                &ldquo;While we — and every small-handed pianist we know — love the narrower keyboard, we understand that trying something new takes a leap of faith. Our guarantee is designed to make that leap completely risk-free.&rdquo;
                            </p>
                            <p className="font-sans text-sm text-white/40 mt-4 uppercase tracking-wider">The DreamPlay Team</p>
                        </div>
                    </div>
                </section>

                {/* ═══ HERO — LIGHT ═══ */}
                <section className="bg-neutral-50 text-black pt-32 pb-20 overflow-hidden">
                    <div className="max-w-5xl mx-auto px-6 text-center">
                        <h1 className="font-serif text-4xl md:text-6xl tracking-tight leading-tight mb-12 reveal-el opacity-0 translate-y-8 transition-all duration-700">
                            <span className="text-black">Global Delivery.</span><br />
                            <span className="text-[#0066cc]">Discounted Shipping.</span>
                        </h1>

                        {/* World Map */}
                        <div className="max-w-4xl mx-auto mb-16 reveal-el opacity-0 translate-y-8 transition-all duration-700 delay-200">
                            <Image src="/images/stock/Worldmap.png" alt="World map showing DreamPlay piano shipping regions across US, Europe, and Asia" width={1200} height={600} className="w-full h-auto object-contain" />
                        </div>

                        {/* Map Legend */}
                        <div className="flex flex-wrap justify-center gap-8 mb-16 reveal-el opacity-0 translate-y-8 transition-all duration-700 delay-200">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-[#2F80ED]"></div>
                                <span className="text-sm font-medium text-neutral-500">Main</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-[#00C2CB]"></div>
                                <span className="text-sm font-medium text-neutral-500">Extended Region</span>
                            </div>
                        </div>

                        <p className="font-sans text-lg text-neutral-500 max-w-xl mx-auto mb-12 reveal-el opacity-0 translate-y-8 transition-all duration-700 delay-300">
                            Subsidized delivery to the US, Canada, and Europe. Extended shipping available worldwide.
                        </p>

                        {/* Price Stats */}
                        <div className="flex flex-wrap justify-center gap-8 md:gap-16 reveal-el opacity-0 translate-y-8 transition-all duration-700 delay-300">
                            <div className="text-center">
                                <div className="font-serif text-5xl font-bold text-black">Under $40</div>
                                <div className="text-sm text-neutral-500 mt-2">US &amp; Europe</div>
                            </div>
                            <div className="hidden md:block w-px bg-neutral-300 h-16"></div>
                            <div className="text-center">
                                <div className="font-serif text-5xl font-bold text-black">+$70</div>
                                <div className="text-sm text-neutral-500 mt-2">Extended Regions</div>
                            </div>
                            <div className="hidden md:block w-px bg-neutral-300 h-16"></div>
                            <div className="text-center">
                                <div className="font-serif text-5xl font-bold text-black">$150</div>
                                <div className="text-sm text-neutral-500 mt-2">Rest of World</div>
                            </div>
                        </div>

                        {/* Global Tax Notice */}
                        <div className="mt-8 max-w-2xl mx-auto text-center reveal-el opacity-0 translate-y-8 transition-all duration-700 delay-300">
                            <div className="bg-neutral-100 border border-neutral-200 rounded-none p-5 inline-block text-left">
                                <p className="text-sm text-neutral-800 font-bold mb-2">
                                    ℹ️ Note on Import Duties & Taxes
                                </p>
                                <p className="text-xs text-neutral-600 leading-relaxed max-w-lg">
                                    Due to shifting global trade policies, standard government import duties and local taxes (like VAT) are calculated closer to the shipping date. For a seamless experience, we ship DDP (Delivered Duty Paid) — meaning we prepay and handle all customs clearance on your behalf, so you never deal with a carrier demanding fees at your door. This applies to all shipping regions including the US, UK, EU, Australia, and Japan. We will invoice you for the exact duty/tax amount before fulfillment, ensuring a smooth, surprise-free delivery.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ SHIPPING ZONES — DARK ═══ */}
                <section className="bg-[#050505] text-white py-24">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-20 reveal-el opacity-0 translate-y-8 transition-all duration-700">
                            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#0066cc] mb-4 font-semibold">Shipping Zones</p>
                            <h2 className="font-serif text-4xl md:text-5xl tracking-tight leading-tight text-white">We ship to over 50 countries</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Discounted */}
                            <div className="reveal-el opacity-0 translate-y-8 transition-all duration-700 delay-100 border border-white/10 bg-white/5 rounded-none p-8 hover:border-white/20 transition-all">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#2F80ED]"></div>
                                        <span className="text-xs uppercase tracking-wider text-white/50">Main</span>
                                    </div>
                                </div>
                                <div className="font-serif text-5xl font-bold mb-2 text-white">Under $40</div>
                                <p className="text-white/40 text-sm mb-8">Estimated Shipping July 2026</p>
                                <div className="space-y-3">
                                    {['Austria', 'Belgium', 'Canada', 'Denmark', 'Finland', 'France', 'Germany', 'Ireland', 'Netherlands', 'UK', 'US (Continental)'].map(c => (
                                        <div key={c} className="flex items-center gap-3 text-sm text-white/60"><span className="text-[#2F80ED]">✓</span> {c}</div>
                                    ))}
                                </div>
                            </div>

                            {/* Extended */}
                            <div className="reveal-el opacity-0 translate-y-8 transition-all duration-700 delay-200 border border-white/10 bg-white/5 rounded-none p-8 hover:border-white/20 transition-all">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#00C2CB]"></div>
                                        <span className="text-xs uppercase tracking-wider text-white/50">Extended</span>
                                    </div>
                                </div>
                                <div className="font-serif text-5xl font-bold mb-2 text-white">$50–$70</div>
                                <p className="text-white/40 text-sm mb-8">Estimated Shipping October 2026</p>
                                <div className="space-y-3">
                                    {['Australia', 'China', 'Japan', 'South Korea', 'New Zealand', 'Singapore', 'Switzerland', 'Taiwan', 'Hawaii (US)'].map(c => (
                                        <div key={c} className="flex items-center gap-3 text-sm text-white/60"><span className="text-[#00C2CB]">✓</span> {c}</div>
                                    ))}
                                </div>
                            </div>

                            {/* Standard */}
                            <div className="reveal-el opacity-0 translate-y-8 transition-all duration-700 delay-300 border border-white/10 bg-white/5 rounded-none p-8 hover:border-white/20 transition-all">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-white/40"></div>
                                        <span className="text-xs uppercase tracking-wider text-white/50">Standard</span>
                                    </div>
                                </div>
                                <div className="font-serif text-5xl font-bold mb-2 text-white">$150</div>
                                <p className="text-white/40 text-sm mb-8">Estimated Shipping October 2026</p>
                                <div className="space-y-3">
                                    {['Brazil', 'India', 'Mexico', 'UAE', 'Saudi Arabia', 'Turkey', 'Argentina', 'Egypt'].map(c => (
                                        <div key={c} className="flex items-center gap-3 text-sm text-white/60"><span className="text-white/40">✓</span> {c}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ INLINE VIP SHIPPING CTA — DARK ACCENT ═══ */}
                <InlineShippingCTA />

                {/* ═══ PACKAGING — LIGHT ═══ */}
                <section className="bg-white text-black py-24">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div className="reveal-el opacity-0 translate-y-8 transition-all duration-700">
                                <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#0066cc] mb-4 font-semibold">Premium Protection</p>
                                <h2 className="font-serif text-4xl md:text-5xl tracking-tight leading-tight text-black mb-6">Packaged with Care</h2>
                                <p className="font-sans text-base text-neutral-600 leading-relaxed mb-10">
                                    Every DreamPlay One is carefully packaged in custom-designed protective casing to ensure it arrives in perfect condition, no matter where you are in the world.
                                </p>
                                <div className="space-y-8">
                                    {[
                                        { title: 'Custom Foam Inserts', desc: 'Precision-cut protection for every component' },
                                        { title: 'Double-Wall Boxing', desc: 'Extra durability for long-distance shipping' },
                                        { title: 'Insured Delivery', desc: 'Full coverage throughout the journey' }
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="w-10 h-10 rounded-none border border-neutral-200 bg-neutral-50 flex items-center justify-center flex-shrink-0 text-[#0066cc]">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                            </div>
                                            <div>
                                                <h3 className="font-sans font-bold text-black text-lg">{item.title}</h3>
                                                <p className="font-sans text-sm text-neutral-500">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="reveal-el opacity-0 translate-y-8 transition-all duration-700 delay-200">
                                <div className="border border-neutral-200 overflow-hidden bg-neutral-50">
                                    <Image src="/images/accessories/piano-in-the-box.png" alt="DreamPlay One digital piano in protective packaging with custom foam inserts" width={600} height={600} className="w-full aspect-square object-cover scale-110" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ SHIPPING BOX SPECIFICATIONS — DARK ═══ */}
                <section className="bg-[#050505] text-white py-24 border-t border-white/10">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="text-center mb-16 reveal-el opacity-0 translate-y-8 transition-all duration-700">
                            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#0066cc] mb-4 font-semibold">Shipping Logistics</p>
                            <h2 className="font-serif text-4xl md:text-5xl tracking-tight leading-tight text-white mb-6">Shipping Box Specifications</h2>
                            <p className="font-sans text-base text-white/50 max-w-2xl mx-auto leading-relaxed">
                                Based on the DreamPlay One&apos;s chassis dimensions (48.27&quot; × 11.65&quot; × 5.9&quot;), here are the estimated shipping box dimensions and weights.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 mb-16">
                            {/* Box Dimensions Card */}
                            <div className="reveal-el opacity-0 translate-y-8 transition-all duration-700 delay-100 border border-white/10 bg-white/5 p-8 md:p-10">
                                <h3 className="font-serif text-2xl text-white mb-6">Estimated Box Dimensions</h3>
                                <div className="space-y-5">
                                    {[
                                        { label: 'Length', value: '57" – 59"', metric: '(145 – 150 cm)' },
                                        { label: 'Width (Depth)', value: '15" – 17"', metric: '(38 – 43 cm)' },
                                        { label: 'Height', value: '9" – 11"', metric: '(23 – 28 cm)' },
                                    ].map((d) => (
                                        <div key={d.label} className="flex justify-between items-center border-b border-white/10 pb-4">
                                            <span className="font-sans text-sm text-white/60">{d.label}</span>
                                            <div className="text-right">
                                                <span className="font-mono text-base text-white font-medium">{d.value}</span>
                                                <span className="font-sans text-xs text-white/40 ml-2">{d.metric}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Shipping Weight Card */}
                            <div className="reveal-el opacity-0 translate-y-8 transition-all duration-700 delay-200 border border-white/10 bg-white/5 p-8 md:p-10">
                                <h3 className="font-serif text-2xl text-white mb-6">Estimated Shipping Weight</h3>
                                <div className="space-y-5">
                                    {[
                                        { label: 'Keyboard', value: '25 – 30 lbs', metric: '(11 – 14 kg)' },
                                        { label: 'Accessories', value: '2 – 3 lbs', metric: '(1 – 1.4 kg)' },
                                        { label: 'Packaging Materials', value: '4 – 6 lbs', metric: '(1.8 – 2.7 kg)' },
                                    ].map((d) => (
                                        <div key={d.label} className="flex justify-between items-center border-b border-white/10 pb-4">
                                            <span className="font-sans text-sm text-white/60">{d.label}</span>
                                            <div className="text-right">
                                                <span className="font-mono text-base text-white font-medium">{d.value}</span>
                                                <span className="font-sans text-xs text-white/40 ml-2">{d.metric}</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="font-sans text-sm text-[#0066cc] font-bold">Total Shipping Weight</span>
                                        <div className="text-right">
                                            <span className="font-mono text-lg text-[#0066cc] font-bold">31 – 39 lbs</span>
                                            <span className="font-sans text-xs text-white/40 ml-2">(14 – 18 kg)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Why So Large? */}
                        <div className="reveal-el opacity-0 translate-y-8 transition-all duration-700 delay-300 border border-white/10 bg-white/[0.03] p-8 md:p-12">
                            <h3 className="font-serif text-2xl text-white mb-8">Why the box needs to be this large</h3>
                            <div className="grid md:grid-cols-3 gap-8">
                                <div>
                                    <div className="w-10 h-10 bg-white/10 flex items-center justify-center mb-4 border border-white/10">
                                        <svg className="w-5 h-5 text-[#0066cc]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                                    </div>
                                    <h4 className="font-sans font-bold text-white text-sm uppercase tracking-wider mb-3">Edge &amp; Corner Protection</h4>
                                    <p className="font-sans text-sm text-white/50 leading-relaxed">
                                        2–3 inches of dense EPS foam or custom cardboard inserts surround every side, especially the corners. Without this crush space, a drop during transit could crack the chassis.
                                    </p>
                                </div>
                                <div>
                                    <div className="w-10 h-10 bg-white/10 flex items-center justify-center mb-4 border border-white/10">
                                        <svg className="w-5 h-5 text-[#0066cc]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                    </div>
                                    <h4 className="font-sans font-bold text-white text-sm uppercase tracking-wider mb-3">Accessory Space</h4>
                                    <p className="font-sans text-sm text-white/50 leading-relaxed">
                                        The power supply, sustain pedal, music rest, and manual are packed alongside the keyboard. The music rest lays flat on top, while pedals and cables nestle into hollowed foam sections at each end.
                                    </p>
                                </div>
                                <div>
                                    <div className="w-10 h-10 bg-white/10 flex items-center justify-center mb-4 border border-white/10">
                                        <svg className="w-5 h-5 text-[#0066cc]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                                    </div>
                                    <h4 className="font-sans font-bold text-white text-sm uppercase tracking-wider mb-3">Double-Wall Cardboard</h4>
                                    <p className="font-sans text-sm text-white/50 leading-relaxed">
                                        For a 30 lb item of this length, single-wall cardboard would buckle during transit. Double-wall corrugated board adds about half an inch to exterior dimensions but ensures the box survives the journey.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ PRODUCT AVAILABILITY — DARK ═══ */}
                <section className="bg-[#050505] text-white py-24">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16 reveal-el opacity-0 translate-y-8 transition-all duration-700">
                            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-4">Coming Soon</p>
                            <h2 className="font-serif text-4xl md:text-5xl tracking-tight leading-tight text-white">Product Availability</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {/* DS5.5 */}
                            <div className="reveal-el opacity-0 translate-y-8 transition-all duration-700 delay-100 border border-white/10 bg-white/5 rounded-none p-8 hover:border-white/20 transition-all">
                                <div className="aspect-[4/3] bg-[#0a0a0a] rounded-none mb-6 flex items-center justify-center p-4">
                                    <Image src="/images/icons/Group-2.png" alt="DreamPlay DS5.5 narrow keys piano for small hands" width={400} height={300} className="max-h-full object-contain" />
                                </div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-serif text-2xl font-bold">DS5.5</h3>
                                    <div className="text-right">
                                        <div className="text-[10px] uppercase tracking-wider text-white/50">Ships</div>
                                        <div className="font-sans font-medium text-sm">October 2026</div>
                                    </div>
                                </div>
                                <p className="text-white/50 text-sm border-t border-white/10 pt-4 mt-4">Zone A: Smaller Hands</p>
                            </div>

                            {/* DS6.0 */}
                            <div className="reveal-el opacity-0 translate-y-8 transition-all duration-700 delay-200 border border-white/10 bg-white/5 rounded-none p-8 hover:border-white/20 transition-all">
                                <div className="aspect-[4/3] bg-[#0a0a0a] rounded-none mb-6 flex items-center justify-center p-4">
                                    <Image src="/images/icons/Group-3.png" alt="DreamPlay DS6.0 ergonomic piano keyboard" width={400} height={300} className="max-h-full object-contain" />
                                </div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-serif text-2xl font-bold">DS6.0</h3>
                                    <div className="text-right">
                                        <div className="text-[10px] uppercase tracking-wider text-white/50">Ships</div>
                                        <div className="font-sans font-medium text-sm">October 2026</div>
                                    </div>
                                </div>
                                <p className="text-white/50 text-sm border-t border-white/10 pt-4 mt-4">Zone B: Medium Hands</p>
                            </div>

                            {/* DS6.5 */}
                            <div className="reveal-el opacity-0 translate-y-8 transition-all duration-700 delay-300 border border-white/10 bg-white/5 rounded-none p-8 hover:border-white/20 transition-all">
                                <div className="aspect-[4/3] bg-[#0a0a0a] rounded-none mb-6 flex items-center justify-center p-4">
                                    <Image src="/images/keyboards/ds65-black-standard-digital-piano.png" alt="DreamPlay DS6.5 standard size digital piano" width={400} height={300} className="max-h-full object-contain" />
                                </div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-serif text-2xl font-bold">DS6.5</h3>
                                    <div className="text-right">
                                        <div className="text-[10px] uppercase tracking-wider text-white/50">Ships</div>
                                        <div className="font-sans font-medium text-[#0066cc] text-sm">October 2026</div>
                                    </div>
                                </div>
                                <p className="text-white/50 text-sm border-t border-white/10 pt-4 mt-4">Zone C: Standard Size</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ PAYMENT & POLICIES — LIGHT ═══ */}
                <section className="bg-neutral-50 text-black py-24">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="text-center mb-16 reveal-el opacity-0 translate-y-8 transition-all duration-700">
                            <h2 className="font-serif text-4xl md:text-5xl tracking-tight leading-tight text-black">Payment &amp; Policies</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { title: 'Make Changes Anytime', desc: 'At any point before we ship out the keyboard, you may modify or cancel your reservation.', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
                                { title: 'Duties & Taxes', desc: 'Standard import duties and local taxes are not included in the initial pre-order price. To provide the most accurate rates, these will be calculated and invoiced securely right before your order ships.', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                                { title: '90-Day Returns', desc: 'No questions asked, full refund within 90 days of receiving your instrument.', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' }
                            ].map((item, i) => (
                                <div key={i} className={`reveal-el opacity-0 translate-y-8 transition-all duration-700 border border-neutral-200 bg-white rounded-none p-8 hover:border-neutral-400 transition-all`} style={{ transitionDelay: `${(i + 1) * 100}ms` }}>
                                    <div className="w-12 h-12 bg-neutral-100 rounded-none flex items-center justify-center text-[#0066cc] mb-6 border border-neutral-200">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path></svg>
                                    </div>
                                    <h3 className="font-serif text-xl font-bold text-black mb-3">{item.title}</h3>
                                    <p className="font-sans text-sm text-neutral-500 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>


                {/* ═══ CTA — DARK ═══ */}
                <section className="bg-[#050505] text-white py-32 border-t border-white/10 text-center">
                    <div className="max-w-3xl mx-auto px-6 reveal-el opacity-0 translate-y-8 transition-all duration-700">
                        <h2 className="font-serif text-3xl md:text-4xl tracking-tight leading-tight mb-6 text-white">Ready to order your DreamPlay One?</h2>
                        <p className="font-sans text-base text-white/60 mb-10 max-w-xl mx-auto leading-relaxed">
                            Secure your pre-order today and be among the first to experience the future of piano.
                        </p>
                        <Link href="/customize" className="group inline-flex items-center justify-center gap-2 border border-white bg-white px-8 py-4 font-sans text-xs uppercase tracking-widest text-black transition-colors hover:bg-white/90">
                            Configure Yours
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                        </Link>
                    </div>
                </section>

            </main>
            <Footer />
        </div>
    );
}
