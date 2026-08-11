/**
 * Marketing Calendar (August 2026) — 10 high-intent nurture emails on a
 * Tue/Thu/Sun cadence.
 *
 * The drafts live as `campaigns` rows with category
 * MARKETING_CALENDAR_CATEGORY, status "draft" and scheduled_status NULL, so
 * nothing sends until Lionel approves and a send script goes out (same
 * pipeline guarantees as scripts/email/send-ab-test-august-10.mjs). The
 * audience snapshot lives in app_settings under AUDIENCE_SETTING; it is
 * built by scripts/email/setup-marketing-calendar.mjs and reviewed at
 * /admin/marketing-calendar/audience.
 */

export const MARKETING_CALENDAR_CATEGORY = "marketing-calendar";
export const AUDIENCE_SETTING = "marketing-calendar:audience";
export const CALENDAR_TIMEZONE = "America/New_York";

export interface MarketingAudienceSetting {
    /** ISO timestamp the snapshot was built. */
    builtAt: string;
    /** Human-readable description of how the group was selected. */
    rules: string[];
    /** Subscriber ids in the snapshot (before manual removals). */
    subscriberIds: string[];
    /** Subscriber ids Lionel excluded on the review page. */
    removedIds: string[];
}

export function parseAudienceSetting(value: unknown): MarketingAudienceSetting | null {
    if (!value || typeof value !== "object") return null;
    const v = value as Record<string, unknown>;
    const ids = Array.isArray(v.subscriberIds) ? v.subscriberIds.filter((x): x is string => typeof x === "string") : null;
    if (!ids) return null;
    return {
        builtAt: typeof v.builtAt === "string" ? v.builtAt : "",
        rules: Array.isArray(v.rules) ? v.rules.filter((x): x is string => typeof x === "string") : [],
        subscriberIds: ids,
        removedIds: Array.isArray(v.removedIds) ? v.removedIds.filter((x): x is string => typeof x === "string") : [],
    };
}

/**
 * High-intent signals: subscriber tag -> label shown on the audience page.
 * Mirrored by scripts/email/setup-marketing-calendar.mjs (the snapshot
 * builder). Keep the two in sync.
 */
export const HIGH_INTENT_TAG_LABELS: Record<string, string> = {
    DPHI: "High intent score",
    DPMI: "Medium intent score",
    "Hand Guide Download": "Downloaded the hand guide",
    "Website Waitlist": "Website waitlist",
    Waitlist: "Waitlist",
    "VIP Account": "VIP account",
    "$300 Off Lead": "$300 off lead",
    "$100 Credit Lead": "$100 credit lead",
    "Free Shipping Lead": "Free shipping lead",
    "5% Off Survey Lead": "5% off survey lead",
    "Super High Interest": "Super high interest",
    "Super High Interest, No Conversion": "Super high interest, no conversion",
    "FOMO TAG MARCH": "March offer lead",
};

/** Tags that disqualify a subscriber from the marketing audience. */
export const INTENT_EXCLUDE_TAGS = ["Purchased", "Test Account"];

/** Signal label for subscribers pulled in via recent checkout-intent events. */
export const CHECKOUT_INTENT_SIGNAL = "Recent checkout activity";

/** Human-readable intent signals for a subscriber's tag list. */
export function signalsForTags(tags: string[] | null | undefined): string[] {
    const out: string[] = [];
    for (const tag of tags ?? []) {
        const label = HIGH_INTENT_TAG_LABELS[tag];
        if (label) out.push(label);
    }
    return out;
}

// ---------------------------------------------------------------------------
// Eastern-time helpers. Send times are edited in ET on the calendar page and
// stored UTC in campaigns.scheduled_at.
// ---------------------------------------------------------------------------

/** UTC offset ("-04:00" / "-05:00") in effect in New York at noon UTC of the given day. */
export function easternOffset(dateIso: string): string {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: CALENDAR_TIMEZONE,
        timeZoneName: "longOffset",
    }).formatToParts(new Date(`${dateIso}T12:00:00Z`));
    const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    const m = name.match(/GMT([+-]\d{2}:\d{2})/);
    return m?.[1] ?? "-05:00";
}

/** "2026-08-13" + "09:00" (ET wall clock) -> UTC ISO string. */
export function easternToUtcIso(dateIso: string, time: string): string {
    return new Date(`${dateIso}T${time}:00${easternOffset(dateIso)}`).toISOString();
}

/** UTC ISO -> ET wall-clock parts for form inputs. */
export function utcIsoToEastern(iso: string): { date: string; time: string } {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: CALENDAR_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(new Date(iso));
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
    return {
        date: `${get("year")}-${get("month")}-${get("day")}`,
        time: `${get("hour")}:${get("minute")}`,
    };
}
