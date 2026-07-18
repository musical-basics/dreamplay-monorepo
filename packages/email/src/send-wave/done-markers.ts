/**
 * Done markers — non-negotiable fix #3.
 *
 * The legacy scheduler tagged recipients `done-<key>` right after SCHEDULING a
 * wave, before the send actually fired. A failed send left recipients tagged
 * done, so re-runs wrongly excluded them (the done-marker race,
 * docs/planned_changes.md in the legacy repo).
 *
 * The fix by construction: done markers are derived FROM sent_history. A
 * subscriber gets the done tag only when a sent_history row proves the send
 * happened. Run `applyDoneMarkers` after waves have fired (the CLI's
 * --finalize mode); it is idempotent and resumable.
 */

import type { AdminClient } from "@dreamplay/db";
import { retryDb } from "../retry";

export interface ApplyDoneMarkersResult {
    campaignId: string;
    confirmedSent: number;
    newlyTagged: number;
}

/**
 * Tag every subscriber with a CONFIRMED sent_history row for `campaignId`
 * with `doneTag`. Subscribers without a sent_history row are never tagged,
 * no matter what was scheduled.
 */
export async function applyDoneMarkers(
    db: AdminClient,
    options: { campaignId: string; doneTag: string }
): Promise<ApplyDoneMarkersResult> {
    const sentRes = await retryDb(() =>
        db.from("sent_history").select("subscriber_id").eq("campaign_id", options.campaignId)
    );
    if (sentRes.error) throw new Error(`sent_history read failed: ${sentRes.error.message}`);
    const subscriberIds = (sentRes.data ?? []).map((r) => r.subscriber_id);

    let newlyTagged = 0;
    for (let i = 0; i < subscriberIds.length; i += 200) {
        const chunk = subscriberIds.slice(i, i + 200);
        const subsRes = await retryDb(() => db.from("subscribers").select("id,tags").in("id", chunk));
        if (subsRes.error) throw new Error(`subscribers read failed: ${subsRes.error.message}`);
        for (const sub of subsRes.data ?? []) {
            const tags = sub.tags ?? [];
            if (tags.includes(options.doneTag)) continue;
            const upd = await db
                .from("subscribers")
                .update({ tags: [...tags, options.doneTag] })
                .eq("id", sub.id);
            if (!upd.error) newlyTagged++;
        }
    }

    return { campaignId: options.campaignId, confirmedSent: subscriberIds.length, newlyTagged };
}

/**
 * Finalize a whole wave send: find every child campaign whose send_key is in
 * the `doneTag` namespace and apply done markers from its sent_history.
 */
export async function finalizeWaveSend(
    db: AdminClient,
    options: { doneTag: string }
): Promise<ApplyDoneMarkersResult[]> {
    const childrenRes = await retryDb(() =>
        db.from("campaigns").select("id,send_key").like("send_key", `${options.doneTag}:%`)
    );
    if (childrenRes.error) throw new Error(`children lookup failed: ${childrenRes.error.message}`);

    const results: ApplyDoneMarkersResult[] = [];
    for (const child of childrenRes.data ?? []) {
        results.push(await applyDoneMarkers(db, { campaignId: child.id, doneTag: options.doneTag }));
    }
    return results;
}

/** Emails (lowercased) among `emails` already carrying `doneTag`. */
export async function getDoneTagged(db: AdminClient, emails: string[], doneTag: string): Promise<Set<string>> {
    const out = new Set<string>();
    for (let i = 0; i < emails.length; i += 200) {
        const chunk = emails.slice(i, i + 200);
        const res = await retryDb(() => db.from("subscribers").select("email,tags").in("email", chunk));
        if (res.error) throw new Error(`done-tag lookup failed: ${res.error.message}`);
        for (const row of res.data ?? []) {
            if ((row.tags ?? []).includes(doneTag)) out.add(String(row.email).toLowerCase());
        }
    }
    return out;
}
