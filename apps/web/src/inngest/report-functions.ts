/**
 * Scheduled report functions. Separate from functions.ts (the email send
 * pipeline) — these are single-recipient admin reports, so they bypass the
 * campaign machinery (suppression, sent_history, tracking) and call the
 * Resend sender directly. They do NOT take the global-send-lock: a one-off
 * report send can't meaningfully contend with the 5 req/s account budget.
 */

import { variationSinceMap } from "@dreamplay/ab";
import { createResendSender, defaultFromAddress } from "@dreamplay/email";
import { buildAbReportData, renderAbReportPdfBase64 } from "@dreamplay/reports";
import { AB_SCORING, abFunnel } from "@/config/ab";
import { getExcludedIps } from "@/lib/admin-analytics";
import { getAdminDb } from "@/lib/db";
import { inngest } from "./client";

const REPORT_RECIPIENT = "support@dreamplaypianos.com";

/**
 * daily-ab-report — every day at 8:00 AM America/New_York, emails a PDF of
 * A/B variant performance (previous ET calendar day + trailing 7 ET days).
 */
export const dailyAbReport = inngest.createFunction(
    { id: "daily-ab-report", triggers: [{ cron: "TZ=America/New_York 0 8 * * *" }] },
    async ({ step }) => {
        // Pin "as of" once so a step retry reports on the same windows.
        const asOfIso = await step.run("pin-as-of", async () => new Date().toISOString());
        const asOf = new Date(asOfIso);

        const data = await step.run("build-report-data", async () => {
            const client = getAdminDb();
            return buildAbReportData(asOf, AB_SCORING, { client }, {
                sinceByVariant: variationSinceMap(abFunnel),
                excludeIps: await getExcludedIps(client),
            });
        });

        const sendResult = await step.run("render-and-send", async () => {
            const pdfBase64 = await renderAbReportPdfBase64(data, AB_SCORING);
            const dayStamp = data.yesterday.window.startIso.slice(0, 10);
            const sender = createResendSender();
            return sender.send({
                from: defaultFromAddress(),
                to: REPORT_RECIPIENT,
                subject: `A/B Test Report — ${data.yesterday.window.label}`,
                html: [
                    `<p>Attached is the daily A/B variant performance report.</p>`,
                    `<p><strong>Previous day:</strong> ${data.yesterday.window.label} — ` +
                        `${data.yesterday.groupScores.reduce((n, g) => n + g.sessions, 0)} sessions<br/>` +
                        `<strong>Trailing 7 days:</strong> ${data.trailing7Days.window.label} — ` +
                        `${data.trailing7Days.groupScores.reduce((n, g) => n + g.sessions, 0)} sessions</p>`,
                    `<p>Live dashboard: <a href="https://dreamplaypianos.com/admin/ab-tests">/admin/ab-tests</a></p>`,
                ].join("\n"),
                attachments: [{ filename: `ab-report-${dayStamp}.pdf`, content: pdfBase64 }],
            });
        });

        return { message: "Daily A/B report sent", to: REPORT_RECIPIENT, emailId: sendResult.id };
    }
);

export const reportFunctions = [dailyAbReport];
