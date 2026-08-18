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

/**
 * Append the attribution markers to a Shopify cart permalink that was built
 * SERVER-SIDE (and therefore could not read cookies).
 *
 * The $200 Pro upgrade link is the case this exists for: it is rendered by
 * `proUpgradeCheckoutUrl()` on the server (it is also emailed), so it reached
 * Shopify carrying only `Pro upgrade | reservation <ref>`. Every Pro upgrade
 * purchase therefore landed in `events` with `session_id: null` and no
 * `ab_variant`, which made those orders — the only real revenue in August 2026
 * — invisible to the A/B score sheet and to campaign attribution.
 *
 * Call this in a click handler (it reads document.cookie) on the URL the
 * server produced; the note's existing content is preserved and the markers
 * are appended with the same ` | ` separator the webhook parser expects.
 * Returns the URL unchanged when there is nothing to add or the URL is not
 * the expected cart-clear shape, so a failure here can never block a payment.
 */
export function withAbCheckoutMarkers(
  checkoutUrl: string,
  sessionId: string | undefined,
): string {
  const parts = abCheckoutNoteParts(sessionId);
  if (parts.length === 0) return checkoutUrl;

  try {
    // Shape: https://<store>/cart/clear?return_to=<encoded /cart/...?note=...>
    const outer = new URL(checkoutUrl);
    const returnTo = outer.searchParams.get("return_to");
    if (!returnTo) return checkoutUrl;

    // return_to is a relative path; parse against the same origin.
    const inner = new URL(returnTo, outer.origin);
    const existingNote = inner.searchParams.get("note") ?? "";
    // Idempotent: never stamp a second ab_variant onto the same note.
    if (/(^|\s\|\s)ab_variant:/.test(existingNote)) return checkoutUrl;

    const note = [existingNote, ...parts].filter(Boolean).join(" | ");
    inner.searchParams.set("note", note);

    outer.searchParams.set("return_to", `${inner.pathname}${inner.search}`);
    return outer.toString();
  } catch {
    // Malformed URL: hand back the original rather than breaking checkout.
    return checkoutUrl;
  }
}
