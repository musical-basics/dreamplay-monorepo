"use client"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
    {
        question: "How does the free trade-in work?",
        answer:
            "When your child's hands grow beyond the DS5.5 sizing, simply contact us. Ship your DS5.5 back (buyer pays shipping) and we'll send a brand-new DS6.0 to your door. The upgrade itself is completely free when you purchase during our launch promotion.",
    },
    {
        question: "Is there a time limit on when I can trade in?",
        answer:
            "No. There's no expiration date on the trade-in. Whether your child outgrows the DS5.5 in 2 years or 10 years, the free upgrade is yours to use whenever you're ready. The only requirement is that you purchase during our launch promo.",
    },
    {
        question: "What condition does the DS5.5 need to be in?",
        answer:
            "Normal wear and tear is perfectly fine. It's a musical instrument, it should be played! As long as the keyboard is functional and not intentionally damaged, we'll accept it for trade-in.",
    },
    {
        question: "Do I need to pay for shipping?",
        answer:
            "Yes, the buyer is responsible for shipping costs. However, the upgrade itself from DS5.5 to DS6.0 is completely free when you purchase during our launch promotion.",
    },
    {
        question: "Why is this only available during the launch promo?",
        answer:
            "Our launch promo pricing gives us a unique opportunity to offer this trade-in program. As a thank-you to our earliest supporters, we're absorbing the cost of the upgrade. Once we move to standard retail pricing, this program will not be available.",
    },
    {
        question: "Can I trade a DS6.0 for a DS5.5 instead?",
        answer:
            "No. The trade-in program is designed for growing children. It only goes from DS5.5 to DS6.0 as their hands get bigger. If you ordered the wrong size, we offer a 90-day exchange period where you can swap for the correct model. Buyer pays shipping for exchanges.",
    },
]

export function TradeInFaqSection() {
    return (
        <section className="relative bg-neutral-50">
            <div className="mx-auto max-w-4xl px-6 py-20 md:py-28 lg:py-32">
                <div className="mb-12 max-w-2xl">
                    <p className="font-sans text-xs uppercase tracking-[0.3em] text-neutral-500">
                        Frequently Asked Questions
                    </p>
                    <h2 className="mt-4 font-serif text-3xl leading-tight text-neutral-900 md:text-4xl lg:text-5xl text-balance">
                        How the trade-in upgrade works.
                    </h2>
                    <p className="mt-4 font-sans text-base font-medium leading-relaxed text-neutral-500 md:text-lg">
                        Everything you need to know about our free DS5.5 → DS6.0 upgrade program.
                    </p>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, i) => (
                        <AccordionItem
                            key={i}
                            value={`faq-${i}`}
                            className="border-neutral-200"
                        >
                            <AccordionTrigger className="font-serif text-lg text-neutral-900 hover:no-underline text-left md:text-xl py-5">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="font-sans text-base leading-relaxed text-neutral-500 pb-6">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    )
}
