/**
 * shopify-auto-capture-sweep: every hour, capture card payments that were
 * authorized at least 72 hours ago (Lionel, 2026-10-05). The store stays on
 * manual capture, so the first 3 days are a review window; this sweep makes
 * sure nothing is then forgotten until Shopify's 7-day authorization lapses,
 * which is how #1115, #1132, #1133 and #1135 were lost.
 *
 * A sweep rather than a sleeping workflow per order, for the same reason as
 * the coupon trigger: an order can be cancelled, edited or captured by hand
 * at any point in those 3 days, and a sweep reads current state every time.
 *
 * Per run:
 *   1. evaluate: every authorized order, decided by the pure decideCapture()
 *   2. capture: one step per due order, attempted once; a failure goes to a
 *      human instead of being retried blind
 *   3. report: one email to support@ if anything was captured, handed over,
 *      or is within 24 hours of expiring
 *   4. tag: capture-manually on hand-overs, capture-deadline-warned on
 *      warnings, AFTER the email, so a failed tag means a duplicate alert
 *      next hour rather than a silent miss
 *   5. backup watch: alert (at most daily) if the independent day-5 backup
 *      job (D15, GitHub Actions) has not written its heartbeat for 6 hours
 *   6. heartbeat: app_settings "shopify:auto-capture:status"
 *
 * Kill switch: app_settings["shopify:auto-capture"].enabled, toggled at
 * /admin/auto-capture. Manual run: send event "shopify/auto-capture.run";
 * with data { dryRun: true } it evaluates and returns the plan without
 * capturing, tagging or emailing.
 */

import { createResendSender, defaultFromAddress } from "@dreamplay/email";
import {
    AUTO_CAPTURE_EVENT,
    DEADLINE_WARNED_TAG,
    MANUAL_CAPTURE_TAG,
    type CaptureResult,
    type FollowUp,
    backupHeartbeatAction,
    planFollowUps,
} from "@/lib/auto-capture";
import {
    type AutoCapturePipeline,
    addOrderTags,
    captureAuthorization,
    loadAutoCapturePipeline,
    readAutoCaptureStatus,
    readBackupHeartbeat,
    updateAutoCaptureStatus,
} from "@/lib/auto-capture-data";
import {
    AUTO_CAPTURE_RECIPIENT,
    type ActionEntry,
    buildAutoCaptureEmail,
    buildBackupDownEmail,
    buildSweepFailureEmail,
} from "@/lib/auto-capture-email";
import { getAdminDb } from "@/lib/db";
import { shopifyAdminOrderUrl } from "@/lib/shopify/admin";
import { inngest } from "./client";

/** A broken sweep alerts at most this often. */
const FAILURE_ALERT_INTERVAL_MS = 24 * 3_600_000;

function numericId(gid: string): string {
    return gid.split("/").pop() ?? gid;
}

function actionEntry(f: FollowUp): ActionEntry {
    return {
        name: f.order.name,
        adminUrl: shopifyAdminOrderUrl(f.order.id),
        amount: f.order.currentTotal.amount,
        currencyCode: f.order.currentTotal.currencyCode,
        why: f.why,
        expiresAt: f.expiresAt,
    };
}

export const shopifyAutoCaptureSweep = inngest.createFunction(
    {
        id: "shopify-auto-capture-sweep",
        // Two sweeps must never decide on the same orders at once: a run that
        // starts while another is active (a manual run during the hourly one)
        // is skipped, not queued.
        singleton: { mode: "skip" },
        retries: 2,
        triggers: [{ cron: "0 * * * *" }, { event: AUTO_CAPTURE_EVENT }],
        onFailure: async ({ error, step }) => {
            await step.run("record-and-alert-failure", async () => {
                const db = getAdminDb();
                const status = await readAutoCaptureStatus(db);
                const nowIso = new Date().toISOString();
                const alertDue =
                    !status.lastErrorAlertedAt ||
                    Date.now() - new Date(status.lastErrorAlertedAt).getTime() >= FAILURE_ALERT_INTERVAL_MS;
                if (alertDue) {
                    const { subject, html } = buildSweepFailureEmail(error.message, status.lastRunAt);
                    await createResendSender().send({
                        from: defaultFromAddress(),
                        to: AUTO_CAPTURE_RECIPIENT,
                        subject,
                        html,
                    });
                }
                await updateAutoCaptureStatus(db, {
                    lastErrorAt: nowIso,
                    lastError: error.message.slice(0, 1000),
                    ...(alertDue ? { lastErrorAlertedAt: nowIso } : {}),
                });
                return { alerted: alertDue };
            });
        },
    },
    async ({ event, step }) => {
        const dryRun =
            event.name === AUTO_CAPTURE_EVENT && (event.data as { dryRun?: unknown } | undefined)?.dryRun === true;

        // Pin evaluation time so a step retry makes the same decisions.
        const nowIso = await step.run("pin-now", async () => new Date().toISOString());
        const now = new Date(nowIso);

        // JSON round-trip through Inngest's memo is lossless here: every field
        // is a string, number, boolean, null or array of those.
        const pipeline = (await step.run("evaluate", async () =>
            loadAutoCapturePipeline(getAdminDb(), now),
        )) as AutoCapturePipeline;
        const { setting, items } = pipeline;
        const due = items.filter((i) => i.decision.action === "capture");
        const waiting = items.filter((i) => i.decision.action === "wait").length;

        if (dryRun) {
            return {
                dryRun: true,
                enabled: setting.enabled,
                holdHours: setting.holdHours,
                orders: items.map(({ order, decision }) => ({ order: order.name, ...decision })),
            };
        }

        if (!setting.enabled) {
            await step.run("record-status", async () =>
                updateAutoCaptureStatus(getAdminDb(), { lastRunAt: nowIso, lastOutcome: "disabled", lastCounts: null }),
            );
            return { message: "Auto-capture is switched off; nothing captured", wouldCapture: due.map((i) => i.order.name) };
        }

        // One step per order: memoized, so a retry of a later step can never
        // capture the same order twice within a run.
        const results: Record<string, CaptureResult> = {};
        for (const { order, decision } of due) {
            if (decision.action !== "capture") continue;
            results[order.id] = (await step.run(`capture-${numericId(order.id)}`, async () =>
                captureAuthorization(order.id, decision),
            )) as CaptureResult;
        }

        const { handOver, expiring } = planFollowUps(items, results, now);
        const captured = due.filter((i) => results[i.order.id]?.ok);

        const email = buildAutoCaptureEmail({
            holdHours: setting.holdHours,
            captured: captured.map(({ order, decision }) => {
                const result = results[order.id];
                return {
                    name: order.name,
                    adminUrl: shopifyAdminOrderUrl(order.id),
                    amount: decision.action === "capture" ? decision.amount : order.currentTotal.amount,
                    currencyCode: decision.action === "capture" ? decision.currencyCode : order.currentTotal.currencyCode,
                    authorizedAt: decision.action === "capture" ? decision.authorizedAt : order.createdAt,
                    status: result?.ok ? result.status : "SUCCESS",
                };
            }),
            handedOver: handOver.map(actionEntry),
            expiring: expiring.map(actionEntry),
        });
        if (email) {
            await step.run("email-report", async () =>
                createResendSender().send({
                    from: defaultFromAddress(),
                    to: AUTO_CAPTURE_RECIPIENT,
                    subject: email.subject,
                    html: email.html,
                }),
            );
        }

        for (const f of handOver) {
            await step.run(`tag-manual-${numericId(f.order.id)}`, async () =>
                addOrderTags(f.order.id, [MANUAL_CAPTURE_TAG]),
            );
        }
        for (const f of expiring) {
            await step.run(`tag-warned-${numericId(f.order.id)}`, async () =>
                addOrderTags(f.order.id, [DEADLINE_WARNED_TAG]),
            );
        }

        // Watch the watcher: the backup job (D15) runs on GitHub cron, which a
        // public repo loses after 60 days without a commit. Monitoring only;
        // a failure here must not fail the capture run.
        await step.run("check-backup-heartbeat", async () => {
            try {
                const db = getAdminDb();
                const [backup, status] = await Promise.all([readBackupHeartbeat(db), readAutoCaptureStatus(db)]);
                const action = backupHeartbeatAction(backup.lastRunAt, status.backupDownAlertedAt, now);
                if (action === "alert" && backup.lastRunAt) {
                    const { subject, html } = buildBackupDownEmail(backup.lastRunAt);
                    await createResendSender().send({ from: defaultFromAddress(), to: AUTO_CAPTURE_RECIPIENT, subject, html });
                    await updateAutoCaptureStatus(db, { backupDownAlertedAt: nowIso });
                } else if (action === "clear") {
                    await updateAutoCaptureStatus(db, { backupDownAlertedAt: null });
                }
                return { backupLastRunAt: backup.lastRunAt, action };
            } catch (err) {
                return { error: err instanceof Error ? err.message : String(err) };
            }
        });

        const counts = { captured: captured.length, handedOver: handOver.length, warned: expiring.length, waiting };
        await step.run("record-status", async () =>
            updateAutoCaptureStatus(getAdminDb(), {
                lastRunAt: nowIso,
                lastOutcome: "ok",
                lastCounts: counts,
                // Recovered: clear the error so the next failure alerts at once.
                lastError: null,
                lastErrorAlertedAt: null,
            }),
        );

        return {
            message: `Captured ${counts.captured}, handed over ${counts.handedOver}, warned ${counts.warned}, waiting ${counts.waiting}`,
            captured: captured.map((i) => i.order.name),
            handedOver: handOver.map((f) => f.order.name),
            expiring: expiring.map((f) => f.order.name),
        };
    },
);

export const paymentFunctions = [shopifyAutoCaptureSweep];
