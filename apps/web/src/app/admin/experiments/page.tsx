import Link from "next/link";
import { revalidatePath } from "next/cache";
import { getVariantResults, type AnalyticsRange, type VariantResult } from "@dreamplay/analytics/queries";
import { syncExperimentsToDb } from "@dreamplay/ab/sync";
import type { Experiment } from "@dreamplay/ab";
import { experiments } from "@/config/experiments";
import { getAdminDb } from "@/lib/db";
import { CONVERSION_EVENTS } from "@/lib/admin-analytics";

/**
 * /admin/experiments — the registry (source of truth, code) with per-variant
 * results read from event metadata (ab_experiments / ab_variant) via
 * getVariantResults. "Sync to DB" mirrors the registry into the experiments
 * table (names/status/definitions for dashboards & history).
 */

export const dynamic = "force-dynamic";

const RANGES: readonly AnalyticsRange[] = ["24h", "7d", "30d"];

// Widen from the registry's exact literal type so optional fields
// (forcedVariant, geoPools) and both path-matcher shapes are addressable.
const registry: readonly Experiment[] = experiments;

interface ExperimentDbRow {
  key: string;
  status: string;
  started_at: string | null;
  concluded_at: string | null;
  updated_at: string;
}

async function syncToDbAction() {
  "use server";
  await syncExperimentsToDb(experiments, { client: getAdminDb() });
  revalidatePath("/admin/experiments");
}

function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export default async function AdminExperimentsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range: AnalyticsRange = (RANGES as readonly string[]).includes(params.range ?? "")
    ? (params.range as AnalyticsRange)
    : "7d";

  const resultsByKey = new Map<string, VariantResult[]>();
  const dbRowsByKey = new Map<string, ExperimentDbRow>();
  let loadError: string | null = null;

  try {
    const client = getAdminDb();
    const [allResults, dbRows] = await Promise.all([
      Promise.all(
        registry.map((exp) =>
          getVariantResults(exp.key, range, {
            client,
            conversionEvents: CONVERSION_EVENTS,
          })
        )
      ),
      client
        .from("experiments")
        .select("key, status, started_at, concluded_at, updated_at")
        .in("key", registry.map((e) => e.key)),
    ]);
    registry.forEach((exp, i) => resultsByKey.set(exp.key, allResults[i] ?? []));
    for (const row of dbRows.data ?? []) dbRowsByKey.set(row.key, row);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load experiment results.";
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Experiments</h1>
          <p className="font-sans text-sm text-white/40 mt-1">
            Registry is code (apps/web/src/config/experiments.ts) · conversions:{" "}
            {CONVERSION_EVENTS.join(", ")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <nav className="flex gap-2">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={`/admin/experiments?range=${r}`}
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
          <form action={syncToDbAction}>
            <button
              type="submit"
              className="px-4 py-2 font-sans text-xs uppercase tracking-widest border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 transition-colors cursor-pointer"
            >
              Sync to DB
            </button>
          </form>
        </div>
      </div>

      {loadError ? (
        <div className="border border-red-500/30 bg-red-500/10 p-6 font-sans text-sm text-red-300 mb-8">
          Could not load experiment results: {loadError}
        </div>
      ) : null}

      <div className="space-y-8">
        {registry.map((exp) => {
          const results = resultsByKey.get(exp.key) ?? [];
          const dbRow = dbRowsByKey.get(exp.key);
          // Show a row for every registry variant, even before any exposures.
          const rows = exp.variants.map((variant) => {
            const result = results.find((r) => r.variant === variant.key);
            return {
              key: variant.key,
              label: variant.label,
              exposures: result?.exposures ?? 0,
              conversions: result?.conversions ?? 0,
              conversionRate: result?.conversionRate ?? 0,
              events: result?.events ?? 0,
            };
          });

          return (
            <section key={exp.key} className="border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
                <h2 className="font-serif text-xl">{exp.name}</h2>
                <span
                  className={`px-3 py-1 font-sans text-[10px] uppercase tracking-widest border ${
                    exp.status === "running"
                      ? "border-emerald-500/40 text-emerald-300"
                      : "border-white/20 text-white/50"
                  }`}
                >
                  {exp.status}
                </span>
              </div>
              <p className="font-sans text-xs text-white/40 mb-4">
                key <code className="text-white/60">{exp.key}</code> · cookie{" "}
                <code className="text-white/60">ab_{exp.key}</code> · paths{" "}
                {exp.paths.map((p) => `${p.path}${p.type === "prefix" ? "/*" : ""}`).join(", ")}
                {exp.forcedVariant ? (
                  <>
                    {" "}
                    · forced <code className="text-white/60">{exp.forcedVariant}</code>
                  </>
                ) : null}
                {" · "}
                {dbRow ? (
                  <>
                    synced to DB{" "}
                    {new Date(dbRow.updated_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </>
                ) : (
                  <span className="text-amber-300/80">not synced to DB yet</span>
                )}
              </p>

              <table className="w-full font-sans text-sm">
                <thead>
                  <tr className="text-left text-white/40 text-xs uppercase tracking-widest">
                    <th className="pb-2 font-normal">Variant</th>
                    <th className="pb-2 font-normal text-right">Exposures</th>
                    <th className="pb-2 font-normal text-right">Conversions</th>
                    <th className="pb-2 font-normal text-right">Rate</th>
                    <th className="pb-2 font-normal text-right">Events</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key} className="border-t border-white/5">
                      <td className="py-2 text-white/80">
                        <code>{row.key}</code>
                        {row.label ? <span className="text-white/35"> — {row.label}</span> : null}
                      </td>
                      <td className="py-2 text-right text-white/60">{row.exposures.toLocaleString()}</td>
                      <td className="py-2 text-right text-white/60">{row.conversions.toLocaleString()}</td>
                      <td className="py-2 text-right text-white/80">{formatRate(row.conversionRate)}</td>
                      <td className="py-2 text-right text-white/40">{row.events.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          );
        })}
      </div>
    </div>
  );
}
