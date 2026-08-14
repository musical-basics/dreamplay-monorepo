import { readAbVariantFromCookieString } from "@dreamplay/ab";
import { abFunnel } from "@/config/ab";

/**
 * A/B + session + email markers for the Shopify order note (Decision D11).
 *
 * Shopify webhooks carry no cookies, so purchase events could never be
 * attributed to a variant, session or email campaign. The fix: every checkout
 * handoff appends `ab_variant:<key>` / `dp_session:<id>` / `dp_sid:<id>` /
 * `dp_cid:<id>` to the order note (alongside the legacy `checkout_source:<x>`
 * marker); the orders webhook parses them back out and tags the purchase
 * event. Client-side only (reads document.cookie).
 *
 * dp_sid / dp_cid are the email subscriber and campaign, planted as cookies by
 * the middleware when someone arrives on a `?sid=&cid=` link from an email.
 * They are what makes "this campaign produced this sale" answerable; without
 * them the only link between an email and an order is a fuzzy match on the
 * address the buyer happened to type into Shopify.
 */

function readCookie(cookieString: string, name: string): string | undefined {
  const match = cookieString.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match?.[2];
}

export function abCheckoutNoteParts(sessionId: string | undefined): string[] {
  const parts: string[] = [];
  const cookies = typeof document !== "undefined" ? document.cookie : "";

  const variant = cookies ? readAbVariantFromCookieString(cookies, abFunnel) : undefined;
  if (variant) parts.push(`ab_variant:${variant}`);
  if (sessionId) parts.push(`dp_session:${sessionId}`);

  // Email attribution. Both are UUIDs written by the middleware; the webhook's
  // parser is strict about that shape, so anything odd is simply dropped
  // rather than poisoning the note.
  const sid = readCookie(cookies, "dp_sid");
  const cid = readCookie(cookies, "dp_cid");
  if (sid) parts.push(`dp_sid:${sid}`);
  if (cid) parts.push(`dp_cid:${cid}`);

  return parts;
}
