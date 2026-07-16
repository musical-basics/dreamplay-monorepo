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
// Per-variant experiment results
// ---------------------------------------------------------------------------

export interface VariantResult {
  variant: string;
  /** Distinct sessions that saw the experiment (any tagged event). */
  exposures: number;
  /** Distinct exposed sessions that fired a conversion event. */
  conversions: number;
  /** conversions / exposures (0 when no exposures). */
  conversionRate: number;
  /** Raw tagged event count (debugging/sanity). */
  events: number;
}

export interface VariantResultsOptions extends QueryOptions {
  /** Event names that count as a conversion. */
  conversionEvents?: readonly string[];
  pageSize?: number;
}

const DEFAULT_CONVERSION_EVENTS = ["purchase", "begin_checkout", "subscribe", "conversion"];

/**
 * Exposures / conversions / rates per variant for one experiment, read from
 * event metadata (`ab_experiments.<key>`, falling back to `ab_variant` for
 * single-experiment rows). Sessions are the unit: a session counts as one
 * exposure and at most one conversion.
 */
export async function getVariantResults(
  experimentKey: string,
  range: AnalyticsRange,
  opts: VariantResultsOptions = {}
): Promise<VariantResult[]> {
  const client = resolveClient(opts);
  const conversionEvents = new Set(opts.conversionEvents ?? DEFAULT_CONVERSION_EVENTS);
  const pageSize = opts.pageSize ?? 1000;
  const startIso = rangeStartIso(range);

  interface Bucket {
    exposureSessions: Set<string>;
    conversionSessions: Set<string>;
    events: number;
  }
  const buckets = new Map<string, Bucket>();

  let offset = 0;
  for (;;) {
    const { data, error } = await client
      .from("events")
      .select("event_name, session_id, metadata")
      .gte("created_at", startIso)
      .not(`metadata->ab_experiments->>${experimentKey}`, "is", null)
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(`getVariantResults failed: ${error.message}`);
    const rows = data ?? [];

    for (const row of rows) {
      const meta = (row.metadata ?? {}) as Record<string, Json | undefined>;
      const experimentsMap = meta.ab_experiments as Record<string, Json | undefined> | undefined;
      const variantRaw = experimentsMap?.[experimentKey] ?? meta.ab_variant;
      if (typeof variantRaw !== "string" || variantRaw.length === 0) continue;
      let bucket = buckets.get(variantRaw);
      if (!bucket) {
        bucket = { exposureSessions: new Set(), conversionSessions: new Set(), events: 0 };
        buckets.set(variantRaw, bucket);
      }
      bucket.events += 1;
      const session = row.session_id ?? `no-session:${bucket.events}`;
      bucket.exposureSessions.add(session);
      if (conversionEvents.has(row.event_name)) bucket.conversionSessions.add(session);
    }

    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  return [...buckets.entries()]
    .map(([variant, b]) => ({
      variant,
      exposures: b.exposureSessions.size,
      conversions: b.conversionSessions.size,
      conversionRate: b.exposureSessions.size === 0 ? 0 : b.conversionSessions.size / b.exposureSessions.size,
      events: b.events,
    }))
    .sort((a, b) => a.variant.localeCompare(b.variant));
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
