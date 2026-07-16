export function StanfordQuoteSection() {
    return (
        <section className="relative bg-foreground">
            <div className="mx-auto max-w-4xl px-6 py-20 md:py-28 lg:py-32">
                <div className="mx-auto max-w-2xl border-l-2 border-background/20 pl-8 md:pl-12">
                    <blockquote className="font-sans text-xl leading-relaxed text-background/80 md:text-2xl lg:text-3xl text-balance italic">
                        &ldquo;We would never expect a world-class athlete to compete with
                        equipment that does not fit their body. Yet we ask pianists,
                        particularly women, to adapt to a one-size-fits-all design that was
                        never built with them in mind.&rdquo;
                    </blockquote>
                    <div className="mt-8 flex flex-col gap-1">
                        <cite className="font-sans text-lg font-medium text-background/90 not-italic md:text-xl">
                            Elizabeth Schumann
                        </cite>
                        <span className="font-sans text-base text-background/50">
                            Director of Keyboard Studies, Stanford University
                        </span>
                    </div>
                </div>
            </div>
        </section>
    )
}
