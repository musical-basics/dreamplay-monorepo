/**
 * Client-side assignment readers — the bridge to @dreamplay/analytics.
 *
 * The analytics client accepts a `getAbAssignments?: () => Record<string,
 * string>` hook and merges the result into every event's metadata as
 * `ab_variant` (primary experiment) + `ab_experiments` (full map). Keep the
 * metadata key literally `ab_variant` — the dashboard reads that exact key
 * (Decision D5 / belgium porting rule 3).
 */

import { abCookieName, type Experiment } from "./experiments";

const AB_COOKIE_PREFIX = "ab_";

/**
 * Parses `ab_<key>=<variant>` cookies out of a cookie header/document.cookie
 * string into an `{ experimentKey: variantKey }` map.
 *
 * With a registry, only known experiment keys are returned and each value is
 * validated against the experiment's variants (stale cookies from renamed
 * experiments/variants are dropped). Without one, every `ab_*` cookie is
 * returned as-is (the standalone-snippet mode).
 */
export function readAbAssignmentsFromCookieString(
  cookieString: string | null | undefined,
  experiments?: readonly Experiment[]
): Record<string, string> {
  const assignments: Record<string, string> = {};
  if (!cookieString) return assignments;

  for (const part of cookieString.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    if (!name.startsWith(AB_COOKIE_PREFIX)) continue;
    const key = name.slice(AB_COOKIE_PREFIX.length);
    if (!key) continue;
    let value = part.slice(eq + 1).trim();
    try {
      value = decodeURIComponent(value);
    } catch {
      // keep raw value
    }
    if (!value) continue;

    if (experiments) {
      const exp = experiments.find((e) => e.key === key);
      if (!exp || !exp.variants.some((v) => v.key === value)) continue;
      assignments[key] = value;
    } else {
      assignments[key] = value;
    }
  }
  return assignments;
}

/**
 * Browser hook factory for AnalyticsConfig.getAbAssignments:
 *
 * ```ts
 * createAnalytics({ getAbAssignments: createGetAbAssignments(experiments) });
 * ```
 *
 * Reads document.cookie fresh on every event, so a mid-session re-bucketing
 * (or an ?ab= override) is reflected immediately.
 */
export function createGetAbAssignments(
  experiments?: readonly Experiment[]
): () => Record<string, string> {
  return () => {
    if (typeof document === "undefined") return {};
    return readAbAssignmentsFromCookieString(document.cookie, experiments);
  };
}

/**
 * Assignment map → analytics metadata shape. `ab_variant` is set to the
 * single RUNNING experiment's variant when exactly one such assignment
 * exists (or the single entry when no registry is supplied); with several
 * concurrent experiments only `ab_experiments` is emitted and consumers pass
 * `primaryExperiment` to the analytics client instead.
 */
export function abAssignmentsToMetadata(
  assignments: Record<string, string>,
  experiments?: readonly Experiment[]
): { ab_variant?: string; ab_experiments?: Record<string, string> } {
  const keys = Object.keys(assignments);
  if (keys.length === 0) return {};
  const meta: { ab_variant?: string; ab_experiments?: Record<string, string> } = {
    ab_experiments: { ...assignments },
  };
  let candidates = keys;
  if (experiments) {
    candidates = keys.filter(
      (key) => experiments.find((e) => e.key === key)?.status === "running"
    );
  }
  if (candidates.length === 1) {
    meta.ab_variant = assignments[candidates[0] as string];
  }
  return meta;
}

/** Convenience: does this cookie string carry an assignment for `experimentKey`? */
export function hasAssignment(
  cookieString: string | null | undefined,
  experimentKey: string
): boolean {
  return readAbAssignmentsFromCookieString(cookieString)[experimentKey] !== undefined;
}

export { abCookieName };
