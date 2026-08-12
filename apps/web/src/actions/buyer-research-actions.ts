"use server";

import { getAdminDb, getServerDb } from "@/lib/db";
import {
    ARMS,
    ARM_OVERRIDES_SETTING,
    AB_TEMPLATE_NAMES,
    CALL_DAY_OPTIONS,
    CALL_REWARD_USD,
    DAY_PART_OPTIONS,
    SURVEY_QUESTIONS,
    SURVEY_REWARD_USD,
    armHasIncentive,
    armMethod,
    loadArmOverrides,
    parseResearchToken,
    resolveArm,
    type ResearchArm,
} from "@/lib/buyer-research";
import type { BuyerCallContactMethod, BuyerCallStatus } from "@dreamplay/db";

export interface ResearchActionResult {
    ok: boolean;
    error?: string;
    /** Store credit granted by this action (0 for no-incentive arms). */
    creditGranted?: number;
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
 * Grant a one-shot store credit. The partial unique index on
 * (buyer_id, source) makes this idempotent: a second grant for the same
 * source is a no-op, so retries can never double-credit.
 */
async function grantCredit(
    buyerId: string,
    amount: number,
    source: "survey-reward" | "call-reward",
    reason: string,
): Promise<boolean> {
    const db = getAdminDb();
    const { error } = await db.from("store_credits").insert({
        buyer_id: buyerId,
        amount_usd: amount,
        reason,
        source,
    });
    return !error;
}

/** Survey: accepts EVERY arm (call arms use it as their fallback). */
export async function submitBuyerSurvey(
    token: string,
    answers: Record<string, string>,
): Promise<ResearchActionResult> {
    const buyerId = parseResearchToken(token);
    if (!buyerId) return { ok: false, error: "This link is invalid. Please use the link from your email." };

    const db = getAdminDb();
    const { data: buyer } = await db.from("buyers").select("id").eq("id", buyerId).maybeSingle();
    if (!buyer) return { ok: false, error: "We could not find your order. Please contact support." };

    const clean: Record<string, string> = {};
    for (const q of SURVEY_QUESTIONS) {
        const raw = (answers[q.id] ?? "").trim();
        if (!raw) {
            if (q.optional) continue;
            return { ok: false, error: "Please answer every question (only the last one is optional)." };
        }
        if (q.kind === "radio" && !q.options?.includes(raw)) {
            return { ok: false, error: "Please choose one of the listed answers." };
        }
        clean[q.id] = raw.slice(0, 4000);
    }

    const { error } = await db
        .from("buyer_survey_responses")
        .upsert({ buyer_id: buyerId, answers: clean }, { onConflict: "buyer_id" });
    if (error) return { ok: false, error: "Something went wrong saving your answers. Please try again." };

    let creditGranted = 0;
    const overrides = await loadArmOverrides(db);
    if (armHasIncentive(resolveArm(buyerId, overrides))) {
        const granted = await grantCredit(
            buyerId,
            SURVEY_REWARD_USD,
            "survey-reward",
            "Buyer research survey completed (AB Test August 10)",
        );
        if (granted) creditGranted = SURVEY_REWARD_USD;
    }
    return { ok: true, creditGranted };
}

/** "Yes I can call": days + part of day + auto-detected timezone. Call arms only. */
export async function requestFounderCall(
    token: string,
    input: {
        contactMethod: string;
        contactValue: string;
        preferredDays: string[];
        dayParts: string[];
        timezone: string;
        notes: string;
    },
): Promise<ResearchActionResult> {
    const buyerId = parseResearchToken(token);
    if (!buyerId) return { ok: false, error: "This link is invalid. Please use the link from your email." };
    const db = getAdminDb();
    const overrides = await loadArmOverrides(db);
    if (armMethod(resolveArm(buyerId, overrides)) !== "call") {
        return { ok: false, error: "This link is not valid for the call invite." };
    }

    const { data: buyer } = await db.from("buyers").select("id").eq("id", buyerId).maybeSingle();
    if (!buyer) return { ok: false, error: "We could not find your order. Please contact support." };

    if (!["zoom", "phone", "whatsapp"].includes(input.contactMethod)) {
        return { ok: false, error: "Please choose how you would like to take the call." };
    }
    const contactValue = input.contactValue.trim().slice(0, 200);
    if (input.contactMethod !== "zoom" && !contactValue) {
        return { ok: false, error: "Please add the number we should call." };
    }
    const days = input.preferredDays.filter((d) => (CALL_DAY_OPTIONS as readonly string[]).includes(d));
    if (days.length === 0) return { ok: false, error: "Please pick at least one day that usually works." };
    const parts = input.dayParts.filter((p) => (DAY_PART_OPTIONS as readonly string[]).includes(p));
    if (parts.length === 0) return { ok: false, error: "Please pick morning, afternoon or evening." };

    const { error } = await db.from("buyer_call_requests").upsert(
        {
            buyer_id: buyerId,
            contact_method: input.contactMethod as BuyerCallContactMethod,
            contact_value: contactValue || null,
            preferred_days: days,
            day_parts: parts,
            timezone: input.timezone.trim().slice(0, 100) || null,
            notes: input.notes.trim().slice(0, 2000) || null,
            status: "requested",
        },
        { onConflict: "buyer_id" },
    );
    if (error) return { ok: false, error: "Something went wrong saving your request. Please try again." };
    return { ok: true };
}

/**
 * Admin-only: move a call request through its lifecycle. Marking it
 * completed grants the $10 store credit on credit arms.
 */
export async function setCallRequestStatus(
    requestId: string,
    status: BuyerCallStatus,
): Promise<ResearchActionResult> {
    if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
    const db = getAdminDb();

    const { data: request, error } = await db
        .from("buyer_call_requests")
        .update({ status })
        .eq("id", requestId)
        .select("buyer_id")
        .maybeSingle();
    if (error) return { ok: false, error: error.message };

    let creditGranted = 0;
    const overrides = await loadArmOverrides(db);
    if (status === "completed" && request && armHasIncentive(resolveArm(request.buyer_id, overrides))) {
        const granted = await grantCredit(
            request.buyer_id,
            CALL_REWARD_USD,
            "call-reward",
            "Buyer research founder call completed (AB Test August 10)",
        );
        if (granted) creditGranted = CALL_REWARD_USD;
    }
    return { ok: true, creditGranted };
}

// --- AB Test August 10 admin GUI actions -----------------------------------------

export async function saveAbTestTemplate(
    arm: ResearchArm,
    subject: string,
    html: string,
): Promise<ResearchActionResult> {
    if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
    if (!(ARMS as readonly string[]).includes(arm)) return { ok: false, error: "Unknown variant." };
    if (!subject.trim() || !html.trim()) return { ok: false, error: "Subject and body are required." };

    const db = getAdminDb();
    const { error } = await db
        .from("campaigns")
        .update({ subject_line: subject.trim().slice(0, 300), html_content: html })
        .eq("name", AB_TEMPLATE_NAMES[arm])
        .eq("is_template", true);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
}

export async function saveArmOverrides(map: Record<string, string>): Promise<ResearchActionResult> {
    if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
    const db = getAdminDb();

    const clean: Record<string, ResearchArm> = {};
    for (const [buyerId, arm] of Object.entries(map)) {
        if (!(ARMS as readonly string[]).includes(arm)) return { ok: false, error: `Unknown variant for ${buyerId}.` };
        clean[buyerId] = arm as ResearchArm;
    }

    const { error } = await db
        .from("app_settings")
        .upsert({ key: ARM_OVERRIDES_SETTING, value: clean }, { onConflict: "key" });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
}

// --- founder call scheduling (/admin/founder-calls) -------------------------------

/**
 * Save a proposed slot for a call request. Drafting only: this never emails
 * the buyer. `scheduledAt` is an ISO string in UTC, or null to unschedule.
 */
export async function saveCallSchedule(
    requestId: string,
    scheduledAt: string | null,
): Promise<ResearchActionResult> {
    if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };

    if (scheduledAt !== null) {
        const when = new Date(scheduledAt);
        if (Number.isNaN(when.getTime())) return { ok: false, error: "Invalid date." };
    }

    const db = getAdminDb();
    const { error } = await db
        .from("buyer_call_requests")
        .update({ scheduled_at: scheduledAt })
        .eq("id", requestId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
}

/** Save every changed slot in one go (the page's "Save schedule" button). */
export async function saveCallSchedules(
    map: Record<string, string | null>,
): Promise<ResearchActionResult> {
    if (!(await requireAdmin())) return { ok: false, error: "Not authorized." };
    const db = getAdminDb();

    // A slot may only be held by one buyer: catch collisions before writing.
    const taken = new Map<string, string>();
    for (const [id, iso] of Object.entries(map)) {
        if (!iso) continue;
        if (Number.isNaN(new Date(iso).getTime())) return { ok: false, error: "Invalid date." };
        const clash = taken.get(iso);
        if (clash) return { ok: false, error: "Two buyers are on the same slot. Move one first." };
        taken.set(iso, id);
    }

    for (const [id, iso] of Object.entries(map)) {
        const { error } = await db.from("buyer_call_requests").update({ scheduled_at: iso }).eq("id", id);
        if (error) return { ok: false, error: error.message };
    }
    return { ok: true };
}
