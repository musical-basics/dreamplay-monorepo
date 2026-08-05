/**
 * A/B score engine — turns raw analytics event rows into per-variation point
 * scores (Decision D11). Pure functions, no I/O: the score sheet page fetches
 * rows from the `events` table and feeds them through here, and tests can
 * assert on synthetic rows.
 *
 * Model: every action a visitor takes has a point value reflecting how far
 * down the funnel it sits (a click is worth less than an email capture, which
 * is worth less than a purchase). Points accrue PER SESSION with per-rule
 * caps, then aggregate per variation, so one hyperactive session can't buy a
 * variation the leaderboard.
 */

import { variationGroup, type AbFunnelConfig } from "./funnel";

/**
 * Minimal projection of an `events` row needed for scoring. `metadata` is
 * deliberately loose (DB drivers type jsonb as a broad Json union); non-object
 * values are treated as empty.
 */
export interface ScoringEventRow {
  event_name: string;
  path?: string | null;
  session_id?: string | null;
  duration_seconds?: number | string | null;
  metadata?: unknown;
  /** Needed only when per-variation `since` cutoffs are in play. */
  created_at?: string | null;
  /** Needed only when `excludeIps` filtering is in play. */
  ip_address?: string | null;
}

export interface ComputeScoresOptions {
  /**
   * Per-variant "data since" cutoffs (ISO timestamps): rows for a variant
   * recorded before its cutoff are ignored. Built from the registry's
   * `variation.since` fields via variationSinceMap() — used when a key
   * changes meaning so stale data can't blend into the new test.
   */
  sinceByVariant?: Record<string, string>;
  /**
   * IPs whose rows are excluded (admin/bot lists from the settings table).
   * Query-time and therefore RETROACTIVE — unlike the ingest-time
   * is_admin/is_bot flags, this also catches events logged before an IP was
   * added to the list. IPv4-mapped IPv6 (::ffff:x.x.x.x) matches its IPv4
   * entry, per the legacy dreamplay-analytics isAdminIP semantics.
   */
  excludeIps?: readonly string[];
}

/** ::ffff:-mapped IPv6 equals its IPv4 form for exclusion purposes. */
function normalizeIp(ip: string): string {
  return ip.replace(/^::ffff:/i, "").toLowerCase();
}

/** Extract `{ variant: sinceIso }` for every variation that declares one. */
export function variationSinceMap(config: AbFunnelConfig): Record<string, string> {
  const map: Record<string, string> = {};
  for (const group of config.groups) {
    for (const variation of group.variations) {
      if (variation.since) map[variation.key] = variation.since;
    }
  }
  return map;
}

function metadataOf(row: ScoringEventRow): Record<string, unknown> {
  const meta = row.metadata;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return meta as Record<string, unknown>;
  }
  return {};
}

export type ScoringRule =
  | {
      kind: "once";
      key: string;
      label: string;
      /** event_name to match. */
      event: string;
      /** Optional path prefixes — e.g. count pageviews only on /checkout. */
      paths?: readonly string[];
      /** Awarded at most once per session. */
      points: number;
    }
  | {
      kind: "count";
      key: string;
      label: string;
      event: string;
      paths?: readonly string[];
      /** Awarded per occurrence, capped per session by maxPoints. */
      points: number;
      maxPoints?: number;
    }
  | {
      kind: "duration";
      key: string;
      label: string;
      /** Sums duration_seconds of matching events (usually page_leave). */
      event: string;
      paths?: readonly string[];
      /** Points per `unitSeconds` of accumulated time. */
      points: number;
      unitSeconds: number;
      maxPoints?: number;
    }
  | {
      kind: "clicks";
      key: string;
      label: string;
      /** Sums metadata.click_count of matching events (usually page_leave). */
      event: string;
      paths?: readonly string[];
      /** Points per `unitClicks` accumulated clicks. */
      points: number;
      unitClicks: number;
      maxPoints?: number;
    };

export interface RuleScore {
  /** Points contributed by this rule across all sessions. */
  points: number;
  /** Sessions that earned any credit from this rule. */
  sessions: number;
  /** Raw magnitude: occurrences (once/count), seconds (duration), clicks. */
  raw: number;
}

export interface VariationScore {
  variant: string;
  // Optional (not `string | undefined`) so the type survives a JSON
  // round-trip intact — Inngest step results are serialized between steps.
  group?: string | undefined;
  /** Distinct sessions that produced any tagged event. */
  sessions: number;
  totalPoints: number;
  /** totalPoints / sessions (0 when no sessions). */
  avgPoints: number;
  rules: Record<string, RuleScore>;
}

function matchesRule(rule: ScoringRule, row: ScoringEventRow): boolean {
  if (row.event_name !== rule.event) return false;
  if (rule.paths && rule.paths.length > 0) {
    const path = (row.path ?? "").split("?")[0] ?? "";
    if (!rule.paths.some((p) => path === p || path.startsWith(p + "/"))) return false;
  }
  return true;
}

function toNumber(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Aggregate tagged event rows into per-variation scores.
 *
 * Rows are attributed by `metadata.ab_variant`; untagged rows (the /main
 * funnel, plain site traffic) and rows flagged `is_bot`/`is_admin` are
 * skipped. Rows without a session_id (e.g. a webhook purchase where only the
 * variant survived the round-trip) each count as their own session so the
 * conversion is never dropped.
 */
export function computeVariationScores(
  rows: Iterable<ScoringEventRow>,
  rules: readonly ScoringRule[],
  opts: ComputeScoresOptions = {}
): VariationScore[] {
  // Pre-parse cutoffs once; invalid dates are ignored.
  const sinceMs = new Map<string, number>();
  for (const [variant, iso] of Object.entries(opts.sinceByVariant ?? {})) {
    const ms = Date.parse(iso);
    if (!Number.isNaN(ms)) sinceMs.set(variant, ms);
  }
  const excludedIps = new Set((opts.excludeIps ?? []).map(normalizeIp));

  // variant → session → per-rule accumulator (+ presence marker)
  const perVariant = new Map<string, Map<string, Map<string, number>>>();

  let anonymous = 0;
  for (const row of rows) {
    const meta = metadataOf(row);
    const variant = typeof meta["ab_variant"] === "string" ? (meta["ab_variant"] as string) : undefined;
    if (!variant) continue;
    if (meta["is_bot"] === true || meta["is_admin"] === true) continue;
    if (excludedIps.size > 0 && row.ip_address && excludedIps.has(normalizeIp(row.ip_address))) {
      continue; // admin/bot IP — excluded retroactively regardless of flags
    }
    const cutoff = sinceMs.get(variant);
    if (cutoff !== undefined && row.created_at) {
      const at = Date.parse(row.created_at);
      if (!Number.isNaN(at) && at < cutoff) continue; // pre-remap data for this key
    }

    const sessionKey = row.session_id || `__anon_${anonymous++}`;
    let sessions = perVariant.get(variant);
    if (!sessions) perVariant.set(variant, (sessions = new Map()));
    let accum = sessions.get(sessionKey);
    if (!accum) sessions.set(sessionKey, (accum = new Map()));

    for (const rule of rules) {
      if (!matchesRule(rule, row)) continue;
      const prev = accum.get(rule.key) ?? 0;
      switch (rule.kind) {
        case "once":
        case "count":
          accum.set(rule.key, prev + 1);
          break;
        case "duration":
          accum.set(rule.key, prev + toNumber(row.duration_seconds));
          break;
        case "clicks":
          accum.set(rule.key, prev + toNumber(meta["click_count"]));
          break;
      }
    }
  }

  const scores: VariationScore[] = [];
  for (const [variant, sessions] of perVariant) {
    const ruleScores: Record<string, RuleScore> = {};
    for (const rule of rules) ruleScores[rule.key] = { points: 0, sessions: 0, raw: 0 };

    for (const accum of sessions.values()) {
      for (const rule of rules) {
        const raw = accum.get(rule.key) ?? 0;
        if (raw <= 0) continue;
        let points: number;
        switch (rule.kind) {
          case "once":
            points = rule.points;
            break;
          case "count":
            points = raw * rule.points;
            break;
          case "duration":
            points = Math.floor(raw / rule.unitSeconds) * rule.points;
            break;
          case "clicks":
            points = Math.floor(raw / rule.unitClicks) * rule.points;
            break;
        }
        if (rule.kind !== "once" && rule.maxPoints !== undefined) {
          points = Math.min(points, rule.maxPoints);
        }
        const entry = ruleScores[rule.key] as RuleScore;
        entry.raw += raw;
        if (points > 0) {
          entry.points += points;
          entry.sessions += 1;
        }
      }
    }

    const totalPoints = Object.values(ruleScores).reduce((sum, r) => sum + r.points, 0);
    const sessionCount = sessions.size;
    scores.push({
      variant,
      group: variationGroup(variant),
      sessions: sessionCount,
      totalPoints,
      avgPoints: sessionCount > 0 ? totalPoints / sessionCount : 0,
      rules: ruleScores,
    });
  }

  // Leaderboard order: average points per session, then volume.
  scores.sort((a, b) => b.avgPoints - a.avgPoints || b.sessions - a.sessions);
  return scores;
}

export interface GroupScore {
  group: string;
  sessions: number;
  totalPoints: number;
  avgPoints: number;
  variants: string[];
}

/** Roll variation scores up to their layout group (1a+1b+1c → group 1). */
export function rollUpGroups(scores: readonly VariationScore[]): GroupScore[] {
  const groups = new Map<string, GroupScore>();
  for (const score of scores) {
    const key = score.group ?? "?";
    let entry = groups.get(key);
    if (!entry) {
      groups.set(key, (entry = { group: key, sessions: 0, totalPoints: 0, avgPoints: 0, variants: [] }));
    }
    entry.sessions += score.sessions;
    entry.totalPoints += score.totalPoints;
    entry.variants.push(score.variant);
  }
  for (const entry of groups.values()) {
    entry.avgPoints = entry.sessions > 0 ? entry.totalPoints / entry.sessions : 0;
    entry.variants.sort();
  }
  return [...groups.values()].sort((a, b) => b.avgPoints - a.avgPoints || b.sessions - a.sessions);
}
