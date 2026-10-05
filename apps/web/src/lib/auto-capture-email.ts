/**
 * The auto-capture report email: one message per sweep that did something,
 * to support@dreamplaypianos.com. Action items (orders a human must capture)
 * come first; routine captures follow. Pure, so the copy is testable.
 */

import { formatEastern, formatMoney } from "./auto-capture";

export const AUTO_CAPTURE_RECIPIENT = "support@dreamplaypianos.com";
export const AUTO_CAPTURE_ADMIN_URL = "https://www.dreamplaypianos.com/admin/auto-capture";

export interface ReportOrderRef {
    name: string;
    adminUrl: string;
    amount: string;
    currencyCode: string;
}

export interface CapturedEntry extends ReportOrderRef {
    authorizedAt: string;
    /** Shopify transaction status: SUCCESS, or PENDING for async gateways. */
    status: string;
}

export interface ActionEntry extends ReportOrderRef {
    /** Why the sweep did not capture it. */
    why: string;
    expiresAt: string | null;
}

export interface AutoCaptureReport {
    holdHours: number;
    captured: CapturedEntry[];
    /** Newly handed to a human this run (held, or the capture failed). */
    handedOver: ActionEntry[];
    /** Still uncaptured and expiring within 24 hours. */
    expiring: ActionEntry[];
}

function esc(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function orderLink(o: ReportOrderRef): string {
    return `<a href="${esc(o.adminUrl)}">${esc(o.name)}</a>, ${esc(formatMoney(o.amount, o.currencyCode))}`;
}

function expiryText(expiresAt: string | null): string {
    return expiresAt ? `Authorization expires ${esc(formatEastern(expiresAt))}.` : "Authorization expiry unknown.";
}

export function buildAutoCaptureEmail(report: AutoCaptureReport): { subject: string; html: string } | null {
    const { captured, handedOver, expiring } = report;
    if (!captured.length && !handedOver.length && !expiring.length) return null;

    // An order can be handed over and already be inside its last 24 hours;
    // it then belongs in the more urgent list only.
    const expiringNames = new Set(expiring.map((e) => e.name));
    const handed = handedOver.filter((h) => !expiringNames.has(h.name));
    const actions = [...expiring, ...handed];

    const [onlyAction] = actions;
    const [onlyCapture] = captured;
    let subject: string;
    if (actions.length === 1 && onlyAction) {
        const deadline = onlyAction.expiresAt ? ` before ${formatEastern(onlyAction.expiresAt)}` : "";
        subject = `Action needed: capture ${onlyAction.name} by hand${deadline}`;
    } else if (actions.length > 1) {
        subject = `Action needed: ${actions.length} payments to capture by hand`;
    } else if (captured.length === 1 && onlyCapture) {
        subject = `Payment captured: ${onlyCapture.name}, ${formatMoney(onlyCapture.amount, onlyCapture.currencyCode)}`;
    } else {
        subject = `Payments captured: ${captured.length} orders`;
    }

    const sections: string[] = [];

    if (expiring.length) {
        sections.push(
            `<p><strong>Expiring within 24 hours.</strong> Capture these in Shopify now, or the money is lost and the buyer has to pay again:</p>`,
            `<ul>${expiring
                .map((e) => `<li>${orderLink(e)}. ${esc(e.why)}. ${expiryText(e.expiresAt)}</li>`)
                .join("")}</ul>`,
        );
    }

    if (handed.length) {
        sections.push(
            `<p><strong>Needs you.</strong> The sweep will not capture these. Capture in Shopify if genuine, or cancel the order:</p>`,
            `<ul>${handed
                .map((h) => `<li>${orderLink(h)}. ${esc(h.why)}. ${expiryText(h.expiresAt)}</li>`)
                .join("")}</ul>`,
        );
    }

    if (captured.length) {
        sections.push(
            `<p><strong>Captured automatically:</strong></p>`,
            `<ul>${captured
                .map(
                    (c) =>
                        `<li>${orderLink(c)}, authorized ${esc(formatEastern(c.authorizedAt))}${
                            c.status === "PENDING" ? " (capture pending at the payment gateway)" : ""
                        }.</li>`,
                )
                .join("")}</ul>`,
        );
    }

    sections.push(
        `<p style="color:#888;font-size:12px">The auto-capture sweep runs hourly and captures card payments ${report.holdHours} hours after checkout. ` +
            `Orders Shopify flags as medium or high fraud risk, and anything unusual, are left for you and tagged capture-manually. ` +
            `Add that tag to any order in Shopify to keep the sweep away from it. ` +
            `Settings and upcoming captures: <a href="${AUTO_CAPTURE_ADMIN_URL}">${AUTO_CAPTURE_ADMIN_URL}</a></p>`,
    );

    return { subject, html: sections.join("\n") };
}

/** The "the sweep itself is broken" alert, sent at most once a day. */
export function buildSweepFailureEmail(error: string, lastRunAt: string | null): { subject: string; html: string } {
    return {
        subject: "Action needed: payment auto-capture is failing",
        html: [
            `<p>The hourly payment auto-capture sweep failed, so no card payments are being captured automatically.</p>`,
            `<p><strong>Error:</strong> ${esc(error.slice(0, 1000))}</p>`,
            `<p>Last successful run: ${lastRunAt ? esc(formatEastern(lastRunAt)) : "never"}.</p>`,
            `<p>Until it is fixed, capture authorized orders by hand in Shopify (Orders, filter Payment status: Authorized). ` +
                `Authorizations expire 7 days after checkout. This alert repeats at most once a day while the failure continues.</p>`,
            `<p><a href="${AUTO_CAPTURE_ADMIN_URL}">${AUTO_CAPTURE_ADMIN_URL}</a></p>`,
        ].join("\n"),
    };
}
