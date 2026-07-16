import { describe, expect, it } from "vitest";

import {
  abCookieName,
  activeVariants,
  defineExperiments,
  experimentMatchesPath,
  isVariantOf,
  type Experiment,
} from "../experiments";

const base: Experiment = {
  key: "hero",
  name: "Hero",
  paths: [{ type: "exact", path: "/" }],
  variants: [
    { key: "a", weight: 1 },
    { key: "b", weight: 3 },
  ],
  status: "running",
};

describe("defineExperiments validation", () => {
  it("accepts a valid registry", () => {
    expect(defineExperiments([base])).toHaveLength(1);
  });

  it("rejects duplicate experiment keys", () => {
    expect(() => defineExperiments([base, { ...base }])).toThrow(/duplicate experiment key/);
  });

  it("rejects keys that would break the cookie name", () => {
    expect(() => defineExperiments([{ ...base, key: "Hero Test!" }])).toThrow(/invalid experiment key/);
  });

  it("rejects duplicate/weightless variants", () => {
    expect(() =>
      defineExperiments([
        { ...base, variants: [{ key: "a", weight: 1 }, { key: "a", weight: 1 }] },
      ])
    ).toThrow(/duplicate variant/);
    expect(() =>
      defineExperiments([{ ...base, variants: [{ key: "a", weight: 0 }] }])
    ).toThrow(/positive finite weight/);
  });

  it("rejects unknown forcedVariant and unknown geo-pool variants", () => {
    expect(() => defineExperiments([{ ...base, forcedVariant: "zz" }])).toThrow(
      /forcedVariant "zz"/
    );
    expect(() =>
      defineExperiments([{ ...base, geoPools: { pools: [{ variants: ["zz"] }] } }])
    ).toThrow(/unknown variant "zz"/);
  });

  it("rejects empty variants/paths", () => {
    expect(() => defineExperiments([{ ...base, variants: [] }])).toThrow(/no variants/);
    expect(() => defineExperiments([{ ...base, paths: [] }])).toThrow(/matches no paths/);
  });
});

describe("guards & matchers", () => {
  it("isVariantOf narrows valid keys only", () => {
    expect(isVariantOf(base, "a")).toBe(true);
    expect(isVariantOf(base, "zz")).toBe(false);
    expect(isVariantOf(base, null)).toBe(false);
    expect(isVariantOf(base, undefined)).toBe(false);
  });

  it("experimentMatchesPath handles exact and prefix matchers", () => {
    expect(experimentMatchesPath(base, "/")).toBe(true);
    expect(experimentMatchesPath(base, "/x")).toBe(false);
    const prefixed: Experiment = { ...base, paths: [{ type: "prefix", path: "/shop" }] };
    expect(experimentMatchesPath(prefixed, "/shop")).toBe(true);
    expect(experimentMatchesPath(prefixed, "/shop/a/b")).toBe(true);
    expect(experimentMatchesPath(prefixed, "/shopping")).toBe(false);
  });

  it("abCookieName prefixes with ab_", () => {
    expect(abCookieName("hero")).toBe("ab_hero");
  });

  it("activeVariants resolves geo pools with catch-all fallback", () => {
    const exp: Experiment = {
      ...base,
      variants: [
        { key: "l", weight: 1 },
        { key: "o", weight: 1 },
      ],
      geoPools: {
        pools: [
          { countries: ["BE"], variants: ["l"] },
          { variants: ["o"] },
        ],
      },
    };
    expect(activeVariants(exp, "be").map((v) => v.key)).toEqual(["l"]);
    expect(activeVariants(exp, "US").map((v) => v.key)).toEqual(["o"]);
    expect(activeVariants(exp, null).map((v) => v.key)).toEqual(["o"]);
    expect(activeVariants(base, "BE")).toBe(base.variants); // no pools → all
  });
});
