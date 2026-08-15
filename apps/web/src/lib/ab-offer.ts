/**
 * Offer mode for the Love-vs-Spec 2x2 test (docs/plan/AB-TEST-LOVE-VS-SPEC.md).
 *
 * Variants 6b and 7b advertise the $249 deposit and show the Pro as sold out;
 * everyone else (6a, 7a, /main, untagged visitors) keeps the standard offer.
 * The offer is a property of the visitor's dp_ab variant, not of a route:
 * 6a/6b share /legacy-home and 7a/7b share /play-again, and /customize forks
 * on this value.
 *
 * Pure data + pure function: safe to import from client components, server
 * components, and middleware alike.
 */

export type OfferMode = "standard" | "deposit249";

/** Variant keys whose visitors see the $249 deposit offer and sold-out Pro. */
export const DEPOSIT_249_VARIANTS: ReadonlySet<string> = new Set(["6b", "7b"]);

export function offerModeForVariant(key: string | null | undefined): OfferMode {
  return key != null && DEPOSIT_249_VARIANTS.has(key) ? "deposit249" : "standard";
}
