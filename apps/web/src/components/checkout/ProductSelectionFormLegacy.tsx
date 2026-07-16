"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

interface ProductSelectionFormProps {
    className?: string;
}

export default function ProductSelectionFormLegacy({ className }: ProductSelectionFormProps) {
    const [selectedPiano, setSelectedPiano] = useState<string>("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [country, setCountry] = useState("Loading...");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Fetch country like in the original HTML
        fetch('https://ipapi.co/json/')
            .then(response => response.json())
            .then(data => {
                if (data.country_name) {
                    setCountry(data.country_name);
                } else {
                    setCountry("Unknown");
                }
            })
            .catch(error => {
                console.error('Error fetching country:', error);
                setCountry("Unknown"); // Fallback
            });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate submission delay or analytics tracking here if needed
        // For now, we just redirect to the Stripe URL as requested

        // Construct Stripe URL with prefilled email if possible, though the provided URL is a payment link
        // Standard Stripe Payment Links don't always accept params easily without configuration, 
        // but specific ones do. The user provided: https://buy.stripe.com/cNifZa4lh9k867Y1xtcMM00
        // We will standard redirect.

        // In a real app, we might want to save this data to Supabase/PostHog before redirecting.

        setTimeout(() => {
            window.location.href = "https://buy.stripe.com/cNifZa4lh9k867Y1xtcMM00?prefilled_email=" + encodeURIComponent(email);
        }, 500);
    };

    const pianoOptions = [
        {
            id: "DS-5.5-Black",
            value: "DS 5.5 - Black",
            label: "DS 5.5 - Black",
            image: "/images/Group-1.png",
        },
        {
            id: "DS-5.5-White",
            value: "DS 5.5 - White",
            label: "DS 5.5 - White",
            image: "/images/Group-2.png",
        },
        {
            id: "DS-6.0-Black",
            value: "DS 6.0 - Black",
            label: "DS 6.0 - Black",
            image: "/images/Group-3.png",
        },
        {
            id: "DS-6.0-White",
            value: "DS 6.0 - White",
            label: "DS 6.0 - White",
            image: "/images/Group-4.png",
        },
        {
            id: "Not-sure",
            value: "Not sure",
            label: "Not sure",
            image: "/images/Group-4-1.png",
        },
    ];

    return (
        <form onSubmit={handleSubmit} className={`w-full max-w-4xl mx-auto ${className}`}>
            {/* Country Field Hidden */}
            <div className="hidden">
                <input
                    type="text"
                    value={country}
                    readOnly
                    className="w-full"
                />
            </div>

            {/* Piano Selection - was commented out in the original */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
                {pianoOptions.map((option) => (
                    <label key={option.id} className="relative cursor-pointer group">
                        <input
                            type="radio"
                            name="Piano"
                            value={option.value}
                            checked={selectedPiano === option.value}
                            onChange={(e) => setSelectedPiano(e.target.value)}
                            className="peer sr-only"
                        />
                        <div className="p-2 border-2 border-transparent rounded-xl transition-all duration-200 peer-checked:border-black peer-checked:bg-neutral-50 hover:bg-neutral-50">
                            <div className="relative aspect-[3/4] w-full mb-3">
                                <Image
                                    src={option.image}
                                    alt={option.label}
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <div className="text-center">
                                <span className="text-xs font-medium text-neutral-600 peer-checked:text-black">{option.label}</span>
                            </div>
                        </div>
                    </label>
                ))}
            </div>

            <div className="bg-transparent mb-8">
                <div className="space-y-4 max-w-lg mx-auto">
                    <div>
                        <input
                            type="text"
                            id="fullName"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Full name"
                            className="w-full px-6 py-4 rounded-xl bg-neutral-100 border-transparent focus:bg-white focus:border-neutral-900 focus:ring-0 transition-all placeholder:text-neutral-500 font-medium"
                        />
                    </div>
                    <div>
                        <input
                            type="email"
                            id="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            className="w-full px-6 py-4 rounded-xl bg-neutral-100 border-transparent focus:bg-white focus:border-neutral-900 focus:ring-0 transition-all placeholder:text-neutral-500 font-medium"
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-6">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-black text-white px-12 py-4 rounded-full text-base font-semibold hover:bg-neutral-800 transition-all disabled:opacity-70 shadow-lg hover:shadow-xl w-full max-w-sm"
                >
                    {isSubmitting ? "Processing..." : "Join the Waitlist"}
                </button>

                <p className="text-center text-base text-neutral-600 font-medium">
                    100% Fully Refundable Deposit. Cancel Anytime.
                </p>
            </div>
        </form>
    );
}
