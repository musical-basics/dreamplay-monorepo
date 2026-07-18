import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/db";
import { CORS_HEADERS, isUuid } from "../lib/tracking";

/**
 * Resolve a subscriber id (sid) to an email for client-side identity
 * stitching. Same contract as the legacy dp-email-2
 * `/api/resolve-subscriber`: the website EmailTracker and the analytics
 * tracker.js call this cross-origin with ?sid= (and optional &cid=) and read
 * `email` off the JSON response. CORS is deliberately open — the response
 * only maps an opaque uuid the caller already possesses to its email.
 */
export const dynamic = "force-dynamic";

async function resolve(sid: string | null): Promise<NextResponse> {
    if (!isUuid(sid)) {
        return NextResponse.json({ error: "invalid sid" }, { status: 400, headers: CORS_HEADERS });
    }
    const db = getAdminDb();
    const { data, error } = await db
        .from("subscribers")
        .select("id,email,first_name")
        .eq("id", sid)
        .maybeSingle();
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
    }
    if (!data) {
        return NextResponse.json({ error: "not found" }, { status: 404, headers: CORS_HEADERS });
    }
    return NextResponse.json(
        { subscriber_id: data.id, email: data.email, first_name: data.first_name },
        { headers: CORS_HEADERS }
    );
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    return resolve(url.searchParams.get("sid"));
}

export async function POST(request: Request) {
    let body: { sid?: string; cid?: string } = {};
    try {
        body = (await request.json()) as { sid?: string; cid?: string };
    } catch {
        // fall through with empty body -> 400
    }
    return resolve(body.sid ?? null);
}

export function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
