/**
 * Assignment resolution tests — no DOM, no DB. Covers the 4c6c865 semantics:
 * CSPRNG weighted distribution, cookie stickiness, override + re-stamp,
 * forced/paused pins, geo pools (foreign-pool re-bucketing), rewrites.
 */

import { describe, expect, it } from "vitest";

import {
  applyAssignments,
  assignmentsToMap,
  getRewritePath,
  resolveAssignments,
  weightedRandomVariant,
  AB_COOKIE_MAX_AGE,
  type RequestLike,
} from "../assign";
import { defineExperiments, type Experiment } from "../experiments";

function makeReq({
  path = "/",
  cookies = {},
  country,
  headers = {},
}: {
  path?: string;
  cookies?: Record<string, string>;
  country?: string;
  headers?: Record<string, string>;
} = {}): RequestLike {
  const all: Record<string, string> = { ...headers };
  if (country) all["x-vercel-ip-country"] = country;
  return {
    url: `https://dreamplaypianos.com${path}`,
    cookies: {
      get: (name) => (cookies[name] !== undefined ? { value: cookies[name] } : undefined),
    },
    headers: { get: (name) => all[name.toLowerCase()] ?? null },
  };
}

const hero: Experiment = {
  key: "hero",
  name: "Hero layout",
  paths: [{ type: "exact", path: "/" }],
  variants: [
    { key: "a", weight: 1, label: "Control" },
    { key: "b", weight: 1, route: "/b" },
  ],
  status: "running",
};

const registry = defineExperiments([hero]);

describe("weightedRandomVariant distribution (CSPRNG)", () => {
  it("splits ~50/50 for equal weights over 10k draws", () => {
    const variants = [
      { key: "a", weight: 1 },
      { key: "b", weight: 1 },
    ];
    const counts: Record<string, number> = { a: 0, b: 0 };
    for (let i = 0; i < 10_000; i++) counts[weightedRandomVariant(variants).key]! += 1;
    expect(counts.a! / 10_000).toBeGreaterThan(0.47);
    expect(counts.a! / 10_000).toBeLessThan(0.53);
  });

  it("respects uneven weights (70/20/10) over 10k draws", () => {
    const variants = [
      { key: "x", weight: 70 },
      { key: "y", weight: 20 },
      { key: "z", weight: 10 },
    ];
    const counts: Record<string, number> = { x: 0, y: 0, z: 0 };
    for (let i = 0; i < 10_000; i++) counts[weightedRandomVariant(variants).key]! += 1;
    expect(counts.x! / 10_000).toBeCloseTo(0.7, 1);
    expect(counts.y! / 10_000).toBeCloseTo(0.2, 1);
    expect(counts.z! / 10_000).toBeCloseTo(0.1, 1);
  });

  it("throws on an empty pool", () => {
    expect(() => weightedRandomVariant([])).toThrow(/empty variant pool/);
  });
});

describe("resolveAssignments", () => {
  it("fresh visitor: CSPRNG assignment + 30d lax/secure cookie", () => {
    const [assignment] = resolveAssignments(makeReq(), registry);
    expect(assignment).toBeDefined();
    expect(["a", "b"]).toContain(assignment!.variant);
    expect(assignment!.source).toBe("assigned");
    expect(assignment!.setCookie).toMatchObject({
      name: "ab_hero",
      value: assignment!.variant,
      maxAge: AB_COOKIE_MAX_AGE,
      sameSite: "lax",
      secure: true,
      path: "/",
      httpOnly: false,
    });
  });

  it("sticky: a valid cookie is respected and NOT re-stamped", () => {
    for (let i = 0; i < 20; i++) {
      const [assignment] = resolveAssignments(
        makeReq({ cookies: { ab_hero: "b" } }),
        registry
      );
      expect(assignment!.variant).toBe("b");
      expect(assignment!.source).toBe("cookie");
      expect(assignment!.setCookie).toBeUndefined();
    }
  });

  it("invalid cookie value is re-bucketed and re-stamped", () => {
    const [assignment] = resolveAssignments(
      makeReq({ cookies: { ab_hero: "zz" } }),
      registry
    );
    expect(assignment!.source).toBe("assigned");
    expect(assignment!.setCookie).toBeDefined();
  });

  it("?ab= override wins over the cookie and always re-stamps", () => {
    const [assignment] = resolveAssignments(
      makeReq({ path: "/?ab=b", cookies: { ab_hero: "b" } }),
      registry
    );
    expect(assignment!.variant).toBe("b");
    expect(assignment!.source).toBe("override");
    // Same value as the cookie, but override still refreshes it (shareable
    // preview links must re-pin even expiring cookies).
    expect(assignment!.setCookie?.value).toBe("b");
  });

  it("?ab_<key>= override targets one experiment; invalid values are ignored", () => {
    const [byKey] = resolveAssignments(
      makeReq({ path: "/?ab_hero=a", cookies: { ab_hero: "b" } }),
      registry
    );
    expect(byKey!.variant).toBe("a");
    expect(byKey!.source).toBe("override");

    const [invalid] = resolveAssignments(
      makeReq({ path: "/?ab=nope", cookies: { ab_hero: "b" } }),
      registry
    );
    expect(invalid!.variant).toBe("b");
    expect(invalid!.source).toBe("cookie");
  });

  it("?ab= shorthand does not apply when several experiments match the path", () => {
    const two = defineExperiments([
      hero,
      {
        key: "pricing",
        name: "Pricing",
        paths: [{ type: "exact", path: "/" }],
        variants: [
          { key: "a", weight: 1 },
          { key: "b", weight: 1 },
        ],
        status: "running",
        forcedVariant: "a",
      },
    ]);
    const assignments = resolveAssignments(makeReq({ path: "/?ab=b" }), two);
    // Ambiguous shorthand → neither experiment treats it as an override.
    expect(assignments.every((a) => a.source !== "override")).toBe(true);
  });

  it("forcedVariant pins a running experiment", () => {
    const forced = defineExperiments([{ ...hero, forcedVariant: "a" }]);
    const [assignment] = resolveAssignments(makeReq({ cookies: { ab_hero: "b" } }), forced);
    expect(assignment!.variant).toBe("a");
    expect(assignment!.source).toBe("forced");
    expect(assignment!.setCookie?.value).toBe("a"); // re-stamped over "b"
  });

  it("paused experiment lands on forcedVariant (or control) but ?ab= preview still works", () => {
    const paused = defineExperiments([{ ...hero, status: "paused" as const }]);
    const [assignment] = resolveAssignments(makeReq(), paused);
    expect(assignment!.variant).toBe("a"); // first variant = control fallback
    expect(assignment!.source).toBe("forced");

    const [preview] = resolveAssignments(makeReq({ path: "/?ab=b" }), paused);
    expect(preview!.variant).toBe("b");
    expect(preview!.source).toBe("override");
  });

  it("skips experiments whose paths do not match", () => {
    expect(resolveAssignments(makeReq({ path: "/about" }), registry)).toHaveLength(0);
  });

  it("prefix matchers apply to nested paths but not lookalike siblings", () => {
    const prefixed = defineExperiments([
      { ...hero, paths: [{ type: "prefix" as const, path: "/shop" }] },
    ]);
    expect(resolveAssignments(makeReq({ path: "/shop/tickets" }), prefixed)).toHaveLength(1);
    expect(resolveAssignments(makeReq({ path: "/shop" }), prefixed)).toHaveLength(1);
    expect(resolveAssignments(makeReq({ path: "/shopping" }), prefixed)).toHaveLength(0);
  });

  it("emits rewritePath for variants with a route (whole-page variants)", () => {
    const [assignment] = resolveAssignments(
      makeReq({ cookies: { ab_hero: "b" } }),
      registry
    );
    expect(assignment!.rewritePath).toBe("/b");
    expect(getRewritePath([assignment!])).toBe("/b");

    const [control] = resolveAssignments(makeReq({ cookies: { ab_hero: "a" } }), registry);
    expect(control!.rewritePath).toBeUndefined();
  });
});

describe("geo pools (belgium LOCAL/INTERNATIONAL pattern)", () => {
  const geo = defineExperiments([
    {
      key: "concert",
      name: "Concert page",
      paths: [{ type: "exact", path: "/" }],
      variants: [
        { key: "l", weight: 1 },
        { key: "m", weight: 1 },
        { key: "o", weight: 1 },
        { key: "p", weight: 1 },
        { key: "q", weight: 1 },
      ],
      geoPools: {
        pools: [
          { countries: ["BE", "NL", "LU", "GB", "FR", "DE"], variants: ["l", "m"] },
          { variants: ["o", "p", "q"] }, // catch-all: everyone else
        ],
      },
      status: "running" as const,
    },
  ]);

  it("buckets local visitors into the local pool only", () => {
    for (let i = 0; i < 50; i++) {
      const [a] = resolveAssignments(makeReq({ country: "BE" }), geo);
      expect(["l", "m"]).toContain(a!.variant);
    }
  });

  it("buckets everyone else (and unknown geo) into the catch-all pool", () => {
    for (let i = 0; i < 50; i++) {
      const [us] = resolveAssignments(makeReq({ country: "US" }), geo);
      expect(["o", "p", "q"]).toContain(us!.variant);
      const [unknown] = resolveAssignments(makeReq(), geo);
      expect(["o", "p", "q"]).toContain(unknown!.variant);
    }
  });

  it("re-buckets a cookie from the other geography's pool (4c6c865 rule)", () => {
    const [a] = resolveAssignments(
      makeReq({ country: "BE", cookies: { ab_concert: "o" } }),
      geo
    );
    expect(["l", "m"]).toContain(a!.variant);
    expect(a!.source).toBe("assigned");
    expect(a!.setCookie).toBeDefined();
  });

  it("keeps a cookie that is inside the visitor's pool", () => {
    const [a] = resolveAssignments(
      makeReq({ country: "BE", cookies: { ab_concert: "m" } }),
      geo
    );
    expect(a!.variant).toBe("m");
    expect(a!.source).toBe("cookie");
  });
});

describe("applyAssignments / assignmentsToMap", () => {
  it("stamps pending cookies onto a response-like object", () => {
    const set: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
    const response = {
      cookies: {
        set: (name: string, value: string, options: Record<string, unknown> = {}) =>
          set.push({ name, value, options }),
      },
    };
    const assignments = resolveAssignments(makeReq(), registry);
    const returned = applyAssignments(response, assignments);
    expect(returned).toBe(response);
    expect(set).toHaveLength(1);
    expect(set[0]).toMatchObject({
      name: "ab_hero",
      options: { maxAge: AB_COOKIE_MAX_AGE, sameSite: "lax", secure: true, path: "/" },
    });
  });

  it("maps assignments to the { experiment: variant } shape", () => {
    const assignments = resolveAssignments(makeReq({ cookies: { ab_hero: "b" } }), registry);
    expect(assignmentsToMap(assignments)).toEqual({ hero: "b" });
  });
});
