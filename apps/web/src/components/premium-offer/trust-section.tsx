"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function TrustSection() {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  return (
    <>
      <section id="trust" className="relative overflow-hidden bg-background">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28 lg:py-32">
          <div className="mb-16 max-w-2xl">
            <p className="font-sans text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Built to Last
            </p>
            <h2 className="mt-4 font-serif text-3xl leading-tight text-foreground md:text-4xl lg:text-5xl text-balance">
              Trusted manufacturing. Transparent process.
            </h2>
          </div>

          <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
            {/* Manufacturing image */}
            <div className="relative lg:w-2/5">
              <button
                onClick={() => setLightboxOpen(true)}
                className="relative aspect-[4/3] overflow-hidden rounded-sm w-full cursor-zoom-in group block"
              >
                <Image
                  src="/images/accessories/packaging-care 2x Upscaled-2.jpg"
                  alt="DreamPlay manufacturing facility"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </button>
              <p className="mt-2 text-center font-sans text-xs text-muted-foreground/60 tracking-wide">
                Click to enlarge
              </p>
            </div>

            {/* Content */}
            <div className="flex flex-col justify-center lg:w-3/5">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="manufacturer" className="border-border/60">
                  <AccordionTrigger className="font-serif text-lg text-foreground hover:no-underline md:text-xl">
                    About Our Manufacturer
                  </AccordionTrigger>
                  <AccordionContent className="font-sans text-sm leading-relaxed text-muted-foreground md:text-base">
                    <p>
                      Our Supplier, Ebulent Technologies Corporation, has been a cornerstone of precision
                      manufacturing in Shenzhen for over two decades. We chose them
                      not just for their factory size, but for their specific
                      expertise in building next-generation musical instruments.
                    </p>
                    <p className="mt-4">
                      <strong className="text-foreground">
                        The Aeroband Connection:
                      </strong>{" "}
                      Ebulent is the manufacturing force behind the viral Aeroband
                      Smart Guitar. They understand that a digital instrument must
                      feel as responsive and soulful as an acoustic one.
                    </p>
                    <p className="mt-4">
                      <strong className="text-foreground">
                        Total Quality Control:
                      </strong>{" "}
                      Unlike factories that just assemble bought parts, Ebulent
                      builds from the ground up. From high-capacity lithium
                      batteries to complex internal electronics, they manufacture
                      critical components in-house.
                    </p>
                    <p className="mt-4">
                      <strong className="text-foreground">
                        Decades of Experience:
                      </strong>{" "}
                      Established in the early 2000s, Ebulent has evolved from
                      display technologies to advanced consumer electronics. This
                      history ensures your DreamPlay One is built with mature,
                      time-tested reliability.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="timeline" className="border-border/60">
                  <AccordionTrigger className="font-serif text-lg text-foreground hover:no-underline md:text-xl">
                    Production Timeline
                  </AccordionTrigger>
                  <AccordionContent className="font-sans text-sm leading-relaxed text-muted-foreground md:text-base">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start gap-4">
                        <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-foreground" />
                        <p>
                          <strong className="text-foreground">
                            Tooling (90 Days):
                          </strong>{" "}
                          The most complex part is creating the steel molds for our
                          custom key sizes. This takes approximately 3 months. We
                          cannot rush this without risking quality.
                        </p>
                      </div>
                      <div className="flex items-start gap-4">
                        <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-foreground" />
                        <p>
                          <strong className="text-foreground">
                            Delivery Target (October 2026):
                          </strong>{" "}
                          We have built a 2-month buffer into our timeline to
                          account for potential ocean freight delays or customs
                          congestion.
                        </p>
                      </div>
                      <p className="mt-2">
                        We promise 100% transparency. You will be updated every
                        single month with photos from the factory floor until the
                        DreamPlay One is in your living room.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="risks" className="border-border/60">
                  <AccordionTrigger className="font-serif text-lg text-foreground hover:no-underline md:text-xl">
                    Risks & Challenges
                  </AccordionTrigger>
                  <AccordionContent className="font-sans text-sm leading-relaxed text-muted-foreground md:text-base">
                    <p className="mb-4">
                      Every crowdfunding campaign involves some risk, but we have
                      mitigated the biggest ones already:
                    </p>
                    <div className="flex flex-col gap-3">
                      {[
                        "Prototype is finished: We aren't guessing; the piano works.",
                        "Manufacturer secured: We have partnered with a reputable factory.",
                        "Experienced Team: We know music and logistics.",
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-foreground" />
                          <p>{item}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="shipping" className="border-border/60">
                  <AccordionTrigger className="font-serif text-lg text-foreground hover:no-underline md:text-xl">
                    Shipping & Delivery
                  </AccordionTrigger>
                  <AccordionContent className="font-sans text-sm leading-relaxed text-muted-foreground md:text-base">
                    <p>
                      We ship worldwide! Shipping costs will be calculated after
                      the campaign ends to ensure you get the best current rates.
                    </p>
                    <div className="mt-4 border border-border/40 bg-background p-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-foreground">
                        Important for All Backers (US/EU/UK/Asia/Australia)
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Shipping estimates do not include local VAT (e.g., 19%
                        MwSt), Tariffs, Import Duties, or Customs fees. When your keyboard
                        is ready to ship, we will advise you of the final duties amount
                        in accordance with your country{"'"}s regulations.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Link
                href="/production-timeline"
                className="mt-8 inline-flex items-center gap-2 border border-white/20 bg-white/5 px-5 py-2.5 font-sans text-xs uppercase tracking-[0.15em] text-foreground transition-all hover:bg-white/10 hover:border-white/30"
              >
                Learn more about our manufacturing timeline
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-zoom-out p-4 md:p-8"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors font-sans text-sm uppercase tracking-widest z-10"
          >
            ✕ Close
          </button>
          <div className="relative w-full max-w-5xl aspect-[4/3]" onClick={(e) => e.stopPropagation()}>
            <Image
              src="/images/accessories/packaging-care 2x Upscaled-2.jpg"
              alt="DreamPlay packaging — enlarged view"
              fill
              sizes="95vw"
              className="object-contain cursor-zoom-out"
              onClick={() => setLightboxOpen(false)}
              quality={95}
            />
          </div>
        </div>
      )}
    </>
  )
}
