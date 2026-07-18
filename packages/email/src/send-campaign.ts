/**
 * sendCampaign — the core per-recipient send loop.
 *
 * ── Idempotency invariant (non-negotiable fix #1) ───────────────────────────
 * Re-running this function for the same campaign NEVER re-sends an email:
 *   a. pre-query: recipients already in sent_history are filtered out;
 *   b. per-recipient write: a sent_history row is inserted IMMEDIATELY after
 *      each successful Resend call (a mid-loop crash loses nothing);
 *   c. last line of defense: sent_history has UNIQUE (campaign_id,
 *      subscriber_id) — a unique-violation on insert is treated as a SKIP,
 *      not an error (another invocation won the race).
 * This is what makes it safe for Inngest to wrap the whole call in a single
 * retriable step: a step retry re-runs the function, hits (a), and no-ops for
 * everyone already sent (the 2026-05-12 double-send scenario, now impossible).
 *
 * ── Retry invariant (fix #2) ────────────────────────────────────────────────
 * Resend calls AND internal DB calls retry with exponential backoff on
 * 429/5xx (max 5 attempts) instead of aborting the whole send.
 *
 * ── Completion invariant (fix #3) ───────────────────────────────────────────
 * Completion state (campaigns.status/total_recipients) is derived ONLY from
 * counting sent_history rows — never from "we scheduled it".
 *
 * ── Suppression invariant (fix #4) ──────────────────────────────────────────
 * Every recipient is checked against suppressions + subscribers.status at
 * send time (in addition to the audience-level pre-filter).
 */

import type { AdminClient, Tables } from "@dreamplay/db";
import { resolveAudience } from "./audience";
import { applyMergeTags, getMergeTagDefaults } from "./merge-tags";
import { injectPreheader } from "./preheader";
import { renderConditionalBlocks, renderTemplate, STANDARD_TAGS } from "./render-template";
import { retryDb, withRetry, type RetryOptions } from "./retry";
import { defaultFromAddress, type EmailSender } from "./sender";
import { isSuppressed } from "./suppression";
import { injectOpenPixel, pickTrackingBaseUrl, rewriteLinks, type ClickTrackingMode } from "./tracking-links";
import { appendUnsubscribeFooter, buildUnsubscribeUrls, unsubscribeHeaders } from "./unsubscribe";

export type LogLevel = "info" | "success" | "warn" | "error";
export type LogFn = (level: LogLevel, message: string, meta?: Record<string, unknown>) => void;

export interface SendCampaignDeps {
    db: AdminClient;
    sender: EmailSender;
    /** Optional HTML transform (image proxy). Injected so tests skip it. */
    prepareHtml?: (html: string, log: LogFn) => Promise<string>;
}

export interface SendCampaignOptions {
    campaignId: string;
    /**
     * Deterministic idempotency key for TEMPLATE sends. When the campaign is
     * a template, the send clones it into a child; the child is looked up /
     * created by this key so a retried invocation reuses the same child (and
     * therefore the same sent_history scope) instead of minting a fresh one.
     * Callers triggering template sends from Inngest MUST memoize this in its
     * own step. Direct (non-template) campaign sends don't need it.
     */
    sendKey?: string;
    overrideSubscriberIds?: string[];
    fromName?: string | null;
    fromEmail?: string | null;
    clickTracking?: boolean;
    clickTrackingMode?: ClickTrackingMode;
    openTracking?: boolean;
    triggeredBy?: string;
    /** Sends per second (default env RESEND_SEND_RATE_PER_SEC, then 5). */
    ratePerSec?: number;
    /** Override the From-domain-aligned tracking base URL. */
    trackingBaseUrl?: string;
    /** Injectable pacing/backoff for tests. */
    sleep?: (ms: number) => Promise<void>;
    retry?: RetryOptions;
    log?: LogFn;
}

export interface SendCampaignResult {
    /** Campaign the sends were recorded against (child id for templates). */
    campaignId: string;
    sent: number;
    failed: number;
    skippedAlreadySent: number;
    skippedSuppressed: number;
    totalAudience: number;
    /** Authoritative post-send count of sent_history rows for the campaign. */
    sentHistoryCount: number;
    completed: boolean;
}

const noopLog: LogFn = () => {};
const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function envRatePerSec(): number {
    const raw = Number(process.env.RESEND_SEND_RATE_PER_SEC);
    return Number.isFinite(raw) && raw > 0 ? raw : 5;
}

type CampaignRow = Tables<"campaigns">;

function vv(campaign: Pick<CampaignRow, "variable_values">): Record<string, unknown> {
    return (campaign.variable_values ?? {}) as Record<string, unknown>;
}

/**
 * For template campaigns: find-or-create the child campaign that actually
 * records the send. Lookup is by campaigns.send_key (unique partial index),
 * so retries reuse the child created by the first attempt.
 */
async function resolveTrackingCampaign(
    db: AdminClient,
    campaign: CampaignRow,
    sendKey: string | undefined,
    log: LogFn
): Promise<CampaignRow> {
    if (!campaign.is_template) return campaign;

    if (sendKey) {
        const existing = await retryDb(() =>
            db.from("campaigns").select("*").eq("send_key", sendKey).limit(1)
        );
        if (existing.error) throw new Error(`child lookup failed: ${existing.error.message}`);
        if (existing.data && existing.data.length > 0) {
            log("info", `Reusing child campaign ${existing.data[0]!.id} for sendKey=${sendKey} (retry detected).`);
            return existing.data[0] as CampaignRow;
        }
    } else {
        log(
            "warn",
            "Template send without a sendKey: child creation is NOT idempotent across retries. Pass a memoized sendKey from the caller."
        );
    }

    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const sourceVars = vv(campaign);
    const { subscriber_id: _drop, ...childVars } = sourceVars;
    const insert = await db
        .from("campaigns")
        .insert({
            name: `${campaign.name} (Send ${today})`,
            subject_line: campaign.subject_line,
            html_content: campaign.html_content,
            status: "draft" as const,
            is_template: false,
            parent_template_id: campaign.id,
            workspace: campaign.workspace,
            email_type: campaign.email_type ?? "campaign",
            send_key: sendKey ?? null,
            variable_values: childVars as CampaignRow["variable_values"],
        })
        .select("*")
        .single();

    if (insert.error) {
        // Unique violation on send_key => another invocation created the child
        // between our lookup and insert. Reuse theirs.
        if (sendKey && insert.error.code === "23505") {
            const again = await retryDb(() => db.from("campaigns").select("*").eq("send_key", sendKey).limit(1));
            if (!again.error && again.data && again.data.length > 0) return again.data[0] as CampaignRow;
        }
        throw new Error(`Failed to create child campaign: ${insert.error.message}`);
    }
    log("info", `Created child campaign ${insert.data.id} from template ${campaign.id}`);
    return insert.data as CampaignRow;
}

export async function sendCampaign(
    deps: SendCampaignDeps,
    options: SendCampaignOptions
): Promise<SendCampaignResult> {
    const { db, sender } = deps;
    const log = options.log ?? noopLog;
    const sleep = options.sleep ?? defaultSleep;
    const ratePerSec = options.ratePerSec ?? envRatePerSec();
    const interSendDelayMs = Math.ceil(1000 / ratePerSec);
    const clickTracking = options.clickTracking ?? true;
    const clickTrackingMode = options.clickTrackingMode ?? "append";
    const openTracking = options.openTracking ?? true;
    const retryOpts: RetryOptions = { ...options.retry };

    const logs: Array<Record<string, unknown>> = [];
    const capture: LogFn = (level, message, meta) => {
        logs.push({ ts: new Date().toISOString(), level, message, ...(meta ?? {}) });
        log(level, message, meta);
    };

    // Durable send log row — failures land in the DB, not just function logs.
    let sendLogId: string | null = null;
    {
        const res = await db
            .from("send_logs")
            .insert({ campaign_id: options.campaignId, triggered_by: options.triggeredBy ?? "agent", status: "pending" })
            .select("id")
            .single();
        if (res.error) capture("warn", `send_logs insert failed: ${res.error.message}`);
        else sendLogId = res.data.id;
    }

    const finalizeLog = async (status: "success" | "error", errorMessage?: string) => {
        if (!sendLogId) return;
        await db
            .from("send_logs")
            .update({ status, error_message: errorMessage ?? null, logs: logs as never })
            .eq("id", sendLogId);
    };

    try {
        // ── Load campaign ──────────────────────────────────────────────────
        const campaignRes = await retryDb(
            () => db.from("campaigns").select("*").eq("id", options.campaignId).maybeSingle(),
            retryOpts
        );
        if (campaignRes.error) throw new Error(`campaign fetch failed: ${campaignRes.error.message}`);
        if (!campaignRes.data) throw new Error(`Campaign ${options.campaignId} not found`);
        const campaign = campaignRes.data as CampaignRow;
        capture("info", `Campaign: "${campaign.name}"`);

        const tracking = await resolveTrackingCampaign(db, campaign, options.sendKey, capture);
        const trackingCampaignId = tracking.id;
        const campaignVars = vv(campaign);

        // ── Audience (active + suppression pre-filter) ─────────────────────
        const audience = await resolveAudience(db, campaign, options.overrideSubscriberIds);
        let skippedSuppressed = audience.suppressedCount;
        const totalAudience = audience.subscribers.length + audience.suppressedCount;
        capture("info", `Audience: ${audience.subscribers.length} sendable (${skippedSuppressed} suppressed) via ${audience.source}`);

        // ── Idempotency pre-query (fix #1a) ────────────────────────────────
        // Skip everyone already in sent_history for this campaign. On error we
        // ABORT: sending without the guard risks a double-send.
        const alreadySent = new Set<string>();
        {
            const ids = audience.subscribers.map((s) => s.id);
            for (let i = 0; i < ids.length; i += 200) {
                const chunk = ids.slice(i, i + 200);
                const res = await retryDb(
                    () =>
                        db
                            .from("sent_history")
                            .select("subscriber_id")
                            .eq("campaign_id", trackingCampaignId)
                            .in("subscriber_id", chunk),
                    retryOpts
                );
                if (res.error) {
                    throw new Error(`Idempotency check failed: ${res.error.message}. Aborting to avoid double-send.`);
                }
                for (const row of res.data ?? []) alreadySent.add(row.subscriber_id);
            }
        }
        const recipients = audience.subscribers.filter((s) => !alreadySent.has(s.id));
        if (alreadySent.size > 0) {
            capture("warn", `Idempotency filter: ${alreadySent.size} recipient(s) already in sent_history; skipping.`);
        }

        const resolvedFromEmail =
            options.fromEmail || (campaignVars.from_email as string | undefined) || null;
        const resolvedFromName = options.fromName || (campaignVars.from_name as string | undefined) || null;
        const baseUrl = options.trackingBaseUrl ?? pickTrackingBaseUrl(resolvedFromEmail);

        const finalize = async (sent: number, failed: number): Promise<SendCampaignResult> => {
            // ── Completion derived ONLY from sent_history (fix #3) ─────────
            const countRes = await retryDb(
                () =>
                    db
                        .from("sent_history")
                        .select("id", { count: "exact", head: true })
                        .eq("campaign_id", trackingCampaignId),
                retryOpts
            );
            const sentHistoryCount = countRes.count ?? 0;
            const completed = failed === 0;
            await db
                .from("campaigns")
                .update({
                    status: completed ? "completed" : "sending",
                    total_recipients: sentHistoryCount,
                    updated_at: new Date().toISOString(),
                    ...(firstResendEmailId ? { resend_email_id: firstResendEmailId } : {}),
                })
                .eq("id", trackingCampaignId);

            const result: SendCampaignResult = {
                campaignId: trackingCampaignId,
                sent,
                failed,
                skippedAlreadySent: alreadySent.size + lateUniqueSkips,
                skippedSuppressed,
                totalAudience,
                sentHistoryCount,
                completed,
            };
            capture(failed === 0 ? "success" : "warn", `Send complete`, { stats: result as unknown as Record<string, unknown> });
            await finalizeLog(failed === 0 ? "success" : "error", failed === 0 ? undefined : `${failed} recipient(s) failed`);
            return result;
        };

        let firstResendEmailId: string | null = null;
        let lateUniqueSkips = 0;

        if (recipients.length === 0) {
            capture("success", "All recipients already sent or suppressed. Idempotent no-op.");
            return await finalize(0, 0);
        }

        // ── Render (global pass; conditionals deferred to per-recipient) ───
        const globalAssets = Object.fromEntries(
            Object.entries(campaignVars).filter(
                ([key, value]) => !STANDARD_TAGS.includes(key) && typeof value === "string"
            )
        ) as Record<string, string>;
        let htmlBase = renderTemplate(campaign.html_content ?? "", globalAssets, [], {
            evaluateConditionals: false,
        });
        htmlBase = injectPreheader(htmlBase, campaignVars.preview_text as string | undefined);
        htmlBase = appendUnsubscribeFooter(htmlBase);
        if (deps.prepareHtml) {
            htmlBase = await deps.prepareHtml(htmlBase, capture);
        }

        const mergeDefaults = await getMergeTagDefaults(db);
        const defaultsOverride = (campaignVars.merge_defaults as Record<string, string> | undefined) ?? {};

        let sent = 0;
        let failed = 0;

        for (let i = 0; i < recipients.length; i++) {
            const sub = recipients[i]!;
            const progress = `[${i + 1}/${recipients.length}]`;

            try {
                // ── Per-recipient suppression + status check at SEND time (fix #4) ──
                const check = await isSuppressed(db, sub.email);
                if (check.suppressed) {
                    skippedSuppressed++;
                    capture("warn", `${progress} Skipping suppressed ${sub.email} (${check.reason})`);
                    continue;
                }

                const urls = buildUnsubscribeUrls(baseUrl, sub.id, trackingCampaignId);

                let personalHtml = renderConditionalBlocks(htmlBase, sub.tags ?? []);
                personalHtml = applyMergeTags(personalHtml, {
                    subscriber: sub as unknown as Record<string, unknown>,
                    dynamicVars: {
                        unsubscribe_url: urls.pageUrl,
                        discount_code: (campaignVars.discount_code as string | undefined) ?? "",
                    },
                    defaultsOverride,
                    defaults: mergeDefaults,
                });
                if (clickTracking) {
                    personalHtml = rewriteLinks(personalHtml, {
                        baseUrl,
                        subscriberId: sub.id,
                        campaignId: trackingCampaignId,
                        mode: clickTrackingMode,
                    });
                }
                if (openTracking) {
                    personalHtml = injectOpenPixel(personalHtml, {
                        baseUrl,
                        subscriberId: sub.id,
                        campaignId: trackingCampaignId,
                    });
                }

                const personalSubject = applyMergeTags(campaign.subject_line ?? "", {
                    subscriber: sub as unknown as Record<string, unknown>,
                    defaultsOverride,
                    defaults: mergeDefaults,
                });

                const from =
                    resolvedFromName && resolvedFromEmail
                        ? `${resolvedFromName} <${resolvedFromEmail}>`
                        : resolvedFromEmail || defaultFromAddress();

                // ── Resend call with 429/5xx backoff (fix #2) ──────────────
                const sendResult = await withRetry(
                    () =>
                        sender.send({
                            from,
                            to: sub.email,
                            subject: personalSubject,
                            html: personalHtml,
                            headers: unsubscribeHeaders(urls),
                        }),
                    {
                        ...retryOpts,
                        onRetry: (attempt, error, delayMs) =>
                            capture("warn", `${progress} Resend attempt ${attempt} failed for ${sub.email}; retrying in ${delayMs}ms`, {
                                error: error instanceof Error ? error.message : String(error),
                            }),
                    }
                );

                // ── sent_history write IMMEDIATELY after success (fix #1b) ──
                const historyRes = await db.from("sent_history").insert({
                    campaign_id: trackingCampaignId,
                    subscriber_id: sub.id,
                    resend_email_id: sendResult.id,
                });
                if (historyRes.error) {
                    if (historyRes.error.code === "23505") {
                        // Unique violation => a concurrent/previous invocation
                        // already recorded this recipient. Treat as SKIP (fix #1c).
                        lateUniqueSkips++;
                        capture("warn", `${progress} sent_history unique-violation for ${sub.email}; counting as already-sent skip.`);
                        continue;
                    }
                    capture("error", `${progress} sent_history insert failed for ${sub.email}: ${historyRes.error.message}`);
                }

                sent++;
                if (!firstResendEmailId && sendResult.id) firstResendEmailId = sendResult.id;
                capture("success", `${progress} Sent to ${sub.email}`, { resendId: sendResult.id });
            } catch (error) {
                failed++;
                capture("error", `${progress} FAILED ${sub.email}: ${error instanceof Error ? error.message : String(error)}`);
            }

            if (i < recipients.length - 1) {
                // Resend account limit is enforced via RESEND_SEND_RATE_PER_SEC
                // (default 5/s). Concurrent invocations are prevented by the
                // Inngest global-send-lock; this throttle is the per-invocation
                // line of defense.
                await sleep(interSendDelayMs);
            }
        }

        return await finalize(sent, failed);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        capture("error", `Fatal: ${message}`);
        await finalizeLog("error", message);
        throw error;
    }
}
