import "server-only";
import { getAdminDb } from "@/lib/db";
import {
    CAPTURE_WORKSPACE,
    captureTags,
    normalizeCaptureEmail,
    planSubscriberCapture,
    type CaptureInput,
} from "@/lib/subscriber-capture";

/**
 * Save a capture straight into `subscribers` (D20) and return the row id.
 * Shared by subscribeToNewsletter and /api/webhooks/subscribe. The legacy
 * email app's tag triggers are not ported: no `email_triggers` rows exist in
 * this DB.
 */
export async function saveSubscriber(input: CaptureInput): Promise<string> {
    const db = getAdminDb();
    const email = normalizeCaptureEmail(input.email);
    const capture = { ...input, email };

    const existing = await db
        .from("subscribers")
        .select("id, tags, status, first_name, workspace")
        .eq("email", email)
        .maybeSingle();
    if (existing.error) throw new Error(existing.error.message);

    const plan = planSubscriberCapture(existing.data, capture);
    await db
        .from("tag_definitions")
        .upsert(
            captureTags(input.tags).map((name) => ({
                name,
                color: "#6b7280",
                workspace: existing.data?.workspace ?? input.workspace ?? CAPTURE_WORKSPACE,
            })),
            { onConflict: "workspace,name", ignoreDuplicates: true }
        );

    if (plan.kind === "update") {
        const { error } = await db.from("subscribers").update(plan.patch).eq("id", plan.id);
        if (error) throw new Error(error.message);
        return plan.id;
    }

    const inserted = await db.from("subscribers").insert(plan.row).select("id").single();
    if (!inserted.error) return inserted.data.id;
    // Lost a race with a concurrent submit of the same email: merge instead.
    if (inserted.error.code !== "23505") throw new Error(inserted.error.message);
    const raced = await db
        .from("subscribers")
        .select("id, tags, status, first_name, workspace")
        .eq("email", email)
        .single();
    if (raced.error) throw new Error(raced.error.message);
    const retry = planSubscriberCapture(raced.data, capture);
    if (retry.kind !== "update") throw new Error("Subscriber vanished during capture");
    const { error } = await db.from("subscribers").update(retry.patch).eq("id", retry.id);
    if (error) throw new Error(error.message);
    return retry.id;
}
