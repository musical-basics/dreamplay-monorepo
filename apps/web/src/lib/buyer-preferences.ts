import { createHmac, timingSafeEqual } from "node:crypto";
import type { Tables } from "@dreamplay/db";

/**
 * Self-service buyer configuration (/order-preferences).
 *
 * Links are HMAC-signed over the buyer id (EMAIL_UNSUBSCRIBE_SECRET, distinct
 * "buyer-pref:" message prefix so tokens are not interchangeable with
 * unsubscribe tokens), so a third party cannot open someone's preference page
 * by enumerating buyer ids.
 */

export type Buyer = Tables<"buyers">;

/** Buyers who purchased AFTER this date never see the Pro upgrade offer. */
export const PRO_UPGRADE_CUTOFF = "2026-05-01T00:00:00Z";
export const PRO_UPGRADE_PRICE = 200;

export const STANDARD_SIZES = ["DS5.5", "DS6.0", "DS6.5"] as const;
export const PRO_SIZES = ["DS5.5", "DS6.0"] as const;
export const STANDARD_FINISHES = [
    { value: "Black", label: "Midnight Black" },
    { value: "White", label: "Pearl White" },
] as const;
export const PRO_FINISHES = [
    { value: "Nightmare Black", label: "Nightmare Black" },
    { value: "Aztec Gold", label: "Aztec Gold" },
] as const;

function getSecret(): string {
    const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET;
    if (!secret) {
        throw new Error("EMAIL_UNSUBSCRIBE_SECRET is not set: refusing to build/verify preference links.");
    }
    return secret;
}

export function buyerPrefToken(buyerId: string): string {
    return createHmac("sha256", getSecret()).update(`buyer-pref:${buyerId}`).digest("hex").slice(0, 32);
}

export function verifyBuyerPrefToken(buyerId: string, token: string | null | undefined): boolean {
    if (!token) return false;
    const expected = Buffer.from(buyerPrefToken(buyerId));
    const got = Buffer.from(token);
    if (expected.length !== got.length) return false;
    return timingSafeEqual(expected, got);
}

/** The `t` query param packs id + signature: `<buyerId>.<hmac>`. */
export function buildPreferencesPath(buyerId: string): string {
    return `/order-preferences?t=${encodeURIComponent(`${buyerId}.${buyerPrefToken(buyerId)}`)}`;
}

export function parsePreferencesToken(t: string | null | undefined): string | null {
    if (!t) return null;
    const dot = t.lastIndexOf(".");
    if (dot <= 0) return null;
    const id = t.slice(0, dot);
    return verifyBuyerPrefToken(id, t.slice(dot + 1)) ? id : null;
}

/** Did this buyer already purchase a Pro product? */
export function boughtPro(buyer: Pick<Buyer, "product_line" | "finish">): boolean {
    return (
        /\bpro\b/i.test(buyer.product_line ?? "") ||
        PRO_FINISHES.some((f) => f.value === (buyer.finish ?? ""))
    );
}

/**
 * Pro-upgrade eligibility (Lionel, 2026-08-06): real buyers only, purchased
 * on or before 2026-04-30, and not already on a Pro product.
 */
export function canUpgradeToPro(buyer: Buyer): boolean {
    if (buyer.kind !== "buyer") return false;
    if (!buyer.purchase_date) return false;
    if (buyer.purchase_date >= PRO_UPGRADE_CUTOFF) return false;
    return !boughtPro(buyer);
}
