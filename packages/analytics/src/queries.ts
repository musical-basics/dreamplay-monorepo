/**
 * Typed query helpers over the unified `events` table.
 *
 * Server-side only (admin client, bypasses RLS): dashboard routes, exports,
 * scripts. Heavy aggregation happens in Postgres (the get_analytics_summary
 * RPC from Phase 1) — never the legacy 20k-rows-into-JS pattern. The one
 * exception is per-variant A/B results, which page through narrow projections
 * with the same paginator as exportEvents.
 */

import { createAdminClient, type AdminClient, type Json, type Tables } from "@dreamplay/db";

export type AnalyticsRange = "24h" | "7d" | "30d" | "all";
export type EventRow = Tables<"events">;

const RANGE_MS: Record<Exclude<AnalyticsRange, "all">, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export function rangeStartIso(range: AnalyticsRange, now: () => number = Date.now): string {
  if (range === "all") return new Date(0).toISOString();
  return new Date(now() - RANGE_MS[range]).toISOString();
}

export interface QueryOptions {
  /** Injectable client (tests / connection reuse). Default: createAdminClient(). */
  client?: AdminClient;
}

function resolveClient(opts?: QueryOptions): AdminClient {
  return opts?.client ?? createAdminClient();
}

// ---------------------------------------------------------------------------
// Summary (Postgres RPC)
// ---------------------------------------------------------------------------

export interface SummaryOptions extends QueryOptions {
  excludeAdmin?: boolean;
  excludeBots?: boolean;
}

/**
 * Dashboard headline numbers: live users, pageviews, uniques, chart series,
 * A/B results — computed inside Postgres by get_analytics_summary.
 */
export async function getSummary(range: AnalyticsRange, opts: SummaryOptions = {}): Promise<Json> {
  const client = resolveClient(opts);
  const { data, error } = await client.rpc("get_analytics_summary", {
    p_range: range,
    p_exclude_admin: opts.excludeAdmin ?? false,
    p_exclude_bots: opts.excludeBots ?? false,
  });
  if (error) throw new Error(`get_analytics_summary failed: ${error.message}`);
  return data;
}

// ---------------------------------------------------------------------------
// A/B funnel rows (Decision D11)
// ---------------------------------------------------------------------------

/** Narrow projection of variant-tagged events for the score engine. */
export interface AbEventRow {
  event_name: string;
  path: string | null;
  session_id: string | null;
  duration_seconds: number | string | null;
  metadata: Json;
  /** Needed by the score engine's per-variation `since` cutoffs. */
  created_at: string;
  /** Needed by the score engine's retroactive admin/bot IP exclusion. */
  ip_address: string | null;
}

export interface AbEventsOptions extends QueryOptions {
  pageSize?: number;
  /** Safety valve against unbounded reads. Default 100k rows. */
  maxRows?: number;
}

/**
 * Every event carrying `metadata.ab_variant` in the range (exposures and
 * conversions alike — /main and untagged site traffic never appear here).
 * Feed the result to @dreamplay/ab's computeVariationScores; filtering of
 * bot/admin rows happens there.
 */
export async function fetchAbTaggedEvents(
  range: AnalyticsRange,
  opts: AbEventsOptions = {}
): Promise<AbEventRow[]> {
  const client = resolveClient(opts);
  const pageSize = opts.pageSize ?? 1000;
  const maxRows = opts.maxRows ?? 100_000;
  const startIso = rangeStartIso(range);

  const rows: AbEventRow[] = [];
  let offset = 0;
  while (rows.length < maxRows) {
    const { data, error } = await client
      .from("events")
      .select("event_name, path, session_id, duration_seconds, metadata, created_at, ip_address")
      .gte("created_at", startIso)
      .not("metadata->>ab_variant", "is", null)
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(`fetchAbTaggedEvents failed: ${error.message}`);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }
  return rows;
}

/**
 * Same as fetchAbTaggedEvents but over an explicit [startIso, endIso) window
 * instead of a "now minus preset" range — for reports pinned to a calendar
 * day/week in a specific timezone (e.g. the daily A/B PDF report), where the
 * preset ranges (which are always relative to `now`) don't apply.
 */
export async function fetchAbTaggedEventsBetween(
  startIso: string,
  endIso: string,
  opts: AbEventsOptions = {}
): Promise<AbEventRow[]> {
  const client = resolveClient(opts);
  const pageSize = opts.pageSize ?? 1000;
  const maxRows = opts.maxRows ?? 100_000;

  const rows: AbEventRow[] = [];
  let offset = 0;
  while (rows.length < maxRows) {
    const { data, error } = await client
      .from("events")
      .select("event_name, path, session_id, duration_seconds, metadata, created_at, ip_address")
      .gte("created_at", startIso)
      .lt("created_at", endIso)
      .not("metadata->>ab_variant", "is", null)
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(`fetchAbTaggedEventsBetween failed: ${error.message}`);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Visitor history
// ---------------------------------------------------------------------------

export interface VisitorHistoryOptions extends QueryOptions {
  limit?: number;
}

/**
 * Chronological event trail for one visitor, matched by session id OR
 * visitor id (either identifier works — journeys built from email links only
 * have the session cookie).
 */
export async function getVisitorHistory(
  sessionOrVisitorId: string,
  opts: VisitorHistoryOptions = {}
): Promise<EventRow[]> {
  const client = resolveClient(opts);
  // PostgREST `or` filter values are comma/paren-delimited — reject ids that
  // could smuggle extra filters rather than quoting our way around it.
  if (/[(),]/.test(sessionOrVisitorId)) {
    throw new Error("getVisitorHistory: id must not contain '(', ')' or ','");
  }
  const { data, error } = await client
    .from("events")
    .select("*")
    .or(`session_id.eq.${sessionOrVisitorId},visitor_id.eq.${sessionOrVisitorId}`)
    .order("created_at", { ascending: true })
    .limit(opts.limit ?? 1000);
  if (error) throw new Error(`getVisitorHistory failed: ${error.message}`);
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Export (async generator past the 1000-row PostgREST cap)
// ---------------------------------------------------------------------------

/**
 * Streams every event in the range in stable id order, `pageSize` rows per
 * yield — the CSV-export building block (the legacy dashboard hand-rolled
 * this pagination in the route).
 *
 * ```ts
 * for await (const page of exportEvents("30d")) { csv.write(page); }
 * ```
 */
export async function* exportEvents(
  range: AnalyticsRange,
  pageSize = 1000,
  opts: QueryOptions = {}
): AsyncGenerator<EventRow[], void, undefined> {
  const client = resolveClient(opts);
  const startIso = rangeStartIso(range);
  let offset = 0;
  for (;;) {
    const { data, error } = await client
      .from("events")
      .select("*")
      .gte("created_at", startIso)
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(`exportEvents failed: ${error.message}`);
    const rows = data ?? [];
    if (rows.length > 0) yield rows;
    if (rows.length < pageSize) return;
    offset += pageSize;
  }
}
