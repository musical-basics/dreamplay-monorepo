"use client";

import { usePathname } from "next/navigation";
import { AnalyticsBeacon, AnalyticsProvider } from "@dreamplay/analytics/react";
import { createGetAbAssignments } from "@dreamplay/ab";
import { experiments } from "@/config/experiments";

/**
 * Client-side app providers, mounted once in the root layout so every page
 * (and the popups/banners that live in the layout itself) can call
 * useAnalytics().
 *
 * - AnalyticsProvider: one analytics client for the app lifetime, posting to
 *   /api/track. getAbAssignments reads the ab_* cookies stamped by the
 *   middleware (validated against the registry) on EVERY event, so all
 *   exposures and conversions carry metadata.ab_variant / ab_experiments.
 * - AnalyticsBeacon: pageview per App Router path change (usePathname) +
 *   page_leave with duration on tab hide/close.
 */
function Beacon() {
  const pathname = usePathname();
  return <AnalyticsBeacon pathname={pathname} />;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AnalyticsProvider
      config={{
        endpoint: "/api/track",
        getAbAssignments: createGetAbAssignments(experiments),
      }}
    >
      {children}
      <Beacon />
    </AnalyticsProvider>
  );
}
