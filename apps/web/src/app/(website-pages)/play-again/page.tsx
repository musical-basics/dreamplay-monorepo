/* eslint-disable @next/next/no-img-element */
import React from "react";
import Link from "next/link";
import { InlineHandGuide } from "@/components/InlineHandGuide";
import { SmallHandsGuideCapture } from "@/components/SmallHandsGuideCapture";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AbCtaLink } from "@/components/ab/AbCtaLink";
import BackgroundVideo from "../legacy-home/background-video";
import PianoSwiper from "../legacy-home/piano-swiper";

// A/B variant page (7a/7b, "Love of the piano") - must never be indexed.
export const metadata = {
    title: "DreamPlay",
    robots: { index: false, follow: false },
};

/* ------------------------------------------------------------------ */
/* Shared bits (same pill-button family as legacy-home)                */
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

/** Inner markup of the white pill button (label + dark arrow circle). */
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
/* Sizing cards ("Find Your Perfect Fit"), same family as legacy-home  */
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
/* Repertoire cards ("the slides")                                     */
/* ------------------------------------------------------------------ */

const REPERTOIRE_CARDS: { theme: "dark" | "light"; title: string; text: string }[] = [
    {
        theme: "dark",
        title: "The tenth",
        text: "Reach it as one chord, not a roll. The interval that was always half an inch too far sits under your hand.",
    },
    {
        theme: "light",
        title: "The inner notes",
        text: "Big chords stop being outer shells. The middle voices you used to drop are back under your fingers.",
    },
    {
        theme: "light",
        title: "Grieg",
        text: "“Wedding Day at Troldhaugen,” played the way it is written, stretches and all.",
    },
    {
        theme: "dark",
        title: "Rachmaninoff",
        text: "Written by a pianist with an enormous reach. Narrower keys bring his chords into yours.",
    },
];

/* ------------------------------------------------------------------ */
/* Return-story cards (paraphrased buyer patterns, no names)           */
/* ------------------------------------------------------------------ */

const RETURN_STORIES: { title: string; text: string }[] = [
    {
        title: "The one who quit after school",
        text: "They grew up assuming their hands would eventually grow into the keys. The hands never did, and after school the playing quietly ended.",
    },
    {
        title: "The one who cut practice shorter",
        text: "Every year the fingers and wrists ached a little sooner, so every year the sessions got a little shorter, until one year they stopped.",
    },
    {
        title: "The one caught at the key edge",
        text: "Octaves landed on the very edge of the keys, every time, for decades. At that stretch, accuracy at speed was never going to come, no matter how much they practiced.",
    },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function PlayAgainPage() {
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
                                        Is the piano still fun?
                                    </h1>
                                </div>
                                <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                                    <p className="text-xl font-bold leading-[1.6] text-white/80">
                                        Play the pieces you always wanted to play.
                                    </p>
                                    <div className="w-full max-w-[14rem]">
                                        <AbCtaLink
                                            cta="play_again_hero"
                                            className={pillButtonClass}
                                        >
                                            <PillButtonInner label="Start Playing Again" />
                                        </AbCtaLink>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --------------------------- RECOGNITION --------------------------- */}
                <section id="Recognition" className="bg-white">
                    <div className="px-[5%] py-20 md:py-28">
                        <div className="mx-auto w-full max-w-[80rem]">
                            <div className="mx-auto max-w-[61.625rem]">
                                <div className="text-center">
                                    <h2 className="text-4xl font-semibold leading-[1.2] tracking-[-0.04em] text-[#010103] md:text-6xl lg:text-[4.5rem]">
                                        There was a point
                                        <br />
                                        where you slowed down.
                                    </h2>
                                    <p className="mx-auto mt-8 max-w-[44rem] text-xl font-medium leading-[1.6] text-[#010103]">
                                        Not because you stopped loving the music. Playing simply
                                        stopped being enjoyable. The pieces you wanted stayed out
                                        of reach, practice turned into strain, and you assumed
                                        that was what getting older meant.
                                    </p>
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
                                                It was never effort.
                                            </h3>
                                            <p className="text-lg leading-[1.6] text-white/80">
                                                The barrier was geometry. The standard piano key
                                                was sized for one hand size, and it was not
                                                yours. Traditional keyboards fit handspans of
                                                8.5 inches or more, leaving behind most women
                                                and nearly a third of men.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-12 text-center text-3xl font-semibold leading-[1.3] tracking-[-0.02em] text-[#010103] md:text-[2.625rem]">
                                    You never lost the ability to want to play.
                                </p>
                            </div>
                            <div className="mx-auto mt-10 w-full max-w-[25rem] md:w-1/2">
                                <Link href="/how-it-works" className={pillButtonOutlinedClass}>
                                    <PillButtonInner label="See Why Key Width Matters" />
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

                {/* --------------------------- REPERTOIRE --------------------------- */}
                <section id="Repertoire" className="bg-white">
                    <div className="px-[5%] py-20 md:py-28">
                        <div className="mx-auto w-full max-w-[80rem]">
                            <div className="mb-12 text-center">
                                <p className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
                                    What Opens Up
                                </p>
                                <h2 className="text-balance text-4xl font-bold tracking-tight text-black md:text-5xl lg:text-6xl">
                                    The music comes back.
                                </h2>
                                <p className="mx-auto mt-6 max-w-[44rem] text-xl font-medium leading-[1.6] text-[#010103]">
                                    On keys that fit your hand, the notes you have been rolling
                                    or leaving out are simply there.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                                {REPERTOIRE_CARDS.map((card) => (
                                    <div
                                        key={card.title}
                                        className={`flex flex-col rounded-3xl p-10 transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.02] ${
                                            card.theme === "dark"
                                                ? "bg-black text-white hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]"
                                                : "border-[5px] border-solid border-black bg-white text-black hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
                                        }`}
                                    >
                                        <h3 className="mb-4 text-[2rem] font-extrabold leading-[1.1]">
                                            {card.title}
                                        </h3>
                                        <p
                                            className={`text-lg font-medium leading-relaxed ${
                                                card.theme === "dark"
                                                    ? "text-gray-400"
                                                    : "text-gray-500"
                                            }`}
                                        >
                                            {card.text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* --------------------------- SIZING --------------------------- */}
                <section id="Sizing" className="bg-white">
                    <div className="px-[5%] pb-20 md:pb-28">
                        <div className="mx-auto w-full max-w-[1600px]">
                            <div className="mb-12 text-center">
                                <p className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
                                    Three Key Widths
                                </p>
                                <h2 className="text-balance text-4xl font-bold tracking-tight text-black md:text-5xl lg:text-6xl">
                                    Find Your Perfect Fit.
                                </h2>
                                <p className="mx-auto mt-6 max-w-[44rem] text-xl font-medium leading-[1.6] text-[#010103]">
                                    The number matters because of the music it unlocks. Measure
                                    your handspan, pick the width, and the repertoire follows.
                                </p>
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
                            {/* Email-gated: the hand-measuring guide is the
                                strongest capture asset, never a bare link. */}
                            <div className="mx-auto mt-6 w-full max-w-2xl">
                                <InlineHandGuide />
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

                {/* ------------------------- RETURN STORIES ------------------------- */}
                <section
                    id="return-stories"
                    className="overflow-hidden rounded-[2.5rem] bg-[#010103]"
                >
                    <div className="px-[5%] py-20 md:py-28">
                        <div className="mx-auto w-full max-w-[80rem]">
                            <div className="mb-14 flex flex-col items-center gap-6 text-center">
                                <div className="text-xl font-medium text-white/80 md:text-2xl">
                                    Who Buys This Piano
                                </div>
                                <h2 className="text-4xl font-semibold leading-[1.2] tracking-[-0.04em] text-white md:text-6xl lg:text-[4.5rem]">
                                    Most of our buyers
                                    <br />
                                    are coming back.
                                </h2>
                                <p className="max-w-[44rem] text-lg leading-[1.65] text-white/80 md:text-xl">
                                    Not beginners. People who played for years, stopped, and
                                    never quite stopped missing it. The same stories keep
                                    reaching us, in different words.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
                                {RETURN_STORIES.map((story) => (
                                    <div
                                        key={story.title}
                                        className="flex flex-col rounded-3xl border border-white/15 bg-white/5 p-8"
                                    >
                                        <h3 className="mb-4 text-2xl font-semibold leading-[1.2] text-white">
                                            {story.title}
                                        </h3>
                                        <p className="text-lg leading-[1.65] text-white/70">
                                            {story.text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-14 text-center text-3xl font-semibold leading-[1.3] tracking-[-0.02em] text-white md:text-[2.625rem]">
                                We are how people come back.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ------------------------- FOUNDER NOTE ------------------------- */}
                <section id="founder-note" className="bg-white">
                    <div className="px-[5%] py-20 md:py-28">
                        <div className="mx-auto w-full max-w-[50rem] text-center">
                            <p className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
                                A Note From the Founder
                            </p>
                            <div className="text-left text-xl font-medium leading-[1.7] text-[#010103] md:text-2xl">
                                <p>
                                    I am a piano teacher and a YouTuber. I never planned to
                                    become a manufacturer. But for years, people kept telling me
                                    the same thing: my hands are too small. I heard it so many
                                    times that I stopped believing the problem was the players.
                                </p>
                                <p className="mt-6">
                                    So I am building the piano I could not find, with keys sized
                                    for real hands, so nobody has to give up the music they
                                    love.
                                </p>
                            </div>
                            <p className="mt-8 text-lg font-semibold text-[#010103]">
                                Lionel, founder of DreamPlay
                            </p>
                        </div>
                    </div>
                </section>

                {/* --------------------------- RESERVE --------------------------- */}
                <SmallHandsGuideCapture />

                <section id="Reserve" className="bg-white">
                    <div className="px-[5%] py-20 md:py-28">
                        <div className="mx-auto flex w-full max-w-[50rem] flex-col items-center gap-8 text-center">
                            <div>
                                <p className="text-2xl font-bold leading-[1.4] tracking-[-0.02em] text-[#010103]">
                                    Lock in the $999 Founder&apos;s Price
                                </p>
                                <div className="mt-4 text-lg font-medium leading-[1.6] text-[#010103]">
                                    The DreamPlay One will launch at an MSRP of{" "}
                                    <strong>$1,499</strong>. Reserve yours now for $999 with
                                    free shipping, the lowest price we will ever offer. Every
                                    reservation is covered by a money-back guarantee any time
                                    before your piano ships. Estimated delivery: May 2027.
                                </div>
                            </div>
                            <div className="w-full max-w-[19rem]">
                                <AbCtaLink
                                    cta="play_again_reserve"
                                    className="relative flex h-14 w-full items-center rounded-[2rem] border border-[#010103] bg-[#010103] py-1 pl-6 pr-16 text-base font-medium text-white transition-transform duration-200 hover:scale-[1.02]"
                                >
                                    <span className="relative z-[2] w-full text-center font-bold">
                                        Reserve My Piano
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
