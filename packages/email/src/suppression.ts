/**
 * Suppression checks — non-negotiable fix #4 (closed bounce/complaint/
 * unsubscribe loop). The send pipeline consults BOTH the suppressions table
 * and subscribers.status before every recipient.
 */

import type { AdminClient, SubscriberStatus } from "@dreamplay/db";

const BLOCKED_STATUSES: SubscriberStatus[] = ["unsubscribed", "bounced", "complained", "deleted"];

export interface SuppressionCheck {
    suppressed: boolean;
    reason?: string;
}

/**
 * Is this address (or its subscriber row) barred from receiving email?
 * Checks the suppressions table first, then the subscriber's status.
 */
export async function isSuppressed(db: AdminClient, email: string): Promise<SuppressionCheck> {
    const normalized = email.trim().toLowerCase();

    const { data: suppression, error: suppressionError } = await db
        .from("suppressions")
        .select("reason")
        .eq("email", normalized)
        .maybeSingle();
    if (suppressionError) {
        // Fail CLOSED: if we cannot verify, do not send.
        return { suppressed: true, reason: `suppression check failed: ${suppressionError.message}` };
    }
    if (suppression) return { suppressed: true, reason: `suppressions:${suppression.reason}` };

    const { data: subscriber, error: subscriberError } = await db
        .from("subscribers")
        .select("status")
        .eq("email", normalized)
        .maybeSingle();
    if (subscriberError) {
        return { suppressed: true, reason: `status check failed: ${subscriberError.message}` };
    }
    if (subscriber && BLOCKED_STATUSES.includes(subscriber.status)) {
        return { suppressed: true, reason: `status:${subscriber.status}` };
    }

    return { suppressed: false };
}

/**
 * Bulk variant used for audience resolution: returns the subset of `emails`
 * present in the suppressions table (lowercased). Chunked to stay under
 * PostgREST URL limits.
 */
export async function getSuppressedEmails(db: AdminClient, emails: string[]): Promise<Set<string>> {
    const out = new Set<string>();
    const normalized = emails.map((e) => e.trim().toLowerCase());
    for (let i = 0; i < normalized.length; i += 200) {
        const chunk = normalized.slice(i, i + 200);
        const { data, error } = await db.from("suppressions").select("email").in("email", chunk);
        if (error) throw new Error(`suppression bulk check failed: ${error.message}`);
        for (const row of data ?? []) out.add(String(row.email).toLowerCase());
    }
    return out;
}
