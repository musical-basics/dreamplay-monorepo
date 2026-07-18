/**
 * Agent API — ported from dreamplay-email-3 `src/agent/handler.ts`.
 *
 * Surface: campaigns / subscribers / tags / rotations / merge-tags CRUD plus
 * send / schedule / cancel actions. Auth: Bearer AGENT_API_KEY.
 *
 * Safety gates on sends (all enforced server-side):
 *   - UNSAFE_SEND_BLOCKED: no targeting OR the resolved audience is empty.
 *   - TARGET_TAG_SEND_REQUIRES_CONFIRMATION: tag-wide sends need
 *     { confirmTargetTag: true }.
 *   - RECIPIENT_COUNT_CONFIRMATION_REQUIRED: audiences >= 50 (after the
 *     suppression-aware resolution) require { confirmRecipientCount: N }
 *     matching the actual count — the manual send-safety audit, formalized.
 *   - Audience resolution is suppression-aware: suppressed addresses are
 *     excluded before the count is echoed and before any send dispatches.
 *
 * Dropped vs legacy: chains, triggers, copilot (AI copilot deferred to
 * Phase 8), editor endpoints.
 */

import type { NextResponse } from "next/server";
import type { CampaignEmailType, CampaignStatus, EmailEventType, SubscriberStatus } from "@dreamplay/db";
import { resolveAudience } from "@dreamplay/email";
import { getAdminDb } from "@/lib/db";
import { inngest } from "@/inngest/client";
import {
    errorResponse,
    json,
    listEnvelope,
    paginationFromUrl,
    rangeFor,
    readJson,
    requireAgentAuth,
    zodErrorResponse,
} from "./http";
import {
    bulkTagSchema,
    bulkUntagSchema,
    campaignCreateSchema,
    campaignPatchSchema,
    cloneCampaignSchema,
    mergeTagCreateSchema,
    mergeTagPatchSchema,
    rotationCreateSchema,
    rotationPatchSchema,
    rotationSendSchema,
    sendSchema,
    subscriberPatchSchema,
    subscriberUpsertSchema,
    tagCreateSchema,
    workspaceSchema,
    type Workspace,
} from "./schemas";

export type AgentRouteContext = {
    params: Promise<{ workspace: string; path?: string[] }>;
};

/** Resolved audiences at or above this size require an exact count echo. */
const RECIPIENT_COUNT_CONFIRMATION_THRESHOLD = 50;

const campaignListFields = [
    "id",
    "name",
    "subject_line",
    "status",
    "email_type",
    "is_template",
    "is_ready",
    "is_starred_template",
    "parent_template_id",
    "category",
    "send_key",
    "total_recipients",
    "total_opens",
    "total_clicks",
    "scheduled_at",
    "scheduled_status",
    "workspace",
    "created_at",
    "updated_at",
].join(",");

const campaignDetailFields = `${campaignListFields},html_content,variable_values,sent_from_email`;

const subscriberFields = [
    "id",
    "email",
    "first_name",
    "last_name",
    "status",
    "tags",
    "smart_tags",
    "country",
    "country_code",
    "phone_code",
    "phone_number",
    "shipping_city",
    "workspace",
    "created_at",
].join(",");

// Scanner/link-unfurler user agents excluded by filter=human on events.
const SCANNER_UA_PATTERNS = [
    "mimecast",
    "proofpoint",
    "barracuda",
    "ironport",
    "safelinks",
    "outlookatp",
    "outlookadvancedurls",
    "googlesafetyauth",
    "slackbot",
    "discordbot",
    "telegrambot",
    "twitterbot",
    "facebookexternalhit",
    "whatsapp",
    "linkedinbot",
    "googlebot",
    "bingbot",
    "yandexbot",
    "applebot",
];

function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

function uniqueStrings(values: string[]) {
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

async function ensureTagDefinitions(workspace: Workspace, tags: string[]) {
    const cleanTags = uniqueStrings(tags);
    if (!cleanTags.length) return;
    const db = getAdminDb();
    await db
        .from("tag_definitions")
        .upsert(
            cleanTags.map((name) => ({ name, color: "#6b7280", workspace })),
            { onConflict: "workspace,name" }
        );
}

async function dispatchInngest(name: string, data: Record<string, unknown>) {
    if (!process.env.INNGEST_EVENT_KEY) {
        throw new Error("INNGEST_EVENT_KEY is not configured");
    }
    return inngest.send({ name, data });
}

// --- campaigns ---------------------------------------------------------------

async function handleCampaigns(request: Request, method: string, workspace: Workspace, path: string[]) {
    const db = getAdminDb();
    const campaignId = path[1];
    const action = path[2];

    if (method === "GET" && !campaignId) {
        const url = new URL(request.url);
        const pagination = paginationFromUrl(url);
        const [from, to] = rangeFor(pagination);
        const includeHtml = url.searchParams.get("include_html") === "true";
        const fields = includeHtml ? campaignDetailFields : campaignListFields;

        let query = db
            .from("campaigns")
            .select(fields, { count: "exact" })
            .eq("workspace", workspace)
            .order("updated_at", { ascending: false })
            .range(from, to);

        const status = url.searchParams.get("status");
        const emailType = url.searchParams.get("email_type");
        const parentTemplateId = url.searchParams.get("parent_template_id");
        const isTemplate = url.searchParams.get("is_template");
        if (status) query = query.eq("status", status as CampaignStatus);
        if (emailType) query = query.eq("email_type", emailType as CampaignEmailType);
        if (parentTemplateId) query = query.eq("parent_template_id", parentTemplateId);
        if (isTemplate !== null) query = query.eq("is_template", isTemplate === "true");

        const { data, count, error } = await query;
        if (error) return errorResponse(error.message, 500);
        return json(listEnvelope(data, pagination, count));
    }

    if (method === "GET" && campaignId && action === "analytics") {
        const { data, error } = await db
            .from("campaigns")
            .select("id,name,total_recipients,total_opens,total_clicks,status,workspace")
            .eq("workspace", workspace)
            .eq("id", campaignId)
            .maybeSingle();
        if (error) return errorResponse(error.message, 500);
        if (!data) return errorResponse("Campaign not found", 404);
        return json({ data });
    }

    if (method === "GET" && campaignId && action === "events") {
        const campaign = await db
            .from("campaigns")
            .select("id")
            .eq("workspace", workspace)
            .eq("id", campaignId)
            .maybeSingle();
        if (campaign.error) return errorResponse(campaign.error.message, 500);
        if (!campaign.data) return errorResponse("Campaign not found", 404);

        const url = new URL(request.url);
        const type = url.searchParams.get("type");
        const filter = url.searchParams.get("filter"); // "raw" (default) | "human"
        const pagination = paginationFromUrl(url);
        const [from, to] = rangeFor(pagination);

        if (filter !== "human") {
            let query = db
                .from("email_events")
                .select("subscriber_id, type, url, created_at, ip, user_agent", { count: "exact" })
                .eq("campaign_id", campaignId)
                .order("created_at", { ascending: false })
                .range(from, to);
            if (type) query = query.eq("type", type as EmailEventType);
            const { data, count, error } = await query;
            if (error) return errorResponse(error.message, 500);
            return json(listEnvelope(data, pagination, count));
        }

        // Human mode: UA + too-fast + burst filtering over the full event set.
        const HUMAN_PAGE_LIMIT = 5000;
        let allQuery = db
            .from("email_events")
            .select("subscriber_id, type, url, created_at, ip, user_agent")
            .eq("campaign_id", campaignId)
            .order("created_at", { ascending: false })
            .limit(HUMAN_PAGE_LIMIT);
        if (type) allQuery = allQuery.eq("type", type as EmailEventType);
        const allRes = await allQuery;
        if (allRes.error) return errorResponse(allRes.error.message, 500);
        const allEvents = (allRes.data ?? []).filter((e) => e.subscriber_id) as Array<{
            subscriber_id: string;
            type: string;
            url: string | null;
            created_at: string;
            ip: string | null;
            user_agent: string | null;
        }>;

        const sentRes = await db
            .from("sent_history")
            .select("subscriber_id, sent_at")
            .eq("campaign_id", campaignId);
        if (sentRes.error) return errorResponse(sentRes.error.message, 500);
        const sentAtMap = new Map<string, number>();
        for (const row of sentRes.data ?? []) {
            if (row.sent_at) sentAtMap.set(row.subscriber_id, new Date(row.sent_at).getTime());
        }

        const TOO_FAST_MS = 10_000;
        const BURST_GAP_MS = 5_000;
        const BURST_MIN = 4;

        const eventKey = (e: { subscriber_id: string; created_at: string; url: string | null }) =>
            `${e.subscriber_id}|${e.created_at}|${e.url || ""}`;
        const burstKeys = new Set<string>();
        const bySubscriber = new Map<string, typeof allEvents>();
        for (const e of allEvents) {
            const list = bySubscriber.get(e.subscriber_id) || [];
            list.push(e);
            bySubscriber.set(e.subscriber_id, list);
        }
        for (const subEvents of bySubscriber.values()) {
            if (subEvents.length < BURST_MIN) continue;
            const sorted = [...subEvents].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            let session: typeof sorted = [sorted[0]!];
            const flush = () => {
                if (session.length >= BURST_MIN) for (const e of session) burstKeys.add(eventKey(e));
            };
            for (let i = 1; i < sorted.length; i++) {
                const gap = new Date(sorted[i]!.created_at).getTime() - new Date(sorted[i - 1]!.created_at).getTime();
                if (gap <= BURST_GAP_MS) session.push(sorted[i]!);
                else {
                    flush();
                    session = [sorted[i]!];
                }
            }
            flush();
        }

        const exclusions = { scanner_ua: 0, too_fast: 0, burst: 0 };
        const kept: typeof allEvents = [];
        for (const e of allEvents) {
            const ua = (e.user_agent || "").toLowerCase();
            if (ua && SCANNER_UA_PATTERNS.some((p) => ua.includes(p))) {
                exclusions.scanner_ua++;
                continue;
            }
            const sentMs = sentAtMap.get(e.subscriber_id);
            if (sentMs && new Date(e.created_at).getTime() - sentMs < TOO_FAST_MS) {
                exclusions.too_fast++;
                continue;
            }
            if (burstKeys.has(eventKey(e))) {
                exclusions.burst++;
                continue;
            }
            kept.push(e);
        }

        const envelope = listEnvelope(kept.slice(from, to + 1), pagination, kept.length);
        return json({ ...envelope, raw_count: allEvents.length, excluded: exclusions });
    }

    if (method === "GET" && campaignId && action === "sent-history") {
        const campaign = await db
            .from("campaigns")
            .select("id")
            .eq("workspace", workspace)
            .eq("id", campaignId)
            .maybeSingle();
        if (campaign.error) return errorResponse(campaign.error.message, 500);
        if (!campaign.data) return errorResponse("Campaign not found", 404);

        const url = new URL(request.url);
        const pagination = paginationFromUrl(url);
        const [from, to] = rangeFor(pagination);
        const { data, count, error } = await db
            .from("sent_history")
            .select("subscriber_id,sent_at,resend_email_id,subscribers(email,first_name,last_name,tags,workspace)", {
                count: "exact",
            })
            .eq("campaign_id", campaignId)
            .order("sent_at", { ascending: false })
            .range(from, to);
        if (error) return errorResponse(error.message, 500);
        return json(listEnvelope(data, pagination, count));
    }

    if (method === "GET" && campaignId && !action) {
        const { data, error } = await db
            .from("campaigns")
            .select(campaignDetailFields)
            .eq("workspace", workspace)
            .eq("id", campaignId)
            .maybeSingle();
        if (error) return errorResponse(error.message, 500);
        if (!data) return errorResponse("Campaign not found", 404);
        return json({ data });
    }

    if (method === "POST" && !campaignId) {
        const body = await readJson(request);
        const parsed = campaignCreateSchema.safeParse(body);
        if (!parsed.success) return zodErrorResponse(parsed.error);

        const insert = {
            ...parsed.data,
            variable_values: (parsed.data.variable_values ?? {}) as never,
            status: parsed.data.status || ("draft" as const),
            workspace,
        };
        const { data, error } = await db.from("campaigns").insert(insert).select(campaignDetailFields).single();
        if (error) return errorResponse(error.message, 500);
        return json({ data }, 201);
    }

    if (method === "PATCH" && campaignId && !action) {
        const body = await readJson(request);
        const parsed = campaignPatchSchema.safeParse(body);
        if (!parsed.success) return zodErrorResponse(parsed.error);

        const { data, error } = await db
            .from("campaigns")
            .update({
                ...parsed.data,
                variable_values: parsed.data.variable_values as never,
                updated_at: new Date().toISOString(),
            })
            .eq("workspace", workspace)
            .eq("id", campaignId)
            .select(campaignDetailFields)
            .maybeSingle();
        if (error) return errorResponse(error.message, 500);
        if (!data) return errorResponse("Campaign not found", 404);
        return json({ data });
    }

    if (method === "POST" && campaignId && action === "clone") {
        const body = await readJson(request);
        const parsed = cloneCampaignSchema.safeParse(body);
        if (!parsed.success) return zodErrorResponse(parsed.error);

        const { data: original, error: fetchError } = await db
            .from("campaigns")
            .select("*")
            .eq("workspace", workspace)
            .eq("id", campaignId)
            .maybeSingle();
        if (fetchError) return errorResponse(fetchError.message, 500);
        if (!original) return errorResponse("Campaign not found", 404);

        const sourceVars = (original.variable_values || {}) as Record<string, unknown>;
        const restVars = { ...sourceVars };
        delete restVars.subscriber_id;
        const mergedVars: Record<string, unknown> = { ...restVars, ...(parsed.data.variable_values || {}) };
        if (parsed.data.subscriber_ids?.length) mergedVars.subscriber_ids = parsed.data.subscriber_ids;
        if (parsed.data.target_tag) mergedVars.target_tag = parsed.data.target_tag;

        let name = parsed.data.name;
        if (!name) {
            const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            if (parsed.data.subscriber_ids?.length) {
                name = `${original.name} (Bulk Send ${today}, ${parsed.data.subscriber_ids.length} recipients)`;
            } else if (parsed.data.target_tag) {
                name = `${original.name} (Tag: ${parsed.data.target_tag})`;
            } else {
                name = original.name;
            }
        }

        const { data, error: insertError } = await db
            .from("campaigns")
            .insert({
                name,
                status: "draft" as const,
                email_type: original.email_type || "campaign",
                subject_line: original.subject_line,
                html_content: original.html_content,
                workspace,
                variable_values: mergedVars as never,
                parent_template_id: original.is_template ? original.id : original.parent_template_id || null,
                is_template: parsed.data.is_template ?? false,
                is_starred_template: parsed.data.is_starred_template ?? false,
            })
            .select(campaignDetailFields)
            .single();
        if (insertError) return errorResponse(insertError.message, 500);
        return json({ data }, 201);
    }

    if (method === "POST" && campaignId && action === "cancel-schedule") {
        const { data, error } = await db
            .from("campaigns")
            .select("id,scheduled_status")
            .eq("workspace", workspace)
            .eq("id", campaignId)
            .maybeSingle();
        if (error) return errorResponse(error.message, 500);
        if (!data) return errorResponse("Campaign not found", 404);
        if (data.scheduled_status === "sent") {
            return errorResponse("ALREADY_SENT", 409, { message: "Campaign already sent; nothing to cancel." });
        }
        const update = await db
            .from("campaigns")
            .update({ scheduled_status: "cancelled" as const, status: "draft" as const, updated_at: new Date().toISOString() })
            .eq("workspace", workspace)
            .eq("id", campaignId);
        if (update.error) return errorResponse(update.error.message, 500);
        return json({ data: { success: true, cancelled: true } });
    }

    if (method === "POST" && campaignId && action === "send") {
        const body = await readJson(request);
        const parsed = sendSchema.safeParse(body);
        if (!parsed.success) return zodErrorResponse(parsed.error);

        const { data: campaign, error } = await db
            .from("campaigns")
            .select("id,name,is_template,variable_values,status,workspace")
            .eq("workspace", workspace)
            .eq("id", campaignId)
            .maybeSingle();
        if (error) return errorResponse(error.message, 500);
        if (!campaign) return errorResponse("Campaign not found", 404);

        const variableValues = (campaign.variable_values || {}) as Record<string, unknown>;
        const subscriberIds = variableValues.subscriber_ids;
        const hasSubscriberIds = Array.isArray(subscriberIds) && subscriberIds.length > 0;
        const hasSubscriberId = Boolean(variableValues.subscriber_id);
        const hasTargetTag = Boolean(variableValues.target_tag);

        if (!hasSubscriberId && !hasSubscriberIds && !hasTargetTag) {
            return errorResponse("UNSAFE_SEND_BLOCKED", 400, {
                message:
                    "Set variable_values.subscriber_id, variable_values.subscriber_ids, or variable_values.target_tag before sending.",
            });
        }

        if (hasTargetTag && !parsed.data.confirmTargetTag) {
            return errorResponse("TARGET_TAG_SEND_REQUIRES_CONFIRMATION", 400, {
                message: "target_tag can send to a broad audience. Retry with { confirmTargetTag: true }.",
            });
        }

        // Suppression-aware audience resolution + size echo (safety audit gate).
        let audienceCount = 0;
        let suppressedCount = 0;
        try {
            const audience = await resolveAudience(db, campaign);
            audienceCount = audience.subscribers.length;
            suppressedCount = audience.suppressedCount;
        } catch (e) {
            return errorResponse("AUDIENCE_RESOLUTION_FAILED", 500, {
                message: e instanceof Error ? e.message : String(e),
            });
        }
        if (audienceCount === 0) {
            return errorResponse("UNSAFE_SEND_BLOCKED", 400, {
                message: "Resolved audience is empty (all recipients suppressed, inactive, or unknown).",
                suppressedCount,
            });
        }
        if (
            audienceCount >= RECIPIENT_COUNT_CONFIRMATION_THRESHOLD &&
            parsed.data.confirmRecipientCount !== audienceCount
        ) {
            return errorResponse("RECIPIENT_COUNT_CONFIRMATION_REQUIRED", 400, {
                message: `This send resolves to ${audienceCount} recipient(s) (>= ${RECIPIENT_COUNT_CONFIRMATION_THRESHOLD}). Retry with { confirmRecipientCount: ${audienceCount} } to confirm.`,
                audienceCount,
                suppressedCount,
            });
        }

        const eventData = {
            campaignId,
            workspace,
            fromName: parsed.data.fromName,
            fromEmail: parsed.data.fromEmail,
            clickTracking: parsed.data.clickTracking,
            clickTrackingMode: parsed.data.clickTrackingMode,
            openTracking: parsed.data.openTracking,
        };

        if (parsed.data.scheduledAt) {
            const update = await db
                .from("campaigns")
                .update({
                    scheduled_at: parsed.data.scheduledAt,
                    scheduled_status: "pending" as const,
                    status: "scheduled" as const,
                    updated_at: new Date().toISOString(),
                })
                .eq("workspace", workspace)
                .eq("id", campaignId);
            if (update.error) return errorResponse(update.error.message, 500);

            await dispatchInngest("agent.campaign.scheduled-send", {
                ...eventData,
                scheduledAt: parsed.data.scheduledAt,
            });
            return json({
                data: {
                    success: true,
                    scheduled: true,
                    scheduledAt: parsed.data.scheduledAt,
                    audienceCount,
                    suppressedCount,
                },
            });
        }

        const update = await db
            .from("campaigns")
            .update({ status: "sending" as const, updated_at: new Date().toISOString() })
            .eq("workspace", workspace)
            .eq("id", campaignId);
        if (update.error) return errorResponse(update.error.message, 500);

        await dispatchInngest("agent.campaign.send", eventData);
        return json({ data: { success: true, scheduled: false, audienceCount, suppressedCount } });
    }

    return errorResponse("Campaign endpoint not found", 404);
}

// --- subscribers -------------------------------------------------------------

async function handleSubscribers(request: Request, method: string, workspace: Workspace, path: string[]) {
    const db = getAdminDb();
    const subscriberId = path[1];
    const action = path[2];

    if (method === "GET" && !subscriberId) {
        const url = new URL(request.url);
        const pagination = paginationFromUrl(url);
        const [from, to] = rangeFor(pagination);

        let query = db
            .from("subscribers")
            .select(subscriberFields, { count: "exact" })
            .eq("workspace", workspace)
            .order("created_at", { ascending: false })
            .range(from, to);

        const tag = url.searchParams.get("tag");
        const notTags = url.searchParams.getAll("not_tag");
        const search = url.searchParams.get("search");
        const status = url.searchParams.get("status");
        if (tag) query = query.contains("tags", [tag]);
        for (const nt of notTags) {
            if (nt) query = query.not("tags", "cs", `{${nt}}`);
        }
        if (search) query = query.ilike("email", `%${search}%`);
        if (status) query = query.eq("status", status as SubscriberStatus);

        const { data, count, error } = await query;
        if (error) return errorResponse(error.message, 500);
        return json(listEnvelope(data, pagination, count));
    }

    if (method === "GET" && subscriberId && action === "history") {
        const subscriber = await db
            .from("subscribers")
            .select("id")
            .eq("workspace", workspace)
            .eq("id", subscriberId)
            .maybeSingle();
        if (subscriber.error) return errorResponse(subscriber.error.message, 500);
        if (!subscriber.data) return errorResponse("Subscriber not found", 404);

        const [sentRes, eventsRes] = await Promise.all([
            db
                .from("sent_history")
                .select("campaign_id,sent_at,resend_email_id,campaigns(name,subject_line,workspace)")
                .eq("subscriber_id", subscriberId)
                .order("sent_at", { ascending: false })
                .limit(100),
            db
                .from("email_events")
                .select("type,url,created_at,metadata")
                .eq("subscriber_id", subscriberId)
                .order("created_at", { ascending: false })
                .limit(100),
        ]);
        if (sentRes.error) return errorResponse(sentRes.error.message, 500);
        if (eventsRes.error) return errorResponse(eventsRes.error.message, 500);
        return json({ data: { sent: sentRes.data || [], events: eventsRes.data || [] } });
    }

    if (method === "GET" && subscriberId && !action) {
        const { data, error } = await db
            .from("subscribers")
            .select(subscriberFields)
            .eq("workspace", workspace)
            .eq("id", subscriberId)
            .maybeSingle();
        if (error) return errorResponse(error.message, 500);
        if (!data) return errorResponse("Subscriber not found", 404);
        return json({ data });
    }

    if (method === "PATCH" && subscriberId && !action) {
        const body = await readJson(request);
        const parsed = subscriberPatchSchema.safeParse(body);
        if (!parsed.success) return zodErrorResponse(parsed.error);

        const { data, error } = await db
            .from("subscribers")
            .update({ ...parsed.data, smart_tags: parsed.data.smart_tags as never })
            .eq("workspace", workspace)
            .eq("id", subscriberId)
            .select(subscriberFields)
            .maybeSingle();
        if (error) return errorResponse(error.message, 500);
        if (!data) return errorResponse("Subscriber not found", 404);
        return json({ data });
    }

    if (method === "POST" && !subscriberId) {
        const body = await readJson(request);
        const parsed = subscriberUpsertSchema.safeParse(body);
        if (!parsed.success) return zodErrorResponse(parsed.error);

        const email = normalizeEmail(parsed.data.email);
        // subscribers.email is globally unique (citext) in the unified schema,
        // so lookup is by email only.
        const existing = await db.from("subscribers").select("id,tags").eq("email", email).maybeSingle();
        if (existing.error) return errorResponse(existing.error.message, 500);

        const tags = uniqueStrings([...(existing.data?.tags || []), ...(parsed.data.tags || [])]);
        await ensureTagDefinitions(workspace, tags);

        if (existing.data) {
            const { data, error } = await db
                .from("subscribers")
                .update({ ...parsed.data, smart_tags: parsed.data.smart_tags as never, email, tags, workspace })
                .eq("id", existing.data.id)
                .select(subscriberFields)
                .single();
            if (error) return errorResponse(error.message, 500);
            return json({ data });
        }

        const { data, error } = await db
            .from("subscribers")
            .insert({ ...parsed.data, smart_tags: parsed.data.smart_tags as never, email, tags, workspace })
            .select(subscriberFields)
            .single();
        if (error) return errorResponse(error.message, 500);
        return json({ data }, 201);
    }

    if (method === "POST" && subscriberId === "bulk-tag") {
        const body = await readJson(request);
        const parsed = bulkTagSchema.safeParse(body);
        if (!parsed.success) return zodErrorResponse(parsed.error);

        await ensureTagDefinitions(workspace, parsed.data.tags);

        const results = [];
        for (const emailInput of parsed.data.emails) {
            const email = normalizeEmail(emailInput);
            const existing = await db.from("subscribers").select("id,tags").eq("email", email).maybeSingle();
            if (existing.error) {
                results.push({ email, success: false, error: existing.error.message });
                continue;
            }
            const tags = uniqueStrings([...(existing.data?.tags || []), ...parsed.data.tags]);
            const response = existing.data
                ? await db.from("subscribers").update({ tags }).eq("id", existing.data.id)
                : await db.from("subscribers").insert({ email, tags, workspace, status: "active" });
            results.push(
                response.error ? { email, success: false, error: response.error.message } : { email, success: true }
            );
        }

        return json({
            data: {
                succeeded: results.filter((r) => r.success).length,
                total: results.length,
                results,
            },
        });
    }

    if (method === "POST" && subscriberId === "bulk-untag") {
        const body = await readJson(request);
        const parsed = bulkUntagSchema.safeParse(body);
        if (!parsed.success) return zodErrorResponse(parsed.error);

        const removeSet = new Set(parsed.data.tags);
        const results = [];
        for (const emailInput of parsed.data.emails) {
            const email = normalizeEmail(emailInput);
            const existing = await db.from("subscribers").select("id,tags").eq("email", email).maybeSingle();
            if (existing.error) {
                results.push({ email, success: false, error: existing.error.message });
                continue;
            }
            if (!existing.data) {
                results.push({ email, success: false, error: "subscriber not found" });
                continue;
            }
            const before = existing.data.tags || [];
            const after = before.filter((t) => !removeSet.has(t));
            if (before.length === after.length) {
                results.push({ email, success: true, removed: 0 });
                continue;
            }
            const update = await db.from("subscribers").update({ tags: after }).eq("id", existing.data.id);
            results.push(
                update.error
                    ? { email, success: false, error: update.error.message }
                    : { email, success: true, removed: before.length - after.length }
            );
        }

        return json({
            data: {
                succeeded: results.filter((r) => r.success).length,
                total: results.length,
                results,
            },
        });
    }

    return errorResponse("Subscriber endpoint not found", 404);
}

// --- tags --------------------------------------------------------------------

async function handleTags(request: Request, method: string, workspace: Workspace, path: string[]) {
    const db = getAdminDb();
    const tagId = path[1];

    if (method === "GET") {
        const { data, error } = await db.from("tag_definitions").select("*").eq("workspace", workspace).order("name");
        if (error) return errorResponse(error.message, 500);
        return json({ data: data || [] });
    }

    if (method === "POST") {
        const body = await readJson(request);
        const parsed = tagCreateSchema.safeParse(body);
        if (!parsed.success) return zodErrorResponse(parsed.error);

        const { data, error } = await db
            .from("tag_definitions")
            .upsert({ ...parsed.data, workspace }, { onConflict: "workspace,name" })
            .select()
            .single();
        if (error) return errorResponse(error.message, 500);
        return json({ data }, 201);
    }

    if (method === "DELETE" && tagId) {
        const { data: tag, error } = await db.from("tag_definitions").select("id,name").eq("id", tagId).maybeSingle();
        if (error) return errorResponse(error.message, 500);
        if (!tag) return errorResponse("Tag not found", 404);

        const affected = await db
            .from("subscribers")
            .select("id,tags")
            .eq("workspace", workspace)
            .contains("tags", [tag.name]);
        if (affected.error) return errorResponse(affected.error.message, 500);

        for (const subscriber of affected.data || []) {
            await db
                .from("subscribers")
                .update({ tags: (subscriber.tags || []).filter((value) => value !== tag.name) })
                .eq("id", subscriber.id);
        }

        const deleted = await db.from("tag_definitions").delete().eq("id", tagId);
        if (deleted.error) return errorResponse(deleted.error.message, 500);
        return json({ data: { success: true, removedFrom: affected.data?.length || 0 } });
    }

    return errorResponse("Tags endpoint not found", 404);
}

// --- rotations ---------------------------------------------------------------

async function handleRotations(request: Request, method: string, workspace: Workspace, path: string[]) {
    const db = getAdminDb();
    const rotationId = path[1];
    const action = path[2];

    if (method === "GET" && !rotationId) {
        const url = new URL(request.url);
        const pagination = paginationFromUrl(url);
        const [from, to] = rangeFor(pagination);
        const { data, count, error } = await db
            .from("rotations")
            .select("*", { count: "exact" })
            .eq("workspace", workspace)
            .order("updated_at", { ascending: false })
            .range(from, to);
        if (error) return errorResponse(error.message, 500);
        return json(listEnvelope(data, pagination, count));
    }

    if (method === "GET" && rotationId && action === "analytics") {
        const rotation = await db
            .from("rotations")
            .select("id, campaign_ids")
            .eq("workspace", workspace)
            .eq("id", rotationId)
            .maybeSingle();
        if (rotation.error) return errorResponse(rotation.error.message, 500);
        if (!rotation.data) return errorResponse("Rotation not found", 404);

        const templateIds: string[] = rotation.data.campaign_ids || [];
        const [childrenRes, templatesRes] = await Promise.all([
            db
                .from("campaigns")
                .select("id, name, parent_template_id, total_recipients, total_opens, total_clicks, status, created_at")
                .eq("rotation_id", rotationId)
                .order("created_at", { ascending: false }),
            templateIds.length
                ? db.from("campaigns").select("id, name").in("id", templateIds)
                : Promise.resolve({ data: [] as Array<{ id: string; name: string }>, error: null }),
        ]);
        if (childrenRes.error) return errorResponse(childrenRes.error.message, 500);
        if (templatesRes.error) return errorResponse(templatesRes.error.message, 500);

        const templateNames: Record<string, string> = {};
        for (const t of templatesRes.data || []) templateNames[t.id] = t.name;

        const children = childrenRes.data || [];
        const stats = templateIds.map((templateId) => {
            const tChildren = children.filter((c) => c.parent_template_id === templateId);
            const recipients = tChildren.reduce((s, c) => s + (c.total_recipients || 0), 0);
            const opens = tChildren.reduce((s, c) => s + (c.total_opens || 0), 0);
            const clicks = tChildren.reduce((s, c) => s + (c.total_clicks || 0), 0);
            return {
                templateId,
                templateName: templateNames[templateId] || "Unknown",
                sends: recipients,
                opens,
                clicks,
                openRate: recipients > 0 ? Math.round((opens / recipients) * 100) : 0,
                clickRate: recipients > 0 ? Math.round((clicks / recipients) * 100) : 0,
                childCampaigns: tChildren,
            };
        });
        return json({ data: stats });
    }

    if (method === "GET" && rotationId && !action) {
        const { data, error } = await db
            .from("rotations")
            .select("*")
            .eq("workspace", workspace)
            .eq("id", rotationId)
            .maybeSingle();
        if (error) return errorResponse(error.message, 500);
        if (!data) return errorResponse("Rotation not found", 404);
        return json({ data });
    }

    if (method === "POST" && !rotationId) {
        const body = await readJson(request);
        const parsed = rotationCreateSchema.safeParse(body);
        if (!parsed.success) return zodErrorResponse(parsed.error);

        const { data, error } = await db
            .from("rotations")
            .insert({ name: parsed.data.name, campaign_ids: parsed.data.campaign_ids, cursor_position: 0, workspace })
            .select("*")
            .single();
        if (error) return errorResponse(error.message, 500);
        return json({ data }, 201);
    }

    if (method === "PATCH" && rotationId && !action) {
        const body = await readJson(request);
        const parsed = rotationPatchSchema.safeParse(body);
        if (!parsed.success) return zodErrorResponse(parsed.error);

        const { data, error } = await db
            .from("rotations")
            .update({ ...parsed.data, updated_at: new Date().toISOString() })
            .eq("workspace", workspace)
            .eq("id", rotationId)
            .select("*")
            .maybeSingle();
        if (error) return errorResponse(error.message, 500);
        if (!data) return errorResponse("Rotation not found", 404);
        return json({ data });
    }

    if (method === "POST" && rotationId && action === "cancel-schedule") {
        const rotation = await db
            .from("rotations")
            .select("id")
            .eq("workspace", workspace)
            .eq("id", rotationId)
            .maybeSingle();
        if (rotation.error) return errorResponse(rotation.error.message, 500);
        if (!rotation.data) return errorResponse("Rotation not found", 404);

        const { error } = await db
            .from("app_settings")
            .upsert({ key: `rotation-schedule:${rotationId}`, value: { status: "cancelled" } });
        if (error) return errorResponse(error.message, 500);
        return json({ data: { success: true, cancelled: true } });
    }

    if (method === "POST" && rotationId && action === "send") {
        const body = await readJson(request);
        const parsed = rotationSendSchema.safeParse(body);
        if (!parsed.success) return zodErrorResponse(parsed.error);

        const rotation = await db
            .from("rotations")
            .select("id, campaign_ids")
            .eq("workspace", workspace)
            .eq("id", rotationId)
            .maybeSingle();
        if (rotation.error) return errorResponse(rotation.error.message, 500);
        if (!rotation.data) return errorResponse("Rotation not found", 404);
        if (!Array.isArray(rotation.data.campaign_ids) || rotation.data.campaign_ids.length === 0) {
            return errorResponse("Rotation has no campaigns", 400);
        }

        // Suppression-aware audience echo, same rules as campaign sends.
        let audienceCount = 0;
        let suppressedCount = 0;
        try {
            const audience = await resolveAudience(
                db,
                { workspace, variable_values: { subscriber_ids: parsed.data.subscriberIds } }
            );
            audienceCount = audience.subscribers.length;
            suppressedCount = audience.suppressedCount;
        } catch (e) {
            return errorResponse("AUDIENCE_RESOLUTION_FAILED", 500, {
                message: e instanceof Error ? e.message : String(e),
            });
        }
        if (audienceCount === 0) {
            return errorResponse("UNSAFE_SEND_BLOCKED", 400, {
                message: "Resolved audience is empty (all recipients suppressed, inactive, or unknown).",
                suppressedCount,
            });
        }
        if (
            audienceCount >= RECIPIENT_COUNT_CONFIRMATION_THRESHOLD &&
            parsed.data.confirmRecipientCount !== audienceCount
        ) {
            return errorResponse("RECIPIENT_COUNT_CONFIRMATION_REQUIRED", 400, {
                message: `This send resolves to ${audienceCount} recipient(s) (>= ${RECIPIENT_COUNT_CONFIRMATION_THRESHOLD}). Retry with { confirmRecipientCount: ${audienceCount} } to confirm.`,
                audienceCount,
                suppressedCount,
            });
        }

        const eventData = {
            rotationId,
            subscriberIds: parsed.data.subscriberIds,
            fromName: parsed.data.fromName,
            fromEmail: parsed.data.fromEmail,
            clickTracking: parsed.data.clickTracking,
            clickTrackingMode: parsed.data.clickTrackingMode,
            openTracking: parsed.data.openTracking,
        };

        if (parsed.data.scheduledAt) {
            const { error } = await db.from("app_settings").upsert({
                key: `rotation-schedule:${rotationId}`,
                value: { status: "pending", scheduledAt: parsed.data.scheduledAt },
            });
            if (error) return errorResponse(error.message, 500);

            await dispatchInngest("agent.rotation.scheduled-send", {
                ...eventData,
                scheduledAt: parsed.data.scheduledAt,
            });
            return json({
                data: {
                    success: true,
                    scheduled: true,
                    scheduledAt: parsed.data.scheduledAt,
                    audienceCount,
                    suppressedCount,
                },
            });
        }

        await dispatchInngest("agent.rotation.send", eventData);
        return json({ data: { success: true, scheduled: false, audienceCount, suppressedCount } });
    }

    return errorResponse("Rotation endpoint not found", 404);
}

// --- merge-tags --------------------------------------------------------------

async function handleMergeTags(request: Request, method: string, workspace: Workspace, path: string[]) {
    const db = getAdminDb();
    const mergeTagId = path[1];

    if (method === "GET") {
        const { data, error } = await db
            .from("merge_tags")
            .select("*")
            .order("created_at", { ascending: true });
        if (error) return errorResponse(error.message, 500);
        return json({ data: data || [] });
    }

    if (method === "POST" && !mergeTagId) {
        const body = await readJson(request);
        const parsed = mergeTagCreateSchema.safeParse(body);
        if (!parsed.success) return zodErrorResponse(parsed.error);

        const { data, error } = await db
            .from("merge_tags")
            .upsert({ ...parsed.data, workspace }, { onConflict: "workspace,name" })
            .select()
            .single();
        if (error) return errorResponse(error.message, 500);
        return json({ data }, 201);
    }

    if (method === "PATCH" && mergeTagId) {
        const body = await readJson(request);
        const parsed = mergeTagPatchSchema.safeParse(body);
        if (!parsed.success) return zodErrorResponse(parsed.error);

        const { data, error } = await db
            .from("merge_tags")
            .update({ ...parsed.data, updated_at: new Date().toISOString() })
            .eq("id", mergeTagId)
            .select()
            .maybeSingle();
        if (error) return errorResponse(error.message, 500);
        if (!data) return errorResponse("Merge tag not found", 404);
        return json({ data });
    }

    if (method === "DELETE" && mergeTagId) {
        const { error } = await db.from("merge_tags").delete().eq("id", mergeTagId);
        if (error) return errorResponse(error.message, 500);
        return json({ data: { success: true } });
    }

    return errorResponse("Merge-tags endpoint not found", 404);
}

// --- suppressions (read-only inspection) ------------------------------------

async function handleSuppressions(request: Request, method: string) {
    if (method !== "GET") return errorResponse("Suppressions endpoint not found", 404);
    const db = getAdminDb();
    const url = new URL(request.url);
    const pagination = paginationFromUrl(url);
    const [from, to] = rangeFor(pagination);
    let query = db
        .from("suppressions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);
    const search = url.searchParams.get("search");
    if (search) query = query.ilike("email", `%${search}%`);
    const { data, count, error } = await query;
    if (error) return errorResponse(error.message, 500);
    return json(listEnvelope(data, pagination, count));
}

// --- entry -------------------------------------------------------------------

export async function handleAgentRequest(request: Request, context: AgentRouteContext): Promise<NextResponse> {
    try {
        const authError = requireAgentAuth(request);
        if (authError) return authError;

        const params = await context.params;
        const workspaceResult = workspaceSchema.safeParse(params.workspace);
        if (!workspaceResult.success) {
            return errorResponse("Invalid workspace", 400, { allowed: workspaceSchema.options });
        }

        const path = params.path || [];
        const resource = path[0] || "";
        const method = request.method.toUpperCase();
        const workspace = workspaceResult.data;

        switch (resource) {
            case "campaigns":
                return await handleCampaigns(request, method, workspace, path);
            case "subscribers":
                return await handleSubscribers(request, method, workspace, path);
            case "tags":
                return await handleTags(request, method, workspace, path);
            case "rotations":
                return await handleRotations(request, method, workspace, path);
            case "merge-tags":
                return await handleMergeTags(request, method, workspace, path);
            case "suppressions":
                return await handleSuppressions(request, method);
            default:
                return errorResponse(`Unknown agent API resource: ${resource}`, 404);
        }
    } catch (error) {
        console.error("[agent-api] unhandled error:", error);
        return errorResponse(error instanceof Error ? error.message : "Unexpected server error", 500);
    }
}
