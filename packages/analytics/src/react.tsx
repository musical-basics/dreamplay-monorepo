"use client";

/**
 * React bindings for @dreamplay/analytics — Next.js App Router friendly
 * (client components only; the package itself never imports `next/*`).
 *
 * Usage in apps/web:
 * ```tsx
 * // app/providers.tsx ("use client")
 * <AnalyticsProvider config={{ getAbAssignments: createGetAbAssignments(experiments) }}>
 *   {children}
 * </AnalyticsProvider>
 *
 * // app/layout.tsx → a small client component:
 * const pathname = usePathname();
 * <AnalyticsBeacon pathname={pathname} />
 * ```
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

import { createAnalytics, type Analytics, type AnalyticsConfig } from "./client";

const AnalyticsContext = createContext<Analytics | null>(null);

export function AnalyticsProvider({
  config,
  children,
}: {
  config?: AnalyticsConfig;
  children: ReactNode;
}) {
  // Created once for the app lifetime; config is intentionally captured on
  // first render (identity/session state must not reset on re-render).
  const analyticsRef = useRef<Analytics | null>(null);
  if (analyticsRef.current === null) {
    analyticsRef.current = createAnalytics(config);
  }
  const value = analyticsRef.current;
  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

/**
 * Returns the ambient Analytics instance. Throws outside AnalyticsProvider —
 * a misplaced hook should fail loudly in development, not silently drop
 * events.
 */
export function useAnalytics(): Analytics {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error("useAnalytics must be used within <AnalyticsProvider>");
  return ctx;
}

/**
 * Fires `pageview` once per path change and `page_leave` on exit
 * (visibilitychange→hidden / pagehide, sendBeacon transport — the belgium
 * dp-analytics-beacon pattern).
 *
 * Pass `pathname` from `usePathname()` so App Router client-side navigations
 * are observed (this package does not import next/navigation). Without the
 * prop it falls back to window.location.pathname + popstate, which only
 * covers full loads and history navigation.
 */
export function AnalyticsBeacon({ pathname }: { pathname?: string }) {
  const analytics = useAnalytics();
  const lastTrackedPath = useRef<string | null>(null);

  // Pageview per path change.
  useEffect(() => {
    const firePath = pathname ?? (typeof window !== "undefined" ? window.location.pathname : null);
    if (firePath === null || lastTrackedPath.current === firePath) return;
    lastTrackedPath.current = firePath;
    void analytics.pageview();
  }, [analytics, pathname]);

  // Fallback path-change signal when no pathname prop is supplied.
  useEffect(() => {
    if (pathname !== undefined || typeof window === "undefined") return;
    const onPopState = () => {
      const path = window.location.pathname;
      if (lastTrackedPath.current === path) return;
      lastTrackedPath.current = path;
      void analytics.pageview();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [analytics, pathname]);

  // page_leave on real exits. pageLeave() is internally deduped, so firing
  // from both listeners is safe.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPageHide = () => void analytics.pageLeave();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") void analytics.pageLeave();
    };
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [analytics]);

  return null;
}
