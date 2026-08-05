/**
 * Per-visit aggregation for /admin/visitors — the port of the legacy
 * dreamplay-analytics "Visitors" tab (stats-v2): who came, from which IP,
 * what they looked at, how long they stayed, whether they bounced.
 *
 * A "visit" here is a session (dp_session_id) — the unit every event already
 * carries — rather than the legacy IP+email key; the IP (and email when the
 * ingest enrichment resolved one) is displayed per row. Admin/bot traffic is
 * excluded by default via the settings IP lists + ingest flags, with an
 * include toggle for debugging your own visits.
 *
 * Admin client only — never import from client components.
 */

import { rangeStartIso, type AnalyticsRange } from "@dreamplay/analytics/queries";
import type { AdminClient, Json } from "@dreamplay/db";
import { buildIpMatcher } from "./admin-analytics";

export interface VisitSummary {
  sessionId: string;
  ip: string | null;
  email: string | null;
  country: string | null;
  city: string | null;
  device: "Desktop" | "Mobile" | "Tablet" | "Bot" | "Unknown";
  /** Oldest non-internal traffic source seen (utm_* string or referrer URL). */
  source: string | null;
  abVariant: string | null;
  /** Distinct pages viewed, in first-seen order. */
  pages: string[];
  pageviews: number;
  totalSeconds: number;
  clicks: number;
  events: number;
  firstSeen: string;
  lastSeen: string;
  bounced: boolean;
  isAdmin: boolean;
  isBot: boolean;
}

export interface VisitorsOverview {
  visits: VisitSummary[];
  totalVisits: number;
  bounceRate: number;
  avgSeconds: number;
  /** True when the row scan hit maxRows — oldest visits in range may be missing. */
  truncated: boolean;
}

function classifyDevice(ua: string | null): VisitSummary["device"] {
  if (!ua) return "Unknown";
  if (/bot|crawl|spider|slurp|facebookexternalhit|Twitterbot|LinkedInBot/i.test(ua)) return "Bot";
  if (/iPad|tablet|Kindle|Silk|PlayBook/i.test(ua)) return "Tablet";
  if (/Mobile|iPhone|iPod|Android.*Mobile|webOS|BlackBerry|Opera Mini|IEMobile/i.test(ua)) return "Mobile";
  return "Desktop";
}

function metaOf(metadata: Json): Record<string, unknown> {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? (metadata as Record<string, unknown>)
    : {};
}

function sourceOf(meta: Record<string, unknown>): string | null {
  if (typeof meta.utm_source === "string" && meta.utm_source) {
    let src = `utm_source=${meta.utm_source}`;
    if (typeof meta.utm_medium === "string" && meta.utm_medium) src += `&utm_medium=${meta.utm_medium}`;
    if (typeof meta.utm_campaign === "string" && meta.utm_campaign) src += `&utm_campaign=${meta.utm_campaign}`;
    return src;
  }
  if (typeof meta.sid === "string" && meta.sid) return "email link";
  if (typeof meta.referrer === "string" && meta.referrer) {
    try {
      const url = new URL(meta.referrer);
      return url.hostname.includes("dreamplaypianos.com") ? null : meta.referrer;
    } catch {
      return meta.referrer;
    }
  }
  return null;
}

export interface VisitorsOptions {
  /** Include rows from admin/bot IPs (debugging your own visits). */
  includeAdmin?: boolean;
  /** Admin+bot IP lists (from getExcludedIps) applied when excluding. */
  excludeIps?: readonly string[];
  visitLimit?: number;
  maxRows?: number;
}

export async function getVisitsOverview(
  client: AdminClient,
  range: AnalyticsRange,
  opts: VisitorsOptions = {}
): Promise<VisitorsOverview> {
  const startIso = rangeStartIso(range);
  const isExcludedIp = buildIpMatcher(opts.excludeIps ?? []);
  const visitLimit = opts.visitLimit ?? 200;
  const maxRows = opts.maxRows ?? 30_000;
  const pageSize = 1000;

  const visits = new Map<string, VisitSummary>();
  let scanned = 0;
  let truncated = false;

  // Newest-first so the most recent visits fill in before any truncation.
  for (let offset = 0; offset < maxRows; offset += pageSize) {
    const { data, error } = await client
      .from("events")
      .select(
        "created_at, event_name, path, session_id, ip_address, country, city, user_agent, email, duration_seconds, metadata"
      )
      .gte("created_at", startIso)
      .order("id", { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(`getVisitsOverview failed: ${error.message}`);
    const rows = data ?? [];
    scanned += rows.length;

    for (const row of rows) {
      if (!row.session_id) continue;
      const meta = metaOf(row.metadata);
      const isAdmin = meta.is_admin === true || isExcludedIp(row.ip_address);
      const isBot = meta.is_bot === true;
      if (!opts.includeAdmin && (isAdmin || isBot)) continue;

      let visit = visits.get(row.session_id);
      if (!visit) {
        visit = {
          sessionId: row.session_id,
          ip: row.ip_address,
          email: row.email,
          country: row.country,
          city: row.city,
          device: classifyDevice(row.user_agent),
          source: null,
          abVariant: typeof meta.ab_variant === "string" ? meta.ab_variant : null,
          pages: [],
          pageviews: 0,
          totalSeconds: 0,
          clicks: 0,
          events: 0,
          firstSeen: row.created_at,
          lastSeen: row.created_at,
          bounced: false,
          isAdmin,
          isBot,
        };
        visits.set(row.session_id, visit);
      }

      visit.events += 1;
      // Rows arrive newest-first: lastSeen was set on first sight; keep
      // pushing firstSeen (and the entry source/first pages) older.
      visit.firstSeen = row.created_at;
      visit.email ??= row.email;
      visit.ip ??= row.ip_address;
      visit.abVariant ??= typeof meta.ab_variant === "string" ? meta.ab_variant : null;
      const source = sourceOf(meta);
      if (source) visit.source = source; // oldest wins (keeps overwriting)

      if (row.event_name === "pageview" && row.path) {
        visit.pageviews += 1;
        const path = row.path.split("?")[0] || row.path;
        // /ab and /main serve their layout via rewrite (URL unchanged), so
        // annotate the trail with what was actually rendered there.
        const rowVariant = typeof meta.ab_variant === "string" ? meta.ab_variant : null;
        const label =
          (path === "/ab" || path.startsWith("/ab/")) && rowVariant
            ? `/ab[${rowVariant}]`
            : path;
        // Building newest→oldest; unshift so pages end up in visit order.
        if (!visit.pages.includes(label)) visit.pages.unshift(label);
      }
      if (row.event_name === "page_leave") {
        const dur = Number(row.duration_seconds ?? 0);
        if (Number.isFinite(dur) && dur > 0 && dur < 3600) visit.totalSeconds += dur;
        const clicks = Number(meta.click_count ?? 0);
        if (Number.isFinite(clicks) && clicks > 0) visit.clicks += clicks;
      }
    }

    if (rows.length < pageSize) break;
    if (scanned >= maxRows) truncated = true;
  }

  const all = [...visits.values()];
  for (const visit of all) visit.bounced = visit.pageviews <= 1;

  const withPageviews = all.filter((v) => v.pageviews > 0);
  const bounces = withPageviews.filter((v) => v.bounced).length;
  const totalSeconds = withPageviews.reduce((sum, v) => sum + v.totalSeconds, 0);

  const sorted = all.sort(
    (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
  );

  return {
    visits: sorted.slice(0, visitLimit),
    totalVisits: all.length,
    bounceRate: withPageviews.length > 0 ? bounces / withPageviews.length : 0,
    avgSeconds: withPageviews.length > 0 ? totalSeconds / withPageviews.length : 0,
    truncated,
  };
}
