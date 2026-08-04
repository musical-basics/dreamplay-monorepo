/* eslint-disable @next/next/no-img-element */
import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AbCtaLink } from "@/components/ab/AbCtaLink";
import BackgroundVideo from "./background-video";
import TestimonialSlider from "./testimonial-slider";
import PianoSwiper from "./piano-swiper";

// A/B variant page — must never be indexed.
export const metadata = {
    title: "DreamPlay",
    robots: { index: false, follow: false },
};

/* ------------------------------------------------------------------ */
/* Shared bits (ported from the legacy Webflow `.button` styles)       */
/* ------------------------------------------------------------------ */

function ArrowIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            viewBox="0 0 18 10"
            fill="none"
            aria-hidden="true"
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12.0002 5.00391C12.0002 4.45162 11.5525 4.00391 11.0002 4.00391L1.00025 4.00391C0.44796 4.00391 0.000245026 4.45162 0.000245051 5.00391C0.000245075 5.55619 0.44796 6.00391 1.00025 6.00391L11.0002 6.00391C11.5525 6.00391 12.0002 5.55619 12.0002 5.00391Z"
                fill="currentColor"
            />
            <path
                d="M17.3616 3.77448C18.2131 4.36865 18.2131 5.63135 17.3616 6.22552L12.3417 9.72824C11.3409 10.4266 10.0002 9.6933 10.0002 8.50272L10.0002 1.49728C10.0002 0.306709 11.3409 -0.426616 12.3417 0.271762L17.3616 3.77448Z"
                fill="currentColor"
            />
        </svg>
    );
}

/** Inner markup of the legacy white pill button (label + dark arrow circle). */
function PillButtonInner({ label }: { label: string }) {
    return (
        <>
            <span className="relative z-[2] w-full text-center">{label}</span>
            <span className="absolute right-[7px] top-[7px] flex h-10 w-10 items-center justify-center rounded-full bg-[#010103] pl-1 text-white">
                <ArrowIcon />
            </span>
        </>
    );
}

const pillButtonClass =
    "relative flex h-14 w-full items-center rounded-[2rem] bg-white py-1 pl-6 pr-16 text-base font-medium text-[#010103] transition-transform duration-200 hover:scale-[1.02]";

const pillButtonOutlinedClass = `${pillButtonClass} border-2 border-solid border-black`;

/* ------------------------------------------------------------------ */
/* Sizing cards ("Find Your Perfect Fit")                              */
/* ------------------------------------------------------------------ */

function SizingCard({
    theme,
    pianoSrc,
    pianoAlt,
    handSrc,
    handAlt,
    title,
    desc,
    zone,
    className = "",
}: {
    theme: "dark" | "light";
    pianoSrc: string;
    pianoAlt: string;
    handSrc: string;
    handAlt: string;
    title: string;
    desc: string;
    zone: string;
    className?: string;
}) {
    const themeClass =
        theme === "dark"
            ? "bg-black text-white hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]"
            : "border-[5px] border-solid border-black bg-white text-black hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]";
    const descClass = theme === "dark" ? "text-gray-400" : "text-gray-500";

    return (
        <div
            className={`flex flex-col rounded-3xl p-8 transition-all duration-300 ease-out hover:z-50 hover:-translate-y-2 hover:scale-[1.03] ${themeClass} ${className}`}
        >
            <div className="relative mb-6 flex aspect-[3/2] w-full items-center justify-center overflow-hidden">
                <img
                    src={pianoSrc}
                    alt={pianoAlt}
                    loading="lazy"
                    className="max-h-full w-auto object-contain"
                />
            </div>
            <div className="mb-6 text-center">
                <h3 className="mb-3 text-[2rem] font-extrabold leading-[1.1]">{title}</h3>
                <p className={`text-lg font-medium leading-relaxed ${descClass}`}>{desc}</p>
            </div>
            <div className="relative mt-auto aspect-[3/2] w-full overflow-hidden rounded-2xl">
                <img
                    src={handSrc}
                    alt={handAlt}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                />
            </div>
            <p className="mt-6 text-center text-5xl font-extrabold tracking-[-0.02em] md:text-6xl">
                {zone}
            </p>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Feature cards                                                       */
/* ------------------------------------------------------------------ */

const FEATURES: { icon: string; label: React.ReactNode }[] = [
    { icon: "/images/icons/image-3.svg", label: "Built-in Metronome" },
    { icon: "/images/icons/image-4.svg", label: "Recording & Playback" },
    { icon: "/images/icons/Feature-Icon.svg", label: "256-note Polyphony" },
    { icon: "/images/icons/Feature-Icon_1.svg", label: "Dual-Sensor Velocity Keys" },
    { icon: "/images/icons/Feature-Icon-5.svg", label: "MIDI Sequencing" },
    { icon: "/images/icons/volume-icon.png", label: "18 Essential Presets" },
    { icon: "/images/icons/monitor.png", label: "Backlit LCD Screen" },
    { icon: "/images/icons/grand-piano-icon.png", label: "Grand Piano Sound" },
    {
        icon: "/images/icons/headphone-icon.png",
        label: "High-fidelity Speakers and Headphone Audio",
    },
    { icon: "/images/icons/Feature-Icon-4.svg", label: "88 Graded, Weighted Keys" },
    { icon: "/images/icons/bluetooth-app-icon.png", label: "Bluetooth Connectivity" },
    {
        icon: "/images/icons/LED-lights.png",
        label: (
            <>
                LED&nbsp;Lighting
                <br />
                For Every Key
            </>
        ),
    },
];

/* ------------------------------------------------------------------ */
/* Product detail cards                                                */
/* ------------------------------------------------------------------ */

const DETAIL_CARDS: {
    image: string;
    title: React.ReactNode;
    text: string;
    reversed?: boolean;
}[] = [
    {
        image: "/images/marketing/dreamplay-one-hero-studio.jpg",
        title: "Modern Design, Subtle Brilliance",
        text: "LED lights make each key press feel extra satisfying. A sleek design that looks good in any setting.",
    },
    {
        image: "/images/stock/article-placeholder.jpg",
        title: (
            <>
                Authentic Grand
                <br />
                Piano Feel
            </>
        ),
        text: "High quality, graded keys that feel like a real grand piano.",
        reversed: true,
    },
    {
        image: "/images/marketing/pianist-hands-on-narrow-keys.jpg",
        title: (
            <>
                Pristine,
                <br />
                Inspiring Sound
            </>
        ),
        text: "A beautiful, rich grand piano sound with every key press.",
    },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function LegacyHomePage() {
    return (
        <div className="bg-white">
            <Navbar />

            <main>
                {/* ------------------------------ HERO ------------------------------ */}
                <section
                    className="flex min-h-screen w-full flex-col justify-end pb-20"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(0,0,0,0) 31%, #000), url('/images/marketing/dreamplay-one-hero.jpg')",
                        backgroundPosition: "0 0, 50% 25%",
                        backgroundRepeat: "no-repeat, no-repeat",
                        backgroundSize: "auto, cover",
                    }}
                >
                    <div className="px-[5%]">
                        <div className="mx-auto w-full max-w-[80rem]">
                            <div className="flex flex-col gap-16 md:gap-[8.75rem]">
                                <div className="w-full max-w-[48.125rem]">
                                    <h1 className="text-[3rem] font-semibold leading-[1.1] tracking-[-0.02em] text-white md:text-[4.5rem] lg:text-[6rem]">
                                        Standard Piano Keys Are Too Wide
                                    </h1>
                                </div>
                                <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                                    <p className="text-xl font-bold leading-[1.6] text-white/80">
                                        Stop wasting time practicing on a keyboard that&apos;s too
                                        big for your hands.
                                    </p>
                                    <div className="w-full max-w-[14rem]">
                                        <AbCtaLink
                                            cta="legacy_home_hero"
                                            className={pillButtonClass}
                                        >
                                            <PillButtonInner label="Join The Waitlist" />
                                        </AbCtaLink>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ------------------------------ ABOUT ------------------------------ */}
                <section id="About" className="bg-white">
                    <div className="px-[5%] py-20 md:py-28">
                        <div className="mx-auto w-full max-w-[80rem]">
                            <div className="mx-auto max-w-[61.625rem]">
                                <div className="text-center">
                                    <h2 className="text-4xl font-semibold leading-[1.2] tracking-[-0.04em] text-[#010103] md:text-6xl lg:text-[4.5rem]">
                                        Stop fighting a keyboard
                                        <br />
                                        that wasn&apos;t built for you.
                                    </h2>
                                </div>
                                <div className="mt-11 h-[34rem] rounded-[8rem] bg-[#f8f8f8] p-6 md:h-[43.9375rem] md:rounded-[22.9375rem] md:p-[3.375rem]">
                                    <div
                                        className="flex h-full w-full flex-col justify-end rounded-[7rem] pb-[2.125rem] md:rounded-[22.9375rem]"
                                        style={{
                                            backgroundImage:
                                                "url('/images/marketing/Video_1.webp')",
                                            backgroundPosition: "50%",
                                            backgroundRepeat: "no-repeat",
                                            backgroundSize: "cover",
                                        }}
                                    >
                                        <div className="mx-auto flex w-full max-w-[26.5625rem] flex-col items-center gap-3.5 px-4 text-center">
                                            <h3 className="text-3xl font-semibold leading-[1.4] tracking-[-0.02em] text-white md:text-[2.625rem]">
                                                Did you know?
                                            </h3>
                                            <p className="text-lg leading-[1.6] text-white/80">
                                                Traditional pianos are designed for handspans of 8.5
                                                inches or more, leaving behind most women and nearly
                                                a third of men.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mx-auto mt-10 w-full max-w-[25rem] md:w-1/2">
                                <Link href="/how-it-works" className={pillButtonOutlinedClass}>
                                    <PillButtonInner label="Learn More About These Statistics" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --------------------------- VIDEO 1 --------------------------- */}
                <section className="relative h-[56.25vw] max-h-[80vh] min-h-[300px] w-full overflow-hidden bg-[#0a0a0f]">
                    <BackgroundVideo
                        posterUrl="/videos/Clip-4-poster-00001.jpg"
                        videoMp4="/videos/Clip-4-transcode.mp4"
                        videoWebm="/videos/Clip-4-transcode.webm"
                    />
                </section>

                {/* --------------------------- SIZING --------------------------- */}
                <section id="Sizing" className="bg-white">
                    <div className="px-[5%] py-20 md:py-28">
                        <div className="mx-auto w-full max-w-[1600px]">
                            <div className="mb-12 text-center">
                                <p className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
                                    Introducing the Sizes
                                </p>
                                <h2 className="text-balance text-4xl font-bold tracking-tight text-black md:text-5xl lg:text-6xl">
                                    Find Your Perfect Fit.
                                </h2>
                            </div>
                            <div className="flex flex-col gap-6 md:gap-8 lg:flex-row">
                                <div className="flex flex-[2] flex-col md:flex-row">
                                    <SizingCard
                                        theme="dark"
                                        className="flex-1 md:rounded-r-none"
                                        pianoSrc="/images/keyboards/ds55-white-narrow-keys-alt.png"
                                        pianoAlt="Piano DS5.5"
                                        handSrc="/images/hands/zone-a-small-hands-diagram.png"
                                        handAlt="Hand Zone A"
                                        title="Piano DS5.5"
                                        desc="Perfect for handspans under 7.6 inches."
                                        zone="Zone A"
                                    />
                                    <SizingCard
                                        theme="light"
                                        className="relative z-10 mt-4 flex-1 md:-ml-4 md:mt-0 md:rounded-l-none"
                                        pianoSrc="/images/keyboards/ds60-black-narrow-keys-side.png"
                                        pianoAlt="Piano DS6.0"
                                        handSrc="/images/hands/zone-b-medium-hands-diagram.png"
                                        handAlt="Hand Zone B"
                                        title="Piano DS6.0"
                                        desc="Perfect for handspans between 7.6-8.5 inches."
                                        zone="Zone B"
                                    />
                                </div>
                                <div className="flex-1">
                                    <SizingCard
                                        theme="dark"
                                        className="h-full"
                                        pianoSrc="/images/keyboards/ds65-black-standard-digital-piano.png"
                                        pianoAlt="Standard Piano"
                                        handSrc="/images/hands/zone-c-standard-hands-diagram.png"
                                        handAlt="Hand Zone C"
                                        title="Standard Piano"
                                        desc="Perfect for handspans over 8.5 inches."
                                        zone="Zone C"
                                    />
                                </div>
                            </div>
                            <div className="mx-auto mt-10 w-full max-w-[25rem] md:w-1/2">
                                <a
                                    href="https://www.dropbox.com/scl/fi/9b72rbi4ga0pjterxyoan/DreamPlay-Infographic.pdf?rlkey=mc08i1ahn5tp3thdd0qjnag2d&st=olbh1t9w&dl=1"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={pillButtonOutlinedClass}
                                >
                                    <PillButtonInner label="Download Our Hand-Measuring Guide" />
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --------------------------- FEATURES --------------------------- */}
                <section id="Feature" className="bg-white">
                    <div className="px-[5%] pb-20 md:pb-28">
                        <div className="mx-auto w-full max-w-[80rem]">
                            <div className="mb-14 flex flex-col items-center gap-6 text-center">
                                <div className="text-xl font-medium text-[#76767b] md:text-2xl">
                                    Our Features
                                </div>
                                <h2 className="text-4xl font-semibold leading-[1.2] tracking-[-0.04em] text-[#010103] md:text-6xl lg:text-[4.5rem]">
                                    Everything You Need, Built In
                                </h2>
                            </div>
                            <div className="mx-auto grid w-full max-w-[70.5rem] grid-cols-2 gap-8 md:grid-cols-3">
                                {FEATURES.map((feature, i) => (
                                    <div
                                        key={i}
                                        className="flex flex-col items-center gap-8 text-center"
                                    >
                                        <div className="h-10 w-10">
                                            <img
                                                src={feature.icon}
                                                alt=""
                                                loading="lazy"
                                                className="h-full w-full object-contain"
                                            />
                                        </div>
                                        <div className="text-lg leading-[1.65] md:text-xl">
                                            {feature.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* --------------------------- VIDEO 2 --------------------------- */}
                <section className="relative h-[56.25vw] max-h-[80vh] min-h-[300px] w-full overflow-hidden bg-[#0a0a0f]">
                    <BackgroundVideo
                        posterUrl="/videos/Clip-6_poster.0000000.jpg"
                        videoMp4="/videos/Clip-6_mp4.mp4"
                        videoWebm="/videos/Clip-6_webm.webm"
                    />
                </section>

                {/* --------------------------- DETAILS --------------------------- */}
                <section id="details" className="bg-white">
                    <div className="px-[5%] py-20 md:py-28">
                        <div className="mx-auto flex w-full max-w-[80rem] flex-col gap-20">
                            {DETAIL_CARDS.map((card, i) => (
                                <div
                                    key={i}
                                    className={`flex flex-col items-center gap-10 lg:gap-28 ${
                                        card.reversed ? "lg:flex-row-reverse" : "lg:flex-row"
                                    }`}
                                >
                                    <div className="w-full flex-1">
                                        <div className="h-[20.625rem] w-full overflow-hidden rounded-[2rem] bg-[#f6f6f6] md:h-[25rem] md:rounded-[3.5rem]">
                                            <img
                                                src={card.image}
                                                alt=""
                                                loading="lazy"
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex w-full max-w-[560px] flex-1 items-center">
                                        <div>
                                            <h2 className="text-4xl font-semibold leading-[1.2] tracking-[-0.04em] text-[#010103] md:text-5xl lg:text-[4.5rem]">
                                                {card.title}
                                            </h2>
                                            <p className="mt-6 text-xl font-medium leading-[1.6] text-[#010103]">
                                                {card.text}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --------------------------- REVIEWS --------------------------- */}
                <section
                    id="reviews"
                    className="overflow-hidden rounded-[2.5rem] bg-[#010103]"
                >
                    <div className="px-[5%] py-20 md:py-28">
                        <div className="mx-auto w-full max-w-[80rem]">
                            <div className="mb-14 flex flex-col items-center gap-6 text-center">
                                <div className="text-xl font-medium text-white/80 md:text-2xl">
                                    Why We&apos;re Doing This
                                </div>
                                <h2 className="text-4xl font-semibold leading-[1.2] tracking-[-0.04em] text-white md:text-6xl lg:text-[4.5rem]">
                                    Playing the piano
                                    <br />
                                    doesn&apos;t have to hurt
                                </h2>
                            </div>
                            <div className="flex flex-col gap-12 lg:flex-row">
                                <div className="w-full max-w-[32rem] flex-none self-start overflow-hidden rounded-3xl">
                                    <img
                                        src="/images/marketing/Profile-Image_1.webp"
                                        alt=""
                                        loading="lazy"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <TestimonialSlider />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ------------------------ BIG IMAGE CTA ------------------------ */}
                <section className="bg-[#0a0a0f]">
                    <div className="px-[5%] py-20 md:py-28">
                        <div className="mx-auto w-full max-w-[80rem]">
                            <div className="relative overflow-hidden rounded-3xl">
                                <div
                                    className="relative flex h-[39.5rem] w-full items-end overflow-hidden p-6 pb-10 md:pb-14 md:pl-14"
                                    style={{
                                        backgroundImage:
                                            "url('/images/keyboards/Main-Product-In-Studio-1-1_1.avif')",
                                        backgroundPosition: "0 0",
                                        backgroundSize: "cover",
                                    }}
                                >
                                    <div className="relative z-10 flex w-full max-w-[45.5rem] flex-col gap-5">
                                        <h2 className="text-4xl font-semibold leading-[1.2] tracking-[-0.04em] text-white md:text-5xl lg:text-[4.5rem]">
                                            Be the First to
                                            <br />
                                            Experience DreamPlay.
                                        </h2>
                                        <p className="text-lg leading-[1.65] text-white md:text-xl">
                                            We&apos;ve finished the design. Now, we need your help
                                            to begin production. By reserving now, you&apos;re not
                                            just pre-ordering a keyboard - you&apos;re helping
                                            bring a new standard of instrument to life.
                                        </p>
                                    </div>
                                    <div
                                        className="absolute inset-x-0 bottom-0 h-[19.625rem] backdrop-blur-[4px]"
                                        style={{
                                            backgroundImage:
                                                "linear-gradient(rgba(8,8,8,0), #080808)",
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --------------------------- RESERVE --------------------------- */}
                <section id="Reserve" className="bg-white">
                    <div className="px-[5%] py-20 md:py-28">
                        <div className="mx-auto flex w-full max-w-[50rem] flex-col items-center gap-8 text-center">
                            <div>
                                <p className="text-2xl font-bold leading-[1.4] tracking-[-0.02em] text-[#010103]">
                                    Lock in the $599 Founder&apos;s Price
                                </p>
                                <div className="mt-4 text-lg font-medium leading-[1.6] text-[#010103]">
                                    The DreamPlay One will launch at <strong>$899</strong>. Due to
                                    the early stage, we are offering this keyboard at the
                                    incredible price of $599 (with free shipping). This is the
                                    lowest price we will ever offer.
                                </div>
                            </div>
                            <div className="w-full max-w-[19rem]">
                                <AbCtaLink
                                    cta="legacy_home_reserve"
                                    className="relative flex h-14 w-full items-center rounded-[2rem] border border-[#010103] bg-[#010103] py-1 pl-6 pr-16 text-base font-medium text-white transition-transform duration-200 hover:scale-[1.02]"
                                >
                                    <span className="relative z-[2] w-full text-center font-bold">
                                        Secure My Discount
                                    </span>
                                    <span className="absolute right-[7px] top-[7px] flex h-10 w-10 items-center justify-center rounded-full bg-white pl-1 text-[#010103]">
                                        <ArrowIcon />
                                    </span>
                                </AbCtaLink>
                            </div>
                            <div className="text-lg font-medium leading-[1.6] text-[#010103]">
                                Available in White or Black
                            </div>

                            <PianoSwiper />
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
