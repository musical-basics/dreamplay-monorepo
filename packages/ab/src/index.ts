/**
 * @dreamplay/ab — the A/B funnel (Decision D11): layout groups × variations
 * behind /ab, a manually-pinned /main outside the test, and a point-based
 * score engine.
 *
 * Entry points:
 *   "."       — funnel registry, router, cookie readers, scoring (this file;
 *               everything here is edge-safe)
 *   "./react" — <AbFunnelProvider/>, useAbVariation(), useAbCta()
 *
 * See README.md for the runbook.
 */

export {
  defineAbFunnel,
  resolveFunnel,
  findVariation,
  activeVariations,
  isVariationActive,
  variationGroup,
  weightedRandomVariation,
  applyCtaBase,
  AB_COOKIE,
  AB_COOKIE_MAX_AGE,
  type AbFunnelConfig,
  type AbGroup,
  type AbVariation,
  type AbMainConfig,
  type FoundVariation,
  type FunnelCookie,
  type FunnelResolution,
} from "./funnel";

export {
  FUNNEL_ASSIGNMENT_KEY,
  readAbVariantFromCookieString,
  createGetAbAssignments,
} from "./cookies";

export {
  computeVariationScores,
  rollUpGroups,
  variationSinceMap,
  type ComputeScoresOptions,
  type ScoringEventRow,
  type ScoringRule,
  type RuleScore,
  type VariationScore,
  type GroupScore,
} from "./scoring";
