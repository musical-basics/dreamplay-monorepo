export function StanfordQuoteSection() {
    return (
        <section className="relative overflow-hidden bg-foreground">
            <div className="mx-auto max-w-4xl px-6 pt-4 pb-16 md:pt-6 md:pb-24">
                <div className="border-l-2 border-background/20 pl-8 md:pl-12">
                    <blockquote className="font-serif text-lg leading-relaxed text-background/80 md:text-xl lg:text-2xl text-balance italic">
                        &ldquo;We would never expect a world-class athlete to compete with
                        equipment that does not fit their body. Yet we ask pianists,
                        particularly women, to adapt to a one-size-fits-all design that was
                        never built with them in mind.&rdquo;
                    </blockquote>
                    <div className="mt-6 flex flex-col gap-1">
                        <cite className="font-serif text-base font-medium text-background/90 not-italic md:text-lg">
                            Elizabeth Schumann
                        </cite>
                        <span className="font-sans text-sm text-background/50">
                            Director of Keyboard Studies, Stanford University
                        </span>
                    </div>
                </div>
            </div>
        </section>
    )
}
