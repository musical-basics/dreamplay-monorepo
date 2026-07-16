import Image from "next/image"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function CreatorSection() {
  return (
    <section id="creator" className="relative overflow-hidden bg-foreground">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28 lg:py-32">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
          {/* Image */}
          <div className="relative lg:w-2/5">
            <div className="relative aspect-[3/4] overflow-hidden rounded-sm">
              <Image
                src="/images/marketing/carnegie-hall-performance.png"
                alt="Lionel Yu performing at a concert venue"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col justify-center lg:w-3/5">
            <p className="font-sans text-xs uppercase tracking-[0.3em] text-background/50">
              Meet the Creator
            </p>
            <h2 className="mt-4 font-serif text-3xl leading-tight text-background md:text-4xl lg:text-5xl text-balance">
              Lionel Yu
            </h2>
            <p className="mt-2 font-sans text-sm text-background/50">
              Concert Pianist & Founder &middot; Las Vegas, NV
            </p>

            <p className="mt-8 font-sans text-sm leading-relaxed text-background/70 md:text-base">
              {'"'}I{"'"}ve been a concert pianist for years, performing at
              Carnegie Hall, the Kennedy Center, Barbican Hall and venues around the world. But
              there{"'"}s something most people never saw: I was constantly
              fighting against the piano.{'"'}
            </p>

            <Accordion type="single" collapsible className="mt-6">
              <AccordionItem value="story" className="border-background/20">
                <AccordionTrigger className="font-serif text-base text-background hover:no-underline md:text-lg [&>svg]:text-background/60">
                  Read the full story
                </AccordionTrigger>
                <AccordionContent className="font-sans text-sm leading-relaxed text-background/60 md:text-base">
                  <p>
                    My hands span at exactly 8.0 inches. That meant many
                    traditional pieces were difficult, sometimes impossible, for
                    me to play comfortably. No matter how much I practiced, I
                    felt like the instrument wasn{"'"}t built for me.
                  </p>
                  <p className="mt-4">
                    So I asked myself: {'"'}What if the piano could be designed
                    to fit the pianist, instead of the other way around?{'"'}
                  </p>
                  <p className="mt-4">
                    That{"'"}s where DreamPlay was born. Most pianos are designed
                    for large hand spans, at least 8.5 inches. But 87% of women
                    and 24% of men fall short of that. That means strain,
                    tension, and frustration. I know because I lived it.
                  </p>
                  <p className="mt-4">
                    DreamPlay is the instrument I always wished I had: a
                    professional keyboard designed to fit your hands.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Who is it for */}
            <div className="mt-10">
              <h3 className="font-serif text-lg text-background md:text-xl">
                Who DreamPlay Is For
              </h3>
              <div className="mt-6 flex flex-col gap-4">
                {[
                  "Pianists with smaller hand spans who want comfort and freedom.",
                  "Students starting their piano journey with the right foundation.",
                  "Professionals who want speed, comfort, and expressive control.",
                  "Anyone who wants to unlock their full musical potential.",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-background/30 font-sans text-xs text-background/60">
                      {i + 1}
                    </span>
                    <p className="font-sans text-sm leading-relaxed text-background/70 md:text-base">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
