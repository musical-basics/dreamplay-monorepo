import type { Metadata } from "next";
import WebflowHome from "@/components/webflow-home/WebflowHome";

/**
 * /webflow-home — the original Webflow homepage (dreamplay-website@1d47b9f,
 * 2026-01-02), pinned as the site's /main page. Metadata mirrors the
 * previous main page (/premium-offer): site title + canonical to the root,
 * since visitors reach it through the / -> /main rewrite. Direct hits on
 * /webflow-home are disallowed in robots.ts like every other layout route.
 */
export const metadata: Metadata = {
    title: "DreamPlay One | A Piano That Fits Your Hands",
    description:
        "The DreamPlay One is a premium digital piano with narrower keys designed to fit your hands — reducing strain, preventing injury, and unlocking pieces a standard keyboard puts out of reach.",
    alternates: {
        canonical: "https://dreamplaypianos.com",
    },
};

export default function WebflowHomePage() {
    return <WebflowHome />;
}
