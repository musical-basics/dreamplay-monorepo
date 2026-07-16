"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { submitContactForm } from "@/actions/email-actions";

export default function ContactPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // Pre-fill from localStorage if available. localStorage is only
        // readable client-side, so this must happen in a mount effect.
        const savedEmail = localStorage.getItem("dp_user_email");
        const savedName = localStorage.getItem("dp_user_first_name");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (savedEmail) setEmail(savedEmail);
        if (savedName) setName(savedName);
    }, []);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            const result = await submitContactForm({ name, email, subject, message });
            if (!result.success) {
                throw new Error(result.error || "Failed to send message");
            }
            setIsSubmitted(true);
        } catch (err: unknown) {
            setError(err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen font-sans selection:bg-white/20">
            <Navbar forceOpaque={true} darkMode={true} className="border-b border-white/10 bg-[#050505] backdrop-blur-md" />

            <main>
                {/* Hero */}
                <section className="bg-[#050505] text-white pt-32 pb-20">
                    <div className="max-w-3xl mx-auto px-6 text-center">
                        <div className="reveal-el opacity-0 translate-y-8 transition-all duration-700">
                            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 mb-4">Get In Touch</p>
                            <h1 className="font-serif text-4xl md:text-6xl tracking-tight leading-tight text-white mb-6">
                                Contact Us
                            </h1>
                            <p className="font-sans text-base text-white/60 max-w-xl mx-auto leading-relaxed">
                                Have a question about DreamPlay, our keyboards, or your order? We&apos;d love to hear from you.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Contact Form */}
                <section className="bg-neutral-50 text-black py-20">
                    <div className="max-w-2xl mx-auto px-6">
                        {isSubmitted ? (
                            <div className="text-center py-16">
                                <div className="mx-auto w-16 h-16 bg-green-50 border border-green-200 flex items-center justify-center mb-6">
                                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                                </div>
                                <h2 className="font-serif text-3xl text-neutral-900 mb-4">Message Sent</h2>
                                <p className="font-sans text-base text-neutral-500 leading-relaxed max-w-md mx-auto">
                                    Thank you for reaching out. We typically respond within 24–48 hours.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                {error && (
                                    <div className="mb-6 p-4 border border-red-200 bg-red-50 text-red-700 text-sm font-sans">
                                        {error}
                                    </div>
                                )}

                                <div className="grid gap-6 md:grid-cols-2 mb-6">
                                    <div>
                                        <label className="block font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-2">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Your name"
                                            className="w-full px-4 py-3 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:border-black focus:ring-0 outline-none font-sans text-sm transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@email.com"
                                            className="w-full px-4 py-3 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:border-black focus:ring-0 outline-none font-sans text-sm transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-2">
                                        Subject
                                    </label>
                                    <select
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 border border-neutral-300 bg-white text-neutral-900 focus:border-black focus:ring-0 outline-none font-sans text-sm transition-colors appearance-none cursor-pointer"
                                    >
                                        <option value="">Select a topic</option>
                                        <option value="Pre-Order Question">Pre-Order Question</option>
                                        <option value="Sizing Help">Sizing Help</option>
                                        <option value="Shipping Inquiry">Shipping Inquiry</option>
                                        <option value="Technical Question">Technical Question</option>
                                        <option value="Partnership / Press">Partnership / Press</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="mb-8">
                                    <label className="block font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        required
                                        rows={6}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Tell us how we can help..."
                                        className="w-full px-4 py-3 border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:border-black focus:ring-0 outline-none font-sans text-sm transition-colors resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full flex items-center justify-center gap-2 bg-black text-white font-sans text-xs uppercase tracking-widest font-bold py-4 hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            Send Message
                                            <Send className="w-3 h-3" />
                                        </>
                                    )}
                                </button>

                                <p className="text-center text-neutral-400 font-sans text-[10px] uppercase tracking-widest mt-4">
                                    We typically respond within 24–48 hours
                                </p>
                            </form>
                        )}
                    </div>
                </section>

                {/* Additional Contact Info */}
                <section className="bg-[#050505] text-white py-20 border-t border-white/5">
                    <div className="max-w-4xl mx-auto px-6">
                        <div className="grid md:grid-cols-3 gap-8 text-center reveal-el opacity-0 translate-y-8 transition-all duration-700">
                            <div className="border border-white/10 bg-white/5 p-8">
                                <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/40 mb-3">Email</p>
                                <a href="mailto:hello@dreamplaypianos.com" className="font-sans text-sm text-white/80 hover:text-white transition-colors">
                                    hello@dreamplaypianos.com
                                </a>
                            </div>
                            <div className="border border-white/10 bg-white/5 p-8">
                                <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/40 mb-3">Social</p>
                                <a href="https://www.instagram.com/dreamplaypianos" target="_blank" rel="noopener noreferrer" className="font-sans text-sm text-white/80 hover:text-white transition-colors">
                                    @dreamplaypianos
                                </a>
                            </div>
                            <div className="border border-white/10 bg-white/5 p-8">
                                <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/40 mb-3">Response Time</p>
                                <p className="font-sans text-sm text-white/80">24–48 hours</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
