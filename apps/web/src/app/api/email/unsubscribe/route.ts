import { NextResponse } from "next/server";
import { processUnsubscribe, verifyUnsubscribeToken } from "@dreamplay/email";
import { getAdminDb } from "@/lib/db";
import { isUuid, requestIp } from "../lib/tracking";

/**
 * One-click unsubscribe endpoint (RFC 8058). This URL goes in the
 * List-Unsubscribe header; mail clients POST to it with
 * `List-Unsubscribe=One-Click`. Links are HMAC-signed (t param) so subscriber
 * ids can't be enumerated to mass-unsubscribe an audience.
 *
 * GET redirects humans to the /unsubscribe confirm page.
 */
export const dynamic = "force-dynamic";

function params(request: Request) {
    const url = new URL(request.url);
    return {
        subscriberId: url.searchParams.get("s"),
        campaignId: url.searchParams.get("c"),
        token: url.searchParams.get("t"),
        url,
    };
}

export async function POST(request: Request) {
    const { subscriberId, campaignId, token } = params(request);
    if (!isUuid(subscriberId)) {
        return NextResponse.json({ error: "invalid subscriber" }, { status: 400 });
    }
    if (!verifyUnsubscribeToken(token, subscriberId, campaignId || "")) {
        return NextResponse.json({ error: "invalid token" }, { status: 401 });
    }

    const result = await processUnsubscribe(getAdminDb(), {
        subscriberId,
        campaignId: isUuid(campaignId) ? campaignId : null,
        source: "one-click",
        ip: requestIp(request),
        userAgent: request.headers.get("user-agent"),
    });
    if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true });
}

export async function GET(request: Request) {
    const { subscriberId, campaignId, token, url } = params(request);
    const dest = new URL("/unsubscribe", url.origin);
    if (subscriberId) dest.searchParams.set("s", subscriberId);
    if (campaignId) dest.searchParams.set("c", campaignId);
    if (token) dest.searchParams.set("t", token);
    return NextResponse.redirect(dest.toString(), 302);
}
