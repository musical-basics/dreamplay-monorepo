import React from "react";

export function RisksSection() {
    return (
        <section className="py-16 md:py-24 bg-neutral-50 border-t border-neutral-200">
            <div className="container mx-auto px-6 max-w-3xl">
                <h3 className="text-2xl font-bold text-neutral-900 mb-6">Risks & Challenges</h3>
                <div className="space-y-6 text-neutral-600 text-sm md:text-base leading-relaxed">
                    <p>
                        <strong>Manufacturing & Tooling:</strong> We have a working prototype and a manufacturing partner
                        ready. However, creating the steel molds for our custom 15/16th size keys takes approximately
                        90 days. We have built a 2-month buffer into our timeline to account for any tooling adjustments.
                    </p>
                    <p>
                        <strong>Logistics:</strong> Global shipping is volatile. While we aim to ship in May 2027,
                        ocean freight delays (port congestion, customs) can sometimes add 2-4 weeks to delivery times.
                    </p>
                    <p>
                        <strong>Our Promise:</strong> We adhere to the &ldquo;Update Rule.&rdquo; You will receive a production update
                        every single month, whether the news is good or bad. You will see photos of the molds,
                        the first units off the line, and the boxes on the pallets.
                    </p>
                </div>
            </div>
        </section>
    );
}
