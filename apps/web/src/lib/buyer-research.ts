import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { Tables } from "@dreamplay/db";

/**
 * Buyer research A/B test (2026-08): why did people buy the DreamPlay One?
 *
 * Variant A "survey": short questionnaire on /buyer-survey, $5 off on
 * completion. Variant B "call": 15-minute call with Lionel requested on
 * /founder-call, $10 off after the call happens.
 *
 * Goals: (1) which collection method performs better, (2) demographics and
 * the deepest motivations behind purchases, to sharpen DreamPlay marketing.
 */

export type Buyer = Tables<"buyers">;
export type ResearchVariant = "survey" | "call";

export const SURVEY_REWARD_USD = 5;
export const CALL_REWARD_USD = 10;

/**
 * Deterministic assignment: sha256 over a fixed salt + buyer id, first byte
 * parity. Stable across processes and time; no assignment storage.
 *
 * The salt is "v8" because it was chosen (2026-08-10, BEFORE any research
 * email went out) as the first salt that splits the fixed 64-buyer cohort
 * exactly 32/32; the plain salt happened to split 44/20. Do not change it
 * once the research emails have been sent.
 */
export function researchVariant(buyerId: string): ResearchVariant {
    const h = createHash("sha256").update(`buyer-research-v8:${buyerId}`).digest();
    return h[0]! % 2 === 0 ? "survey" : "call";
}

export function researchPagePath(variant: ResearchVariant): string {
    return variant === "survey" ? "/buyer-survey" : "/founder-call";
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

export function buildResearchPath(buyerId: string): string {
    const variant = researchVariant(buyerId);
    return `${researchPagePath(variant)}?t=${encodeURIComponent(`${buyerId}.${researchToken(buyerId)}`)}`;
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

export const CALL_TIME_OPTIONS = [
    "Weekday mornings",
    "Weekday afternoons",
    "Weekday evenings",
    "Weekends",
] as const;
