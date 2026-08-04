/**
 * Calendar-day windows in America/New_York, expressed as [startIso, endIso)
 * UTC boundaries for querying the `events` table (created_at is UTC).
 *
 * `asOf` is the instant the report is generated (normally "now" at send
 * time). Kept as a parameter — not read internally — so callers own the only
 * non-deterministic input and the module stays pure/testable.
 */

const REPORT_TZ = "America/New_York";

/** Y-M-D (in REPORT_TZ) of the given instant, as separate integers. */
function nyDateParts(instant: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: REPORT_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/**
 * UTC instant corresponding to 00:00:00 America/New_York on the given
 * calendar date. Resolves the tz offset by round-tripping through
 * Intl (handles EST/EDT correctly without a tz database dependency).
 */
function nyMidnightUtc(year: number, month: number, day: number): Date {
  // First guess: treat the wall-clock time as if it were UTC, then correct
  // by the observed offset at that instant.
  const guess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const offsetFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: REPORT_TZ,
    timeZoneName: "shortOffset",
  });
  const tzPart = offsetFormatter.formatToParts(guess).find((p) => p.type === "timeZoneName")?.value ?? "GMT+0";
  const match = /GMT([+-]\d{1,2})(?::?(\d{2}))?/.exec(tzPart);
  const offsetHours = match ? Number(match[1]) : 0;
  const offsetMinutes = match?.[2] ? Number(match[2]) * Math.sign(offsetHours || 1) : 0;
  return new Date(guess.getTime() - (offsetHours * 60 + offsetMinutes) * 60_000);
}

export interface ReportWindow {
  /** Human label, e.g. "Aug 3, 2026" or "Jul 28 – Aug 3, 2026". */
  label: string;
  startIso: string;
  endIso: string;
}

/** The previous America/New_York calendar day relative to `asOf`. */
export function previousNyCalendarDay(asOf: Date): ReportWindow {
  const today = nyDateParts(asOf);
  const todayStartUtc = nyMidnightUtc(today.year, today.month, today.day);
  const yesterdayStartUtc = new Date(todayStartUtc.getTime() - 24 * 60 * 60 * 1000);

  return {
    label: new Intl.DateTimeFormat("en-US", { timeZone: REPORT_TZ, month: "short", day: "numeric", year: "numeric" }).format(
      yesterdayStartUtc
    ),
    startIso: yesterdayStartUtc.toISOString(),
    endIso: todayStartUtc.toISOString(),
  };
}

/** The trailing 7 America/New_York calendar days ending the day before `asOf`. */
export function trailing7NyCalendarDays(asOf: Date): ReportWindow {
  const today = nyDateParts(asOf);
  const todayStartUtc = nyMidnightUtc(today.year, today.month, today.day);
  const endUtc = todayStartUtc;
  const startUtc = new Date(endUtc.getTime() - 7 * 24 * 60 * 60 * 1000);

  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: REPORT_TZ, month: "short", day: "numeric" });
  const fmtWithYear = new Intl.DateTimeFormat("en-US", { timeZone: REPORT_TZ, month: "short", day: "numeric", year: "numeric" });
  const lastDay = new Date(endUtc.getTime() - 24 * 60 * 60 * 1000);

  return {
    label: `${fmt.format(startUtc)} – ${fmtWithYear.format(lastDay)}`,
    startIso: startUtc.toISOString(),
    endIso: endUtc.toISOString(),
  };
}
