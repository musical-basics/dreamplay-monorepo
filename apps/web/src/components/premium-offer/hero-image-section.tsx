import Image from "next/image"

export function HeroImageSection() {
    return (
        <section className="relative min-h-screen overflow-hidden">
            <div className="absolute inset-0">
                <Image
                    src="/images/marketing/dreamplay-one-hero.jpg"
                    alt="Hand in black suit playing piano keys"
                    fill
                    className="object-cover"
                    priority
                />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
            <div className="relative z-10 flex h-full min-h-screen flex-col justify-center px-8 md:px-16 lg:px-24">
                <div className="max-w-xl">
                    <h2 className="font-serif text-3xl italic leading-tight text-white md:text-4xl lg:text-5xl xl:text-6xl">
                        This is a
                        <br />
                        Piano Keyboard for
                        <br />
                        Hands That Do Not
                        <br />
                        Fit the Standard.
                    </h2>
                    <p className="mt-8 max-w-md font-sans text-sm leading-relaxed text-white/80 md:text-base">
                        {
                            'Most keyboards were built around one "standard" hand size. If your hands have ever felt too small for the piano, you are not alone.'
                        }
                    </p>
                    <p className="mt-4 max-w-md font-sans text-sm leading-relaxed text-white/80 md:text-base">
                        DreamPlay One is designed with narrower keys &ndash; so you can play
                        freely, naturally, and without strain.
                    </p>
                </div>
            </div>
        </section>
    )
}
