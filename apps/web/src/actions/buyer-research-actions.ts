"use server";

import { getAdminDb, getServerDb } from "@/lib/db";
import {
    CALL_REWARD_USD,
    CALL_TIME_OPTIONS,
    SURVEY_QUESTIONS,
    SURVEY_REWARD_USD,
    armHasIncentive,
    armMethod,
    parseResearchToken,
    researchArm,
} from "@/lib/buyer-research";
import type { BuyerCallContactMethod, BuyerCallStatus } from "@dreamplay/db";

export interface ResearchActionResult {
    ok: boolean;
    error?: string;
    /** Store credit granted by this action (0 for no-incentive arms). */
    creditGranted?: number;
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
    // 23505 = unique violation: credit already granted earlier.
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
    if (armHasIncentive(researchArm(buyerId))) {
        const granted = await grantCredit(
            buyerId,
            SURVEY_REWARD_USD,
            "survey-reward",
            "Buyer research survey completed",
        );
        if (granted) creditGranted = SURVEY_REWARD_USD;
    }
    return { ok: true, creditGranted };
}

/** Call request: call arms (B1/B2) only. */
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
    if (armMethod(researchArm(buyerId)) !== "call") {
        return { ok: false, error: "This link is not valid for the call invite." };
    }

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

/**
 * Admin-only: move a call request through its lifecycle. Marking it
 * completed grants the $10 store credit on credit arms (B1).
 */
export async function setCallRequestStatus(
    requestId: string,
    status: BuyerCallStatus,
): Promise<ResearchActionResult> {
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

    const { data: request, error } = await db
        .from("buyer_call_requests")
        .update({ status })
        .eq("id", requestId)
        .select("buyer_id")
        .maybeSingle();
    if (error) return { ok: false, error: error.message };

    let creditGranted = 0;
    if (status === "completed" && request && armHasIncentive(researchArm(request.buyer_id))) {
        const granted = await grantCredit(
            request.buyer_id,
            CALL_REWARD_USD,
            "call-reward",
            "Buyer research founder call completed",
        );
        if (granted) creditGranted = CALL_REWARD_USD;
    }
    return { ok: true, creditGranted };
}
