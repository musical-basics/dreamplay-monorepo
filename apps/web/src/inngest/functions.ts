/**
 * Inngest send functions. Four functions share ONE account-scoped concurrency
 * slot (the global-send-lock): Resend allows 5 req/s on this account, so at
 * most one send loop may run at a time; the per-invocation throttle inside
 * sendCampaign (RESEND_SEND_RATE_PER_SEC) handles the rest.
 *
 * ── Why a step retry can never double-send ──────────────────────────────────
 * Each send step's body is sendCampaign()/sendRotation(), which are
 * idempotent by construction:
 *   - recipients already in sent_history are filtered out up front,
 *   - each successful Resend call writes its sent_history row immediately,
 *   - the UNIQUE (campaign_id, subscriber_id) constraint turns any race into
 *     a skip, and
 *   - template/rotation child campaigns are found-or-created by a sendKey
 *     that is memoized in its OWN step, so a retry of the send step reuses
 *     the same child (same sent_history scope) instead of minting a new one.
 * So when Inngest re-runs a step (timeout, crash, deploy), the re-run
 * no-ops for everyone already sent — the 2026-05-12 double-send incident
 * class is structurally impossible.
 */

import {
    sendCampaign,
    sendRotation,
    type SendCampaignResult,
    type SendRotationResult,
} from "@dreamplay/email";
import { getAdminDb } from "@/lib/db";
import { inngest } from "./client";
import { createSendDeps } from "./deps";

const GLOBAL_SEND_LOCK = { key: "'global-send-lock'", limit: 1, scope: "account" as const };

type CampaignSendEventData = {
    campaignId: string;
    workspace?: string;
    fromName?: string | null;
    fromEmail?: string | null;
    clickTracking?: boolean;
    clickTrackingMode?: "append" | "redirect";
    openTracking?: boolean;
};

type RotationSendEventData = {
    rotationId: string;
    subscriberIds: string[];
    fromName?: string | null;
    fromEmail?: string | null;
    clickTracking?: boolean;
    clickTrackingMode?: "append" | "redirect";
    openTracking?: boolean;
};

function campaignSendOptions(data: CampaignSendEventData, sendKey: string, triggeredBy: string) {
    return {
        campaignId: data.campaignId,
        sendKey,
        fromName: data.fromName ?? null,
        fromEmail: data.fromEmail ?? null,
        clickTracking: data.clickTracking ?? true,
        clickTrackingMode: data.clickTrackingMode ?? "append",
        openTracking: data.openTracking ?? true,
        triggeredBy,
    } as const;
}

/** agent-send (event: agent.campaign.send) — immediate campaign send. */
export const agentSend = inngest.createFunction(
    { id: "agent-send", concurrency: GLOBAL_SEND_LOCK, triggers: [{ event: "agent.campaign.send" }] },
    async ({ event, step }) => {
        const data = event.data as CampaignSendEventData;

        // Memoized in its own step: a retry of the send step below reuses the
        // SAME key, so template sends reuse the same child campaign.
        const sendKey = await step.run("generate-send-key", async () => crypto.randomUUID());

        const stats = await step.run("send-campaign", async (): Promise<SendCampaignResult> => {
            return sendCampaign(createSendDeps(), campaignSendOptions(data, sendKey, "agent"));
        });

        return { event: "agent.campaign.send.completed", body: { campaignId: data.campaignId, stats } };
    }
);

/**
 * agent-scheduled-send (event: agent.campaign.scheduled-send) — sleeps until
 * scheduledAt, re-checks cancellation, then sends.
 */
export const agentScheduledSend = inngest.createFunction(
    {
        id: "agent-scheduled-campaign-send",
        concurrency: GLOBAL_SEND_LOCK,
        triggers: [{ event: "agent.campaign.scheduled-send" }],
    },
    async ({ event, step }) => {
        const data = event.data as CampaignSendEventData & { scheduledAt: string };

        await step.sleepUntil("wait-for-schedule", new Date(data.scheduledAt));

        // Cancellation re-check AFTER the sleep: the agent API cancels by
        // setting scheduled_status='cancelled'.
        const campaign = await step.run("check-campaign", async () => {
            const db = getAdminDb();
            const { data: row, error } = await db
                .from("campaigns")
                .select("id, scheduled_status, status")
                .eq("id", data.campaignId)
                .maybeSingle();
            if (error) throw new Error(`check-campaign failed: ${error.message}`);
            if (!row) throw new Error("Campaign not found (may have been deleted)");
            return row;
        });

        if (campaign.scheduled_status === "cancelled") {
            return { message: "Schedule was cancelled", campaignId: data.campaignId };
        }
        if (campaign.scheduled_status === "sent" || campaign.status === "completed") {
            return { message: "Campaign already sent", campaignId: data.campaignId };
        }

        const sendKey = await step.run("generate-send-key", async () => crypto.randomUUID());

        const stats = await step.run("send-campaign", async (): Promise<SendCampaignResult> => {
            return sendCampaign(createSendDeps(), campaignSendOptions(data, sendKey, "agent-scheduled"));
        });

        await step.run("update-status", async () => {
            await getAdminDb()
                .from("campaigns")
                .update({ scheduled_status: "sent", updated_at: new Date().toISOString() })
                .eq("id", data.campaignId);
        });

        return { message: "Scheduled campaign sent", campaignId: data.campaignId, stats };
    }
);

/** rotation-send (event: agent.rotation.send) — immediate rotation send. */
export const rotationSend = inngest.createFunction(
    { id: "agent-rotation-send", concurrency: GLOBAL_SEND_LOCK, triggers: [{ event: "agent.rotation.send" }] },
    async ({ event, step }) => {
        const data = event.data as RotationSendEventData;

        // Memoized sendKey: a retry of send-rotation reuses the children
        // created by the first attempt instead of creating a duplicate set.
        const sendKey = await step.run("generate-send-key", async () => crypto.randomUUID());

        const stats = await step.run("send-rotation", async (): Promise<SendRotationResult> => {
            return sendRotation(createSendDeps(), {
                rotationId: data.rotationId,
                subscriberIds: data.subscriberIds,
                sendKey,
                fromName: data.fromName ?? null,
                fromEmail: data.fromEmail ?? null,
                clickTracking: data.clickTracking ?? true,
                clickTrackingMode: data.clickTrackingMode ?? "append",
                openTracking: data.openTracking ?? true,
                triggeredBy: "agent-rotation",
            });
        });

        return { event: "agent.rotation.send.completed", body: { rotationId: data.rotationId, stats } };
    }
);

/**
 * rotation-scheduled-send (event: agent.rotation.scheduled-send) — sleeps
 * until scheduledAt, re-checks cancellation (app_settings key
 * `rotation-schedule:<id>`), then sends.
 */
export const rotationScheduledSend = inngest.createFunction(
    {
        id: "agent-rotation-scheduled-send",
        concurrency: GLOBAL_SEND_LOCK,
        triggers: [{ event: "agent.rotation.scheduled-send" }],
    },
    async ({ event, step }) => {
        const data = event.data as RotationSendEventData & { scheduledAt: string };

        await step.sleepUntil("wait-for-schedule", new Date(data.scheduledAt));

        const schedule = await step.run("check-rotation-schedule", async () => {
            const db = getAdminDb();
            const rot = await db.from("rotations").select("id").eq("id", data.rotationId).maybeSingle();
            if (rot.error) throw new Error(`check-rotation failed: ${rot.error.message}`);
            if (!rot.data) throw new Error("Rotation not found (may have been deleted)");
            const setting = await db
                .from("app_settings")
                .select("value")
                .eq("key", `rotation-schedule:${data.rotationId}`)
                .maybeSingle();
            return { status: ((setting.data?.value ?? {}) as { status?: string }).status ?? "pending" };
        });

        if (schedule.status === "cancelled") {
            return { message: "Schedule was cancelled", rotationId: data.rotationId };
        }
        if (schedule.status === "sent") {
            return { message: "Rotation already sent", rotationId: data.rotationId };
        }

        const sendKey = await step.run("generate-send-key", async () => crypto.randomUUID());

        const stats = await step.run("send-rotation", async (): Promise<SendRotationResult> => {
            return sendRotation(createSendDeps(), {
                rotationId: data.rotationId,
                subscriberIds: data.subscriberIds,
                sendKey,
                fromName: data.fromName ?? null,
                fromEmail: data.fromEmail ?? null,
                clickTracking: data.clickTracking ?? true,
                clickTrackingMode: data.clickTrackingMode ?? "append",
                openTracking: data.openTracking ?? true,
                triggeredBy: "agent-rotation-scheduled",
            });
        });

        await step.run("update-status", async () => {
            await getAdminDb()
                .from("app_settings")
                .upsert({ key: `rotation-schedule:${data.rotationId}`, value: { status: "sent" } });
        });

        return { message: "Scheduled rotation sent", rotationId: data.rotationId, stats };
    }
);

export const emailFunctions = [agentSend, agentScheduledSend, rotationSend, rotationScheduledSend];
