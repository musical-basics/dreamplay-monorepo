/**
 * Standalone tracker snippet — the `/tracker.js` replacement for legacy
 * non-Next sites (Shopify store, blog, crowdfund, ultimatepianist.com,
 * musicalbasics.com) at Phase 7 cutover (Decision D6).
 *
 * Built on the SAME core as the React app (src/client.ts) so cookie names,
 * session semantics, UTM capture and A/B tagging are identical — no more
 * tracker.js/AnalyticsTracker/beacon triple implementation. Dependency-free
 * TypeScript (no React, no zod, no supabase): compile with esbuild in a later
 * task, e.g.
 *
 *   esbuild src/snippet/tracker.ts --bundle --minify --format=iife --outfile=tracker.js
 *
 * Script-tag usage on legacy sites:
 *   <script src="https://dreamplaypianos.com/tracker.js"
 *           data-endpoint="https://dreamplaypianos.com/api/track"
 *           data-cookie-domain=".dreamplaypianos.com" async></script>
 *
 * Exposes window.dreamplay.track(eventName, metadata) for manual conversion
 * events, matching the legacy tracker.js global.
 */

import { createAnalytics, readCookie, type Analytics } from "../client";

export interface TrackerSnippetConfig {
  /** Ingest URL. Default: data-endpoint attribute, else "/api/track". */
  endpoint?: string;
  /** Cookie domain, e.g. ".dreamplaypianos.com". Default: data-cookie-domain. */
  cookieDomain?: string;
  /** Extra metadata stamped on every event (site tag etc.). */
  defaultMetadata?: Record<string, unknown>;
}

declare global {
  interface Window {
    dreamplay?: {
      track: (eventName: string, metadata?: Record<string, unknown>) => void;
      analytics: Analytics;
    };
  }
}

/** Reads config off the executing <script> tag's data- attributes. */
function scriptTagConfig(): TrackerSnippetConfig {
  try {
    const el = document.currentScript as HTMLScriptElement | null;
    if (!el) return {};
    return {
      endpoint: el.dataset.endpoint || undefined,
      cookieDomain: el.dataset.cookieDomain || undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Reads the dp_ab funnel cookie (Decision D11) without the @dreamplay/ab
 * dependency (the snippet must stay dependency-free). Same semantics as
 * @dreamplay/ab createGetAbAssignments, minus registry validation.
 */
function readAbCookies(): Record<string, string> {
  const assignments: Record<string, string> = {};
  try {
    const value = readCookie("dp_ab");
    if (value) assignments.funnel = value;
  } catch {
    // no cookie access — no tagging
  }
  return assignments;
}

/**
 * Initializes tracking: fires the initial pageview, wires page_leave to
 * pagehide/visibilitychange, and installs window.dreamplay.track.
 * Idempotent — a double-included script tag won't double-count.
 */
export function initTracker(config: TrackerSnippetConfig = {}): Analytics | undefined {
  if (typeof window === "undefined" || typeof document === "undefined") return undefined;
  if (window.dreamplay?.analytics) return window.dreamplay.analytics;

  const tagConfig = scriptTagConfig();
  const analytics = createAnalytics({
    endpoint: config.endpoint ?? tagConfig.endpoint ?? "/api/track",
    cookieDomain: config.cookieDomain ?? tagConfig.cookieDomain,
    defaultMetadata: config.defaultMetadata,
    getAbAssignments: readAbCookies,
  });

  window.dreamplay = {
    analytics,
    track: (eventName, metadata) => void analytics.track(eventName, metadata),
  };

  const firePageview = () => void analytics.pageview();
  if (document.readyState === "complete") {
    firePageview();
  } else {
    window.addEventListener("load", firePageview, { once: true });
  }

  const fireLeave = () => void analytics.pageLeave();
  window.addEventListener("pagehide", fireLeave);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") fireLeave();
  });

  return analytics;
}

// Auto-init when running as a compiled IIFE in a real page; harmless no-op in
// SSR/tests (initTracker guards on window/document).
initTracker();

export { readCookie };
