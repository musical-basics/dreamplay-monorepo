import Link from "next/link"

export const metadata = {
    title: "Privacy Policy – DreamPlay Pianos",
    description: "DreamPlay Pianos privacy policy. How we collect, use, and protect your personal information.",
}

export default function PrivacyPolicyPage() {
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
                <h1 className="font-serif text-4xl md:text-5xl tracking-tight mb-12">Privacy Policy</h1>
                <p className="text-white/40 text-sm mb-12">Last updated: February 20, 2026</p>

                <div className="space-y-10 font-sans text-sm leading-relaxed text-white/70">
                    <section>
                        <h2 className="text-white text-lg font-semibold mb-3">1. Introduction</h2>
                        <p>
                            DreamPlay Pianos (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy and is committed to protecting your personal information.
                            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website
                            at <strong>dreamplaypianos.com</strong> or make a purchase from us.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-semibold mb-3">2. Information We Collect</h2>
                        <p className="mb-3">We may collect the following types of information:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong className="text-white/90">Personal Information:</strong> Name, email address, shipping address, and payment details when you place an order, join a waitlist, or opt into marketing updates.</li>
                            <li><strong className="text-white/90">Usage Data:</strong> Pages visited, time spent on site, browser type, device type, and referring URL.</li>
                            <li><strong className="text-white/90">Cookies &amp; Analytics:</strong> We use first-party cookies and analytics tools to understand how visitors interact with our site.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-semibold mb-3">3. How We Use Your Information</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>To process and fulfill your orders.</li>
                            <li>To send you order confirmations, shipping updates, and receipts.</li>
                            <li>To send marketing emails if you have opted in (you can unsubscribe at any time).</li>
                            <li>To improve our website, products, and customer experience.</li>
                            <li>To detect and prevent fraud.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-semibold mb-3">4. Sharing Your Information</h2>
                        <p>
                            We do not sell your personal information. We may share your data with trusted third-party service providers
                            who assist us in operating our website, processing payments, and delivering products. These providers are
                            contractually obligated to protect your information and use it only for the purposes we specify.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-semibold mb-3">5. Data Security</h2>
                        <p>
                            We implement industry-standard security measures to protect your personal information, including SSL encryption
                            for data transmission and secure payment processing through Stripe. However, no method of transmission over the
                            Internet is 100% secure, and we cannot guarantee absolute security.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-semibold mb-3">6. Your Rights</h2>
                        <p className="mb-3">You have the right to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Access the personal data we hold about you.</li>
                            <li>Request correction of inaccurate data.</li>
                            <li>Request deletion of your data.</li>
                            <li>Unsubscribe from marketing communications at any time.</li>
                            <li>Opt out of analytics tracking.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-semibold mb-3">7. Cookies</h2>
                        <p>
                            Our site uses cookies to remember your preferences and understand site usage. You can control cookie settings
                            through your browser. Disabling cookies may limit some features of the site.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-semibold mb-3">8. Third-Party Links</h2>
                        <p>
                            Our website may contain links to third-party sites. We are not responsible for the privacy practices or content
                            of those sites. We encourage you to review their privacy policies before providing any personal information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-semibold mb-3">9. Children&apos;s Privacy</h2>
                        <p>
                            Our website is not intended for children under 13. We do not knowingly collect personal information from children.
                            If we learn that we have collected data from a child under 13, we will delete it promptly.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-semibold mb-3">10. Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated
                            &quot;Last updated&quot; date. We encourage you to review this policy periodically.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-semibold mb-3">11. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy or your personal data, please contact us at:
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
