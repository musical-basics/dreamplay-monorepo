import Link from "next/link";
import type { AnalyticsRange } from "@dreamplay/analytics/queries";
import { getExcludedIps } from "@/lib/admin-analytics";
import { getVisitsOverview, type VisitorsOverview } from "@/lib/admin-visitors";
import { getAdminDb } from "@/lib/db";

/**
 * /admin/visitors — the legacy analytics dashboard's "Visitors" tab, rebuilt
 * on the unified events table: one row per visit (session) with IP, email,
 * geo, device, entry source, A/B variant, pages visited, time spent, clicks
 * and bounce. Click a row for the full event journey.
 */

export const dynamic = "force-dynamic";

const RANGES: readonly AnalyticsRange[] = ["24h", "7d", "30d"];

function fmtDuration(seconds: number): string {
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AdminVisitorsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; admins?: string }>;
}) {
  const params = await searchParams;
  const range: AnalyticsRange = (RANGES as readonly string[]).includes(params.range ?? "")
    ? (params.range as AnalyticsRange)
    : "7d";
  const includeAdmin = params.admins === "1";

  let overview: VisitorsOverview | null = null;
  let loadError: string | null = null;
  try {
    const client = getAdminDb();
    const excludeIps = await getExcludedIps(client);
    overview = await getVisitsOverview(client, range, { includeAdmin, excludeIps });
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load visits.";
  }

  const query = (r: AnalyticsRange, admins: boolean) =>
    `/admin/visitors?range=${r}${admins ? "&admins=1" : ""}`;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Visitors</h1>
          <p className="font-sans text-sm text-white/40 mt-1">
            One row per visit (session) · newest first · click a row for the full journey
          </p>
        </div>
        <div className="flex items-center gap-2">
          <nav className="flex gap-2">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={query(r, includeAdmin)}
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
          <Link
            href={query(range, !includeAdmin)}
            className={`px-4 py-2 font-sans text-xs uppercase tracking-widest border transition-colors ${
              includeAdmin
                ? "border-amber-400/60 text-amber-300"
                : "border-white/20 text-white/60 hover:border-white/50 hover:text-white"
            }`}
          >
            {includeAdmin ? "Admin/bot traffic: shown" : "Admin/bot traffic: hidden"}
          </Link>
        </div>
      </div>

      {loadError ? (
        <div className="border border-red-500/30 bg-red-500/10 p-6 font-sans text-sm text-red-300 mb-8">
          Could not load visits: {loadError}
        </div>
      ) : null}

      {overview ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 font-sans">
            {[
              { label: "Visits", value: overview.totalVisits.toLocaleString() },
              { label: "Bounce rate", value: `${(overview.bounceRate * 100).toFixed(0)}%` },
              { label: "Avg time / visit", value: fmtDuration(overview.avgSeconds) },
              { label: "Shown", value: overview.visits.length.toLocaleString() },
            ].map((stat) => (
              <div key={stat.label} className="border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-widest text-white/40">{stat.label}</p>
                <p className="font-serif text-2xl mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          {overview.truncated ? (
            <p className="font-sans text-xs text-amber-300/80 mb-4">
              Row scan hit its cap for this range — the oldest visits in range may be missing.
            </p>
          ) : null}

          <section className="border border-white/10 bg-white/[0.03] p-6 overflow-x-auto">
            <table className="w-full font-sans text-sm min-w-[1000px]">
              <thead>
                <tr className="text-left text-white/40 text-xs uppercase tracking-widest">
                  <th className="pb-2 font-normal">Last seen</th>
                  <th className="pb-2 font-normal">IP / who</th>
                  <th className="pb-2 font-normal">Where</th>
                  <th className="pb-2 font-normal">Device</th>
                  <th className="pb-2 font-normal">A/B</th>
                  <th className="pb-2 font-normal">Pages visited</th>
                  <th className="pb-2 font-normal text-right">Views</th>
                  <th className="pb-2 font-normal text-right">Time</th>
                  <th className="pb-2 font-normal text-right">Clicks</th>
                  <th className="pb-2 font-normal">Source</th>
                </tr>
              </thead>
              <tbody>
                {overview.visits.map((visit) => (
                  <tr key={visit.sessionId} className="border-t border-white/5 align-top">
                    <td className="py-2 whitespace-nowrap text-white/60">
                      <Link
                        href={`/admin/visitors/${encodeURIComponent(visit.sessionId)}`}
                        className="hover:text-white underline decoration-white/20"
                      >
                        {fmtWhen(visit.lastSeen)}
                      </Link>
                      {visit.bounced && visit.pageviews > 0 ? (
                        <span className="ml-2 px-1.5 py-0.5 text-[10px] uppercase tracking-widest border border-white/15 text-white/40">
                          bounce
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 text-white/80">
                      <code className="text-xs">{visit.ip ?? "unknown"}</code>
                      {visit.isAdmin ? (
                        <span className="ml-2 px-1.5 py-0.5 text-[10px] uppercase tracking-widest border border-amber-400/40 text-amber-300">
                          admin
                        </span>
                      ) : null}
                      {visit.isBot ? (
                        <span className="ml-2 px-1.5 py-0.5 text-[10px] uppercase tracking-widest border border-white/20 text-white/50">
                          bot
                        </span>
                      ) : null}
                      {visit.email ? (
                        <div className="text-xs text-emerald-300/90">{visit.email}</div>
                      ) : null}
                    </td>
                    <td className="py-2 text-white/60 whitespace-nowrap">
                      {[visit.city, visit.country].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="py-2 text-white/60">{visit.device}</td>
                    <td className="py-2 text-white/60">
                      {visit.abVariant ? <code>{visit.abVariant}</code> : "—"}
                    </td>
                    <td className="py-2 text-white/60 max-w-[320px]">
                      <span className="break-words">{visit.pages.join(" → ") || "—"}</span>
                    </td>
                    <td className="py-2 text-right text-white/60">{visit.pageviews}</td>
                    <td className="py-2 text-right text-white/60 whitespace-nowrap">
                      {fmtDuration(visit.totalSeconds)}
                    </td>
                    <td className="py-2 text-right text-white/60">{visit.clicks}</td>
                    <td className="py-2 text-white/40 max-w-[220px] truncate" title={visit.source ?? ""}>
                      {visit.source ?? "direct"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {overview.visits.length === 0 ? (
              <p className="font-sans text-sm text-white/40 mt-4">No visits in this range.</p>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
