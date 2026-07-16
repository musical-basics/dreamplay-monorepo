"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SummaryChartPoint } from "@/lib/admin-analytics";

// Categorical slots 1+2 (dark-mode steps) — validated against this surface
// (CVD ΔE 27.3, normal ΔE 29.9, contrast >= 3:1). Identity is also carried by
// the legend, never color alone.
const VISITORS_COLOR = "#3987e5";
const PAGEVIEWS_COLOR = "#008300";
const SURFACE = "#0b0b0d";

/**
 * Visitors + pageviews over time (hourly buckets for 24h, daily otherwise —
 * bucketing is decided inside the get_analytics_summary RPC).
 */
export function TrafficChart({ data }: { data: SummaryChartPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center font-sans text-sm text-white/40">
        No traffic in this range yet.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={48}
          />
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.25)", strokeWidth: 1 }}
            contentStyle={{
              background: SURFACE,
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 4,
              fontSize: 12,
            }}
            labelStyle={{ color: "rgba(255,255,255,0.85)" }}
            itemStyle={{ color: "rgba(255,255,255,0.7)" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}
            iconType="plainline"
          />
          <Line
            type="monotone"
            dataKey="visitors"
            name="Visitors"
            stroke={VISITORS_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="pageviews"
            name="Pageviews"
            stroke={PAGEVIEWS_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
