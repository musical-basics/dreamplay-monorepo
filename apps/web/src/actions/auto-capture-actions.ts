"use server";

import { getAdminDb, getServerDb } from "@/lib/db";
import { AUTO_CAPTURE_SETTING, MAX_HOLD_HOURS, parseAutoCaptureSetting } from "@/lib/auto-capture";

export interface AutoCaptureActionResult {
    ok: boolean;
    error?: string;
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

/** Save the auto-capture master switch and hold period. */
export async function saveAutoCaptureSetting(input: {
    enabled: boolean;
    holdHours: number;
}): Promise<AutoCaptureActionResult> {
    if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
    if (!Number.isFinite(input.holdHours) || input.holdHours < 0 || input.holdHours > MAX_HOLD_HOURS) {
        return { ok: false, error: `Hold period must be between 0 and ${MAX_HOLD_HOURS} hours.` };
    }

    const value = parseAutoCaptureSetting({ enabled: input.enabled === true, holdHours: input.holdHours });
    const { error } = await getAdminDb()
        .from("app_settings")
        .upsert({ key: AUTO_CAPTURE_SETTING, value: { ...value } }, { onConflict: "key" });
    if (error) return { ok: false, error: "Could not save. Please try again." };
    return { ok: true };
}
