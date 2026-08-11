"use server";

import { getAdminDb, getServerDb } from "@/lib/db";
import {
    AUDIENCE_SETTING,
    MARKETING_CALENDAR_CATEGORY,
    easternToUtcIso,
    parseAudienceSetting,
} from "@/lib/marketing-calendar";

export interface MarketingActionResult {
    ok: boolean;
    error?: string;
    /** UTC ISO the schedule was saved as (echo for the client). */
    scheduledAt?: string;
}

/** Admin gate for server actions (they bypass the /admin layout). */
async function requireAdmin(): Promise<string | null> {
    const server = await getServerDb();
    const { data: userData } = await server.auth.getUser();
    const email = userData.user?.email?.toLowerCase();
    if (!email) return null;
    const db = getAdminDb();
    const { data: setting } = await db.from("settings").select("value").eq("key", "admin_emails").maybeSingle();
    const admins = Array.isArray(setting?.value) ? (setting.value as string[]) : [];
    return admins.some((a) => typeof a === "string" && a.toLowerCase() === email) ? email : null;
}

/**
 * Save one calendar email's subject, copy and send time. Send time arrives as
 * ET wall clock (date "YYYY-MM-DD" + time "HH:mm") and is stored UTC.
 */
export async function saveMarketingEmail(
    campaignId: string,
    input: { subject: string; html: string; previewText: string; date: string; time: string },
): Promise<MarketingActionResult> {
    if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };

    const subject = input.subject.trim().slice(0, 300);
    if (!subject) return { ok: false, error: "Subject cannot be empty." };
    if (!input.html.trim()) return { ok: false, error: "Email body cannot be empty." };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !/^\d{2}:\d{2}$/.test(input.time)) {
        return { ok: false, error: "Invalid date or time." };
    }
    const scheduledAt = easternToUtcIso(input.date, input.time);

    const db = getAdminDb();
    const { data: existing } = await db
        .from("campaigns")
        .select("id, status, variable_values")
        .eq("id", campaignId)
        .eq("category", MARKETING_CALENDAR_CATEGORY)
        .maybeSingle();
    if (!existing) return { ok: false, error: "Email not found." };
    if (existing.status !== "draft") return { ok: false, error: `This email is ${existing.status}; only drafts are editable.` };

    const variableValues = {
        ...(typeof existing.variable_values === "object" && existing.variable_values !== null
            ? (existing.variable_values as Record<string, unknown>)
            : {}),
        preview_text: input.previewText.trim().slice(0, 300),
    };

    const { error } = await db
        .from("campaigns")
        .update({
            subject_line: subject,
            html_content: input.html,
            scheduled_at: scheduledAt,
            variable_values: variableValues,
        })
        .eq("id", campaignId);
    if (error) return { ok: false, error: "Could not save. Please try again." };
    return { ok: true, scheduledAt };
}

/**
 * Save the reviewed audience: the ids Lionel excluded on the review page.
 * Everything else about the snapshot (ids, rules, builtAt) is script-owned.
 */
export async function saveAudienceRemovals(removedIds: string[]): Promise<MarketingActionResult> {
    if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
    if (!Array.isArray(removedIds) || removedIds.some((id) => typeof id !== "string")) {
        return { ok: false, error: "Invalid payload." };
    }

    const db = getAdminDb();
    const { data: row } = await db.from("app_settings").select("value").eq("key", AUDIENCE_SETTING).maybeSingle();
    const setting = parseAudienceSetting(row?.value);
    if (!setting) return { ok: false, error: "Audience snapshot not found. Run setup-marketing-calendar.mjs first." };

    const valid = new Set(setting.subscriberIds);
    const clean = [...new Set(removedIds)].filter((id) => valid.has(id));

    const { error } = await db
        .from("app_settings")
        .upsert({ key: AUDIENCE_SETTING, value: { ...setting, removedIds: clean } }, { onConflict: "key" });
    if (error) return { ok: false, error: "Could not save. Please try again." };
    return { ok: true };
}
