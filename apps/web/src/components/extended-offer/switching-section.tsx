import Image from "next/image"
import { ArrowRight, RefreshCw } from "lucide-react"

export function SwitchingSection() {
    return (
        <section className="relative bg-neutral-50">
            <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
                <div className="flex flex-col gap-12 lg:flex-row lg:gap-16 lg:items-center">
                    {/* Content */}
                    <div className="flex-1 lg:max-w-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <RefreshCw className="h-5 w-5 text-neutral-900" strokeWidth={1.5} />
                            <p className="font-sans text-sm uppercase tracking-[0.3em] text-neutral-500">
                                The #1 Question We Get
                            </p>
                        </div>
                        <h2 className="font-serif text-3xl leading-tight text-neutral-900 md:text-4xl lg:text-[2.75rem] text-balance">
                            &ldquo;Will I lose my ability on a standard piano?&rdquo;
                        </h2>

                        <div className="mt-6 border-l-2 border-neutral-900 pl-6">
                            <p className="font-serif text-xl text-neutral-900 italic md:text-2xl">
                                No. In fact, you&apos;ll get better.
                            </p>
                        </div>

                        <div className="mt-8 flex flex-col gap-6">
                            <div className="flex gap-4">
                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-neutral-900" />
                                <div>
                                    <p className="font-sans text-sm font-semibold text-neutral-900">
                                        Lionel Yu, DreamPlay Co-Founder
                                    </p>
                                    <p className="mt-1 font-sans text-sm leading-relaxed text-neutral-500">
                                        Lionel seamlessly switches between standard and narrow sizes daily. Practicing on narrower keys
                                        teaches your hands to relax, a skill that directly transfers and improves your technique on any keyboard.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-neutral-900" />
                                <div>
                                    <p className="font-sans text-sm font-semibold text-neutral-900">
                                        Dr. Rhonda Boyle, Concert Pianist &amp; Researcher
                                    </p>
                                    <p className="mt-1 font-sans text-sm leading-relaxed text-neutral-500">
                                        Research from the University of Sydney confirms that pianists who practice on reduced-size keyboards
                                        improve their relaxation and accuracy, benefits that carry over when returning to standard-size instruments.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <a
                            href="/how-it-works"
                            className="mt-8 group inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.2em] text-neutral-900 hover:text-neutral-600 transition-colors"
                        >
                            Learn more about the science
                            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                        </a>
                    </div>

                    {/* Image */}
                    <div className="relative flex-1">
                        <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                            <Image
                                src="/images/marketing/David-Linda.jpg"
                                alt="Pianists Linda Gould and David Steinbuhler switching between keyboard sizes"
                                fill
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                className="object-cover"
                            />
                        </div>
                        <p className="mt-3 font-sans text-xs text-neutral-400 text-center">
                            Linda Gould &amp; David Steinbuhler, pioneers of the DS Standard
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
