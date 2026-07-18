import { getAdminDb } from "@/lib/db";
import { bumpCampaignCounter, isUuid, requestIp, TRANSPARENT_GIF } from "../lib/tracking";

/**
 * Open-tracking pixel: GET /api/email/open?c=<campaignId>&s=<subscriberId>
 * Writes an email_events `open` row and returns a 1x1 transparent GIF.
 * Always returns the pixel, even on bad input — a broken pixel URL must
 * never render as a broken image in someone's inbox.
 */
export const dynamic = "force-dynamic";

function pixelResponse(): Response {
    return new Response(new Uint8Array(TRANSPARENT_GIF), {
        status: 200,
        headers: {
            "Content-Type": "image/gif",
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            Pragma: "no-cache",
        },
    });
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const campaignId = url.searchParams.get("c");
        const subscriberId = url.searchParams.get("s");
        if (!isUuid(subscriberId)) return pixelResponse();

        const db = getAdminDb();
        await db.from("email_events").insert({
            subscriber_id: subscriberId,
            campaign_id: isUuid(campaignId) ? campaignId : null,
            type: "open",
            ip: requestIp(request),
            user_agent: request.headers.get("user-agent"),
        });
        if (isUuid(campaignId)) await bumpCampaignCounter(campaignId, "total_opens");
    } catch {
        // Swallow — the pixel must always render.
    }
    return pixelResponse();
}
