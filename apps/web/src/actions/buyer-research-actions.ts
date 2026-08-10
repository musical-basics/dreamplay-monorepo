"use server";

import { getAdminDb, getServerDb } from "@/lib/db";
import {
    CALL_TIME_OPTIONS,
    SURVEY_QUESTIONS,
    parseResearchToken,
    researchVariant,
} from "@/lib/buyer-research";
import type { BuyerCallContactMethod, BuyerCallStatus } from "@dreamplay/db";

export interface ResearchActionResult {
    ok: boolean;
    error?: string;
}

/** Variant A: store (or update) the survey answers. Reward: $5 off. */
export async function submitBuyerSurvey(
    token: string,
    answers: Record<string, string>,
): Promise<ResearchActionResult> {
    const buyerId = parseResearchToken(token);
    if (!buyerId) return { ok: false, error: "This link is invalid. Please use the link from your email." };
    if (researchVariant(buyerId) !== "survey") return { ok: false, error: "This link is not valid for the survey." };

    const db = getAdminDb();
    const { data: buyer } = await db.from("buyers").select("id").eq("id", buyerId).maybeSingle();
    if (!buyer) return { ok: false, error: "We could not find your order. Please contact support." };

    // Validate against the shared question definition; unknown keys dropped.
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
    return { ok: true };
}

/** Variant B: record the 15-minute founder call request. Reward: $10 off after the call. */
export async function requestFounderCall(
    token: string,
    input: {
        contactMethod: string;
        contactValue: string;
        preferredTimes: string[];
        timezone: string;
        notes: string;
    },
): Promise<ResearchActionResult> {
    const buyerId = parseResearchToken(token);
    if (!buyerId) return { ok: false, error: "This link is invalid. Please use the link from your email." };
    if (researchVariant(buyerId) !== "call") return { ok: false, error: "This link is not valid for the call invite." };

    const db = getAdminDb();
    const { data: buyer } = await db.from("buyers").select("id").eq("id", buyerId).maybeSingle();
    if (!buyer) return { ok: false, error: "We could not find your order. Please contact support." };

    if (!["zoom", "phone", "whatsapp"].includes(input.contactMethod)) {
        return { ok: false, error: "Please choose how you would like to take the call." };
    }
    const contactValue = input.contactValue.trim().slice(0, 200);
    if (input.contactMethod !== "zoom" && !contactValue) {
        return { ok: false, error: "Please add the number we should call." };
    }
    const times = input.preferredTimes.filter((t) => (CALL_TIME_OPTIONS as readonly string[]).includes(t));
    if (times.length === 0) return { ok: false, error: "Please pick at least one time that usually works." };

    const { error } = await db.from("buyer_call_requests").upsert(
        {
            buyer_id: buyerId,
            contact_method: input.contactMethod as BuyerCallContactMethod,
            contact_value: contactValue || null,
            preferred_times: times,
            timezone: input.timezone.trim().slice(0, 100) || null,
            notes: input.notes.trim().slice(0, 2000) || null,
            status: "requested",
        },
        { onConflict: "buyer_id" },
    );
    if (error) return { ok: false, error: "Something went wrong saving your request. Please try again." };
    return { ok: true };
}

/** Admin-only: move a call request through its lifecycle (completed = $10 owed). */
export async function setCallRequestStatus(
    requestId: string,
    status: BuyerCallStatus,
): Promise<ResearchActionResult> {
    // Server actions bypass the /admin layout gate, so re-check here.
    const server = await getServerDb();
    const { data: userData } = await server.auth.getUser();
    const email = userData.user?.email?.toLowerCase();
    if (!email) return { ok: false, error: "Not signed in." };
    const db = getAdminDb();
    const { data: setting } = await db.from("settings").select("value").eq("key", "admin_emails").maybeSingle();
    const admins = Array.isArray(setting?.value) ? (setting.value as string[]) : [];
    if (!admins.some((a) => typeof a === "string" && a.toLowerCase() === email)) {
        return { ok: false, error: "Not authorized." };
    }

    const { error } = await db.from("buyer_call_requests").update({ status }).eq("id", requestId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
}
