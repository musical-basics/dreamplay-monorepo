/**
 * Client-side bridge between the dp_ab funnel cookie and analytics.
 *
 * The middleware stamps `dp_ab=<variation key>` (httpOnly:false on purpose);
 * these helpers read it back so every analytics event — exposure AND
 * conversion, on any page — carries the visitor's variation. Visitors without
 * the cookie (the /main funnel) produce no assignment and therefore no
 * `ab_variant` metadata: that is what keeps /main out of the score sheet.
 * Keep the metadata key literally `ab_variant` (Decision D5/D11).
 */

import { AB_COOKIE, findVariation, type AbFunnelConfig } from "./funnel";

/**
 * Key under which the funnel assignment appears in the analytics assignment
 * map (metadata.ab_experiments.funnel). With a single assignment the
 * analytics client also sets the top-level `ab_variant` key automatically.
 */
export const FUNNEL_ASSIGNMENT_KEY = "funnel";

/** Parse the dp_ab value out of a Cookie header / document.cookie string. */
export function readAbVariantFromCookieString(
  cookieString: string | null | undefined,
  config?: AbFunnelConfig
): string | undefined {
  if (!cookieString) return undefined;
  const match = cookieString.match(new RegExp(`(?:^|;\\s*)${AB_COOKIE}=([^;]+)`));
  if (!match?.[1]) return undefined;
  let value: string;
  try {
    value = decodeURIComponent(match[1]);
  } catch {
    return undefined;
  }
  // With a registry, drop stale values that no longer exist in it. Inactive
  // variations still validate — their sessions keep reporting historically.
  if (config && !findVariation(config, value)) return undefined;
  return value;
}

/**
 * Assignment getter for the analytics client (`getAbAssignments` config).
 * Reads document.cookie fresh on every event so a mid-session (re)assignment
 * is reflected immediately.
 */
export function createGetAbAssignments(config?: AbFunnelConfig): () => Record<string, string> {
  return () => {
    const result: Record<string, string> = {};
    if (typeof document === "undefined") return result;
    const variant = readAbVariantFromCookieString(document.cookie, config);
    if (variant) result[FUNNEL_ASSIGNMENT_KEY] = variant;
    return result;
  };
}
