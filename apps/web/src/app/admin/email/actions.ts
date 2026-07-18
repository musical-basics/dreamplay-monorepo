"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdminDb, getServerDb } from "@/lib/db";

/**
 * Server actions for the /admin/email UI. Every action re-checks the admin
 * allowlist itself — server actions are directly invokable endpoints and must
 * not rely on the layout gate alone.
 */
async function assertAdmin(): Promise<void> {
    const db = await getServerDb();
    const { data } = await db.auth.getUser();
    const email = data.user?.email;
    if (!email) throw new Error("Not signed in");

    const admin = getAdminDb();
    const { data: setting } = await admin.from("settings").select("value").eq("key", "admin_emails").maybeSingle();
    const allowed = Array.isArray(setting?.value) ? (setting.value as unknown[]) : [];
    const ok = allowed.some((v) => typeof v === "string" && v.toLowerCase() === email.toLowerCase());
    if (!ok) throw new Error("Not an admin");
}

export async function saveCampaign(formData: FormData): Promise<void> {
    await assertAdmin();

    const id = String(formData.get("id") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    const subject = String(formData.get("subject_line") ?? "");
    const previewText = String(formData.get("preview_text") ?? "");
    const html = String(formData.get("html_content") ?? "");
    if (!name) throw new Error("Name is required");

    const db = getAdminDb();

    if (id === "new") {
        const { data, error } = await db
            .from("campaigns")
            .insert({ name, subject_line: subject, html_content: html, status: "draft" })
            .select("id")
            .single();
        if (error) throw new Error(error.message);
        // preview_text lives in variable_values
        if (previewText) {
            await db.from("campaigns").update({ variable_values: { preview_text: previewText } }).eq("id", data.id);
        }
        redirect(`/admin/email/campaigns/${data.id}`);
    }

    const { data: current, error: fetchError } = await db
        .from("campaigns")
        .select("variable_values")
        .eq("id", id)
        .maybeSingle();
    if (fetchError) throw new Error(fetchError.message);
    if (!current) throw new Error("Campaign not found");

    const vv = { ...((current.variable_values ?? {}) as Record<string, unknown>), preview_text: previewText };
    const { error } = await db
        .from("campaigns")
        .update({
            name,
            subject_line: subject,
            html_content: html,
            variable_values: vv as never,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    if (error) throw new Error(error.message);

    revalidatePath(`/admin/email/campaigns/${id}`);
    revalidatePath("/admin/email");
}

export async function removeSuppression(formData: FormData): Promise<void> {
    await assertAdmin();
    const id = String(formData.get("id") ?? "");
    if (!id) return;
    const db = getAdminDb();
    await db.from("suppressions").delete().eq("id", id);
    revalidatePath("/admin/email/suppressions");
}
