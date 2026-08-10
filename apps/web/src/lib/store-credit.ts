import type { AdminClient } from "@dreamplay/db";

/**
 * Store credit balances from the append-only store_credits ledger.
 * A buyer's balance is simply the sum of their rows (redemptions are
 * negative manual rows).
 */

export async function getStoreCreditBalance(db: AdminClient, buyerId: string): Promise<number> {
    const { data } = await db.from("store_credits").select("amount_usd").eq("buyer_id", buyerId).limit(1000);
    return (data ?? []).reduce((sum, r) => sum + Number(r.amount_usd), 0);
}

/** Balance per buyer id for a whole list (single query). */
export async function getStoreCreditBalances(db: AdminClient): Promise<Map<string, number>> {
    const { data } = await db.from("store_credits").select("buyer_id, amount_usd").limit(10000);
    const map = new Map<string, number>();
    for (const r of data ?? []) {
        map.set(r.buyer_id, (map.get(r.buyer_id) ?? 0) + Number(r.amount_usd));
    }
    return map;
}
