import Link from "next/link";
import {
  computeVariationScores,
  rollUpGroups,
  type VariationScore,
} from "@dreamplay/ab";
import { fetchAbTaggedEvents, type AnalyticsRange } from "@dreamplay/analytics/queries";
import { AB_SCORING, abFunnel } from "@/config/ab";
import { getAdminDb } from "@/lib/db";

/**
 * /admin/ab-tests — the A/B funnel score sheet (Decision D11).
 *
 * Registry is code (apps/web/src/config/ab.ts). Every variant-tagged event in
 * range is pulled and pushed through the point rules in AB_SCORING; variations
 * are ranked by average points per session, with group (layout family)
 * roll-ups. /main traffic is untagged by construction and never appears here.
 */

export const dynamic = "force-dynamic";

const RANGES: readonly AnalyticsRange[] = ["24h", "7d", "30d", "all"];

function fmt(n: number, digits = 0): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export default async function AdminAbTestsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range: AnalyticsRange = (RANGES as readonly string[]).includes(params.range ?? "")
    ? (params.range as AnalyticsRange)
    : "7d";

  let scores: VariationScore[] = [];
  let loadError: string | null = null;
  try {
    const rows = await fetchAbTaggedEvents(range, { client: getAdminDb() });
    scores = computeVariationScores(rows, AB_SCORING);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load A/B events.";
  }
  const scoreByVariant = new Map(scores.map((s) => [s.variant, s]));
  const groupScores = rollUpGroups(scores);

  const registryKeys = new Set<string>(
    abFunnel.groups.flatMap((g) => g.variations.map((v) => v.key))
  );
  // Variants with data but no registry entry (removed from config) still show.
  const retired = scores.filter((s) => !registryKeys.has(s.variant));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">A/B Score Sheet</h1>
          <p className="font-sans text-sm text-white/40 mt-1">
            Registry is code (apps/web/src/config/ab.ts) · /main is excluded by design ·{" "}
            preview any variation at <code className="text-white/60">/ab/&lt;key&gt;</code>
          </p>
        </div>
        <nav className="flex gap-2">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/ab-tests?range=${r}`}
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
        <div className="border border-red-500/30 bg-red-500/10 p-6 font-sans text-sm text-red-300 mb-8">
          Could not load A/B results: {loadError}
        </div>
      ) : null}

      {/* Group leaderboard */}
      <section className="border border-white/10 bg-white/[0.03] p-6 mb-8">
        <h2 className="font-serif text-xl mb-4">Layout groups</h2>
        <table className="w-full font-sans text-sm">
          <thead>
            <tr className="text-left text-white/40 text-xs uppercase tracking-widest">
              <th className="pb-2 font-normal">Group</th>
              <th className="pb-2 font-normal">Layout family</th>
              <th className="pb-2 font-normal text-right">Sessions</th>
              <th className="pb-2 font-normal text-right">Total points</th>
              <th className="pb-2 font-normal text-right">Avg pts / session</th>
            </tr>
          </thead>
          <tbody>
            {abFunnel.groups.map((group) => {
              const rolled = groupScores.find((g) => g.group === group.group);
              return (
                <tr key={group.group} className="border-t border-white/5">
                  <td className="py-2 text-white/80">
                    <code>{group.group}</code>
                    {!group.active ? (
                      <span className="ml-2 px-2 py-0.5 text-[10px] uppercase tracking-widest border border-white/20 text-white/50">
                        off
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2 text-white/60">{group.name}</td>
                  <td className="py-2 text-right text-white/60">{fmt(rolled?.sessions ?? 0)}</td>
                  <td className="py-2 text-right text-white/60">{fmt(rolled?.totalPoints ?? 0)}</td>
                  <td className="py-2 text-right text-white/80">{fmt(rolled?.avgPoints ?? 0, 1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Per-variation score sheet */}
      <section className="border border-white/10 bg-white/[0.03] p-6 mb-8 overflow-x-auto">
        <h2 className="font-serif text-xl mb-1">Variations</h2>
        <p className="font-sans text-xs text-white/40 mb-4">
          Points per session (capped per rule), summed across sessions. Ranked by avg points per
          session.
        </p>
        <table className="w-full font-sans text-sm min-w-[900px]">
          <thead>
            <tr className="text-left text-white/40 text-xs uppercase tracking-widest">
              <th className="pb-2 font-normal">Variation</th>
              <th className="pb-2 font-normal text-right">Sessions</th>
              {AB_SCORING.map((rule) => (
                <th key={rule.key} className="pb-2 font-normal text-right" title={rule.key}>
                  {rule.label}
                </th>
              ))}
              <th className="pb-2 font-normal text-right">Total</th>
              <th className="pb-2 font-normal text-right">Avg / session</th>
            </tr>
          </thead>
          <tbody>
            {abFunnel.groups.flatMap((group) =>
              group.variations.map((variation) => {
                const score = scoreByVariant.get(variation.key);
                const inactive = !group.active || !variation.active;
                return (
                  <tr key={variation.key} className="border-t border-white/5 align-top">
                    <td className="py-2 text-white/80">
                      <code>{variation.key}</code>
                      {inactive ? (
                        <span className="ml-2 px-2 py-0.5 text-[10px] uppercase tracking-widest border border-white/20 text-white/50">
                          off
                        </span>
                      ) : null}
                      <div className="text-white/35 text-xs">
                        {variation.label ?? group.name} · {variation.route} → {variation.cta}
                      </div>
                    </td>
                    <td className="py-2 text-right text-white/60">{fmt(score?.sessions ?? 0)}</td>
                    {AB_SCORING.map((rule) => {
                      const rs = score?.rules[rule.key];
                      return (
                        <td key={rule.key} className="py-2 text-right text-white/60">
                          {fmt(rs?.points ?? 0)}
                          <div className="text-white/25 text-[10px]">
                            {rule.kind === "duration"
                              ? `${fmt(rs?.raw ?? 0)}s`
                              : `×${fmt(rs?.raw ?? 0)}`}
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-2 text-right text-white/80">{fmt(score?.totalPoints ?? 0)}</td>
                    <td className="py-2 text-right text-white/90 font-medium">
                      {fmt(score?.avgPoints ?? 0, 1)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      {retired.length > 0 ? (
        <section className="border border-white/10 bg-white/[0.03] p-6">
          <h2 className="font-serif text-xl mb-4">Retired variants (data without registry entry)</h2>
          <table className="w-full font-sans text-sm">
            <thead>
              <tr className="text-left text-white/40 text-xs uppercase tracking-widest">
                <th className="pb-2 font-normal">Variant</th>
                <th className="pb-2 font-normal text-right">Sessions</th>
                <th className="pb-2 font-normal text-right">Total points</th>
                <th className="pb-2 font-normal text-right">Avg / session</th>
              </tr>
            </thead>
            <tbody>
              {retired.map((score) => (
                <tr key={score.variant} className="border-t border-white/5">
                  <td className="py-2 text-white/80">
                    <code>{score.variant}</code>
                  </td>
                  <td className="py-2 text-right text-white/60">{fmt(score.sessions)}</td>
                  <td className="py-2 text-right text-white/60">{fmt(score.totalPoints)}</td>
                  <td className="py-2 text-right text-white/80">{fmt(score.avgPoints, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}
