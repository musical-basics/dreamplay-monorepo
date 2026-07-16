import Image from "next/image"

export function StatsSection() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      <Image
        src="/images/marketing/pianist-hands-on-narrow-keys.jpg"
        alt="Hands playing piano"
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 flex h-full min-h-screen flex-col items-center justify-center px-6 text-center">
        {/* Mobile/tablet centered layout */}
        <div className="block lg:hidden">
          <p className="font-serif text-7xl text-white md:text-8xl">
            55<span className="text-5xl md:text-6xl">%</span>
          </p>
          <p className="mt-2 font-sans text-sm uppercase tracking-[0.3em] text-white md:text-base">
            of Pianists Have Hands
          </p>
          <p className="mt-4 font-sans text-xs uppercase tracking-[0.3em] text-white/80 md:text-sm">
            Under
          </p>
          <p className="font-serif text-6xl text-white md:text-7xl">
            8.5
            <span className="ml-1 font-sans text-lg uppercase tracking-[0.3em] md:text-xl">
              inches
            </span>
          </p>
        </div>

        {/* Desktop side-by-side layout with divider */}
        <div className="hidden lg:flex lg:items-center lg:gap-12">
          <div className="text-right">
            <p className="font-serif text-8xl text-white xl:text-9xl">
              55<span className="text-6xl xl:text-7xl">%</span>
            </p>
            <p className="mt-1 font-sans text-sm uppercase tracking-[0.3em] text-white">
              of Pianists
            </p>
            <p className="font-sans text-sm uppercase tracking-[0.3em] text-white">
              Have Hands
            </p>
          </div>
          <div className="h-40 w-px bg-white/60" aria-hidden="true" />
          <div className="text-left">
            <p className="font-sans text-sm uppercase tracking-[0.3em] text-white/80">
              Under
            </p>
            <p className="font-serif text-8xl text-white xl:text-9xl">8.5</p>
            <p className="font-sans text-sm uppercase tracking-[0.3em] text-white">
              Inches
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <a
            href="/how-it-works"
            className="inline-block border border-white px-6 py-3 text-xs font-sans uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black md:px-8 md:text-sm"
          >
            See the Science of Strain
          </a>
          <a
            href="/better-practice"
            className="inline-block border border-white px-6 py-3 text-xs font-sans uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black md:px-8 md:text-sm"
          >
            The Benefits Of Narrow Keys
          </a>
        </div>
      </div>
    </section>
  )
}
