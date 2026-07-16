import Link from "next/link";
import { getSummary, type AnalyticsRange } from "@dreamplay/analytics/queries";
import { getAdminDb } from "@/lib/db";
import {
  getRecentPurchases,
  getTopPages,
  parseSummary,
  type AnalyticsSummary,
  type TopPage,
} from "@/lib/admin-analytics";
import type { EventRow } from "@dreamplay/analytics/queries";
import { TrafficChart } from "./TrafficChart";

/**
 * /admin/analytics — replaces data.dreamplaypianos.com (Phase 3 task 6).
 * Server component: headline numbers + chart series come from the
 * get_analytics_summary Postgres RPC (via @dreamplay/analytics/queries);
 * top pages / recent purchases from the paged helpers in lib/admin-analytics.
 */

export const dynamic = "force-dynamic";

const RANGES: readonly AnalyticsRange[] = ["24h", "7d", "30d"];

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border border-white/10 bg-white/[0.03] p-5">
      <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-white/45 mb-2">{label}</p>
      <p className="font-serif text-3xl text-white">{value}</p>
      {hint ? <p className="font-sans text-xs text-white/35 mt-1">{hint}</p> : null}
    </div>
  );
}

function purchaseSummary(row: EventRow): { order: string; total: string; source: string } {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  const order =
    typeof meta.order_number === "string" || typeof meta.order_number === "number"
      ? String(meta.order_number)
      : "—";
  const total =
    typeof meta.total_price === "string" || typeof meta.total_price === "number"
      ? String(meta.total_price)
      : "—";
  const source = typeof meta.checkout_source === "string" ? meta.checkout_source : "—";
  return { order, total, source };
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range: AnalyticsRange = (RANGES as readonly string[]).includes(params.range ?? "")
    ? (params.range as AnalyticsRange)
    : "7d";

  let summary: AnalyticsSummary | null = null;
  let topPages: TopPage[] = [];
  let purchases: EventRow[] = [];
  let loadError: string | null = null;

  try {
    const client = getAdminDb();
    const [summaryJson, pages, recent] = await Promise.all([
      getSummary(range, { client }),
      getTopPages(client, range),
      getRecentPurchases(client),
    ]);
    summary = parseSummary(summaryJson);
    topPages = pages;
    purchases = recent;
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load analytics.";
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Analytics</h1>
          <p className="font-sans text-sm text-white/40 mt-1">
            Unified events table · bots flagged at ingest
          </p>
        </div>
        {/* Range picker via searchParams */}
        <nav className="flex gap-2">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/analytics?range=${r}`}
              className={`px-4 py-2 font-sans text-xs uppercase tracking-widest border transition-colors ${
                r === range
                  ? "border-white bg-white text-black"
                  : "border-white/20 text-white/60 hover:border-white/50 hover:text-white"
              }`}
            >
              {r}
            </Link>
          ))}
        </nav>
      </div>

      {loadError ? (
        <div className="border border-red-500/30 bg-red-500/10 p-6 font-sans text-sm text-red-300">
          Could not load analytics: {loadError}
        </div>
      ) : summary ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Live users" value={String(summary.live_users)} hint="last 5 minutes" />
            <StatCard label="Pageviews" value={summary.total_pageviews.toLocaleString()} hint={range} />
            <StatCard label="Unique visitors" value={summary.unique_visitors.toLocaleString()} hint={range} />
            <StatCard label="Unique pages" value={summary.unique_pages.toLocaleString()} hint={range} />
          </div>

          {/* Time series */}
          <section className="border border-white/10 bg-white/[0.03] p-6 mb-8">
            <h2 className="font-sans text-xs uppercase tracking-[0.25em] text-white/45 mb-4">
              Visitors &amp; pageviews over time
            </h2>
            <TrafficChart data={summary.chart_data} />
          </section>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Top pages */}
            <section className="border border-white/10 bg-white/[0.03] p-6">
              <h2 className="font-sans text-xs uppercase tracking-[0.25em] text-white/45 mb-4">
                Top pages ({range})
              </h2>
              {topPages.length === 0 ? (
                <p className="font-sans text-sm text-white/40">No pageviews in this range yet.</p>
              ) : (
                <table className="w-full font-sans text-sm">
                  <thead>
                    <tr className="text-left text-white/40 text-xs uppercase tracking-widest">
                      <th className="pb-2 font-normal">Path</th>
                      <th className="pb-2 font-normal text-right">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPages.map((page) => (
                      <tr key={page.path} className="border-t border-white/5">
                        <td className="py-2 text-white/80 truncate max-w-[18rem]">{page.path}</td>
                        <td className="py-2 text-right text-white/60">{page.views.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* Recent purchases */}
            <section className="border border-white/10 bg-white/[0.03] p-6">
              <h2 className="font-sans text-xs uppercase tracking-[0.25em] text-white/45 mb-4">
                Recent purchases
              </h2>
              {purchases.length === 0 ? (
                <p className="font-sans text-sm text-white/40">
                  No purchase events yet (they arrive via the Shopify orders webhook).
                </p>
              ) : (
                <table className="w-full font-sans text-sm">
                  <thead>
                    <tr className="text-left text-white/40 text-xs uppercase tracking-widest">
                      <th className="pb-2 font-normal">When</th>
                      <th className="pb-2 font-normal">Order</th>
                      <th className="pb-2 font-normal">Email</th>
                      <th className="pb-2 font-normal text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((row) => {
                      const { order, total, source } = purchaseSummary(row);
                      return (
                        <tr key={row.id} className="border-t border-white/5">
                          <td className="py-2 text-white/60 whitespace-nowrap">
                            {new Date(row.created_at).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-2 text-white/80">
                            {order}
                            <span className="text-white/35"> · {source}</span>
                          </td>
                          <td className="py-2 text-white/60 truncate max-w-[10rem]">{row.email ?? "—"}</td>
                          <td className="py-2 text-right text-white/80">{total}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
