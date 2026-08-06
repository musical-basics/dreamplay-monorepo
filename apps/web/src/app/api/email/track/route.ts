import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/db";
import { bumpCampaignCounter, isUuid, requestIp } from "../lib/tracking";

/**
 * Append-mode click receiver: POST /api/email/track
 *
 * Emails rewrite links with ?sid=&cid= URL params (NO redirect hop — redirect
 * mode collapsed Gmail opens in the 2026-05-03 incident). The middleware
 * stores those params as dp_sid/dp_cid cookies, and the EmailTracker
 * component posts here once per session with the legacy dp-email-2 payload:
 *   { subscriber_id, campaign_id, type, url, duration?, temp_session_id? }
 *
 * Only type "click" writes an email_events row (+ campaigns.total_clicks).
 * Other legacy types (page_view / session_end / conversion_*) are accepted
 * and dropped: subscriber-attributed browsing already flows through the
 * analytics events table via metadata.sid enrichment — recording it twice
 * would double-count.
 *
 * CORS is wide open (anonymous write-only sink, nothing returned): legacy
 * sites' tracker snippets post here cross-origin via the
 * email.dreamplaypianos.com/api/track host rewrite.
 */
export const dynamic = "force-dynamic";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
} as const;

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
    let payload: Record<string, unknown>;
    try {
        payload = await request.json();
    } catch {
        return NextResponse.json({ error: "invalid JSON" }, { status: 400, headers: CORS_HEADERS });
    }

    const subscriberId = typeof payload.subscriber_id === "string" ? payload.subscriber_id : null;
    const campaignId = typeof payload.campaign_id === "string" ? payload.campaign_id : null;
    const type = typeof payload.type === "string" ? payload.type : "";
    const url = typeof payload.url === "string" ? payload.url.slice(0, 2000) : null;

    if (type === "click" && isUuid(subscriberId)) {
        try {
            const db = getAdminDb();
            await db.from("email_events").insert({
                subscriber_id: subscriberId,
                campaign_id: isUuid(campaignId) ? campaignId : null,
                type: "click",
                url,
                ip: requestIp(request),
                user_agent: request.headers.get("user-agent"),
            });
            if (isUuid(campaignId)) await bumpCampaignCounter(campaignId, "total_clicks");
        } catch {
            // Tracking must never surface errors to the page.
        }
    }

    return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
}
