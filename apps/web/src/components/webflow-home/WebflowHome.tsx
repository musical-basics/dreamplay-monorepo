"use client";
/* eslint-disable @next/next/no-img-element */
import React, { useEffect } from "react";
import Link from "next/link";
import { AbCtaLink } from "@/components/ab/AbCtaLink";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { respSrcSet } from "./responsive";

/**
 * The Webflow-era DreamPlay homepage, ported verbatim from
 * dreamplay-website `src/app/page.tsx` at commit 1d47b9f (2026-01-02): the
 * last state of the original launch homepage before /special-offer and
 * /premium-offer were built. Markup, classes, copy and the Webflow
 * `data-w-id` hooks are unchanged; only these were adapted for the monorepo:
 *  - asset paths follow the March-2026 /public reorganisation (SEO names,
 *    categorised folders) and the purged `-p-` srcset variants are served
 *    through the Next image optimiser instead (see ./responsive.ts);
 *  - the two conversion CTAs use <AbCtaLink> so clicks score as `cta_click`
 *    and the destination follows the funnel config (/customize);
 *  - Navbar/Footer are the same-commit components, kept local to this port.
 * Styling comes from the Webflow stylesheets loaded by the (webflow-home)
 * route-group layout; the runtime (jQuery + webflow.js + Swiper) is booted by
 * <WebflowRuntime /> there.
 */
export default function WebflowHome() {
  useEffect(() => {
    // --- SIZING SECTION SCRIPT ---
    const mappings = [
      { source: 'loader-piano-1', target: 'target-piano-1' },
      { source: 'loader-hand-1', target: 'target-hand-1' },
      { source: 'loader-piano-2', target: 'target-piano-2' },
      { source: 'loader-hand-2', target: 'target-hand-2' },
      { source: 'loader-piano-3', target: 'target-piano-3' },
      { source: 'loader-hand-3', target: 'target-hand-3' }
    ];
    mappings.forEach(map => {
      const sourceImg = document.getElementById(map.source) as HTMLImageElement;
      const targetImg = document.getElementById(map.target) as HTMLImageElement;
      if (sourceImg && targetImg) {
        targetImg.src = sourceImg.src;
        if (sourceImg.srcset) targetImg.srcset = sourceImg.srcset;
      }
    });

    // --- SWIPER INIT ---
    // Poll for Swiper availability since it's loaded via lazy script
    type SwiperLike = { isBeginning: boolean; isEnd: boolean };
    type SwiperCtor = new (selector: string, options: Record<string, unknown>) => SwiperLike;
    let cancelled = false;
    const initSwiper = () => {
      if (cancelled) return;
      const SwiperGlobal = (window as unknown as { Swiper?: SwiperCtor }).Swiper;
      if (typeof SwiperGlobal !== 'undefined') {
        const swiper = new SwiperGlobal(".piano", {
          pagination: {
            el: ".swiper-pagination",
            clickable: true,
          },
          navigation: {
            nextEl: ".slide-next",
            prevEl: ".slide-back",
          },
          watchOverflow: true,
          on: {
            slideChange: function (this: SwiperLike) {
              if (this.isBeginning) {
                document.querySelector(".slide-back")?.setAttribute("style", "display: none !important");
              } else {
                document.querySelector(".slide-back")?.setAttribute("style", "display: flex !important");
              }
              if (this.isEnd) {
                document.querySelector(".slide-next")?.setAttribute("style", "display: none !important");
              } else {
                document.querySelector(".slide-next")?.setAttribute("style", "display: flex !important");
              }
            }
          }
        });

        // Initial check
        if (swiper.isBeginning) {
          document.querySelector(".slide-back")?.setAttribute("style", "display: none !important");
        }
      } else {
        setTimeout(initSwiper, 100);
      }
    };
    initSwiper();

    // --- BACKGROUND VIDEOS ---
    // React does not emit the `muted` attribute in server-rendered HTML, so
    // the browser's autoplay policy blocks the two Webflow background clips
    // until something calls play() after hydration. This is the same defect
    // the legacy repo fixed three days after this commit (009e93a, "Fix video
    // display on home page"): play while in view, pause when scrolled away.
    const videos = Array.from(document.querySelectorAll<HTMLVideoElement>(".section-video video"));
    videos.forEach((v) => {
      v.muted = true;
      v.defaultMuted = true;
    });
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const v = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            void v.play().catch(() => undefined);
          } else {
            v.pause();
          }
        });
      },
      { threshold: 0.1 }
    );
    videos.forEach((v) => videoObserver.observe(v));

    return () => {
      cancelled = true;
      videoObserver.disconnect();
    };
  }, []);

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="main-wrapper">
        <section className="section-hero">
          <div className="global-padding">
            <div className="container">
              <div className="hero-content-wrapper">
                <div className="hero-title-block">
                  <h1 data-w-id="a59ecacd-c7ce-77bd-8ce2-30263c56d483" className="h1-heading text-white">Introducing:&nbsp; DreamPlay One</h1>
                </div>
                <div data-w-id="ca99a284-ce87-a7a3-e5b5-f127871c8368" className="hero-lower-content">
                  <p className="p-large text-white-80"><strong>The keyboard that feels like a dream to play.</strong></p>
                  <div className="hero-lower-cta-block">
                    <div className="hero-btn-wrap">
                      <AbCtaLink cta="webflow_home_hero" data-wf--button-primary--variant="base" data-w-id="3571025f-8656-4207-fe0a-7eddcbc423cd"  className="button w-inline-block">
                        <div className="button_text">
                          <div>Pre-Order Now</div>
                        </div>
                        <div className="button_icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 18 10" fill="none" className="button_icon-svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12.0002 5.00391C12.0002 4.45162 11.5525 4.00391 11.0002 4.00391L1.00025 4.00391C0.44796 4.00391 0.000245026 4.45162 0.000245051 5.00391C0.000245075 5.55619 0.44796 6.00391 1.00025 6.00391L11.0002 6.00391C11.5525 6.00391 12.0002 5.55619 12.0002 5.00391Z" fill="currentColor"></path>
                            <path d="M17.3616 3.77448C18.2131 4.36865 18.2131 5.63135 17.3616 6.22552L12.3417 9.72824C11.3409 10.4266 10.0002 9.6933 10.0002 8.50272L10.0002 1.49728C10.0002 0.306709 11.3409 -0.426616 12.3417 0.271762L17.3616 3.77448Z" fill="currentColor"></path>
                          </svg>
                        </div>
                      </AbCtaLink>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="About" className="section-about">
          <div className="global-padding">
            <div className="section-padding">
              <div className="container">
                <div className="about-content-wrapper">
                  <div className="about-title-block">
                    <h2 className="h2-heading text-dark">Stop fighting a keyboard<br />that wasn&apos;t built for you.</h2>
                  </div>
                  <div data-w-id="6564439e-ea22-fa56-985e-c5e60601d5de" className="about-content-box">
                    <div className="about-c-image-block">
                      <div className="about-c-wrapper">
                        <h3 className="h3-large">Did you know?</h3>
                        <p className="p-medium text-white-80">Traditional pianos are designed for handspans of 8.5 inches or more, leaving behind most women and nearly a third of men.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="product-btn-wrapper">
                  <Link data-wf--button-primary--variant="base" data-w-id="3571025f-8656-4207-fe0a-7eddcbc423cd" href="/how-it-works" className="button w-inline-block">
                    <div className="button_text">
                      <div>Learn More About These Statistics</div>
                    </div>
                    <div className="button_icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 18 10" fill="none" className="button_icon-svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12.0002 5.00391C12.0002 4.45162 11.5525 4.00391 11.0002 4.00391L1.00025 4.00391C0.44796 4.00391 0.000245026 4.45162 0.000245051 5.00391C0.000245075 5.55619 0.44796 6.00391 1.00025 6.00391L11.0002 6.00391C11.5525 6.00391 12.0002 5.55619 12.0002 5.00391Z" fill="currentColor"></path>
                        <path d="M17.3616 3.77448C18.2131 4.36865 18.2131 5.63135 17.3616 6.22552L12.3417 9.72824C11.3409 10.4266 10.0002 9.6933 10.0002 8.50272L10.0002 1.49728C10.0002 0.306709 11.3409 -0.426616 12.3417 0.271762L17.3616 3.77448Z" fill="currentColor"></path>
                      </svg>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="section-video">
          <div data-poster-url="/videos/Clip-4-poster-00001.jpg" data-video-urls="/videos/Clip-4-transcode.mp4,/videos/Clip-4-transcode.webm" data-autoplay="true" data-loop="true" data-wf-ignore="true" className="background-video w-background-video w-background-video-atom">
            <video id="4e62a9f2-c6eb-7386-5791-e43c1255e09b-video" autoPlay loop muted playsInline style={{ backgroundImage: 'url("/videos/Clip-4-poster-00001.jpg")' }} data-wf-ignore="true" data-object-fit="cover">
              <source src="/videos/Clip-4-transcode.mp4" data-wf-ignore="true" />
              <source src="/videos/Clip-4-transcode.webm" data-wf-ignore="true" />
            </video>
            <noscript>
              <style>{`
                [data-wf-bgvideo-fallback-img] {
                  display: none;
                }
                @media (prefers-reduced-motion: reduce) {
                  [data-wf-bgvideo-fallback-img] {
                    position: absolute;
                    z-index: -100;
                    display: inline-block;
                    height: 100%;
                    width: 100%;
                    object-fit: cover;
                  }
                }
              `}</style>
              <img data-wf-bgvideo-fallback-img="true" src="/videos/Clip-4-poster-00001.jpg" alt="" />
            </noscript>
            <div aria-live="polite">
              <button type="button" data-w-bg-video-control="true" aria-controls="4e62a9f2-c6eb-7386-5791-e43c1255e09b-video" className="w-backgroundvideo-backgroundvideoplaypausebutton play-pause-btn w-background-video--control">
                <span className="play-state"><img src="https://uploads-ssl.webflow.com/6022af993a6b2191db3ed10c/628299f8aa233b83918e24fd_Pause.svg" loading="lazy" alt="Pause video" className="play-sate-image" /></span>
                <span hidden className="pause-state"><img loading="lazy" alt="Play video" src="https://uploads-ssl.webflow.com/6022af993a6b2191db3ed10c/628298b20ae0236682d4b87f_Play-24.svg" className="pause-state-image" /></span>
              </button>
            </div>
          </div>
        </section>
        <section id="Sizing" className="section-product">
          <div className="section-padding">
            <div className="global-padding">
              <div className="container">
                <div className="product-content-wrapper">
                  <div>
                    <div className="div-block-9">
                      <img src="/images/keyboards/ds55-white-narrow-keys-alt.png" loading="lazy" sizes="(max-width: 5000px) 100vw, 5000px" srcSet={respSrcSet("/images/keyboards/ds55-white-narrow-keys-alt.png")} alt="" id="loader-piano-1" />
                      <img src="/images/hands/zone-a-small-hands-diagram.png" loading="lazy" sizes="(max-width: 1808px) 100vw, 1808px" srcSet={respSrcSet("/images/hands/zone-a-small-hands-diagram.png")} alt="" id="loader-hand-1" />
                      <img src="/images/keyboards/ds60-black-narrow-keys-side.png" loading="lazy" sizes="(max-width: 1224px) 100vw, 1224px" srcSet={respSrcSet("/images/keyboards/ds60-black-narrow-keys-side.png")} alt="" id="loader-piano-2" />
                      <img src="/images/hands/zone-b-medium-hands-diagram.png" loading="lazy" sizes="(max-width: 1802px) 100vw, 1802px" srcSet={respSrcSet("/images/hands/zone-b-medium-hands-diagram.png")} alt="" id="loader-hand-2" />
                      <img src="/images/keyboards/ds65-black-standard-digital-piano.png" loading="lazy" sizes="(max-width: 5000px) 100vw, 5000px" srcSet={respSrcSet("/images/keyboards/ds65-black-standard-digital-piano.png")} alt="" id="loader-piano-3" className="image-5" />
                      <img src="/images/hands/zone-c-standard-hands-diagram.png" loading="lazy" sizes="(max-width: 1808px) 100vw, 1808px" srcSet={respSrcSet("/images/hands/zone-c-standard-hands-diagram.png")} alt="" id="loader-hand-3" />
                    </div>
                    {/* Embedded Sizing Section with Tailwind via CDN in source but we can just use styles provided */}
                    <div>
                      <style>{`
                        /* --- GLOBAL SETTINGS --- */
                        .piano-section { font-family: 'Manrope', sans-serif; }
                        .piano-title { font-size: 2rem; font-weight: 800; margin-bottom: 0.75rem; line-height: 1.1; }
                        .piano-desc { font-size: 1.125rem; line-height: 1.6; font-weight: 500; white-space: pre-line; }
                        .zone-label { font-size: 3rem; font-weight: 800; text-align: center; margin-top: 1.5rem; letter-spacing: -0.02em; }
                        @media (min-width: 768px) { .zone-label { font-size: 3.75rem; } }
                        .piano-card { border-radius: 1.5rem; padding: 2rem; display: flex; flex-direction: column; transition: all 0.3s ease-out; }
                        .piano-card:hover { transform: scale(1.03) translateY(-8px); z-index: 50; }
                        .theme-dark { background-color: #000000; color: #ffffff; }
                        .theme-dark .piano-desc { color: #9ca3af; }
                        .theme-dark:hover { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
                        .theme-light { background-color: #ffffff; color: #000000; border: 5px solid #000000; }
                        .theme-light .piano-desc { color: #6b7280; }
                        .theme-light:hover { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
                        .img-container { width: 100%; aspect-ratio: 3/2; position: relative; overflow: hidden; }
                        .img-container.piano-view { display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; }
                        .img-container.hand-view { border-radius: 1rem; margin-top: auto; }
                      `}</style>
                      <section className="max-w-[1600px] mx-auto px-4 py-16 piano-section">
                        <div className="text-center mb-12">
                          <p className="text-gray-500 text-sm tracking-wide mb-4 uppercase font-bold">Introducing the Sizes</p>
                          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black text-balance tracking-tight">Find Your Perfect Fit.</h1>
                        </div>
                        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
                          <div className="flex flex-col md:flex-row flex-[2]">
                            <div className="flex-1 piano-card theme-dark md:rounded-r-none">
                              <div className="img-container piano-view">
                                <img id="target-piano-1" src={undefined as unknown as string} alt="Piano DS5.5" className="object-contain max-h-full w-auto" />
                              </div>
                              <div className="text-center mb-6">
                                <h2 className="piano-title">Piano DS5.5</h2>
                                <p className="piano-desc">Perfect for handspans under 7.6 inches.</p>
                              </div>
                              <div className="img-container hand-view">
                                <img id="target-hand-1" src={undefined as unknown as string} alt="Hand Zone A" className="absolute inset-0 w-full h-full object-cover" />
                              </div>
                              <p className="zone-label">Zone A</p>
                            </div>
                            <div className="flex-1 piano-card theme-light relative z-10 mt-4 md:mt-0 md:-ml-4 md:rounded-l-none">
                              <div className="img-container piano-view">
                                <img id="target-piano-2" src={undefined as unknown as string} alt="Piano DS6.0" className="object-contain max-h-full w-auto" />
                              </div>
                              <div className="text-center mb-6">
                                <h2 className="piano-title">Piano DS6.0</h2>
                                <p className="piano-desc">Perfect for handspans between 7.6-8.5 inches.</p>
                              </div>
                              <div className="img-container hand-view">
                                <img id="target-hand-2" src={undefined as unknown as string} alt="Hand Zone B" className="absolute inset-0 w-full h-full object-cover" />
                              </div>
                              <p className="zone-label">Zone B</p>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="piano-card theme-dark h-full">
                              <div className="img-container piano-view">
                                <img id="target-piano-3" src={undefined as unknown as string} alt="Standard Piano" className="object-contain max-h-full w-auto" />
                              </div>
                              <div className="text-center mb-6">
                                <h2 className="piano-title">Standard Piano</h2>
                                <p className="piano-desc">Perfect for handspans over 8.5 inches.</p>
                              </div>
                              <div className="img-container hand-view">
                                <img id="target-hand-3" src={undefined as unknown as string} alt="Hand Zone C" className="absolute inset-0 w-full h-full object-cover" />
                              </div>
                              <p className="zone-label">Zone C</p>
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>
                  <div className="product-btn-wrapper">
                    <a data-wf--button-primary--variant="base" data-w-id="3571025f-8656-4207-fe0a-7eddcbc423cd" href="https://www.dropbox.com/scl/fi/9b72rbi4ga0pjterxyoan/DreamPlay-Infographic.pdf?rlkey=mc08i1ahn5tp3thdd0qjnag2d&amp;st=olbh1t9w&amp;dl=1" target="_blank" className="button w-inline-block">
                      <div className="button_text">
                        <div>Download Our Hand-Measuring Guide</div>
                      </div>
                      <div className="button_icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 18 10" fill="none" className="button_icon-svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12.0002 5.00391C12.0002 4.45162 11.5525 4.00391 11.0002 4.00391L1.00025 4.00391C0.44796 4.00391 0.000245026 4.45162 0.000245051 5.00391C0.000245075 5.55619 0.44796 6.00391 1.00025 6.00391L11.0002 6.00391C11.5525 6.00391 12.0002 5.55619 12.0002 5.00391Z" fill="currentColor"></path>
                          <path d="M17.3616 3.77448C18.2131 4.36865 18.2131 5.63135 17.3616 6.22552L12.3417 9.72824C11.3409 10.4266 10.0002 9.6933 10.0002 8.50272L10.0002 1.49728C10.0002 0.306709 11.3409 -0.426616 12.3417 0.271762L17.3616 3.77448Z" fill="currentColor"></path>
                        </svg>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* ... Skipping Feature/Video/Details/Reviews sections for brevity? No, user needs full migration. I will add them in blocks ... */}
        {/* I will add the remaining sections now. Features, Video 2, Details, Reviews, Reserve */}

        <section id="Feature" className="section-feature">
          <div className="section-padding top-0">
            <div className="global-padding">
              <div className="container">
                <div className="feature-wrapper">
                  <div className="feature-tittle-upper">
                    <div data-w-id="30e253e2-26e0-500b-5a23-12b313dc5392" className="p-large text-gray">Our Features</div>
                    <h2 className="h2-heading text-dark">Everything You Need, Built In</h2>
                  </div>
                  <div className="feature-card-block">
                    {/* Feature Cards - I'll just copy structure */}
                    <div className="feature-card-wrap">
                      <div className="f-card-icon-block"><img src="/images/icons/image-3.svg" loading="lazy" alt="" className="f-card-icon" /></div>
                      <div className="f-card-text-block"><div className="p-regular">Built-in Metronome</div></div>
                    </div>
                    {/* ... (repeated for other cards) ... */}
                    {/* For brevity in this tool call I included key ones, but I'll paste all. 
                        Wait, I must produce the full file. */}
                    <div className="feature-card-wrap"><div className="f-card-icon-block"><img src="/images/icons/image-4.svg" loading="lazy" alt="" className="f-card-icon" /></div><div className="f-card-text-block"><div className="p-regular">Recording &amp; Playback</div></div></div>
                    <div className="feature-card-wrap"><div className="f-card-icon-block"><img src="/images/icons/Feature-Icon.svg" loading="lazy" alt="" className="f-card-icon" /></div><div className="f-card-text-block"><div className="p-regular">256-note Polyphony</div></div></div>
                    <div className="feature-card-wrap"><div className="f-card-icon-block"><img src="/images/icons/Feature-Icon_1.svg" loading="lazy" alt="" className="f-card-icon" /></div><div className="f-card-text-block"><div className="small">Dual-Sensor Velocity Keys</div></div></div>
                    <div className="feature-card-wrap"><div className="f-card-icon-block"><img src="/images/icons/Feature-Icon-5.svg" loading="lazy" alt="" className="f-card-icon" /></div><div className="f-card-text-block"><div className="p-regular">MIDI Sequencing</div></div></div>
                    <div className="feature-card-wrap"><div className="f-card-icon-block"><img src="/images/icons/volume-icon.png" loading="lazy" alt="" className="f-card-icon" /></div><div className="f-card-text-block"><div className="p-regular">18 Essential Presets</div></div></div>
                    <div className="feature-card-wrap"><div className="f-card-icon-block"><img src="/images/icons/monitor.png" loading="lazy" alt="" className="f-card-icon" /></div><div className="f-card-text-block"><div className="p-regular">Backlit LCD Screen</div></div></div>
                    <div className="feature-card-wrap"><div className="f-card-icon-block"><img src="/images/icons/grand-piano-icon.png" loading="lazy" alt="" className="f-card-icon" /></div><div className="f-card-text-block"><div className="p-regular">Grand Piano Sound</div></div></div>
                    <div className="feature-card-wrap"><div className="f-card-icon-block"><img src="/images/icons/headphone-icon.png" loading="lazy" width={200} height={200} alt="" className="f-card-icon" /></div><div className="f-card-text-block"><div className="p-regular">High-fidelity Speakers and Headphone Audio</div></div></div>
                    <div className="feature-card-wrap"><div className="f-card-icon-block"><img src="/images/icons/Feature-Icon-4.svg" loading="lazy" alt="" className="f-card-icon" /></div><div className="f-card-text-block"><div className="p-regular">88 Graded, Weighted Keys</div></div></div>
                    <div className="feature-card-wrap"><div className="f-card-icon-block"><img src="/images/icons/bluetooth-app-icon.png" loading="lazy" alt="" className="f-card-icon" /></div><div className="f-card-text-block"><div className="p-regular">Bluetooth Connectivity</div></div></div>
                    <div className="feature-card-wrap"><div className="f-card-icon-block"><img src="/images/icons/LED-lights.png" loading="lazy" alt="" className="f-card-icon" /></div><div className="f-card-text-block"><div className="p-regular">LED&nbsp;Lighting<br />For Every Key</div></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-video">
          <div data-poster-url="/videos/Clip-6_poster.0000000.jpg" data-video-urls="/videos/Clip-6_mp4.mp4,/videos/Clip-6_webm.webm" data-autoplay="true" data-loop="true" data-wf-ignore="true" className="background-video w-background-video w-background-video-atom">
            <video id="b54bc504-e392-a5be-2c03-818d3fff894c-video" autoPlay loop muted playsInline style={{ backgroundImage: 'url("/videos/Clip-6_poster.0000000.jpg")' }} data-wf-ignore="true" data-object-fit="cover">
              <source src="/videos/Clip-6_mp4.mp4" data-wf-ignore="true" />
              <source src="/videos/Clip-6_webm.webm" data-wf-ignore="true" />
            </video>
          </div>
        </section>

        <section id="details" className="section-product">
          <div className="section-padding">
            <div className="global-padding">
              <div className="container">
                <div className="product-cards">
                  <div className="product-card-wrapper">
                    <div className="product-card-block">
                      <div className="product-image-wrap"><img src="/images/marketing/dreamplay-one-hero-studio.jpg" loading="lazy" width={1024} height={200} alt="" srcSet={respSrcSet("/images/marketing/dreamplay-one-hero-studio.jpg")} sizes="100vw" className="product-picture" /></div>
                    </div>
                    <div className="product-card-content-wrap">
                      <div className="product-card-content-block">
                        <div className="product-card-tittle-block">
                          <h2 className="h2-heading">Modern Design, Subtle Brilliance</h2>
                        </div>
                        <div className="product-card-text-block">
                          <p className="p-large">LED lights make each key press feel extra satisfying. A sleek design that looks good in any setting.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="product-card-wrapper is-reversed">
                    <div className="product-card-block">
                      <div className="product-image-wrap"><img src="/images/stock/article-placeholder.jpg" loading="lazy" width={100} height="Auto" alt="" className="product-picture" /></div>
                    </div>
                    <div className="product-card-content-wrap">
                      <div className="product-card-content-block">
                        <div className="product-card-tittle-block">
                          <h2 className="h2-heading">Authentic Grand<br />Piano Feel</h2>
                        </div>
                        <div className="product-card-text-block">
                          <p className="p-large">High quality, graded keys that feel like a real grand piano.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="product-card-wrapper">
                    <div className="product-card-block">
                      <div className="product-image-wrap"><img src="/images/marketing/pianist-hands-on-narrow-keys.jpg" loading="lazy" sizes="100vw" srcSet={respSrcSet("/images/marketing/pianist-hands-on-narrow-keys.jpg")} alt="" className="product-picture" /></div>
                    </div>
                    <div className="product-card-content-wrap">
                      <div className="product-card-content-block">
                        <div className="product-card-tittle-block">
                          <h2 className="h2-heading">Pristine,<br />Inspiring Sound</h2>
                        </div>
                        <div className="product-card-text-block">
                          <p className="p-large">A beautiful, rich grand piano sound with every key press.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="reviews" className="section-slider">
          {/* Slider section content */}
          <div className="section-padding">
            <div className="global-padding">
              <div className="container">
                <div className="slider-wrapper">
                  {/* ... Content ... */}
                  {/* I'll approximate the structure for brevity but ensure it works. 
                       Actually, I should copy the slider HTML properly. */}
                  <div className="slider-tittle-block">
                    <div className="feature-tittle-upper">
                      <div data-w-id="dcc09ef3-7f0f-df81-95bf-044228b340d9" className="p-large text-white-80">Why We’re Doing This</div>
                      <h2 data-w-id="dcc09ef3-7f0f-df81-95bf-044228b340db" className="h2-heading text-white">Playing the piano<br />doesn’t have to hurt</h2>
                    </div>
                  </div>
                  <div className="slider-main">
                    <div className="t-slider-wrapper">
                      <div className="slider-image-wrap">
                        <img
                          className="slider-imge"
                          src="/images/marketing/Profile-Image_1.webp"
                          width="Auto"
                          height="Auto"
                          alt=""
                          sizes="100vw"
                          loading="lazy"
                          srcSet="/images/marketing/Profile-Image_1Profile%20Image.webp 500w, /images/marketing/Profile-Image_1.webp 768w"
                        />
                      </div>
                      {/* This part uses Webflow Slider typically (w-slider). 
                             Webflow.js handles it. Text content is critical. */}
                      <div data-delay="4000" data-animation="slide" className="testimonial-slider w-slider" data-autoplay="false" data-easing="ease" data-hide-arrows="true" data-disable-swipe="true" data-autoplay-limit="0" data-nav-spacing="3" data-duration="500" data-infinite="true">
                        <div className="mask w-slider-mask">
                          {/* Slide 1 */}
                          <div className="testimonial-slide w-slide">
                            <div className="testi-slider-slide">
                              <div className="slider-content-block">
                                <div className="slider-summury-block">
                                  <p className="p-xxl _w-bold text-white">I often witness pianists place their hands for the first time on a keyboard that better suits their hand span. How often the pianist spontaneously bursts into tears. A lifetime of struggling with a seemingly insurmountable problem vanishes in the moment they realize, &quot;It&#x27;s not me that is the problem; it is the instrument!&quot; Following on that, the joy of possibility overwhelms them.</p>
                                </div>
                                <div className="slide-author-wrap">
                                  <div className="slide-author-image-block"><img src="/images/marketing/carol-leone.jpeg" loading="lazy" width="Auto" alt="" className="s-author-image" /></div>
                                  <div className="author-desc-block">
                                    <div className="author-name-block"><div className="p-large text-white">Dr. Carol Leone</div></div>
                                    <div className="author-text-block"><div className="p-small grey">Chair of Piano Studies</div><div className="p-small grey">SMU Meadows School of the Arts in Dallas, Texas,</div></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Slide 2 */}
                          <div className="testimonial-slide w-slide">
                            <div className="testi-slider-slide">
                              <div className="slider-content-block">
                                <div className="slider-summury-block">
                                  <p className="p-xxl _w-bold text-white">My favorite story is from a piano performance major, who couldn’t believe that playing the piano didn’t have to hurt. The instrument restored her joy for piano repertoire. She had been preparing to change over to harpsichord due to keyboard size issues. I will never forget the day she first played a Chopin ballade on the DS5.5. She literally could not stop beaming.</p>
                                </div>
                                <div className="slide-author-wrap">
                                  <div className="slide-author-image-block"><img src="/images/marketing/Kathryn-Ananda-Owens.png" loading="lazy" alt="" className="s-author-image" /></div>
                                  <div className="author-desc-block">
                                    <div className="author-name-block"><div className="p-large text-white">Kathryn-Ananda Owens</div></div>
                                    <div className="author-text-block"><div className="p-small grey">Professor of Music - Piano</div><div className="p-small grey">St Olaf College, Minnesota</div></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Slide 3 */}
                          <div className="testimonial-slide w-slide">
                            <div className="testi-slider-slide">
                              <div className="slider-content-block">
                                <div className="slider-summury-block">
                                  <p className="p-xxl _w-bold text-white">I can play for much longer and continue to play every day. I don’t get frustrated from the pain and from being limited in my playing.<br /><br />- Jen McCabe, <em>harmonypianostudio.com</em><br /></p>
                                </div>
                                <div className="slide-author-wrap">
                                  <div className="slide-author-image-block"><img src="/images/marketing/Jen-McCabe.png" loading="lazy" alt="" className="s-author-image" /></div>
                                  <div className="author-desc-block">
                                    <div className="author-name-block"><div className="p-large text-white">Jen McCabe</div></div>
                                    <div className="author-text-block"><div className="p-small grey">Pianist, teacher, music director</div><div className="p-small grey">North Park, Chicago, IL</div></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="slider-arrow back w-slider-arrow-left"><div className="w-icon-slider-left"></div></div>
                        <div className="slider-arrow w-slider-arrow-right"><div className="icon w-icon-slider-right"></div></div>
                        <div className="slide-nav w-slider-nav w-round"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-dreamplay">
          <div className="section-padding">
            <div className="global-padding">
              <div className="container">
                <div className="dreamplay-big-image-wrap">
                  <div data-w-id="621ec278-cfa0-294d-e5e3-062afdd38e54" className="dreamplay-big-image-block">
                    <div className="cta-c-block">
                      <div><h2 className="h2-heading text-white">Be the First to<br />Experience DreamPlay.</h2></div>
                      <div><p className="p-regular text-white">We&#x27;ve finished the design. Now, we need your help to begin production. By reserving now, you&#x27;re not just pre-ordering a keyboard - you&#x27;re helping bring a new standard of instrument to life.</p></div>
                    </div>
                  </div>
                  <div className="bg-blur"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="Reserve" className="section-discount">
          <div className="section-padding">
            <div className="global-padding">
              <div className="container">
                <div className="discount-all-content-wrap">
                  <div className="discount-all-content-block">
                    <div className="discount-summury-block">
                      <p className="p-xl _w-medium"><strong>Lock in the $599 Founder&#x27;s Price<br /></strong></p>
                      <div className="p-medium _w-medium">The DreamPlay One will launch at <strong>$899</strong>. Due to the early stage, we are offering this keyboard at the incredible price of $599 (with free shipping). This is the lowest price we will ever offer.</div>
                    </div>
                    <div className="discount-btn-block">
                      <AbCtaLink cta="webflow_home_reserve" data-w-id="f1d5c3cb-94af-550d-2aa5-b4cc60c9289e"  className="btn-secondary w-inline-block">
                        <div className="s-btn-text"><strong>Secure My Discount</strong></div>
                        <div className="button_icon white">
                          <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 18 10" fill="none" className="button_icon-svg black">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12.0002 5.00391C12.0002 4.45162 11.5525 4.00391 11.0002 4.00391L1.00025 4.00391C0.44796 4.00391 0.000245026 4.45162 0.000245051 5.00391C0.000245075 5.55619 0.44796 6.00391 1.00025 6.00391L11.0002 6.00391C11.5525 6.00391 12.0002 5.55619 12.0002 5.00391Z" fill="currentColor"></path>
                            <path d="M17.3616 3.77448C18.2131 4.36865 18.2131 5.63135 17.3616 6.22552L12.3417 9.72824C11.3409 10.4266 10.0002 9.6933 10.0002 8.50272L10.0002 1.49728C10.0002 0.306709 11.3409 -0.426616 12.3417 0.271762L17.3616 3.77448Z" fill="currentColor"></path>
                          </svg>
                        </div>
                      </AbCtaLink>
                    </div>
                    <div className="d-sm-text-block">
                      <div className="p-medium _w-medium">Available in White or Black</div>
                    </div>

                    {/* Swiper Section */}
                    <div className="piano-slider-block">
                      <div className="swiper piano">
                        <div data-w-id="a343a42c-8900-04d5-8f4b-feda93bf949b" className="swiper-wrapper">
                          <div className="swiper-slide">
                            <div className="discount-image-wrap">
                              <div className="slider-image-block"><img src="/images/keyboards/ds60-black-narrow-keys-piano.png" loading="lazy" sizes="100vw" srcSet={respSrcSet("/images/keyboards/ds60-black-narrow-keys-piano.png")} alt="" className="discount-im" /></div>
                            </div>
                          </div>
                          <div className="swiper-slide">
                            <div className="discount-image-wrap">
                              <div className="slider-image-block"><img src="/images/keyboards/ds55-white-narrow-keys-piano.png" loading="lazy" sizes="100vw" srcSet={respSrcSet("/images/keyboards/ds55-white-narrow-keys-piano.png")} alt="" className="discount-im" /></div>
                            </div>
                          </div>
                        </div>
                        <div className="swiper-pagination"></div>
                        <div className="slide-back"><div className="w-icon-slider-left"></div></div>
                        <div className="slide-next"><div className="icon w-icon-slider-right"></div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
