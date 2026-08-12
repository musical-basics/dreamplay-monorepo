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

/**
 * Lionel's availability. The core window is 1pm to 5pm ET on his available
 * days; evenings differ per day and live in EVENING_AVAILABILITY.
 */
export const LIONEL_AVAILABILITY = {
    // Monday added 2026-08-12 for a buyer who can only do Mon/Tue/Thu.
    days: ["Monday", "Friday", "Saturday"] as const,
    startHour: 13,
    /** Exclusive: the last core-window meeting may START at 16:00. */
    endHour: 17,
};

/**
 * Evening availability, which differs by day (Lionel, 2026-08-11): Saturday
 * night is free from 5pm, but Friday night is busy until 8pm ET. Monday
 * evenings are open from 5pm.
 *
 * `from` is the first bookable hour, `to` is exclusive.
 */
export const EVENING_AVAILABILITY: Record<string, { from: number; to: number }> = {
    Monday: { from: 17, to: 22 },
    Friday: { from: 20, to: 22 },
    Saturday: { from: 17, to: 22 },
};

/** Latest hour any slot may start, across every day. */
export const EXTENDED_END_HOUR = 22;

/** Is this hour bookable on this weekday, given core + evening windows? */
export function isBookableHour(weekday: string, hour: number): boolean {
    if (!(LIONEL_AVAILABILITY.days as readonly string[]).includes(weekday)) return false;
    const core = hour >= LIONEL_AVAILABILITY.startHour && hour < LIONEL_AVAILABILITY.endHour;
    const evening = EVENING_AVAILABILITY[weekday];
    return core || (evening !== undefined && hour >= evening.from && hour < evening.to);
}

/**
 * Hours (in LIONEL_TZ) Lionel is already busy, keyed by "YYYY-MM-DD" in that
 * same zone. These are removed from the candidate list entirely, so a
 * conflicting slot cannot be picked by the suggester or from the dropdown.
 */
export const BUSY_SLOTS: Record<string, number[]> = {
    // Existing call at 3pm ET on Friday Aug 14 (Lionel, 2026-08-11).
    "2026-08-14": [15],
};

/**
 * Calendar date in a given zone, as "YYYY-MM-DD", for BUSY_SLOTS lookups.
 *
 * The options object is built explicitly rather than with `{ timeZone, ... }`
 * shorthand: the production minifier renamed the parameter and left the
 * shorthand key pointing at a dead binding, which crashed the page with
 * "ReferenceError: timeZone is not defined" while working fine locally.
 */
export function dateKeyIn(date: Date, zone: string): string {
    const options: Intl.DateTimeFormatOptions = {
        timeZone: zone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    };
    return new Intl.DateTimeFormat("en-CA", options).format(date);
}

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

/**
 * Weekday name for an instant, in a given timezone.
 *
 * Note every helper here writes `timeZone: zone` in full. See dateKeyIn()
 * for why the `{ timeZone }` shorthand must not be used in this file.
 */
export function weekdayIn(date: Date, zone: string): string {
    const options: Intl.DateTimeFormatOptions = { timeZone: zone, weekday: "long" };
    return new Intl.DateTimeFormat("en-US", options).format(date);
}

/** Hour (0-23) for an instant, in a given timezone. */
export function hourIn(date: Date, zone: string): number {
    const options: Intl.DateTimeFormatOptions = { timeZone: zone, hour: "numeric", hour12: false };
    return Number(new Intl.DateTimeFormat("en-US", options).format(date));
}

export function formatIn(date: Date, zone: string, opts: Intl.DateTimeFormatOptions = {}): string {
    const options: Intl.DateTimeFormatOptions = {
        timeZone: zone,
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        ...opts,
    };
    return new Intl.DateTimeFormat("en-US", options).format(date);
}

/**
 * Timezone abbreviations are locale-dependent, and en-US gets other
 * countries wrong: it renders Europe/London as "GMT+1" when people there
 * say "BST". Take the label from a locale that matches the zone.
 */
const LOCALE_FOR_ZONE: [RegExp, string][] = [
    [/^Europe\/(London|Belfast)$/, "en-GB"],
    [/^Europe\/Dublin$/, "en-IE"],
    [/^Australia\//, "en-AU"],
    [/^Pacific\/(Auckland|Chatham)$/, "en-NZ"],
    [/^Asia\/(Kolkata|Calcutta)$/, "en-IN"],
];

export function localeForZone(zone: string): string {
    for (const [re, loc] of LOCALE_FOR_ZONE) if (re.test(zone)) return loc;
    return "en-US";
}

/** A short, unambiguous timezone label, e.g. "EDT" or "BST". */
export function tzAbbrev(date: Date, zone: string): string {
    const options: Intl.DateTimeFormatOptions = { timeZone: zone, timeZoneName: "short" };
    const parts = new Intl.DateTimeFormat(localeForZone(zone), options).formatToParts(date);
    return parts.find((p) => p.type === "timeZoneName")?.value ?? zone;
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
        // Scan every hour of the window; isBookableHour() decides which of
        // them are actually open on this particular weekday.
        for (let h = LIONEL_AVAILABILITY.startHour; h < EXTENDED_END_HOUR; h++) {
            // Find the instant that reads as hour `h` in Lionel's timezone on
            // this calendar day. Probing avoids hardcoding a UTC offset.
            for (let probe = 0; probe < 26; probe++) {
                const cand = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), probe, 0, 0));
                if (hourIn(cand, LIONEL_TZ) !== h) continue;
                const wd = weekdayIn(cand, LIONEL_TZ);
                if (!isBookableHour(wd, h)) break;
                const busy = BUSY_SLOTS[dateKeyIn(cand, LIONEL_TZ)] ?? [];
                if (busy.includes(h)) break;
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
    const lionelDay = weekdayIn(slot, LIONEL_TZ);
    const outsidePreferred = lionelHour >= LIONEL_AVAILABILITY.endHour;
    if (outsidePreferred) {
        reasons.push(`${lionelHour - 12}pm ET, your ${lionelDay.toLowerCase()} evening slot`);
    }

    if (dayOk && partOk && !outsidePreferred) reasons.push("fits both of you");

    return { start: slot, fits: dayOk && partOk, outsidePreferred, reasons };
}

/**
 * A buyer's free-text note can be stricter than the chips they ticked (one
 * said "Evening" but wrote "usually free weekdays after 7pm"). When a note
 * names an hour, honour it: the chips are a coarse picker, the note is what
 * they actually told us.
 */
export function earliestHourFromNote(notes: string | null): number | null {
    if (!notes) return null;
    const m = notes.match(/after\s+(\d{1,2})\s*(am|pm)?/i);
    if (!m) return null;
    let hour = Number(m[1]);
    const meridiem = m[2]?.toLowerCase();
    if (meridiem === "pm" && hour < 12) hour += 12;
    // "after 7" with no am/pm, in an evening context, means 7pm.
    if (!meridiem && hour <= 11) hour += 12;
    return hour >= 0 && hour <= 23 ? hour : null;
}

/**
 * Best slot for a buyer: prefer slots that fit them AND sit inside Lionel's
 * window; fall back to fitting slots outside it; finally to the earliest
 * candidate. Ties break toward the earliest date so the calls happen soon.
 *
 * A minimum-hour hint from the buyer's note is applied first and only
 * relaxed if it would leave them with nothing.
 */
export function suggestSlot(slots: Date[], pref: CallPreference): SlotScore | null {
    const tz = pref.timezone || LIONEL_TZ;
    const minHour = earliestHourFromNote(pref.notes);
    const honoursNote = (s: Date) => minHour === null || hourIn(s, tz) >= minHour;

    const preferred = slots.filter(honoursNote);
    const pool = preferred.length ? preferred : slots;

    const scored = pool.map((s) => scoreSlot(s, pref));
    return (
        scored.find((s) => s.fits && !s.outsidePreferred) ??
        scored.find((s) => s.fits) ??
        scored[0] ??
        null
    );
}

/**
 * Slots Lionel has asked for by name, keyed by buyer email. These are placed
 * before anything else is suggested, so a direct instruction always wins
 * over the scoring heuristic.
 */
export const PINNED_SLOTS: Record<string, string> = {
    // "move j hounds to 1pm my time" (Lionel, 2026-08-11). 1pm ET = 11am MDT,
    // inside their stated availability.
    "jhounds99@gmail.com": "2026-08-14T17:00:00.000Z",
    // Jude wrote "usually free weekdays after 7pm" and ticked Friday but not
    // Saturday, so a Saturday evening would break their own preference.
    // Friday 8pm ET is the earliest that clears Lionel's Friday-night
    // commitment while still being a weekday evening for them.
    "judehe45@gmail.com": "2026-08-15T00:00:00.000Z",
    // "poly you can schedule for next monday" (Lionel, 2026-08-12).
    // Mon Aug 17, 3pm ET = 12pm PDT, inside their Afternoon preference.
    "polypseudonymz@gmail.com": "2026-08-17T19:00:00.000Z",
};

/**
 * Assign slots across several buyers without double-booking. Pinned buyers
 * are placed first; the rest are ordered by how few workable options they
 * have, so the most constrained person is not squeezed out by someone
 * flexible.
 */
export function suggestSchedule<T extends { id: string; pref: CallPreference; email?: string }>(
    requests: T[],
    slots: Date[],
): Map<string, SlotScore | null> {
    const taken = new Set<number>();
    const out = new Map<string, SlotScore | null>();

    const pinned: T[] = [];
    const rest: T[] = [];
    for (const r of requests) {
        const key = r.email?.toLowerCase() ?? "";
        if (PINNED_SLOTS[key]) pinned.push(r);
        else rest.push(r);
    }

    for (const r of pinned) {
        const iso = PINNED_SLOTS[r.email!.toLowerCase()]!;
        const start = new Date(iso);
        taken.add(start.getTime());
        const score = scoreSlot(start, r.pref);
        out.set(r.id, { ...score, reasons: ["you asked for this time", ...score.reasons] });
    }

    const optionCount = new Map<string, number>();
    for (const r of rest) {
        optionCount.set(r.id, slots.filter((s) => scoreSlot(s, r.pref).fits).length);
    }
    const order = [...rest].sort((a, b) => (optionCount.get(a.id) ?? 0) - (optionCount.get(b.id) ?? 0));

    for (const r of order) {
        const free = slots.filter((s) => !taken.has(s.getTime()));
        const pick = suggestSlot(free, r.pref);
        if (pick) taken.add(pick.start.getTime());
        out.set(r.id, pick);
    }
    return out;
}
