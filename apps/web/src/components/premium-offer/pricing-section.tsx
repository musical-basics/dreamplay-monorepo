"use client"

import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { useAnalytics } from "@dreamplay/analytics/react"

const allTiers = [
  {
    id: 'reservation',
    badge: null,
    title: "Lock My Spot",
    subtitle: "Batch 1 — May 2027",
    price: "$99",
    msrp: null,
    description:
      "100% refundable reservation. Lock in Founder\u0027s pricing and secure your Batch 1 (May 2027) delivery. Pay the remaining balance only when your piano is boxed and ready to ship.",
    includes: ["Batch 1 Delivery Slot", "Founder\u0027s Price Lock", "Full Refund Anytime"],
    delivery: "May 2027",
    backers: 0,
    remaining: 50,
    total: 50,
    highlight: false,
  },
  {
    id: 'reserve50',
    badge: null,
    title: "Reserve (50%)",
    subtitle: "",
    price: "$499",
    msrp: null,
    description:
      "Pay 50% now ($499), the rest ($500 + shipping/taxes) when ready to ship.",
    includes: ["DreamPlay One Keyboard"],
    delivery: "May 2027",
    backers: 2,
    remaining: 8,
    total: 10,
    highlight: false,
  },
  {
    id: 'solo',
    badge: null,
    title: "DreamPlay One",
    subtitle: "",
    price: "$999",
    msrp: "$1,499",
    description:
      "The DreamPlay One Keyboard. Available in DS5.5 or DS6.0. Choose Midnight Black or Pearl White.",
    includes: ["DreamPlay One Keyboard"],
    delivery: "May 2027",
    backers: 40,
    remaining: 10,
    total: 50,
    highlight: false,
  },
  {
    id: 'full',
    badge: "Most Popular",
    title: "DreamPlay Premium Bundle",
    subtitle: "",
    price: "$1,099",
    msrp: "$1,499",
    description:
      "The complete DreamPlay experience. Keyboard, adjustable stand, responsive sustain pedal, and comfortable padded bench.",
    includes: ["DreamPlay One Keyboard", "Keyboard Stand", "Sustain Pedal", "Padded Bench"],
    delivery: "May 2027",
    backers: 208,
    remaining: 42,
    total: 250,
    highlight: true,
  },
]

export function PricingSection({ hiddenProducts = [] }: { hiddenProducts?: string[] }) {
  const analytics = useAnalytics()
  const tiers = allTiers.filter(t => !hiddenProducts.includes(t.id))
  return (
    <section id="pricing" className="relative overflow-hidden bg-foreground">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28 lg:py-32">
        <div className="mb-16 max-w-2xl">
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-background/50">
            Pre-Order Now
          </p>
          <h2 className="mt-4 font-serif text-3xl leading-tight text-background md:text-4xl lg:text-5xl text-balance">
            Reserve your DreamPlay One.
          </h2>
          <p className="mt-6 font-sans text-sm leading-relaxed text-background/60 md:text-base">
            Ships worldwide. Choose the size and color that suits you after
            placing your order.
          </p>
        </div>



        {/* Import Duties Call-out */}
        <div className="mb-12 border border-background/20 bg-background/5 px-6 py-5 max-w-2xl mt-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-background/60 text-lg leading-none">⚖️</span>
            <div>
              <p className="font-sans text-sm font-semibold text-background/90">
                A Note on Duties & Taxes
              </p>
              <p className="mt-1 font-sans text-xs leading-relaxed text-background/60">
                To guarantee the most accurate rates, standard import duties and local taxes are not included in the reservation price today. We ship Delivered Duty Paid (DDP) — meaning we prepay and handle all customs clearance on your behalf, so there are no surprise carrier fees at your door. This applies to all shipping regions including the US, UK, EU, Australia, and Japan. We will calculate and invoice any applicable duties/taxes right before shipping.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.title}
              className={`relative flex flex-col border p-8 transition-all md:p-10 ${tier.highlight
                ? "border-background/30 bg-background/5"
                : "border-background/10 bg-transparent"
                }`}
            >

              {tier.badge && (
                <span className="mb-4 self-start font-sans text-[10px] uppercase tracking-[0.3em] text-background/50">
                  {tier.badge}
                </span>
              )}

              <h3 className="font-serif text-xl text-background md:text-2xl">
                {tier.title}
              </h3>
              <p className="mt-1 font-sans text-xs text-background/40">
                {tier.subtitle}
              </p>



              <p className="mt-6 font-sans text-sm leading-relaxed text-background/60">
                {tier.description}
              </p>

              {/* Includes */}
              <div className="mt-6 flex flex-col gap-2">
                <p className="font-sans text-xs uppercase tracking-[0.2em] text-background/40">
                  Includes
                </p>
                {tier.includes.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-background/40" />
                    <span className="font-sans text-sm text-background/70">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              {/* Meta */}
              <div className="mt-6 flex items-center gap-6">
                <div>
                  <p className="font-sans text-xs text-background/40">
                    Delivery
                  </p>
                  <p className="font-sans text-sm text-background/70">
                    {tier.delivery}
                  </p>
                </div>
                <div className="h-6 w-px bg-background/10" aria-hidden="true" />
                <div>
                  <p className="font-sans text-xs text-background/40">
                    Backers
                  </p>
                  <p className="font-sans text-sm text-background/70">
                    {tier.backers}
                  </p>
                </div>
                <div className="h-6 w-px bg-background/10" aria-hidden="true" />
                <div>
                  <p className="font-sans text-xs text-background/40">
                    Left
                  </p>
                  <p className="font-sans text-sm text-background/70">
                    {tier.remaining} of {tier.total}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 h-px w-full bg-background/10">
                <div
                  className="h-full bg-background/40 transition-all"
                  style={{
                    width: `${((tier.total - tier.remaining) / tier.total) * 100}%`,
                  }}
                />
              </div>

              {/* CTA */}
              <a
                href="/customize"
                onClick={() => void analytics.track("cta_click", { cta: "premium_offer_pricing_reserve", tier: tier.id, href: "/customize" })}
                className="mt-8 flex items-center justify-center gap-2 border px-6 py-4 text-center font-sans text-xs uppercase tracking-widest border-background/30 text-background/80 hover:border-background hover:bg-background/10 transition-colors"
              >
                Reserve Now
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
