/**
 * Audience resolution shared by the send engine and the agent API's
 * pre-send audience echo. Suppression-aware by construction.
 */

import type { AdminClient, Tables } from "@dreamplay/db";
import { retryDb } from "./retry";
import { getSuppressedEmails } from "./suppression";

export type AudienceSubscriber = Pick<
    Tables<"subscribers">,
    "id" | "email" | "first_name" | "last_name" | "status" | "tags" | "country" | "shipping_city" | "workspace"
>;

const AUDIENCE_FIELDS = "id,email,first_name,last_name,status,tags,country,shipping_city,workspace";

export interface CampaignAudienceSource {
    workspace: string;
    variable_values: unknown;
}

export interface ResolvedAudience {
    /** Active, non-suppressed subscribers. */
    subscribers: AudienceSubscriber[];
    /** Count removed by the suppressions table. */
    suppressedCount: number;
    /** How the audience was targeted (for logs / safety echoes). */
    source: "override" | "subscriber_ids" | "subscriber_id" | "target_tag" | "none";
}

export function audienceTargeting(variableValues: unknown): {
    subscriberIds: string[] | null;
    subscriberId: string | null;
    targetTag: string | null;
} {
    const vv = (variableValues ?? {}) as Record<string, unknown>;
    const ids = Array.isArray(vv.subscriber_ids)
        ? (vv.subscriber_ids as unknown[]).filter((v): v is string => typeof v === "string")
        : null;
    return {
        subscriberIds: ids && ids.length > 0 ? ids : null,
        subscriberId: typeof vv.subscriber_id === "string" && vv.subscriber_id ? vv.subscriber_id : null,
        targetTag: typeof vv.target_tag === "string" && vv.target_tag ? vv.target_tag : null,
    };
}

async function fetchByIds(db: AdminClient, ids: string[]): Promise<AudienceSubscriber[]> {
    const out: AudienceSubscriber[] = [];
    for (let i = 0; i < ids.length; i += 200) {
        const chunk = ids.slice(i, i + 200);
        const res = await retryDb(() =>
            db.from("subscribers").select(AUDIENCE_FIELDS).eq("status", "active").in("id", chunk)
        );
        if (res.error) throw new Error(`audience fetch failed: ${res.error.message}`);
        out.push(...((res.data ?? []) as unknown as AudienceSubscriber[]));
    }
    return out;
}

/**
 * Resolve a campaign's audience: targeting from variable_values (or an
 * explicit override), restricted to status=active, minus the suppression list.
 */
export async function resolveAudience(
    db: AdminClient,
    campaign: CampaignAudienceSource,
    overrideSubscriberIds?: string[]
): Promise<ResolvedAudience> {
    const targeting = audienceTargeting(campaign.variable_values);

    let subscribers: AudienceSubscriber[] = [];
    let source: ResolvedAudience["source"] = "none";

    if (overrideSubscriberIds && overrideSubscriberIds.length > 0) {
        source = "override";
        subscribers = await fetchByIds(db, overrideSubscriberIds);
    } else if (targeting.subscriberIds) {
        source = "subscriber_ids";
        subscribers = await fetchByIds(db, targeting.subscriberIds);
    } else if (targeting.subscriberId) {
        source = "subscriber_id";
        subscribers = await fetchByIds(db, [targeting.subscriberId]);
    } else if (targeting.targetTag) {
        source = "target_tag";
        const res = await retryDb(() =>
            db
                .from("subscribers")
                .select(AUDIENCE_FIELDS)
                .eq("status", "active")
                .eq("workspace", campaign.workspace)
                .contains("tags", [targeting.targetTag as string])
        );
        if (res.error) throw new Error(`audience fetch failed: ${res.error.message}`);
        subscribers = (res.data ?? []) as unknown as AudienceSubscriber[];
    }

    if (subscribers.length === 0) return { subscribers, suppressedCount: 0, source };

    const suppressed = await getSuppressedEmails(
        db,
        subscribers.map((s) => s.email)
    );
    const kept = subscribers.filter((s) => !suppressed.has(s.email.toLowerCase()));
    return { subscribers: kept, suppressedCount: subscribers.length - kept.length, source };
}
