/**
 * Zoom Server-to-Server OAuth client.
 *
 * The credentials in .env.local are S2S OAuth (account id + client id +
 * secret), not a static personal meeting room, so each founder call gets its
 * own scheduled meeting and its own join URL. That is the better shape here:
 * a per-meeting link cannot be reused by someone forwarded the email, and
 * the meeting carries the buyer's name and the agreed time.
 *
 * Env: ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET.
 */

const TOKEN_URL = "https://zoom.us/oauth/token";
const API_BASE = "https://api.zoom.us/v2";

export interface ZoomMeeting {
    id: string;
    joinUrl: string;
    startUrl: string;
}

function creds(): { accountId: string; clientId: string; clientSecret: string } {
    const accountId = process.env.ZOOM_ACCOUNT_ID;
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;
    if (!accountId || !clientId || !clientSecret) {
        throw new Error("Zoom credentials missing (ZOOM_ACCOUNT_ID / ZOOM_CLIENT_ID / ZOOM_CLIENT_SECRET).");
    }
    return { accountId, clientId, clientSecret };
}

/** Fetch an access token. These are short-lived, so callers do not cache. */
export async function zoomAccessToken(): Promise<string> {
    const { accountId, clientId, clientSecret } = creds();
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const res = await fetch(`${TOKEN_URL}?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`, {
        method: "POST",
        headers: { Authorization: `Basic ${basic}` },
    });
    if (!res.ok) throw new Error(`Zoom token failed: ${res.status} ${await res.text()}`);
    const body = (await res.json()) as { access_token?: string };
    if (!body.access_token) throw new Error("Zoom token response had no access_token.");
    return body.access_token;
}

/**
 * Create a scheduled meeting. `startAt` is an absolute instant; it is sent
 * as UTC so Zoom does not reinterpret it in the account's local timezone.
 */
export async function createZoomMeeting(opts: {
    topic: string;
    startAt: Date;
    durationMinutes: number;
    agenda?: string;
}): Promise<ZoomMeeting> {
    const token = await zoomAccessToken();
    const res = await fetch(`${API_BASE}/users/me/meetings`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            topic: opts.topic,
            type: 2, // scheduled
            start_time: opts.startAt.toISOString().replace(/\.\d{3}Z$/, "Z"),
            timezone: "UTC",
            duration: opts.durationMinutes,
            agenda: opts.agenda ?? "",
            settings: {
                join_before_host: true,
                waiting_room: false,
                approval_type: 2, // no registration required
            },
        }),
    });
    if (!res.ok) throw new Error(`Zoom create meeting failed: ${res.status} ${await res.text()}`);
    const m = (await res.json()) as { id?: number | string; join_url?: string; start_url?: string };
    if (!m.join_url || m.id == null) throw new Error("Zoom meeting response was missing id/join_url.");
    return { id: String(m.id), joinUrl: m.join_url, startUrl: m.start_url ?? "" };
}
