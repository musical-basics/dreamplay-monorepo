import { formatRate, type CampaignStats } from "@/lib/campaign-stats";

/**
 * Per-campaign performance for the calendar, below the grid.
 *
 * Rates are unique-per-subscriber and bot-filtered, computed from
 * email_events rather than the campaigns.total_* counters (which lose
 * increments under concurrency). See lib/campaign-stats.ts.
 */

export interface PerformanceRow {
    id: string;
    topic: string;
    subject: string;
    date: string;
    stats: CampaignStats | null;
}

function money(usd: number): string {
    return usd.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function CampaignPerformance({ rows }: { rows: PerformanceRow[] }) {
    const totals = rows.reduce(
        (acc, r) => {
            if (!r.stats) return acc;
            acc.sent += r.stats.sent;
            acc.opens += r.stats.uniqueOpens;
            acc.clicks += r.stats.uniqueClicks;
            acc.orders += r.stats.attributedOrders;
            acc.revenue += r.stats.attributedRevenue;
            return acc;
        },
        { sent: 0, opens: 0, clicks: 0, orders: 0, revenue: 0 },
    );

    const anySent = totals.sent > 0;

    return (
        <section className="mt-12">
            <div className="flex items-baseline justify-between gap-4 mb-2">
                <h2 className="font-sans text-sm font-bold text-white">Performance</h2>
                {anySent && (
                    <p className="font-sans text-xs text-white/40">
                        {totals.sent} sent · {formatRate(totals.opens / totals.sent)} opened ·{" "}
                        {formatRate(totals.clicks / totals.sent)} clicked
                        {totals.orders > 0 && ` · ${totals.orders} orders, ${money(totals.revenue)}`}
                    </p>
                )}
            </div>
            <p className="font-sans text-xs text-white/35 mb-4 max-w-3xl leading-relaxed">
                Opens and clicks are unique people, not raw hits, with known scanners filtered out. Revenue is
                credited only when the buyer arrived through that email&apos;s link, so it undercounts rather than
                flatters.
            </p>

            {!anySent ? (
                <p className="font-sans text-sm text-white/40 border border-white/10 bg-white/[0.02] p-6">
                    Nothing has been sent yet, so there is nothing to measure. This table fills in per email once the
                    calendar starts going out.
                </p>
            ) : (
                <div className="overflow-x-auto border border-white/10">
                    <table className="w-full font-sans text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-[0.2em] text-white/40">
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3 text-right">Sent</th>
                                <th className="px-4 py-3 text-right">Opened</th>
                                <th className="px-4 py-3 text-right">Clicked</th>
                                <th className="px-4 py-3 text-right">Click / open</th>
                                <th className="px-4 py-3 text-right">Orders</th>
                                <th className="px-4 py-3 text-right">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => {
                                const s = r.stats;
                                const sent = s?.sent ?? 0;
                                return (
                                    <tr
                                        key={r.id}
                                        className={`border-b border-white/5 last:border-b-0 hover:bg-white/[0.03] ${
                                            sent === 0 ? "opacity-40" : ""
                                        }`}
                                    >
                                        <td className="px-4 py-3">
                                            <p className="text-white/90">{r.subject}</p>
                                            <p className="text-[12px] text-white/40">
                                                {r.date} · {r.topic}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 text-right text-white/70">{sent || "-"}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-white/90">{formatRate(s?.openRate ?? null)}</span>
                                            {sent > 0 && (
                                                <span className="text-white/35"> ({s?.uniqueOpens ?? 0})</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-white/90">{formatRate(s?.clickRate ?? null)}</span>
                                            {sent > 0 && (
                                                <span className="text-white/35"> ({s?.uniqueClicks ?? 0})</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right text-white/50">
                                            {formatRate(s?.clickToOpenRate ?? null)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-white/70">
                                            {s?.attributedOrders || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-right text-emerald-400">
                                            {s && s.attributedRevenue > 0 ? money(s.attributedRevenue) : "-"}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
