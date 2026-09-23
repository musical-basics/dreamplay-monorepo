"use client";

import { useEffect } from "react";

/**
 * Boots the Webflow runtime for the (webflow-home) route group, replicating
 * what the dreamplay-website root layout did at commit 1d47b9f:
 * jQuery (Webflow's CDN build) -> /js/webflow.js (the site's exported
 * runtime: navbar, slider, background-video and IX2 interactions), plus
 * Swiper for the product carousel, which the page initialises itself.
 *
 * Scripts are injected once per browser session (async=false keeps the
 * jQuery -> webflow.js order). webflow.js initialises on first load by
 * itself; on later client-side visits to this page the runtime is already
 * present, so we re-run its ready() hooks against the fresh DOM (the
 * standard Webflow SPA re-init recipe). On unmount, destroy() detaches the
 * runtime's window/document listeners so nothing leaks onto other routes.
 */
const WF_SITE_ID = "68b99847f96fcca15429faec";
const JQUERY_SRC =
    "https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js?site=68b99847f96fcca15429faec";
const WEBFLOW_SRC = "/js/webflow.js";
const SWIPER_SRC = "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js";

interface WebflowRuntimeApi {
    destroy?: () => void;
    ready?: () => void;
    require?: (name: string) => { init?: () => void } | undefined;
}

declare global {
    interface Window {
        Webflow?: WebflowRuntimeApi;
        __webflowScriptPromises?: Record<string, Promise<void>>;
    }
}

function loadScriptOnce(src: string): Promise<void> {
    const cache = (window.__webflowScriptPromises ??= {});
    if (!cache[src]) {
        cache[src] = new Promise<void>((resolve, reject) => {
            const el = document.createElement("script");
            el.src = src;
            el.async = false;
            el.onload = () => resolve();
            el.onerror = () => {
                delete cache[src];
                reject(new Error(`Failed to load ${src}`));
            };
            document.body.appendChild(el);
        });
    }
    return cache[src];
}

export function WebflowRuntime() {
    useEffect(() => {
        let cancelled = false;
        const html = document.documentElement;
        html.setAttribute("data-wf-site", WF_SITE_ID);

        // Already booted => this is a client-side revisit and webflow.js will
        // not run again on its own.
        const alreadyBooted = typeof window.Webflow?.ready === "function";

        void loadScriptOnce(SWIPER_SRC).catch(() => undefined);
        loadScriptOnce(JQUERY_SRC)
            .then(() => loadScriptOnce(WEBFLOW_SRC))
            .then(() => {
                if (cancelled || !alreadyBooted) return;
                const wf = window.Webflow;
                wf?.destroy?.();
                wf?.ready?.();
                try {
                    wf?.require?.("ix2")?.init?.();
                } catch {
                    /* no IX2 data for this page */
                }
            })
            .catch(() => undefined);

        return () => {
            cancelled = true;
            html.removeAttribute("data-wf-site");
            try {
                window.Webflow?.destroy?.();
            } catch {
                /* ignore */
            }
        };
    }, []);

    return null;
}
