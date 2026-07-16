import React from "react";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import ProductSelectionFormLegacy from "@/components/checkout/ProductSelectionFormLegacy";
import TestimonialsSection from "@/components/checkout/TestimonialsSection";

export const metadata = {
    title: "Join the DreamPlay Founder's Circle | DreamPlay",
    description: "Secure guaranteed access to the lowest Super Early Bird price and receive exclusive rewards.",
};

export default function BuyProduct3Page() {
    return (
        <div className="page-wrapper bg-white font-sans text-neutral-900">
            <Navbar />

            <main>
                {/* --- Hero Section --- */}
                <section className="pt-32 pb-8 md:pt-40 md:pb-16 lg:pt-48">
                    <div className="container mx-auto px-6">
                        <div className="max-w-4xl mx-auto text-center">
                            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-8 animate-fade-in-up">
                                Be The First In Line
                            </h1>

                            <div className="relative w-full max-w-4xl mx-auto aspect-[16/9] md:aspect-[2/1] animate-fade-in-up delay-200">
                                <Image
                                    src="/images/keyboards/ds60-black-narrow-keys-piano.png"
                                    alt="DreamPlay One"
                                    fill
                                    className="object-contain transform scale-125"
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Benefits Section --- */}
                <section className="py-20 bg-white">
                    <div className="container mx-auto px-6">
                        <div className="max-w-5xl mx-auto">
                            <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 tracking-tight">
                                Founder&apos;s Circle Perks
                            </h2>

                            <div className="grid md:grid-cols-2 gap-x-12 gap-y-12">
                                {/* Benefit 1 */}
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 flex-shrink-0 relative mt-1">
                                        <Image src="/images/icons/Frame-85.svg" alt="Price Icon" fill className="object-contain" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-lg text-neutral-900 leading-snug">
                                            Discounts not available anywhere else (including up to $100 off the main price!)
                                        </p>
                                    </div>
                                </div>

                                {/* Benefit 2 */}
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 flex-shrink-0 relative mt-1">
                                        <Image src="/images/icons/Vector-6.svg" alt="Journal Icon" fill className="object-contain" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-lg text-neutral-900 leading-snug">
                                            The Founder&apos;s Journal (Insider Access)
                                        </p>
                                    </div>
                                </div>

                                {/* Benefit 3 */}
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 flex-shrink-0 relative mt-1">
                                        <Image src="/images/icons/Frame-84.svg" alt="Music Icon" fill className="object-contain" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-lg text-neutral-900 leading-snug">
                                            Instant Download of My Exclusive Sheet Music
                                        </p>
                                    </div>
                                </div>

                                {/* Benefit 4 */}
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 flex-shrink-0 relative mt-1">
                                        <Image src="/images/icons/Frame-82.svg" alt="Shipping Icon" fill className="object-contain" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-lg text-neutral-900 leading-snug">
                                            Priority Shipping - you will receive your keyboard earlier than anybody else
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>



                {/* --- Join Waitlist Section --- */}
                <section className="py-20 bg-neutral-50/50" id="rsv">
                    <div className="container mx-auto px-6">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-neutral-800">
                                Join The Waitlist & Receive The Best Price
                            </h2>

                            <ProductSelectionFormLegacy />
                        </div>
                    </div>
                </section>

                {/* --- Testimonials / Why We're Doing This --- */}
                <TestimonialsSection />
            </main>

            <Footer />
        </div>
    );
}
