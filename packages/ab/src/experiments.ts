/**
 * Typed experiment registry — the generalization of belgium's single
 * hardcoded letter split (src/proxy.ts + src/lib/variants/config.ts) into
 * first-class named experiments (Phase 4).
 *
 * The code registry is the source of truth for variant content and routing;
 * it is mirrored into the `experiments` table (src/sync.ts) so the dashboard
 * can read names/status without importing app code.
 */

export type ExperimentStatus = "running" | "paused" | "concluded";

export interface Variant {
  /** Cookie/metadata value, e.g. "a", "control", "short-hero". */
  key: string;
  /** Relative bucketing weight (any positive number; weights are normalized). */
  weight: number;
  /** Human label for dashboards. */
  label?: string;
  /**
   * Optional whole-page variant route (belgium style): when set and the
   * request path differs, resolveAssignments emits a rewritePath so the
   * middleware can NextResponse.rewrite to it. Omit for component-level
   * variants rendered via <ExperimentProvider>/useVariant.
   */
  route?: string;
}

export type PathMatcher =
  | { type: "exact"; path: string }
  | { type: "prefix"; path: string };

/**
 * Geo pools — belgium's LOCAL/INTERNATIONAL pattern: different variant pools
 * per visitor geography, resolved from a request header. A visitor whose
 * cookie points outside their geography's pool is re-bucketed (4c6c865
 * semantics).
 */
export interface GeoPool {
  /** ISO-2 country codes this pool serves. Omit for the catch-all pool. */
  countries?: readonly string[];
  /** Variant keys (must exist in `variants`) active for this pool. */
  variants: readonly string[];
}

export interface GeoPoolsConfig {
  /** Header carrying the ISO-2 country. Default: "x-vercel-ip-country". */
  header?: string;
  pools: readonly GeoPool[];
}

export interface Experiment {
  /** Stable identifier: cookie is `ab_<key>`, DB row keys on it. */
  key: string;
  name: string;
  /** Where the experiment applies; requests matching none are untouched. */
  paths: readonly PathMatcher[];
  variants: readonly Variant[];
  geoPools?: GeoPoolsConfig;
  status: ExperimentStatus;
  /**
   * Pins every visitor to one variant (pausing the split without deleting
   * the experiment — belgium's FORCED_VARIANT, but registry-driven).
   * Also used as the landing variant while status is "paused"/"concluded".
   */
  forcedVariant?: string;
}

const EXPERIMENT_KEY_RE = /^[a-z0-9][a-z0-9_-]*$/;

/**
 * Validates and returns the registry (identity function with checks, so the
 * literal type is preserved for callers).
 */
export function defineExperiments<const T extends readonly Experiment[]>(experiments: T): T {
  const seen = new Set<string>();
  for (const exp of experiments) {
    if (!EXPERIMENT_KEY_RE.test(exp.key)) {
      throw new Error(
        `@dreamplay/ab: invalid experiment key "${exp.key}" (lowercase alphanumeric/_/- only — it becomes the ab_<key> cookie)`
      );
    }
    if (seen.has(exp.key)) {
      throw new Error(`@dreamplay/ab: duplicate experiment key "${exp.key}"`);
    }
    seen.add(exp.key);

    if (exp.variants.length === 0) {
      throw new Error(`@dreamplay/ab: experiment "${exp.key}" has no variants`);
    }
    const variantKeys = new Set<string>();
    for (const variant of exp.variants) {
      if (variantKeys.has(variant.key)) {
        throw new Error(
          `@dreamplay/ab: experiment "${exp.key}" has duplicate variant "${variant.key}"`
        );
      }
      variantKeys.add(variant.key);
      if (!(variant.weight > 0) || !Number.isFinite(variant.weight)) {
        throw new Error(
          `@dreamplay/ab: experiment "${exp.key}" variant "${variant.key}" needs a positive finite weight`
        );
      }
    }
    if (exp.forcedVariant !== undefined && !variantKeys.has(exp.forcedVariant)) {
      throw new Error(
        `@dreamplay/ab: experiment "${exp.key}" forcedVariant "${exp.forcedVariant}" is not a variant`
      );
    }
    if (exp.paths.length === 0) {
      throw new Error(`@dreamplay/ab: experiment "${exp.key}" matches no paths`);
    }
    for (const pool of exp.geoPools?.pools ?? []) {
      if (pool.variants.length === 0) {
        throw new Error(`@dreamplay/ab: experiment "${exp.key}" has an empty geo pool`);
      }
      for (const key of pool.variants) {
        if (!variantKeys.has(key)) {
          throw new Error(
            `@dreamplay/ab: experiment "${exp.key}" geo pool references unknown variant "${key}"`
          );
        }
      }
    }
  }
  return experiments;
}

/** Type guard: is `value` a variant key of `experiment`? */
export function isVariantOf(
  experiment: Experiment,
  value: string | null | undefined
): value is string {
  return typeof value === "string" && experiment.variants.some((v) => v.key === value);
}

/** Does the experiment apply to this pathname? */
export function experimentMatchesPath(experiment: Experiment, pathname: string): boolean {
  return experiment.paths.some((matcher) =>
    matcher.type === "exact"
      ? pathname === matcher.path
      : pathname === matcher.path || pathname.startsWith(matcher.path.endsWith("/") ? matcher.path : `${matcher.path}/`)
  );
}

/** Cookie name for an experiment. */
export function abCookieName(experimentKey: string): string {
  return `ab_${experimentKey}`;
}

/**
 * The variant pool active for a visitor country: first geo pool whose
 * `countries` contains it, else the catch-all pool (no `countries`), else all
 * variants. With no geoPools config every variant is always active.
 */
export function activeVariants(
  experiment: Experiment,
  country: string | null
): readonly Variant[] {
  const pools = experiment.geoPools?.pools;
  if (!pools || pools.length === 0) return experiment.variants;
  const normalized = country?.trim().toUpperCase() || null;
  const matched =
    (normalized && pools.find((p) => p.countries?.includes(normalized))) ||
    pools.find((p) => !p.countries || p.countries.length === 0);
  if (!matched) return experiment.variants;
  const keys = new Set(matched.variants);
  return experiment.variants.filter((v) => keys.has(v.key));
}
