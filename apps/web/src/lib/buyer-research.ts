import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { AdminClient, Tables } from "@dreamplay/db";

/**
 * Buyer research 2x2 test (2026-08): why did people buy the DreamPlay One?
 *
 * Method dimension:    survey (/buyer-survey) vs founder call (/founder-call)
 * Incentive dimension: store credit vs no incentive
 *
 *   A1 survey + $5 store credit     A2 survey, no incentive
 *   B1 call   + $10 store credit    B2 call,   no incentive
 *
 * Call-arm buyers who would rather not talk are offered the survey as a
 * fallback (their email links to it), so /buyer-survey accepts every arm;
 * /founder-call stays exclusive to the call arms. Store credit is granted
 * on the credit arms only, into the store_credits ledger.
 *
 * Goals: (1) which collection method and incentive level converts best,
 * (2) demographics and the deepest motivations behind purchases.
 */

export type Buyer = Tables<"buyers">;
export type ResearchArm = "A1" | "A2" | "B1" | "B2";
export type ResearchMethod = "survey" | "call";

/** This whole experiment is named "AB Test August 10" (Lionel, 2026-08-10). */
export const AB_TEST_KEY = "ab-test-august-10";
export const ARM_OVERRIDES_SETTING = `${AB_TEST_KEY}:arm-overrides`;
export const AB_SEND_KEYS: Record<ResearchArm, string> = {
    A1: `${AB_TEST_KEY}-a1`,
    A2: `${AB_TEST_KEY}-a2`,
    B1: `${AB_TEST_KEY}-b1`,
    B2: `${AB_TEST_KEY}-b2`,
};
export const AB_TEMPLATE_NAMES: Record<ResearchArm, string> = {
    A1: "Buyer Research Survey Credit (A1)",
    A2: "Buyer Research Survey NoCredit (A2)",
    B1: "Buyer Research Call Credit (B1)",
    B2: "Buyer Research Call NoCredit (B2)",
};

export const SURVEY_REWARD_USD = 5;
export const CALL_REWARD_USD = 10;

export const ARMS: readonly ResearchArm[] = ["A1", "A2", "B1", "B2"];

/**
 * Deterministic assignment: sha256 over a fixed salt + buyer id, first byte
 * mod 4. Stable across processes and time; no assignment storage.
 *
 * Salt "4arm-v55" was chosen (2026-08-10, BEFORE any research email went
 * out) as the first salt splitting the fixed 64-buyer cohort exactly
 * 16/16/16/16. Do not change it once the research emails have been sent.
 */
export function researchArm(buyerId: string): ResearchArm {
    const h = createHash("sha256").update(`buyer-research-4arm-v55:${buyerId}`).digest();
    return ARMS[h[0]! % 4]!;
}

// --- manual overrides (drag-and-drop on /admin/ab-test-august-10) ----------------

export type ArmOverrides = Record<string, ResearchArm>;

/** Lionel's manual group assignments, stored in app_settings. */
export async function loadArmOverrides(db: AdminClient): Promise<ArmOverrides> {
    const { data } = await db.from("app_settings").select("value").eq("key", ARM_OVERRIDES_SETTING).maybeSingle();
    const raw = (data?.value ?? {}) as Record<string, unknown>;
    const overrides: ArmOverrides = {};
    for (const [buyerId, arm] of Object.entries(raw)) {
        if (typeof arm === "string" && (ARMS as readonly string[]).includes(arm)) {
            overrides[buyerId] = arm as ResearchArm;
        }
    }
    return overrides;
}

/** The buyer's EFFECTIVE arm: manual override first, deterministic hash otherwise. */
export function resolveArm(buyerId: string, overrides: ArmOverrides): ResearchArm {
    return overrides[buyerId] ?? researchArm(buyerId);
}

export function armMethod(arm: ResearchArm): ResearchMethod {
    return arm.startsWith("A") ? "survey" : "call";
}

export function armHasIncentive(arm: ResearchArm): boolean {
    return arm.endsWith("1");
}

export function researchPagePath(method: ResearchMethod): string {
    return method === "survey" ? "/buyer-survey" : "/founder-call";
}

// --- signed per-buyer links (same shape as /order-preferences tokens) -----------

function getSecret(): string {
    const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET;
    if (!secret) throw new Error("EMAIL_UNSUBSCRIBE_SECRET is not set: refusing to build/verify research links.");
    return secret;
}

export function researchToken(buyerId: string): string {
    return createHmac("sha256", getSecret()).update(`buyer-research-link:${buyerId}`).digest("hex").slice(0, 32);
}

/** The buyer's primary research page (their EFFECTIVE arm's method). */
export function buildResearchPath(buyerId: string, overrides: ArmOverrides = {}): string {
    return `${researchPagePath(armMethod(resolveArm(buyerId, overrides)))}?t=${encodeURIComponent(`${buyerId}.${researchToken(buyerId)}`)}`;
}

/** The survey page for ANY buyer (used as the call arms' fallback). */
export function buildSurveyFallbackPath(buyerId: string): string {
    return `/buyer-survey?t=${encodeURIComponent(`${buyerId}.${researchToken(buyerId)}`)}`;
}

export function parseResearchToken(t: string | null | undefined): string | null {
    if (!t) return null;
    const dot = t.lastIndexOf(".");
    if (dot <= 0) return null;
    const id = t.slice(0, dot);
    const expected = Buffer.from(researchToken(id));
    const got = Buffer.from(t.slice(dot + 1));
    if (expected.length !== got.length) return null;
    return timingSafeEqual(expected, got) ? id : null;
}

// --- survey definition ----------------------------------------------------------

export interface SurveyQuestion {
    id: string;
    label: string;
    kind: "radio" | "text";
    options?: string[];
    optional?: boolean;
}

/**
 * Shared by the survey form (render), server action (validation) and the
 * admin research dashboard (aggregation). Demographic + motivation focused.
 */
export const SURVEY_QUESTIONS: SurveyQuestion[] = [
    {
        id: "who_for",
        label: "Who is the DreamPlay One for?",
        kind: "radio",
        options: ["Myself", "My child", "A student I teach", "A family member or partner", "It is a gift"],
    },
    {
        id: "age",
        label: "Your age range",
        kind: "radio",
        options: ["Under 18", "18 to 29", "30 to 44", "45 to 59", "60 or older", "Prefer not to say"],
    },
    {
        id: "experience",
        label: "Your piano experience",
        kind: "radio",
        options: ["Just starting", "Returning after years away", "Intermediate", "Advanced", "Professional or teacher"],
    },
    {
        id: "octave_reach",
        label: "On a standard keyboard, can you comfortably reach a full octave?",
        kind: "radio",
        options: ["Easily", "With some strain", "Barely", "No", "Not sure"],
    },
    {
        id: "main_reason",
        label: "What was the biggest reason you ordered?",
        kind: "radio",
        options: [
            "Narrow keys that finally fit my hands",
            "Relief from pain or strain while playing",
            "The LED guided learning system",
            "It is for someone with smaller hands",
            "I believe in the mission and wanted to support it",
            "The look and design",
            "Other",
        ],
    },
    {
        id: "hesitation",
        label: "What almost stopped you from ordering?",
        kind: "radio",
        options: [
            "The price",
            "The wait for delivery",
            "Not being able to try it first",
            "Doubts that a new company could deliver",
            "Nothing, it was an easy yes",
            "Other",
        ],
    },
    {
        id: "discovery",
        label: "Where did you first hear about DreamPlay?",
        kind: "radio",
        options: [
            "Lionel's YouTube channel (MusicalBasics)",
            "Another YouTube channel or video",
            "Google search",
            "Social media",
            "A friend, family member or teacher",
            "Other",
        ],
    },
    {
        id: "own_words",
        label: "In your own words: what made you decide the DreamPlay One was worth pre-ordering?",
        kind: "text",
    },
    {
        id: "anything_else",
        label: "Anything else you want Lionel to know? (optional)",
        kind: "text",
        optional: true,
    },
];

export const CALL_DAY_OPTIONS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
] as const;

export const DAY_PART_OPTIONS = ["Morning", "Afternoon", "Evening"] as const;
