/**
 * Offer mode per visitor: which pricing /customize and /dreamplay-pro show.
 *
 * "deposit249" is the offer first tested as variant 7b (Love-vs-Spec 2x2,
 * docs/plan/AB-TEST-LOVE-VS-SPEC.md): $249 down on the DreamPlay One and the
 * Premium Bundle (totals unchanged: $999 / $1,099, balance plus shipping and
 * taxes at delivery) and the Pro shown as sold out with a waitlist.
 *
 * Since 2026-10-07 (decision D15) it is the DEFAULT for everyone: the /main
 * homepage, visitors without a dp_ab cookie, and holders of any variant
 * outside the running test. Only the test's standard-offer cells 6a and 7a
 * keep the standard offer (50% deposits, Pro purchasable), so the 2x2's offer
 * dimension stays intact while groups 6/7 run. When the test ends, empty
 * STANDARD_OFFER_VARIANTS.
 *
 * The offer is a property of the visitor's dp_ab variant, not of a route.
 * Pure data + pure function: safe to import from client components, server
 * components, and middleware alike.
 */

export type OfferMode = "standard" | "deposit249";

/** Variant keys whose visitors keep the standard offer (Love-vs-Spec "a" cells). */
export const STANDARD_OFFER_VARIANTS: ReadonlySet<string> = new Set(["6a", "7a"]);

export function offerModeForVariant(key: string | null | undefined): OfferMode {
  return key != null && STANDARD_OFFER_VARIANTS.has(key) ? "standard" : "deposit249";
}
