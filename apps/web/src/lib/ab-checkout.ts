import { readAbVariantFromCookieString } from "@dreamplay/ab";
import { abFunnel } from "@/config/ab";

/**
 * A/B + session markers for the Shopify order note (Decision D11).
 *
 * Shopify webhooks carry no cookies, so purchase events could never be
 * attributed to a variant or session. The fix: every checkout handoff appends
 * `ab_variant:<key>` / `dp_session:<id>` to the order note (alongside the
 * legacy `checkout_source:<x>` marker); the orders webhook parses them back
 * out and tags the purchase event. Client-side only (reads document.cookie).
 */
export function abCheckoutNoteParts(sessionId: string | undefined): string[] {
  const parts: string[] = [];
  const variant =
    typeof document !== "undefined"
      ? readAbVariantFromCookieString(document.cookie, abFunnel)
      : undefined;
  if (variant) parts.push(`ab_variant:${variant}`);
  if (sessionId) parts.push(`dp_session:${sessionId}`);
  return parts;
}
