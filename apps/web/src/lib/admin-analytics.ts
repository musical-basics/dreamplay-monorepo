/**
 * Server-side helpers for the /admin dashboards (Phase 3 task 6 / Phase 4
 * task 5). Complements @dreamplay/analytics/queries with the two shapes the
 * get_analytics_summary RPC doesn't return (top pages, recent purchases) and
 * a defensive parser for the RPC's jsonb payload. (A/B scoring lives in
 * @dreamplay/ab + /admin/ab-tests, not here — Decision D11.)
 *
 * Admin client only — never import from client components.
 */

import { rangeStartIso, type AnalyticsRange, type EventRow } from "@dreamplay/analytics/queries";
import type { AdminClient, Json } from "@dreamplay/db";

/**
 * Combined admin_ips + bot_ips from the settings table — the exclusion lists
 * for every dashboard/score computation (legacy dreamplay-analytics parity:
 * filter at QUERY time by IP, so adding an IP retroactively cleans history).
 * Failure degrades to an empty list rather than breaking a dashboard.
 */
export async function getExcludedIps(client: AdminClient): Promise<string[]> {
  try {
    const { data } = await client
      .from("settings")
      .select("key, value")
      .in("key", ["admin_ips", "bot_ips"]);
    const ips: string[] = [];
    for (const row of data ?? []) {
      if (!Array.isArray(row.value)) continue;
      for (const entry of row.value) {
        if (typeof entry === "string" && entry.length > 0) ips.push(entry);
      }
    }
    return ips;
  } catch {
    return [];
  }
}

/** ::ffff:-mapped IPv6 equals its IPv4 form (legacy isAdminIP semantics). */
function normalizeIp(ip: string): string {
  return ip.replace(/^::ffff:/i, "").toLowerCase();
}

export function buildIpMatcher(excludeIps: readonly string[]): (ip: string | null) => boolean {
  const set = new Set(excludeIps.map(normalizeIp));
  return (ip) => ip !== null && ip !== "" && set.has(normalizeIp(ip));
}

// ---------------------------------------------------------------------------
// get_analytics_summary payload
// ---------------------------------------------------------------------------

export interface SummaryChartPoint {
  name: string;
  visitors: number;
  pageviews: number;
  unique_pages: number;
  avg_per_user: number;
}

export interface SummaryAbResult {
  variant: string;
  visitors: number;
  conversions: number;
  conversion_rate: number;
}

export interface AnalyticsSummary {
  live_users: number;
  total_pageviews: number;
  unique_visitors: number;
  unique_pages: number;
  chart_data: SummaryChartPoint[];
  ab_results: SummaryAbResult[];
}

function asNumber(value: Json | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function asString(value: Json | undefined): string {
  return typeof value === "string" ? value : "";
}

/** Defensive parse of the get_analytics_summary jsonb payload. */
export function parseSummary(json: Json): AnalyticsSummary {
  const obj = (json && typeof json === "object" && !Array.isArray(json) ? json : {}) as Record<
    string,
    Json | undefined
  >;
  const chartRaw = Array.isArray(obj.chart_data) ? obj.chart_data : [];
  const abRaw = Array.isArray(obj.ab_results) ? obj.ab_results : [];
  return {
    live_users: asNumber(obj.live_users),
    total_pageviews: asNumber(obj.total_pageviews),
    unique_visitors: asNumber(obj.unique_visitors),
    unique_pages: asNumber(obj.unique_pages),
    chart_data: chartRaw.map((row) => {
      const r = (row && typeof row === "object" && !Array.isArray(row) ? row : {}) as Record<
        string,
        Json | undefined
      >;
      return {
        name: asString(r.name),
        visitors: asNumber(r.visitors),
        pageviews: asNumber(r.pageviews),
        unique_pages: asNumber(r.unique_pages),
        avg_per_user: asNumber(r.avg_per_user),
      };
    }),
    ab_results: abRaw.map((row) => {
      const r = (row && typeof row === "object" && !Array.isArray(row) ? row : {}) as Record<
        string,
        Json | undefined
      >;
      return {
        variant: asString(r.variant),
        visitors: asNumber(r.visitors),
        conversions: asNumber(r.conversions),
        conversion_rate: asNumber(r.conversion_rate),
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// Top pages
// ---------------------------------------------------------------------------

export interface TopPage {
  path: string;
  views: number;
}

/**
 * Most-viewed paths in the range (pageview events, query string stripped).
 * Pages through narrow `path` projections with the same paginator pattern as
 * exportEvents; capped at `maxRows` so a traffic spike can't blow the request.
 */
export async function getTopPages(
  client: AdminClient,
  range: AnalyticsRange,
  excludeIps: readonly string[] = [],
  limit = 10,
  maxRows = 20_000
): Promise<TopPage[]> {
  const startIso = rangeStartIso(range);
  const isExcluded = buildIpMatcher(excludeIps);
  const counts = new Map<string, number>();
  const pageSize = 1000;
  for (let offset = 0; offset < maxRows; offset += pageSize) {
    const { data, error } = await client
      .from("events")
      .select("path, ip_address")
      .eq("event_name", "pageview")
      .gte("created_at", startIso)
      .order("id", { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(`getTopPages failed: ${error.message}`);
    const rows = data ?? [];
    for (const row of rows) {
      if (!row.path || isExcluded(row.ip_address)) continue;
      const path = row.path.split("?")[0] || row.path;
      counts.set(path, (counts.get(path) ?? 0) + 1);
    }
    if (rows.length < pageSize) break;
  }
  return [...counts.entries()]
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Recent purchases
// ---------------------------------------------------------------------------

/** Latest `purchase` events (emitted by the Shopify orders webhook). */
export async function getRecentPurchases(client: AdminClient, limit = 20): Promise<EventRow[]> {
  const { data, error } = await client
    .from("events")
    .select("*")
    .eq("event_name", "purchase")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getRecentPurchases failed: ${error.message}`);
  return data ?? [];
}
