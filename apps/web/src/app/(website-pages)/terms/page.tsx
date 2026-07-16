import Link from "next/link"

export const metadata = {
    title: "Terms of Service – DreamPlay Pianos",
    description: "DreamPlay Pianos terms of service. The terms and conditions governing your use of our website and purchases.",
}

export default function TermsOfServicePage() {
    return (
        <div className="bg-[#050505] min-h-screen text-white">
            {/* Header */}
            <header className="border-b border-white/10">
                <div className="mx-auto max-w-3xl px-6 py-8">
                    <Link href="/" className="inline-block mb-6">
                        <img src="/images/logos/DreamPlay Logo White.png" alt="DreamPlay" className="h-5" />
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="mx-auto max-w-3xl px-6 py-16">
                <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/40 mb-4">Legal</p>
                <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-12">Terms of Service</h1>
                <p className="text-white/40 text-sm mb-12">Last updated: February 20, 2026</p>

                <div className="space-y-10 font-sans text-sm leading-relaxed text-white/70">
                    <section>
                        <h2 className="text-white text-lg font-semibold mb-3">1. Agreement to Terms</h2>
                        <p>
                            By accessing or using the DreamPlay Pianos website (&quot;dreamplaypianos.com&quot;) or purchasing any of our
                            products, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do
                            not use our website or services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-semibold mb-3">2. Products &amp; Pre-Orders</h2>
                        <p className="mb-3">
                            DreamPlay Pianos offers keyboard instruments through a pre-order and reservation model. By placing a
                            reservation or pre-order, you acknowledge and agree to the following:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Product specifications, images, and descriptions are subject to change as we finalize manufacturing.</li>
                            <li>Estimated delivery dates are approximate and may shift based on production schedules.</li>
                            <li>Pre-order pricing is a limited-time offer and may increase after the reservation window closes.</li>
                            <li>Your reservation secures your position in the production queue.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-semibold mb-3">3. Pricing &amp; Payments</h2>
                        <p className="mb-3">All prices are listed in US Dollars (USD) unless otherwise noted.</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Payment is processed securely via Stripe. We do not store your credit card information on our servers.</li>
                            <li>Applicable taxes and shipping fees will be calculated at checkout or prior to shipment.</li>
                            <li>For deposit-based reservations, the remaining balance will be charged before your order ships.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-semibold mb-3">4. Refund &amp; Cancellation Policy</h2>
                        <p className="mb-3">
                            We stand behind the quality of our instruments. Our refund policy is as follows:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong className="text-white/90">Pre-order cancellations:</strong> You may cancel your pre-order at any time before your instrument ships for a full refund.</li>
                            <li><strong className="text-white/90">Production guarantee:</strong> If we do not meet our production minimums or quality standards, you will receive a 100% refund automatically.</li>
                            <li><strong className="text-white/90">Post-delivery returns:</strong> If you are unsatisfied with your instrument after delivery, please contact us within 30 days to arrange a return. The instrument must be in its original condition and packaging.</li>
                            <li>Refunds will be processed to the original payment method within 5–10 business days.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-semibold mb-3">5. Shipping &amp; Delivery</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>We ship worldwide. Shipping costs and estimated delivery times will be communicated before shipment.</li>
                            <li>Risk of loss transfers to you upon delivery to the carrier.</li>
                            <li>DreamPlay Pianos is not responsible for delays caused by customs, weather, or other circumstances beyond our control.</li>
                            <li>Promotional credits, when offered, apply only to qualifying orders and products as specified.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-semibold mb-3">6. Intellectual Property</h2>
                        <p>
                            All content on this website — including text, images, logos, product designs, videos, and graphics — is
                            the property of DreamPlay Pianos and is protected by applicable intellectual property laws. You may not
                            reproduce, distribute, or create derivative works from our content without prior written consent.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-semibold mb-3">7. User Accounts</h2>
                        <p className="mb-3">
                            Certain features of our website may require you to create an account. By creating an account, you agree to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Provide accurate and complete information.</li>
                            <li>Maintain the security of your login credentials.</li>
                            <li>Accept responsibility for all activity that occurs under your account.</li>
                            <li>Notify us immediately of any unauthorized use of your account.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-semibold mb-3">8. Warranty</h2>
                        <p>
                            DreamPlay Pianos instruments come with a limited manufacturer&apos;s warranty covering defects in materials
                            and workmanship under normal use. The warranty does not cover damage caused by misuse, accidents, unauthorized
                            modifications, or normal wear and tear. Warranty details will be included with your instrument upon delivery.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-semibold mb-3">9. Limitation of Liability</h2>
                        <p>
                            To the maximum extent permitted by law, DreamPlay Pianos shall not be liable for any indirect, incidental,
                            special, consequential, or punitive damages arising from your use of our website or products. Our total
                            liability shall not exceed the amount you paid for the product in question.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-semibold mb-3">10. Governing Law</h2>
                        <p>
                            These Terms of Service are governed by the laws of the State of California, United States, without regard
                            to conflict of law principles. Any disputes arising from these terms shall be resolved in the courts
                            located in California.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-semibold mb-3">11. Changes to These Terms</h2>
                        <p>
                            We reserve the right to update these Terms of Service at any time. Changes will be posted on this page
                            with an updated &quot;Last updated&quot; date. Continued use of our website after changes constitutes
                            acceptance of the revised terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-semibold mb-3">12. Contact Us</h2>
                        <p>
                            If you have questions about these Terms of Service, please contact us at:
                        </p>
                        <p className="mt-3 text-white/90">
                            <strong>Email:</strong> support@dreamplaypianos.com
                        </p>
                    </section>
                </div>

                {/* Back link */}
                <div className="mt-16 pt-8 border-t border-white/10">
                    <Link href="/" className="text-white/40 hover:text-white text-xs font-sans uppercase tracking-widest transition-colors">
                        ← Back to DreamPlay
                    </Link>
                </div>
            </main>
        </div>
    )
}
