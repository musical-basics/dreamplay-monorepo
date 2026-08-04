import {
  computeVariationScores,
  rollUpGroups,
  type ComputeScoresOptions,
  type GroupScore,
  type ScoringRule,
  type VariationScore,
} from "@dreamplay/ab";
import { fetchAbTaggedEventsBetween, type QueryOptions } from "@dreamplay/analytics/queries";
import { previousNyCalendarDay, trailing7NyCalendarDays, type ReportWindow } from "./date-windows";

export interface AbReportSection {
  window: ReportWindow;
  groupScores: GroupScore[];
  variationScores: VariationScore[];
}

export interface AbReportData {
  generatedAt: string;
  yesterday: AbReportSection;
  trailing7Days: AbReportSection;
}

async function buildSection(
  window: ReportWindow,
  rules: readonly ScoringRule[],
  opts: QueryOptions,
  scoreOpts: ComputeScoresOptions
): Promise<AbReportSection> {
  const rows = await fetchAbTaggedEventsBetween(window.startIso, window.endIso, opts);
  const variationScores = computeVariationScores(rows, rules, scoreOpts);
  return { window, groupScores: rollUpGroups(variationScores), variationScores };
}

/**
 * Builds both report windows (previous NY calendar day + trailing 7 NY
 * calendar days) as of `asOf`. Two independent queries — the 7-day window is
 * NOT a rollup of daily fetches, so it can't drift from the 7d range shown on
 * /admin/ab-tests.
 */
export async function buildAbReportData(
  asOf: Date,
  rules: readonly ScoringRule[],
  opts: QueryOptions = {},
  scoreOpts: ComputeScoresOptions = {}
): Promise<AbReportData> {
  const [yesterday, trailing7Days] = await Promise.all([
    buildSection(previousNyCalendarDay(asOf), rules, opts, scoreOpts),
    buildSection(trailing7NyCalendarDays(asOf), rules, opts, scoreOpts),
  ]);
  return { generatedAt: asOf.toISOString(), yesterday, trailing7Days };
}
