"use client";

/**
 * React bindings for the A/B funnel (Decision D11).
 *
 * Mount one <AbFunnelProvider config={abFunnel} pathname={usePathname()}>
 * near the root. It reads the dp_ab cookie after hydration (initial render
 * always uses the fallback so server and client markup match), and exposes:
 *
 *   useAbVariation()      → the visitor's AbVariation, or undefined (main funnel)
 *   useAbCta("/customize") → the href a CTA should point at:
 *       - assigned visitors get their variation's CTA (they carry it on every
 *         page — "continuously shown that variant going forward"),
 *       - visitors on /main get the manually-configured main CTA,
 *       - everyone else keeps the page's own default.
 *
 * An href swapping shortly after hydration is invisible to the user — CTA
 * targets only matter at click time.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import {
  applyCtaBase,
  findVariation,
  type AbFunnelConfig,
  type AbVariation,
} from "./funnel";
import { readAbVariantFromCookieString } from "./cookies";

interface AbFunnelContextValue {
  config: AbFunnelConfig;
  variation: AbVariation | undefined;
  pathname: string | undefined;
}

const AbFunnelContext = createContext<AbFunnelContextValue | null>(null);

export function AbFunnelProvider({
  config,
  pathname,
  children,
}: {
  config: AbFunnelConfig;
  /** Pass usePathname() so the /main CTA override tracks client navigations. */
  pathname?: string;
  children: ReactNode;
}) {
  const [variantKey, setVariantKey] = useState<string | undefined>(undefined);

  // Read the cookie after mount (SSR-safe) and re-check on every navigation —
  // a visitor can enter the funnel mid-session by clicking an /ab link.
  useEffect(() => {
    setVariantKey(readAbVariantFromCookieString(document.cookie, config));
  }, [config, pathname]);

  const variation = findVariation(config, variantKey)?.variation;
  return (
    <AbFunnelContext.Provider value={{ config, variation, pathname }}>
      {children}
    </AbFunnelContext.Provider>
  );
}

/** The visitor's assigned variation, or undefined for the /main funnel. */
export function useAbVariation(): AbVariation | undefined {
  return useContext(AbFunnelContext)?.variation;
}

/**
 * Resolve a CTA href. Pages keep their hardcoded default (`fallback`); the
 * funnel swaps the base path per the assignment / main config, preserving the
 * fallback's query and hash.
 */
export function useAbCta(fallback: string): string {
  const ctx = useContext(AbFunnelContext);
  if (!ctx) return fallback;
  // /main is outside the test (D14): its configured CTA wins even for
  // visitors holding a funnel cookie.
  if (ctx.pathname === "/main") return applyCtaBase(fallback, ctx.config.main.cta);
  if (ctx.variation) return applyCtaBase(fallback, ctx.variation.cta);
  return fallback;
}
