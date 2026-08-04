"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { useAbCta } from "@dreamplay/ab/react";
import { useAnalytics } from "@dreamplay/analytics/react";

/**
 * Funnel-aware CTA link. `href` is the page's own default destination
 * (usually /customize); visitors inside the A/B funnel get their variation's
 * CTA swapped in, and /main gets the manually-configured main CTA — query
 * string and hash of the default are preserved.
 *
 * Fires the `cta_click` scoring event with the given `cta` label. Use this
 * for main conversion CTAs on landing pages instead of a bare <Link>.
 */
export function AbCtaLink({
  href = "/customize",
  cta,
  onClick,
  children,
  ...rest
}: Omit<ComponentProps<typeof Link>, "href"> & {
  href?: string;
  /** Tracking label, e.g. "legacy_home_hero_reserve". */
  cta: string;
}) {
  const resolved = useAbCta(href);
  const analytics = useAnalytics();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Fire-and-forget (keepalive) — survives the navigation.
    void analytics.track("cta_click", { cta, href: resolved });
    onClick?.(event);
  };

  return (
    <Link href={resolved} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
