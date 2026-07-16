/**
 * Edge-safe assignment resolution — the port of belgium's proxy.ts split
 * logic at commit 4c6c865, generalized from one hardcoded letter set to the
 * experiment registry:
 *   - per-experiment cookie `ab_<key>` (30d, lax, secure, path=/)
 *   - `?ab=<variant>` / `?ab_<key>=<variant>` preview overrides with cookie
 *     re-stamp (shareable test links)
 *   - forcedVariant / paused handling (registry-driven, not env-hardcoded)
 *   - geo pools via x-vercel-ip-country: a cookie pointing outside the
 *     visitor's geography pool is re-bucketed
 *   - weighted CSPRNG bucketing. NEVER Math.random: in a reused Vercel Edge
 *     V8 isolate Math.random can repeat across invocations, which
 *     deterministically pinned every fresh visitor to one variant (the
 *     original belgium incident). crypto.getRandomValues is bulletproof.
 *
 * No Node APIs and no next/server import — NextRequest/NextResponse satisfy
 * the minimal structural types below, so the package typechecks standalone.
 */

import {
  abCookieName,
  activeVariants,
  experimentMatchesPath,
  isVariantOf,
  type Experiment,
  type Variant,
} from "./experiments";

// ---------------------------------------------------------------------------
// Structural request/response types (NextRequest/NextResponse-compatible)
// ---------------------------------------------------------------------------

/** Matches both NextRequest#cookies (`{ value }`) and plain-map adapters. */
export interface CookiesLike {
  get(name: string): { value: string } | string | undefined | null;
}

export interface HeadersLike {
  get(name: string): string | null;
}

export interface RequestLike {
  /** Full request URL (relative paths like "/pricing?ab=b" also accepted). */
  url: string;
  cookies: CookiesLike;
  headers: HeadersLike;
}

export interface ResponseCookiesLike {
  set(
    name: string,
    value: string,
    options?: {
      maxAge?: number;
      sameSite?: "lax" | "strict" | "none";
      secure?: boolean;
      path?: string;
      httpOnly?: boolean;
    }
  ): unknown;
}

export interface ResponseLike {
  cookies: ResponseCookiesLike;
}

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------

export const AB_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days (belgium value)

export type AssignmentSource = "cookie" | "override" | "forced" | "assigned";

export interface AssignmentCookie {
  name: string;
  value: string;
  maxAge: number;
  sameSite: "lax";
  secure: true;
  path: "/";
  /** Client JS must read it (analytics tagging) — never httpOnly. */
  httpOnly: false;
}

export interface Assignment {
  experiment: string;
  variant: string;
  source: AssignmentSource;
  /** Present when the cookie needs (re-)stamping: resolved ≠ existing. */
  setCookie?: AssignmentCookie;
  /**
   * Present when the resolved variant defines a `route` differing from the
   * request path — the middleware should rewrite to it (whole-page variants).
   */
  rewritePath?: string;
}

function readCookieValue(cookies: CookiesLike, name: string): string | undefined {
  const raw = cookies.get(name);
  if (raw == null) return undefined;
  return typeof raw === "string" ? raw : raw.value;
}

/**
 * Weighted CSPRNG bucket. Generalizes 4c6c865's
 * `buf[0] % variants.length` (uniform) to arbitrary weights: one 32-bit
 * crypto draw scaled onto the cumulative weight line.
 */
export function weightedRandomVariant(variants: readonly Variant[]): Variant {
  if (variants.length === 0) {
    throw new Error("@dreamplay/ab: cannot bucket into an empty variant pool");
  }
  const total = variants.reduce((sum, v) => sum + v.weight, 0);
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const point = ((buf[0] as number) / 0x1_0000_0000) * total; // [0, total)
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (point < cumulative) return variant;
  }
  return variants[variants.length - 1] as Variant;
}

function buildCookie(experimentKey: string, variant: string): AssignmentCookie {
  return {
    name: abCookieName(experimentKey),
    value: variant,
    maxAge: AB_COOKIE_MAX_AGE,
    sameSite: "lax",
    secure: true,
    path: "/",
    httpOnly: false,
  };
}

export interface ResolveOptions {
  /**
   * Also resolve experiments whose paths don't match the request (e.g. to
   * stamp cookies site-wide). Default false: non-matching experiments are
   * skipped entirely.
   */
  ignorePaths?: boolean;
}

/**
 * Resolves the visitor's variant for every experiment that applies to this
 * request. Per-experiment priority (4c6c865 order, plus forced/paused):
 *
 *   1. `?ab_<key>=<variant>` query override; `?ab=<variant>` shorthand when
 *      exactly one experiment matches the path (belgium's single-experiment
 *      convenience). Always re-stamps the cookie.
 *   2. forcedVariant / non-running status → the pinned variant.
 *   3. Existing `ab_<key>` cookie — only if valid AND inside the visitor's
 *      geo pool (retired/foreign-pool cookies are re-bucketed).
 *   4. Weighted CSPRNG bucket over the geo pool's variants.
 */
export function resolveAssignments(
  req: RequestLike,
  experiments: readonly Experiment[],
  opts: ResolveOptions = {}
): Assignment[] {
  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname;
  const country = req.headers.get("x-vercel-ip-country");

  const applicable = experiments.filter(
    (exp) => opts.ignorePaths || experimentMatchesPath(exp, pathname)
  );
  const singleMatch = applicable.length === 1;

  const assignments: Assignment[] = [];
  for (const exp of applicable) {
    const cookieName = abCookieName(exp.key);
    const existingRaw = readCookieValue(req.cookies, cookieName);
    const existing = isVariantOf(exp, existingRaw) ? existingRaw : undefined;

    const geoHeader = exp.geoPools?.header ?? "x-vercel-ip-country";
    const expCountry = geoHeader === "x-vercel-ip-country" ? country : req.headers.get(geoHeader);
    const pool = activeVariants(exp, expCountry);
    const poolKeys = new Set(pool.map((v) => v.key));
    const existingInPool = existing !== undefined && poolKeys.has(existing);

    // 1. URL override: ?ab_<key>= always; ?ab= only when unambiguous.
    const overrideRaw =
      url.searchParams.get(cookieName) ?? (singleMatch ? url.searchParams.get("ab") : null);
    const override = isVariantOf(exp, overrideRaw) ? overrideRaw : undefined;

    let variant: string;
    let source: AssignmentSource;
    if (override !== undefined) {
      variant = override;
      source = "override";
    } else if (exp.status !== "running" || exp.forcedVariant !== undefined) {
      // Paused/concluded experiments (or an explicit pin while running) land
      // everyone on the forced variant, falling back to the first variant
      // (control by convention).
      variant = exp.forcedVariant ?? (exp.variants[0] as Variant).key;
      source = "forced";
    } else if (existingInPool) {
      variant = existing;
      source = "cookie";
    } else {
      variant = weightedRandomVariant(pool).key;
      source = "assigned";
    }

    const assignment: Assignment = { experiment: exp.key, variant, source };
    // Re-stamp whenever resolved ≠ existing cookie, and always on explicit
    // override (refreshes maxAge on shared preview links — 4c6c865 rule).
    if (source === "override" || existingRaw !== variant) {
      assignment.setCookie = buildCookie(exp.key, variant);
    }
    const variantDef = exp.variants.find((v) => v.key === variant);
    if (variantDef?.route && variantDef.route !== pathname) {
      assignment.rewritePath = variantDef.route;
    }
    assignments.push(assignment);
  }
  return assignments;
}

/**
 * Stamps every pending assignment cookie onto a response (NextResponse or
 * anything with a compatible `cookies.set`). Returns the response for
 * chaining. Rewrites are the caller's job because NextResponse.rewrite must
 * be constructed, not mutated — use `getRewritePath` first:
 *
 * ```ts
 * const assignments = resolveAssignments(req, experiments);
 * const rewrite = getRewritePath(assignments);
 * const res = rewrite
 *   ? NextResponse.rewrite(new URL(rewrite, req.url))
 *   : NextResponse.next();
 * return applyAssignments(res, assignments);
 * ```
 */
export function applyAssignments<T extends ResponseLike>(
  response: T,
  assignments: readonly Assignment[]
): T {
  for (const assignment of assignments) {
    const cookie = assignment.setCookie;
    if (!cookie) continue;
    response.cookies.set(cookie.name, cookie.value, {
      maxAge: cookie.maxAge,
      sameSite: cookie.sameSite,
      secure: cookie.secure,
      path: cookie.path,
      httpOnly: cookie.httpOnly,
    });
  }
  return response;
}

/**
 * First rewrite target among the assignments (at most one whole-page
 * experiment should match a given path; overlaps resolve in registry order).
 */
export function getRewritePath(assignments: readonly Assignment[]): string | undefined {
  return assignments.find((a) => a.rewritePath)?.rewritePath;
}

/** Assignments as the plain `{ experiment: variant }` map used by React/analytics. */
export function assignmentsToMap(assignments: readonly Assignment[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const a of assignments) map[a.experiment] = a.variant;
  return map;
}
