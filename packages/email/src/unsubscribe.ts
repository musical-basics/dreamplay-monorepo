/**
 * Unsubscribe links, footer, RFC 8058 one-click headers, and the shared
 * unsubscribe processor used by both the /unsubscribe page and the one-click
 * POST endpoint.
 *
 * Links are HMAC-signed (EMAIL_UNSUBSCRIBE_SECRET) over `sid:cid` so a third
 * party cannot mass-unsubscribe an audience by enumerating subscriber IDs.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import type { AdminClient } from "@dreamplay/db";

function getSecret(): string {
    const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET;
    if (!secret) {
        throw new Error(
            "EMAIL_UNSUBSCRIBE_SECRET is not set — refusing to build/verify unsubscribe links with no signature."
        );
    }
    return secret;
}

/** HMAC token binding subscriber id + campaign id. */
export function unsubscribeToken(subscriberId: string, campaignId: string | null | undefined): string {
    return createHmac("sha256", getSecret())
        .update(`${subscriberId}:${campaignId ?? ""}`)
        .digest("hex")
        .slice(0, 32);
}

/** Constant-time verification of an unsubscribe token. */
export function verifyUnsubscribeToken(
    token: string | null | undefined,
    subscriberId: string,
    campaignId: string | null | undefined
): boolean {
    if (!token) return false;
    const expected = unsubscribeToken(subscriberId, campaignId);
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
}

export interface UnsubscribeUrls {
    /** Human-facing confirm page (goes in the footer link). */
    pageUrl: string;
    /** One-click POST endpoint (goes in the List-Unsubscribe header). */
    oneClickUrl: string;
}

/** Build the signed unsubscribe URLs for a recipient. */
export function buildUnsubscribeUrls(
    baseUrl: string,
    subscriberId: string,
    campaignId: string | null | undefined
): UnsubscribeUrls {
    const t = unsubscribeToken(subscriberId, campaignId);
    const qs = `s=${encodeURIComponent(subscriberId)}&c=${encodeURIComponent(campaignId ?? "")}&t=${t}`;
    return {
        pageUrl: `${baseUrl}/unsubscribe?${qs}`,
        oneClickUrl: `${baseUrl}/api/email/unsubscribe?${qs}`,
    };
}

/** RFC 8058 one-click unsubscribe headers. */
export function unsubscribeHeaders(urls: UnsubscribeUrls): Record<string, string> {
    return {
        "List-Unsubscribe": `<${urls.oneClickUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };
}

const UNSUBSCRIBE_FOOTER = `
<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; font-family: sans-serif;">
  <p style="margin: 0;">
    No longer want to receive these emails?
    <a href="{{unsubscribe_url}}" style="color: #6b7280; text-decoration: underline;">Unsubscribe here</a>.
  </p>
</div>
`;

/**
 * Append the standard unsubscribe footer (with the {{unsubscribe_url}}
 * placeholder — filled per recipient by merge tags). Skipped when the
 * template already references an unsubscribe placeholder.
 */
export function appendUnsubscribeFooter(html: string): string {
    if (/\{\{unsubscribe(_link)?(_url)?\}\}/.test(html)) return html;
    if (html.includes("</body>")) return html.replace("</body>", `${UNSUBSCRIBE_FOOTER}</body>`);
    return html + UNSUBSCRIBE_FOOTER;
}

export interface ProcessUnsubscribeInput {
    subscriberId: string;
    campaignId?: string | null;
    /** e.g. "one-click", "page", "admin" */
    source: string;
    ip?: string | null;
    userAgent?: string | null;
}

export interface ProcessUnsubscribeResult {
    ok: boolean;
    email?: string;
    error?: string;
}

/**
 * Perform an unsubscribe: suppressions upsert + subscribers.status update +
 * email_events row. Idempotent — repeating it is a no-op that still reports ok.
 */
export async function processUnsubscribe(
    db: AdminClient,
    input: ProcessUnsubscribeInput
): Promise<ProcessUnsubscribeResult> {
    const { data: sub, error: subError } = await db
        .from("subscribers")
        .select("id,email,status")
        .eq("id", input.subscriberId)
        .maybeSingle();

    if (subError) return { ok: false, error: subError.message };
    if (!sub) return { ok: false, error: "Subscriber not found" };

    // 1. Suppression list (authoritative do-not-send record).
    const { error: suppressionError } = await db.from("suppressions").upsert(
        {
            email: sub.email,
            reason: "unsubscribe",
            source: input.source,
        },
        { onConflict: "email", ignoreDuplicates: true }
    );
    if (suppressionError) return { ok: false, error: suppressionError.message };

    // 2. Subscriber status (unless a harder state like bounced/complained).
    if (sub.status === "active" || sub.status === "inactive") {
        const { error: statusError } = await db
            .from("subscribers")
            .update({ status: "unsubscribed" })
            .eq("id", sub.id);
        if (statusError) return { ok: false, error: statusError.message };
    }

    // 3. Event trail.
    await db.from("email_events").insert({
        subscriber_id: sub.id,
        campaign_id: input.campaignId || null,
        type: "unsubscribe",
        ip: input.ip ?? null,
        user_agent: input.userAgent ?? null,
        metadata: { source: input.source },
    });

    return { ok: true, email: sub.email };
}
