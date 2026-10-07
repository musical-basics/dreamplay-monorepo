"use client";

import { usePathname } from "next/navigation";
import { AnalyticsBeacon, AnalyticsProvider } from "@dreamplay/analytics/react";
import { createGetAbAssignments } from "@dreamplay/ab";
import { AbFunnelProvider } from "@dreamplay/ab/react";
import { abFunnel } from "@/config/ab";

/**
 * Client-side app providers, mounted once in the root layout so every page
 * (and the popups/banners that live in the layout itself) can call
 * useAnalytics() / useAbCta().
 *
 * - AnalyticsProvider: one analytics client for the app lifetime, posting to
 *   /api/track. getAbAssignments reads the dp_ab funnel cookie stamped by the
 *   middleware (validated against the registry) on every event, so exposures
 *   and conversions carry metadata.ab_variant. Events on /main are never
 *   tagged (D14): since 2026-10-07 cookie holders land on /main from `/` too,
 *   and the pinned homepage must stay out of the score sheet. Their later
 *   events elsewhere (e.g. /customize) still carry their assigned variant.
 * - AbFunnelProvider: exposes the visitor's variation + CTA swapping
 *   (useAbCta) to CTA components; pathname keeps the /main override accurate
 *   across client navigations.
 * - AnalyticsBeacon: pageview per App Router path change (usePathname) +
 *   page_leave with duration/clicks on tab hide/close.
 */
const getFunnelAssignments = createGetAbAssignments(abFunnel, { untaggedPaths: ["/main"] });

function Beacon() {
  const pathname = usePathname();
  return <AnalyticsBeacon pathname={pathname} />;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnalyticsProvider
      config={{
        endpoint: "/api/track",
        getAbAssignments: getFunnelAssignments,
      }}
    >
      <AbFunnelProvider config={abFunnel} pathname={pathname ?? undefined}>
        {children}
        <Beacon />
      </AbFunnelProvider>
    </AnalyticsProvider>
  );
}
