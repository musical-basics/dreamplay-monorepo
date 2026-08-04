/**
 * A/B funnel model (Decision D11) — groups × variations.
 *
 * One funnel, one cookie. Variation keys are shaped `<group><letter>`
 * (1a, 1b, 2a…): the number is a layout family, the letter a variation of
 * that layout. `/main` is the manually-pinned page outside the test;
 * `/ab` is the funnel entry that assigns and stickily serves a variation.
 *
 * Edge-safe: imported by middleware. No Node APIs, no next/*, no react.
 * Bucketing uses crypto.getRandomValues — never Math.random, which can repeat
 * across reused edge isolates (enforced by no-math-random.test.ts).
 */

export interface AbVariation {
  /** `<group><letter>`, e.g. "2b". Digits must match the parent group id. */
  key: string;
  /** Internal route that renders this layout (served via rewrite). */
  route: string;
  /** CTA destination base path for this variation (e.g. "/customize", "/shop"). */
  cta: string;
  /** Human label for the score sheet. */
  label?: string;
  /** Deactivated variations stop receiving traffic but keep their history. */
  active: boolean;
  /** Relative assignment weight among active variations. Default 1. */
  weight?: number;
}

export interface AbGroup {
  /** Group id, digits only ("1", "2", …). */
  group: string;
  /** Layout family name for the score sheet. */
  name: string;
  /** Deactivating a group deactivates all its variations at once. */
  active: boolean;
  variations: readonly AbVariation[];
}

/** The manually-set /main page. Never variant-tagged, never scored. */
export interface AbMainConfig {
  route: string;
  cta: string;
}

export interface AbFunnelConfig {
  main: AbMainConfig;
  groups: readonly AbGroup[];
}

const GROUP_ID_RE = /^\d+$/;
const VARIATION_KEY_RE = /^(\d+)([a-z])$/;

/** Paths owned by the funnel router — layout routes must not collide. */
const RESERVED_PATHS = new Set(["/", "/ab", "/main"]);

function assertRoute(value: string, what: string): void {
  if (!value.startsWith("/") || RESERVED_PATHS.has(value)) {
    throw new Error(`ab funnel: ${what} must be an internal path outside /, /ab, /main — got "${value}"`);
  }
}

/**
 * Identity function with fail-fast validation, so a bad registry breaks the
 * build/dev server instead of silently mis-routing production traffic.
 */
export function defineAbFunnel<const T extends AbFunnelConfig>(config: T): T {
  assertRoute(config.main.route, "main.route");
  if (!config.main.cta.startsWith("/")) {
    throw new Error(`ab funnel: main.cta must be an internal path — got "${config.main.cta}"`);
  }
  const seenGroups = new Set<string>();
  const seenKeys = new Set<string>();
  for (const group of config.groups) {
    if (!GROUP_ID_RE.test(group.group)) {
      throw new Error(`ab funnel: group id must be digits — got "${group.group}"`);
    }
    if (seenGroups.has(group.group)) {
      throw new Error(`ab funnel: duplicate group "${group.group}"`);
    }
    seenGroups.add(group.group);
    if (group.variations.length === 0) {
      throw new Error(`ab funnel: group "${group.group}" has no variations`);
    }
    for (const variation of group.variations) {
      const match = VARIATION_KEY_RE.exec(variation.key);
      if (!match) {
        throw new Error(`ab funnel: variation key must be "<digits><letter>" — got "${variation.key}"`);
      }
      if (match[1] !== group.group) {
        throw new Error(
          `ab funnel: variation "${variation.key}" is in group "${group.group}" but its key says group "${match[1]}"`
        );
      }
      if (seenKeys.has(variation.key)) {
        throw new Error(`ab funnel: duplicate variation key "${variation.key}"`);
      }
      seenKeys.add(variation.key);
      assertRoute(variation.route, `variation "${variation.key}" route`);
      if (!variation.cta.startsWith("/")) {
        throw new Error(`ab funnel: variation "${variation.key}" cta must be an internal path`);
      }
      if (variation.weight !== undefined && (!Number.isFinite(variation.weight) || variation.weight <= 0)) {
        throw new Error(`ab funnel: variation "${variation.key}" weight must be a positive number`);
      }
    }
  }
  return config;
}

/** The group a variation key belongs to ("2b" → "2"); undefined if malformed. */
export function variationGroup(key: string): string | undefined {
  return VARIATION_KEY_RE.exec(key)?.[1];
}

export interface FoundVariation {
  group: AbGroup;
  variation: AbVariation;
}

/** Look a variation up by key across all groups (active or not). */
export function findVariation(
  config: AbFunnelConfig,
  key: string | null | undefined
): FoundVariation | undefined {
  if (!key) return undefined;
  for (const group of config.groups) {
    for (const variation of group.variations) {
      if (variation.key === key) return { group, variation };
    }
  }
  return undefined;
}

/** Variations currently eligible for assignment (group AND variation active). */
export function activeVariations(config: AbFunnelConfig): AbVariation[] {
  const result: AbVariation[] = [];
  for (const group of config.groups) {
    if (!group.active) continue;
    for (const variation of group.variations) {
      if (variation.active) result.push(variation);
    }
  }
  return result;
}

export function isVariationActive(config: AbFunnelConfig, key: string | null | undefined): boolean {
  const found = findVariation(config, key);
  return Boolean(found && found.group.active && found.variation.active);
}

/** One CSPRNG draw scaled onto the cumulative weight line. */
export function weightedRandomVariation(variations: readonly AbVariation[]): AbVariation {
  if (variations.length === 0) {
    throw new Error("ab funnel: cannot pick from zero variations");
  }
  const total = variations.reduce((sum, v) => sum + (v.weight ?? 1), 0);
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  // buf[0] / 2^32 ∈ [0, 1)
  let point = ((buf[0] as number) / 0x100000000) * total;
  for (const variation of variations) {
    point -= variation.weight ?? 1;
    if (point < 0) return variation;
  }
  return variations[variations.length - 1] as AbVariation;
}

/**
 * Swap the base path of a CTA href while preserving the original link's
 * query/hash (and merging any query the override itself carries):
 *   applyCtaBase("/customize?product=pro", "/shop") → "/shop?product=pro"
 */
export function applyCtaBase(fallback: string, ctaBase: string): string {
  const fallbackUrl = new URL(fallback, "http://x");
  const ctaUrl = new URL(ctaBase, "http://x");
  const params = new URLSearchParams(ctaUrl.search);
  for (const [key, value] of fallbackUrl.searchParams) {
    if (!params.has(key)) params.append(key, value);
  }
  const query = params.toString();
  const hash = fallbackUrl.hash || ctaUrl.hash;
  return `${ctaUrl.pathname}${query ? `?${query}` : ""}${hash}`;
}

export const AB_COOKIE = "dp_ab";
export const AB_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface FunnelCookie {
  name: typeof AB_COOKIE;
  value: string;
  maxAge: number;
  sameSite: "lax";
  secure: true;
  path: "/";
  /** Must stay false — client JS reads the cookie to tag analytics events. */
  httpOnly: false;
}

export type FunnelResolution =
  | { type: "none" }
  /** Send the visitor to `to` (caller preserves the query string). */
  | { type: "redirect"; to: string }
  /** Serve `to` at the current URL; stamp cookie/variant when in the funnel. */
  | {
      type: "rewrite";
      to: string;
      variant?: string;
      setCookie?: FunnelCookie;
    };

function funnelCookie(value: string): FunnelCookie {
  return {
    name: AB_COOKIE,
    value,
    maxAge: AB_COOKIE_MAX_AGE,
    sameSite: "lax",
    secure: true,
    path: "/",
    httpOnly: false,
  };
}

/**
 * Pure funnel router. Given the request path, the `?v=` search override and
 * the raw dp_ab cookie, decide what the middleware should do:
 *
 * - `/`      → redirect to `/ab` when the visitor carries a known variation
 *              cookie (they joined the funnel once — they stay in it), else
 *              to `/main`.
 * - `/main`  → rewrite to the manually-pinned layout. No cookie, no tag.
 * - `/ab`    → sticky cookie if still active, else CSPRNG-assign among
 *              active variations; rewrite to the variation's route.
 * - `/ab/<key>` (or `/ab?v=<key>`) → forced preview/share link: stamp that
 *              variation (active or not) and serve it.
 * - anything else → none.
 */
export function resolveFunnel(
  config: AbFunnelConfig,
  pathname: string,
  search: URLSearchParams | null,
  rawCookie: string | null | undefined
): FunnelResolution {
  const known = findVariation(config, rawCookie);

  if (pathname === "/") {
    return { type: "redirect", to: known ? "/ab" : "/main" };
  }

  if (pathname === "/main") {
    return { type: "rewrite", to: config.main.route };
  }

  const isAbRoot = pathname === "/ab";
  const abPathKey = pathname.startsWith("/ab/") ? pathname.slice("/ab/".length) : undefined;
  if (!isAbRoot && abPathKey === undefined) {
    return { type: "none" };
  }

  // Forced variation: /ab/<key> beats ?v=<key>.
  const forcedKey = abPathKey ?? search?.get("v") ?? undefined;
  if (forcedKey !== undefined) {
    const forced = findVariation(config, forcedKey);
    if (!forced) {
      // Unknown key in a shared link — fall back to normal assignment.
      return { type: "redirect", to: "/ab" };
    }
    return {
      type: "rewrite",
      to: forced.variation.route,
      variant: forced.variation.key,
      setCookie: rawCookie === forced.variation.key ? undefined : funnelCookie(forced.variation.key),
    };
  }

  // Sticky assignment while it remains active.
  if (known && isVariationActive(config, known.variation.key)) {
    return { type: "rewrite", to: known.variation.route, variant: known.variation.key };
  }

  // (Re)assign: fresh visitor, or their variation/group was deactivated.
  const pool = activeVariations(config);
  if (pool.length === 0) {
    // Nothing to test — serve the main layout, untagged.
    return { type: "rewrite", to: config.main.route };
  }
  const picked = weightedRandomVariation(pool);
  return {
    type: "rewrite",
    to: picked.route,
    variant: picked.key,
    setCookie: funnelCookie(picked.key),
  };
}
