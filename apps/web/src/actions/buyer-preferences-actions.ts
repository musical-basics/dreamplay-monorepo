"use server";

import { getAdminDb } from "@/lib/db";
import {
    PRO_FINISHES,
    PRO_SIZES,
    STANDARD_FINISHES,
    STANDARD_SIZES,
    boughtPro,
    canUpgradeToPro,
    parsePreferencesToken,
} from "@/lib/buyer-preferences";

export interface SavePreferencesResult {
    ok: boolean;
    error?: string;
}

/**
 * Persist a buyer's self-service configuration choice (size/finish, and the
 * $200 Pro upgrade request where eligible). Token-authenticated; every change
 * is appended to buyer_preference_changes with the prior values snapshotted.
 */
export async function saveBuyerPreferences(
    token: string,
    input: { size: string; finish: string; upgradeToPro: boolean },
): Promise<SavePreferencesResult> {
    const buyerId = parsePreferencesToken(token);
    if (!buyerId) return { ok: false, error: "This link is invalid or has expired." };

    const db = getAdminDb();
    const { data: buyer } = await db.from("buyers").select("*").eq("id", buyerId).maybeSingle();
    if (!buyer) return { ok: false, error: "We could not find your order. Please contact support." };

    if (buyer.unit_count > 1) {
        // multi-keyboard orders are handled by support; the one-config form
        // cannot represent per-unit choices
        return {
            ok: false,
            error: "Your order includes multiple keyboards. Please email support@dreamplaypianos.com with the configuration you would like for each one.",
        };
    }

    const eligible = canUpgradeToPro(buyer);
    const upgradeToPro = input.upgradeToPro && eligible; // server-enforced: never trust the client on eligibility
    if (input.upgradeToPro && !eligible) {
        return { ok: false, error: "This order is not eligible for the Pro upgrade." };
    }

    const isPro = boughtPro(buyer) || upgradeToPro;
    const sizes: readonly string[] = isPro ? PRO_SIZES : STANDARD_SIZES;
    const finishes: readonly string[] = (isPro ? PRO_FINISHES : STANDARD_FINISHES).map((f) => f.value);
    if (!sizes.includes(input.size)) return { ok: false, error: "Please choose a valid size." };
    if (!finishes.includes(input.finish)) return { ok: false, error: "Please choose a valid finish." };

    const { error: logError } = await db.from("buyer_preference_changes").insert({
        buyer_id: buyer.id,
        size_variant: input.size,
        finish: input.finish,
        upgrade_to_pro: upgradeToPro,
        previous: {
            size_variant: buyer.size_variant,
            finish: buyer.finish,
            pro_upgrade_requested: buyer.pro_upgrade_requested,
        },
        source: "self-service",
    });
    if (logError) return { ok: false, error: "Something went wrong saving your choice. Please try again." };

    const { error: updateError } = await db
        .from("buyers")
        .update({
            size_variant: input.size,
            finish: input.finish,
            // toggling the box off after a previous request withdraws it (only
            // meaningful for eligible buyers; Pro purchasers stay false)
            pro_upgrade_requested: eligible ? upgradeToPro : buyer.pro_upgrade_requested,
        })
        .eq("id", buyer.id);
    if (updateError) return { ok: false, error: "Something went wrong saving your choice. Please try again." };

    return { ok: true };
}
