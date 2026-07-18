/**
 * Rotation (round-robin A/B) send: assigns each subscriber to one of the
 * rotation's template campaigns starting from the stored cursor, creates one
 * child campaign per (template, batch), and runs sendCampaign for each.
 *
 * Unlike the legacy pipeline this calls sendCampaign DIRECTLY (no internal
 * HTTP hop to /api/send-stream — the hop is what made one transient 500 abort
 * whole sends). Idempotency: children are found-or-created by a deterministic
 * campaigns.send_key derived from the caller's sendKey, so a retried
 * invocation reuses the first attempt's children and sent_history dedupes the
 * recipients inside each child.
 */

import type { AdminClient, Tables } from "@dreamplay/db";
import { retryDb } from "./retry";
import {
    sendCampaign,
    type LogFn,
    type SendCampaignDeps,
    type SendCampaignOptions,
    type SendCampaignResult,
} from "./send-campaign";

export interface SendRotationOptions {
    rotationId: string;
    subscriberIds: string[];
    /**
     * Idempotency key, REQUIRED. Generate once in a memoized step (Inngest
     * step.run) so retries reuse the same child campaigns.
     */
    sendKey: string;
    fromName?: string | null;
    fromEmail?: string | null;
    clickTracking?: boolean;
    clickTrackingMode?: "append" | "redirect";
    openTracking?: boolean;
    triggeredBy?: string;
    log?: LogFn;
    /** Passed through to sendCampaign (tests). */
    sendOptions?: Partial<SendCampaignOptions>;
}

export interface SendRotationResult {
    rotationId: string;
    totalSent: number;
    totalFailed: number;
    totalRecipients: number;
    children: Array<{ templateId: string; campaignId: string; stats: SendCampaignResult }>;
}

type CampaignRow = Tables<"campaigns">;

const noopLog: LogFn = () => {};

async function findOrCreateChild(
    db: AdminClient,
    template: CampaignRow,
    rotationId: string,
    childSendKey: string,
    log: LogFn
): Promise<CampaignRow> {
    const existing = await retryDb(() => db.from("campaigns").select("*").eq("send_key", childSendKey).limit(1));
    if (existing.error) throw new Error(`child lookup failed: ${existing.error.message}`);
    if (existing.data && existing.data.length > 0) {
        log("info", `Reusing child ${existing.data[0]!.id} for sendKey=${childSendKey} (retry detected).`);
        return existing.data[0] as CampaignRow;
    }

    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const sourceVars = (template.variable_values ?? {}) as Record<string, unknown>;
    const { subscriber_id: _d1, subscriber_ids: _d2, ...childVars } = sourceVars;

    const insert = await db
        .from("campaigns")
        .insert({
            name: `${template.name} (Rotation ${today})`,
            subject_line: template.subject_line,
            html_content: template.html_content,
            status: "draft" as const,
            is_template: false,
            parent_template_id: template.id,
            rotation_id: rotationId,
            workspace: template.workspace,
            email_type: template.email_type ?? "campaign",
            send_key: childSendKey,
            variable_values: childVars as CampaignRow["variable_values"],
        })
        .select("*")
        .single();

    if (insert.error) {
        if (insert.error.code === "23505") {
            const again = await retryDb(() => db.from("campaigns").select("*").eq("send_key", childSendKey).limit(1));
            if (!again.error && again.data && again.data.length > 0) return again.data[0] as CampaignRow;
        }
        throw new Error(`Failed to create rotation child for "${template.name}": ${insert.error.message}`);
    }
    return insert.data as CampaignRow;
}

export async function sendRotation(
    deps: SendCampaignDeps,
    options: SendRotationOptions
): Promise<SendRotationResult> {
    const { db } = deps;
    const log = options.log ?? noopLog;
    if (!options.sendKey) throw new Error("sendRotation requires a sendKey (idempotency).");

    const rotationRes = await retryDb(() =>
        db.from("rotations").select("*").eq("id", options.rotationId).maybeSingle()
    );
    if (rotationRes.error) throw new Error(`rotation fetch failed: ${rotationRes.error.message}`);
    if (!rotationRes.data) throw new Error(`Rotation ${options.rotationId} not found`);
    const rotation = rotationRes.data;

    const campaignIds = rotation.campaign_ids ?? [];
    if (campaignIds.length === 0) throw new Error("Rotation has no campaigns");

    const templatesRes = await retryDb(() => db.from("campaigns").select("*").in("id", campaignIds));
    if (templatesRes.error) throw new Error(`templates fetch failed: ${templatesRes.error.message}`);
    const templateMap = new Map((templatesRes.data ?? []).map((t) => [t.id, t as CampaignRow]));

    const subsRes = await retryDb(() =>
        db.from("subscribers").select("id").in("id", options.subscriberIds).eq("status", "active")
    );
    if (subsRes.error) throw new Error(`subscribers fetch failed: ${subsRes.error.message}`);
    const subscribers = subsRes.data ?? [];
    if (subscribers.length === 0) {
        return {
            rotationId: options.rotationId,
            totalSent: 0,
            totalFailed: 0,
            totalRecipients: 0,
            children: [],
        };
    }

    // Round-robin assignment starting from the stored cursor.
    let cursor = rotation.cursor_position ?? 0;
    const grouped = new Map<string, string[]>();
    for (const sub of subscribers) {
        const assigned = campaignIds[cursor % campaignIds.length]!;
        if (!grouped.has(assigned)) grouped.set(assigned, []);
        grouped.get(assigned)!.push(sub.id);
        cursor++;
    }

    let totalSent = 0;
    let totalFailed = 0;
    let anyNewChildCreated = false;
    const children: SendRotationResult["children"] = [];

    for (const [templateId, batchIds] of grouped) {
        const template = templateMap.get(templateId);
        if (!template) {
            log("warn", `Template ${templateId} not found; skipping its batch of ${batchIds.length}.`);
            totalFailed += batchIds.length;
            continue;
        }

        const childSendKey = `${options.sendKey}:${templateId}`;
        const before = await retryDb(() => db.from("campaigns").select("id").eq("send_key", childSendKey).limit(1));
        const existedBefore = !before.error && (before.data?.length ?? 0) > 0;

        const child = await findOrCreateChild(db, template, options.rotationId, childSendKey, log);
        if (!existedBefore) anyNewChildCreated = true;

        const stats = await sendCampaign(deps, {
            campaignId: child.id,
            overrideSubscriberIds: batchIds,
            fromName: options.fromName ?? (template.variable_values as Record<string, unknown> | null)?.from_name as string | undefined,
            fromEmail: options.fromEmail ?? (template.variable_values as Record<string, unknown> | null)?.from_email as string | undefined,
            clickTracking: options.clickTracking,
            clickTrackingMode: options.clickTrackingMode,
            openTracking: options.openTracking,
            triggeredBy: options.triggeredBy ?? "agent-rotation",
            log,
            ...options.sendOptions,
        });

        totalSent += stats.sent;
        totalFailed += stats.failed;
        children.push({ templateId, campaignId: child.id, stats });
    }

    // Advance the cursor only when this invocation created at least one new
    // child. If every child was reused this is a retry of an earlier run —
    // advancing again would shift the round-robin for all subsequent sends.
    if (anyNewChildCreated) {
        const newCursor = ((rotation.cursor_position ?? 0) + subscribers.length) % campaignIds.length;
        await db
            .from("rotations")
            .update({ cursor_position: newCursor, updated_at: new Date().toISOString() })
            .eq("id", options.rotationId);
    } else {
        log("info", "All children reused from a prior run; cursor NOT advanced.");
    }

    return {
        rotationId: options.rotationId,
        totalSent,
        totalFailed,
        totalRecipients: subscribers.length,
        children,
    };
}
