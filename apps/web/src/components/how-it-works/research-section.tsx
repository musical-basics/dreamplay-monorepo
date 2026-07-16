export function ResearchSection() {
    return (
        <section className="w-full bg-black text-white py-20 md:py-28">
            <div className="mx-auto max-w-6xl px-6">
                <div className="text-center mb-16">
                    <p className="font-sans text-xs uppercase tracking-[0.3em] text-white/40">Evidence</p>
                    <h2 className="mt-4 font-sans text-3xl leading-tight text-white md:text-4xl lg:text-5xl text-balance font-bold">Published Research</h2>
                    <p className="mt-6 font-sans text-base text-white/60 max-w-xl mx-auto leading-relaxed">Decades of peer reviewed research explain why standard keyboards hold most pianists back.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-16">
                    {[
                        {
                            title: "Hand size and performance related injuries",
                            source: "Applied Ergonomics, 2021",
                            desc: "Pianists with smaller hands show reduced muscular effort and lower perceived strain when they move to 5.5 inch octave keyboards instead of standard size.",
                            href: "https://www.sciencedirect.com/science/article/abs/pii/S0003687021001654",
                            cta: "Read full study",
                        },
                        {
                            title: "Gender differences and career impact",
                            source: "Susan Tomes",
                            desc: "Studies note that internationally acclaimed women pianists tend to have larger hands, which aligns with a repertoire that often expects very wide reaches.",
                            href: "https://www.susantomes.com/blog/hand-size-gender-differences-pianists-acclaim/",
                            cta: "Read article",
                        },
                        {
                            title: "Benefits of ergonomically scaled keyboards",
                            source: "Survey of reduced size users",
                            desc: "Players report relief from pain, faster technical progress, and greater comfort when they move to keyboards that match their hand span.",
                            href: "https://www.researchgate.net/publication/287901848_PIANIST_HAND_SPANS_GENDER_AND_ETHNIC_DIFFERENCES_AND_IMPLICATIONS_FOR_PIANO_PLAYING",
                            cta: "Read full study",
                        },
                        {
                            title: "Performance quality improvements",
                            source: "PASK findings",
                            desc: "Shorter reaches and reduced wrist travel on compatible keyboards are linked to better control and lower risk of overuse injuries.",
                            href: "https://paskpiano.org/performance-quality/",
                            cta: "Learn more",
                        },
                    ].map((item) => (
                        <div key={item.title} className="border border-white/10 bg-white/5 p-10 flex flex-col hover:border-white/20 transition-all">
                            <div className="font-sans text-xl font-bold text-white mb-3">{item.title}</div>
                            <div className="font-sans text-xs uppercase tracking-[0.3em] text-white/40 mb-4">{item.source}</div>
                            <div className="font-sans text-sm text-white/60 leading-relaxed mb-8 flex-grow">{item.desc}</div>
                            <a href={item.href} target="_blank" className="group inline-flex items-center justify-center gap-2 border border-white bg-white px-8 py-4 font-sans text-xs uppercase tracking-widest text-black transition-colors hover:bg-white/90 w-fit">
                                {item.cta}
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
                            </a>
                        </div>
                    ))}
                </div>

                {/* Academic Recognition */}
                <div className="border border-white/10 p-10 bg-white/5">
                    <h3 className="font-sans text-2xl font-bold text-white mb-2">Academic recognition</h3>
                    <p className="font-sans text-sm text-white/60 leading-relaxed">The Donison Steinbuhler standard appears in research and teaching at leading institutions.</p>
                    <div className="grid md:grid-cols-2 gap-8 mt-10">
                        {[
                            { name: "Stanford University", desc: "Research and advocacy around scaled keyboards in music education and injury prevention." },
                            { name: "Johns Hopkins Peabody Institute", desc: "Use of alternative sizes inside curriculum and performance programs." },
                        ].map((inst) => (
                            <div key={inst.name} className="flex gap-4 items-start">
                                <div className="w-6 h-6 bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/10">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }} className="text-[#34c759]"><path d="M20 6 9 17l-5-5" /></svg>
                                </div>
                                <div>
                                    <h4 className="font-sans text-lg font-bold text-white mb-1">{inst.name}</h4>
                                    <p className="font-sans text-sm text-white/60">{inst.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-10 text-center">
                        <a href="/about-us/ds-standard" className="group inline-flex items-center justify-center gap-2 border border-white bg-white px-8 py-4 font-sans text-xs uppercase tracking-widest text-black transition-colors hover:bg-white/90">
                            Learn more about the DS Standard
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    )
}
