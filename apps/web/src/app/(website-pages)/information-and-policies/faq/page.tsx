import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQList from "@/components/faq-list";
import { getFaqItems } from "@/actions/faq-actions";
import FaqJsonLd from "@/components/FaqJsonLd";

export const metadata = {
    title: "FAQ & Research – DreamPlay Pianos",
    description: "Everything you need to know about the science of hand span and the engineering behind DreamPlay keyboards.",
};

export const revalidate = 60;

export default async function FAQPage() {
    // Fetch live data from the database (or defaults if DB is empty)
    const faqItems = await getFaqItems();

    // Extract unique categories for the jump links
    const categories = Array.from(new Set(faqItems.map(item => item.category || 'General')));

    // Sort to match our preferred order
    const categoryOrder = ["The Science & Research", "The Pianist's Experience", "DreamPlay & Ordering"];
    const orderedCategories = categoryOrder.filter(c => categories.includes(c));
    categories.forEach(c => { if (!orderedCategories.includes(c)) orderedCategories.push(c); });

    return (
        <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-neutral-200">
            <FaqJsonLd items={faqItems} />
            <Navbar forceOpaque={true} darkMode={true} className="border-b border-white/10 bg-[#050505] backdrop-blur-md" />

            <main className="pt-32 pb-24">
                <div className="max-w-4xl mx-auto px-6">
                    {/* HERO */}
                    <div className="text-center mb-16">
                        <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-4 font-bold">Support & Research</p>
                        <h1 className="font-serif text-4xl md:text-6xl tracking-tight leading-tight mb-6 text-black">Frequently Asked Questions</h1>
                        <p className="font-sans text-base md:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
                            Everything you need to know about the science of hand span and the engineering behind DreamPlay keyboards.
                        </p>
                    </div>

                    {/* JUMP LINKS */}
                    <div className="flex flex-wrap justify-center gap-3 mb-20">
                        {orderedCategories.map(cat => (
                            <a
                                key={cat}
                                href={`#${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                                className="text-[10px] md:text-xs font-sans uppercase tracking-widest text-neutral-600 hover:text-black border border-neutral-200 hover:border-neutral-400 bg-neutral-50 hover:bg-white px-5 py-2.5 rounded-none transition-all"
                            >
                                {cat}
                            </a>
                        ))}
                    </div>

                    {/* FAQ LIST */}
                    <FAQList items={faqItems} />

                    {/* CONTACT */}
                    <div className="mt-24 pt-16 border-t border-neutral-200 text-center">
                        <p className="font-sans text-base text-neutral-600 mb-8">
                            Still have questions? Reach out to our team directly.
                        </p>
                        <a href="/contact" className="group inline-flex items-center justify-center gap-2 bg-black text-white px-10 py-5 font-sans text-xs uppercase tracking-widest font-bold transition-transform hover:scale-105 shadow-lg">
                            Contact Support
                        </a>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
