import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { getAdminDb } from "@/lib/db";

/**
 * Resend webhook — closes the bounce/complaint/delivery loop (non-negotiable
 * fix #4; the legacy system had RESEND_WEBHOOK_SECRET configured but never
 * wired the handler, so suppression was manual).
 *
 * Security policy:
 *   - RESEND_WEBHOOK_SECRET missing  -> 500 loudly. We NEVER process
 *     unverified webhook payloads "because the secret wasn't set".
 *   - Invalid svix signature         -> 401.
 *
 * Event handling:
 *   email.bounced    -> email_events `bounce`    + suppressions + status
 *   email.complained -> email_events `complaint` + suppressions + status
 *   email.delivered  -> email_events `delivery`
 * Everything else is acknowledged and ignored.
 */
export const dynamic = "force-dynamic";

type ResendWebhookEvent = {
    type: string;
    created_at?: string;
    data?: {
        email_id?: string;
        from?: string;
        to?: string[] | string;
        subject?: string;
        bounce?: { type?: string; subType?: string; message?: string };
    };
};

function recipientsOf(event: ResendWebhookEvent): string[] {
    const to = event.data?.to;
    if (Array.isArray(to)) return to;
    if (typeof to === "string" && to) return [to];
    return [];
}

export async function POST(request: Request) {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) {
        console.error("[resend-webhook] RESEND_WEBHOOK_SECRET is not set — refusing to process unverified webhooks");
        return NextResponse.json({ error: "webhook secret not configured" }, { status: 500 });
    }

    const payload = await request.text();
    const headers = {
        "svix-id": request.headers.get("svix-id") ?? "",
        "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
        "svix-signature": request.headers.get("svix-signature") ?? "",
    };

    let event: ResendWebhookEvent;
    try {
        event = new Webhook(secret).verify(payload, headers) as ResendWebhookEvent;
    } catch {
        return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }

    const db = getAdminDb();
    const emails = recipientsOf(event).map((e) => e.trim().toLowerCase());

    const eventTypeMap: Record<string, "bounce" | "complaint" | "delivery"> = {
        "email.bounced": "bounce",
        "email.complained": "complaint",
        "email.delivered": "delivery",
    };
    const mapped = eventTypeMap[event.type];
    if (!mapped || emails.length === 0) {
        return NextResponse.json({ received: true, ignored: true });
    }

    for (const email of emails) {
        // Best-effort subscriber linkage for the event trail.
        const { data: subscriber } = await db
            .from("subscribers")
            .select("id,status")
            .eq("email", email)
            .maybeSingle();

        await db.from("email_events").insert({
            subscriber_id: subscriber?.id ?? null,
            campaign_id: null,
            type: mapped,
            metadata: {
                resend_email_id: event.data?.email_id ?? null,
                subject: event.data?.subject ?? null,
                email,
                ...(event.data?.bounce ? { bounce: event.data.bounce } : {}),
            },
        });

        if (mapped === "bounce" || mapped === "complaint") {
            await db.from("suppressions").upsert(
                { email, reason: mapped, source: "resend-webhook" },
                { onConflict: "email", ignoreDuplicates: true }
            );
            if (subscriber) {
                await db
                    .from("subscribers")
                    .update({ status: mapped === "bounce" ? "bounced" : "complained" })
                    .eq("id", subscriber.id);
            }
        }
    }

    return NextResponse.json({ received: true, type: mapped, recipients: emails.length });
}
