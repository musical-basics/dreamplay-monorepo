import { getAdminDb } from "@/lib/db";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | null | undefined): value is string {
    return typeof value === "string" && UUID_RE.test(value);
}

export function requestIp(request: Request): string | null {
    const fwd = request.headers.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0]!.trim();
    return request.headers.get("x-real-ip");
}

/**
 * Best-effort increment of a campaigns counter column. Read-modify-write —
 * a lost update under concurrency only skews a vanity counter; authoritative
 * numbers come from email_events.
 */
export async function bumpCampaignCounter(
    campaignId: string,
    column: "total_opens" | "total_clicks"
): Promise<void> {
    try {
        const db = getAdminDb();
        const { data } = await db.from("campaigns").select(`id,${column}`).eq("id", campaignId).maybeSingle();
        if (!data) return;
        const current = (data as unknown as Record<string, number>)[column] ?? 0;
        const patch = column === "total_opens" ? { total_opens: current + 1 } : { total_clicks: current + 1 };
        await db.from("campaigns").update(patch).eq("id", campaignId);
    } catch {
        // Never let counter maintenance break tracking responses.
    }
}

/** 1x1 transparent GIF. */
export const TRANSPARENT_GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

export const CORS_HEADERS: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};
