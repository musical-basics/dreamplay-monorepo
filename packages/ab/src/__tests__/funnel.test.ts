import { describe, expect, it } from "vitest";

import {
  AB_COOKIE,
  activeVariations,
  applyCtaBase,
  defineAbFunnel,
  findVariation,
  isVariationActive,
  resolveFunnel,
  variationGroup,
  weightedRandomVariation,
  type AbFunnelConfig,
} from "../funnel";

const config: AbFunnelConfig = defineAbFunnel({
  main: { route: "/premium-offer", cta: "/customize" },
  groups: [
    {
      group: "1",
      name: "Original homepage",
      active: true,
      variations: [
        { key: "1a", route: "/legacy-home", cta: "/customize", active: true },
        { key: "1b", route: "/legacy-home", cta: "/shop", active: false },
      ],
    },
    {
      group: "2",
      name: "Special offer",
      active: true,
      variations: [{ key: "2a", route: "/special-offer", cta: "/customize", active: true }],
    },
    {
      group: "3",
      name: "Deactivated group",
      active: false,
      variations: [{ key: "3a", route: "/extended-offer", cta: "/customize", active: true }],
    },
  ],
});

describe("defineAbFunnel validation", () => {
  const base = {
    main: { route: "/premium-offer", cta: "/customize" },
    groups: [] as const,
  };

  it("rejects variation keys that contradict their group", () => {
    expect(() =>
      defineAbFunnel({
        ...base,
        groups: [
          {
            group: "1",
            name: "x",
            active: true,
            variations: [{ key: "2a", route: "/x", cta: "/y", active: true }],
          },
        ],
      })
    ).toThrow(/group "1" but its key says group "2"/);
  });

  it("rejects duplicate variation keys across groups", () => {
    expect(() =>
      defineAbFunnel({
        ...base,
        groups: [
          {
            group: "1",
            name: "x",
            active: true,
            variations: [
              { key: "1a", route: "/x", cta: "/y", active: true },
              { key: "1a", route: "/z", cta: "/y", active: true },
            ],
          },
        ],
      })
    ).toThrow(/duplicate variation key/);
  });

  it("rejects reserved routes and malformed keys/weights", () => {
    expect(() =>
      defineAbFunnel({ ...base, main: { route: "/ab", cta: "/customize" } })
    ).toThrow(/outside \/, \/ab, \/main/);
    expect(() =>
      defineAbFunnel({
        ...base,
        groups: [
          {
            group: "1",
            name: "x",
            active: true,
            variations: [{ key: "1A", route: "/x", cta: "/y", active: true }],
          },
        ],
      })
    ).toThrow(/<digits><letter>/);
    expect(() =>
      defineAbFunnel({
        ...base,
        groups: [
          {
            group: "1",
            name: "x",
            active: true,
            variations: [{ key: "1a", route: "/x", cta: "/y", active: true, weight: 0 }],
          },
        ],
      })
    ).toThrow(/weight/);
  });
});

describe("registry helpers", () => {
  it("variationGroup extracts the digits", () => {
    expect(variationGroup("12b")).toBe("12");
    expect(variationGroup("nope")).toBeUndefined();
  });

  it("findVariation finds inactive variations too", () => {
    expect(findVariation(config, "1b")?.variation.cta).toBe("/shop");
    expect(findVariation(config, "9z")).toBeUndefined();
  });

  it("activeVariations excludes inactive variations and whole inactive groups", () => {
    expect(activeVariations(config).map((v) => v.key)).toEqual(["1a", "2a"]);
    expect(isVariationActive(config, "3a")).toBe(false); // group off
    expect(isVariationActive(config, "1b")).toBe(false); // variation off
    expect(isVariationActive(config, "1a")).toBe(true);
  });
});

describe("resolveFunnel", () => {
  const resolve = (path: string, cookie?: string, search?: string) =>
    resolveFunnel(config, path, new URLSearchParams(search ?? ""), cookie);

  it("routes / to /main for everyone when testing mode is off (D14)", () => {
    expect(resolve("/")).toEqual({ type: "redirect", to: "/main" });
    // A funnel cookie no longer pulls the homepage into the test...
    expect(resolve("/", "2a")).toEqual({ type: "redirect", to: "/main" });
    expect(resolve("/", "3a")).toEqual({ type: "redirect", to: "/main" });
    expect(resolve("/", "zz")).toEqual({ type: "redirect", to: "/main" });
    // ...but the same cookie still pins the visitor's cell on /ab.
    expect(resolve("/ab", "2a")).toEqual({ type: "rewrite", to: "/special-offer", variant: "2a" });
  });

  it("serves /main from the pinned route without cookie or variant", () => {
    const res = resolve("/main", "2a");
    expect(res).toEqual({ type: "rewrite", to: "/premium-offer" });
  });

  it("sticky-serves an active cookie on /ab without restamping", () => {
    expect(resolve("/ab", "2a")).toEqual({ type: "rewrite", to: "/special-offer", variant: "2a" });
  });

  it("assigns a fresh visitor on /ab and stamps the cookie", () => {
    const res = resolve("/ab");
    expect(res.type).toBe("rewrite");
    if (res.type !== "rewrite") throw new Error("unreachable");
    expect(["1a", "2a"]).toContain(res.variant);
    expect(res.setCookie?.name).toBe(AB_COOKIE);
    expect(res.setCookie?.value).toBe(res.variant);
    expect(res.setCookie?.httpOnly).toBe(false);
  });

  it("reassigns when the cookie's variation was deactivated", () => {
    const res = resolve("/ab", "3a");
    if (res.type !== "rewrite") throw new Error("expected rewrite");
    expect(["1a", "2a"]).toContain(res.variant);
    expect(res.setCookie?.value).toBe(res.variant);
  });

  it("forces a variation via /ab/<key> even when inactive, restamping the cookie", () => {
    const res = resolve("/ab/1b", "2a");
    expect(res).toMatchObject({ type: "rewrite", to: "/legacy-home", variant: "1b" });
    if (res.type !== "rewrite") throw new Error("unreachable");
    expect(res.setCookie?.value).toBe("1b");
    // Already on the forced variation → no restamp needed
    const same = resolve("/ab/1b", "1b");
    if (same.type !== "rewrite") throw new Error("unreachable");
    expect(same.setCookie).toBeUndefined();
  });

  it("supports ?v=<key> as the override on /ab", () => {
    const res = resolve("/ab", undefined, "v=2a");
    expect(res).toMatchObject({ type: "rewrite", to: "/special-offer", variant: "2a" });
  });

  it("redirects unknown forced keys back to /ab", () => {
    expect(resolve("/ab/9z")).toEqual({ type: "redirect", to: "/ab" });
  });

  it("supports /<key> shorthand for registry keys only", () => {
    expect(resolve("/2a")).toEqual({ type: "redirect", to: "/ab/2a" });
    expect(resolve("/1b", "2a")).toEqual({ type: "redirect", to: "/ab/1b" });
    // Unknown keys and non-key paths fall through to normal routing (404 etc.)
    expect(resolve("/9z")).toEqual({ type: "none" });
    expect(resolve("/2abc")).toEqual({ type: "none" });
  });

  it("falls back to the main layout when nothing is active", () => {
    const allOff = defineAbFunnel({
      main: { route: "/premium-offer", cta: "/customize" },
      groups: [
        {
          group: "1",
          name: "x",
          active: false,
          variations: [{ key: "1a", route: "/x", cta: "/y", active: true }],
        },
      ],
    });
    expect(resolveFunnel(allOff, "/ab", null, undefined)).toEqual({
      type: "rewrite",
      to: "/premium-offer",
    });
  });

  it("ignores every other path", () => {
    expect(resolve("/premium-offer", "2a")).toEqual({ type: "none" });
    expect(resolve("/about", undefined)).toEqual({ type: "none" });
  });

  it("stamps the cookie from ?v=<known key> on any deep link, serving the page unchanged", () => {
    const res = resolve("/customize", "2a", "v=1b");
    expect(res).toMatchObject({ type: "rewrite", to: "/customize", variant: "1b" });
    if (res.type !== "rewrite") throw new Error("unreachable");
    expect(res.setCookie?.value).toBe("1b");
    // Cookie already matches → no restamp
    const same = resolve("/customize", "1b", "v=1b");
    if (same.type !== "rewrite") throw new Error("unreachable");
    expect(same.setCookie).toBeUndefined();
    // Unknown key on a deep link is ignored — the page serves normally
    expect(resolve("/customize", "2a", "v=9z")).toEqual({ type: "none" });
    // Other query params alongside are irrelevant
    const withSid = resolve("/how-it-works", undefined, "sid=abc&v=2a");
    expect(withSid).toMatchObject({ type: "rewrite", to: "/how-it-works", variant: "2a" });
  });

  it("testing mode funnels / and /main into /ab for everyone", () => {
    const testing = { testingMode: true };
    expect(resolveFunnel(config, "/", null, undefined, testing)).toEqual({
      type: "redirect",
      to: "/ab",
    });
    expect(resolveFunnel(config, "/main", null, "2a", testing)).toEqual({
      type: "redirect",
      to: "/ab",
    });
    // /ab itself and other paths behave identically in testing mode
    expect(resolveFunnel(config, "/ab", null, "2a", testing)).toEqual({
      type: "rewrite",
      to: "/special-offer",
      variant: "2a",
    });
    expect(resolveFunnel(config, "/about", null, undefined, testing)).toEqual({ type: "none" });
  });
});

describe("weightedRandomVariation", () => {
  it("respects weights over many draws", () => {
    const variations = [
      { key: "1a", route: "/a", cta: "/c", active: true, weight: 3 },
      { key: "1b", route: "/b", cta: "/c", active: true, weight: 1 },
    ];
    let heavy = 0;
    const draws = 4000;
    for (let i = 0; i < draws; i++) {
      if (weightedRandomVariation(variations).key === "1a") heavy++;
    }
    // Expect ~75%; allow generous slack for CSPRNG variance.
    expect(heavy / draws).toBeGreaterThan(0.65);
    expect(heavy / draws).toBeLessThan(0.85);
  });

  it("throws on an empty pool", () => {
    expect(() => weightedRandomVariation([])).toThrow();
  });
});

describe("applyCtaBase", () => {
  it("swaps the base path preserving query and hash", () => {
    expect(applyCtaBase("/customize?product=pro", "/shop")).toBe("/shop?product=pro");
    expect(applyCtaBase("/customize#pricing", "/shop")).toBe("/shop#pricing");
    expect(applyCtaBase("/customize", "/shop#benches")).toBe("/shop#benches");
  });

  it("merges query params with the override taking precedence", () => {
    expect(applyCtaBase("/customize?product=pro&x=1", "/shop?product=one")).toBe(
      "/shop?product=one&x=1"
    );
  });
});
