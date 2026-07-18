import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/db";
import { bumpCampaignCounter, isUuid, requestIp } from "../lib/tracking";

/**
 * Click redirect: GET /api/email/click?c=<campaignId>&s=<subscriberId>&u=<url>
 * Validates the destination, writes an email_events `click` row, then 302s.
 *
 * NOTE: bulk sends should use append-mode click tracking (sid/cid on the
 * href) — redirect mode collapsed Gmail open rates in the 2026-05-03
 * incident. This endpoint exists for small sends and for legacy links.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const campaignId = url.searchParams.get("c");
    const subscriberId = url.searchParams.get("s");
    const destination = url.searchParams.get("u");

    // Destination must be an absolute http(s) URL — anything else bounces home.
    let target: URL | null = null;
    try {
        target = destination ? new URL(destination) : null;
    } catch {
        target = null;
    }
    if (!target || (target.protocol !== "https:" && target.protocol !== "http:")) {
        return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL || "https://dreamplaypianos.com", 302);
    }

    try {
        if (isUuid(subscriberId)) {
            const db = getAdminDb();
            await db.from("email_events").insert({
                subscriber_id: subscriberId,
                campaign_id: isUuid(campaignId) ? campaignId : null,
                type: "click",
                url: target.toString(),
                ip: requestIp(request),
                user_agent: request.headers.get("user-agent"),
            });
            if (isUuid(campaignId)) await bumpCampaignCounter(campaignId, "total_clicks");
        }
    } catch {
        // Never block the redirect on tracking failures.
    }

    return NextResponse.redirect(target.toString(), 302);
}
