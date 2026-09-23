import { WebflowRuntime } from "@/components/webflow-home/WebflowRuntime";

/**
 * Route group for the Webflow-era homepage (port of dreamplay-website at
 * commit 1d47b9f, served as /webflow-home and pinned as /main).
 *
 * The three Webflow stylesheets are global by nature (element resets,
 * `.container`, `.button`, ...). They are rendered as plain <link> elements
 * WITHOUT a `precedence` prop, so React keeps them in place inside this
 * layout's DOM instead of hoisting them: they are in the SSR HTML (no
 * unstyled flash) and are removed the moment a visitor navigates client-side
 * to any route outside this group, so the Tailwind pages never see them.
 * Same technique the legacy repo adopted on 2026-03-12
 * ((website-pages)/layout.tsx). Load order matters: after Tailwind's
 * globals.css (head), normalize -> webflow -> site theme, exactly as in the
 * original <head>.
 *
 * Fonts: the original used Google's WebFont loader for Lato + Manrope; the
 * same families/weights come from the Google Fonts stylesheet here.
 */
const GOOGLE_FONTS_HREF =
    "https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&family=Manrope:wght@400;500;600;700;800&display=swap";

export default function WebflowHomeLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <div className="webflow-site">
            {/* eslint-disable @next/next/no-css-tags -- Webflow export CSS must stay unbundled and ordered */}
            <link href="/css/normalize.css" rel="stylesheet" type="text/css" />
            <link href="/css/webflow.css" rel="stylesheet" type="text/css" />
            <link href="/css/lionels-stunning-site-07720d.webflow.css" rel="stylesheet" type="text/css" />
            {/* eslint-enable @next/next/no-css-tags */}
            <link href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css" rel="stylesheet" />
            <link href={GOOGLE_FONTS_HREF} rel="stylesheet" />
            {children}
            <WebflowRuntime />
        </div>
    );
}
