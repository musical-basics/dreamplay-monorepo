/**
 * Founder call scheduling (AB Test August 10 follow-up).
 *
 * Buyers told us their preferred DAYS and PARTS OF DAY in their own
 * timezone, never an exact time. This turns those preferences plus Lionel's
 * own availability into concrete slot suggestions, scored so the admin page
 * can propose a default that he then confirms or moves.
 *
 * Everything is computed in UTC and rendered per-timezone at the edges, so
 * DST is handled by Intl rather than by arithmetic on offsets.
 */

export const LIONEL_TZ = "America/New_York";

/** Lionel's stated availability: Friday and Saturday, 2pm to 5pm ET. */
export const LIONEL_AVAILABILITY = {
    days: ["Friday", "Saturday"] as const,
    startHour: 14,
    /** Exclusive: the last meeting may START at 16:00 and end by 17:00. */
    endHour: 17,
};

/**
 * Two guests asked for evenings that do not exist inside 2-5pm ET. Slots
 * past endHour are still offered, flagged `outsidePreferred`, because
 * refusing them would mean not scheduling those buyers at all.
 */
export const EXTENDED_END_HOUR = 20;

export const DAY_PART_RANGES: Record<string, [number, number]> = {
    Morning: [5, 12],
    Afternoon: [12, 17],
    Evening: [17, 23],
};

export function partOfDay(hour: number): string {
    if (hour < DAY_PART_RANGES.Morning![0]) return "Evening";
    for (const [part, [lo, hi]] of Object.entries(DAY_PART_RANGES)) {
        if (hour >= lo && hour < hi) return part;
    }
    return "Evening";
}

/** Weekday name for an instant, in a given timezone. */
export function weekdayIn(date: Date, timeZone: string): string {
    return new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long" }).format(date);
}

/** Hour (0-23) for an instant, in a given timezone. */
export function hourIn(date: Date, timeZone: string): number {
    return Number(new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hour12: false }).format(date));
}

export function formatIn(date: Date, timeZone: string, opts: Intl.DateTimeFormatOptions = {}): string {
    return new Intl.DateTimeFormat("en-US", {
        timeZone,
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        ...opts,
    }).format(date);
}

/** A short, unambiguous timezone label, e.g. "EDT" or "BST". */
export function tzAbbrev(date: Date, timeZone: string): string {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" }).formatToParts(date);
    return parts.find((p) => p.type === "timeZoneName")?.value ?? timeZone;
}

export interface CallPreference {
    /** IANA zone from the browser at request time; may be null on old rows. */
    timezone: string | null;
    preferredDays: string[];
    dayParts: string[];
    /** Free-text note, which sometimes contradicts the chips ("after 7pm"). */
    notes: string | null;
}

export interface SlotScore {
    /** Slot start, UTC. */
    start: Date;
    /** True when the buyer's day AND part-of-day both match. */
    fits: boolean;
    /** True when the slot falls outside Lionel's 2-5pm ET window. */
    outsidePreferred: boolean;
    /** Why this slot does or does not work, for the admin UI. */
    reasons: string[];
}

/**
 * Build every candidate slot on Lionel's available days within `days` of
 * `from`, at hourly starts. Slots run from his window start through
 * EXTENDED_END_HOUR so that evening-only buyers are reachable.
 */
export function candidateSlots(from: Date, days = 21): Date[] {
    const out: Date[] = [];
    const cursor = new Date(from);
    cursor.setUTCHours(0, 0, 0, 0);
    for (let d = 0; d < days; d++) {
        const day = new Date(cursor.getTime() + d * 86400000);
        for (let h = LIONEL_AVAILABILITY.startHour; h < EXTENDED_END_HOUR; h++) {
            // Find the instant that reads as hour `h` in Lionel's timezone on
            // this calendar day. Probing avoids hardcoding a UTC offset.
            for (let probe = 0; probe < 26; probe++) {
                const cand = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), probe, 0, 0));
                if (hourIn(cand, LIONEL_TZ) !== h) continue;
                const wd = weekdayIn(cand, LIONEL_TZ);
                if (!(LIONEL_AVAILABILITY.days as readonly string[]).includes(wd)) break;
                if (cand > from) out.push(cand);
                break;
            }
        }
    }
    return out.sort((a, b) => a.getTime() - b.getTime());
}

/** Score one slot against one buyer's stated preferences. */
export function scoreSlot(slot: Date, pref: CallPreference): SlotScore {
    const tz = pref.timezone || LIONEL_TZ;
    const reasons: string[] = [];
    const guestDay = weekdayIn(slot, tz);
    const guestHour = hourIn(slot, tz);
    const guestPart = partOfDay(guestHour);

    const dayOk = pref.preferredDays.length === 0 || pref.preferredDays.includes(guestDay);
    const partOk = pref.dayParts.length === 0 || pref.dayParts.includes(guestPart);

    if (!dayOk) reasons.push(`${guestDay} is not one of their days`);
    if (!partOk) reasons.push(`lands in their ${guestPart.toLowerCase()}, they asked for ${pref.dayParts.join("/").toLowerCase()}`);

    const lionelHour = hourIn(slot, LIONEL_TZ);
    const outsidePreferred = lionelHour >= LIONEL_AVAILABILITY.endHour;
    if (outsidePreferred) reasons.push(`${lionelHour - 12}pm ET is past your 5pm cutoff`);

    if (dayOk && partOk && !outsidePreferred) reasons.push("fits both of you");

    return { start: slot, fits: dayOk && partOk, outsidePreferred, reasons };
}

/**
 * Best slot for a buyer: prefer slots that fit them AND sit inside Lionel's
 * window; fall back to fitting slots outside it; finally to the earliest
 * candidate. Ties break toward the earliest date so the calls happen soon.
 */
export function suggestSlot(slots: Date[], pref: CallPreference): SlotScore | null {
    const scored = slots.map((s) => scoreSlot(s, pref));
    return (
        scored.find((s) => s.fits && !s.outsidePreferred) ??
        scored.find((s) => s.fits) ??
        scored[0] ??
        null
    );
}

/**
 * Assign slots across several buyers without double-booking. Buyers with
 * the fewest workable options are placed first, so the most constrained
 * person is not squeezed out by someone flexible.
 */
export function suggestSchedule<T extends { id: string; pref: CallPreference }>(
    requests: T[],
    slots: Date[],
): Map<string, SlotScore | null> {
    const optionCount = new Map<string, number>();
    for (const r of requests) {
        optionCount.set(r.id, slots.filter((s) => scoreSlot(s, r.pref).fits).length);
    }
    const order = [...requests].sort((a, b) => (optionCount.get(a.id) ?? 0) - (optionCount.get(b.id) ?? 0));

    const taken = new Set<number>();
    const out = new Map<string, SlotScore | null>();
    for (const r of order) {
        const free = slots.filter((s) => !taken.has(s.getTime()));
        const pick = suggestSlot(free, r.pref);
        if (pick) taken.add(pick.start.getTime());
        out.set(r.id, pick);
    }
    return out;
}
