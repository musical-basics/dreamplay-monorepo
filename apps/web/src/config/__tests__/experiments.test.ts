import { describe, expect, it } from "vitest";
import { abCookieName, experimentMatchesPath, isVariantOf } from "@dreamplay/ab";
import { experiments } from "../experiments";

/**
 * Registry validity for the smoke-test experiment (Phase 4 task 6):
 * defineExperiments already threw at import time if the registry were
 * malformed — these assertions pin the specific contract the middleware,
 * accessories page, and admin dashboard rely on.
 */

const SMOKE_KEY = "smoke-accessories-hero";

function getSmoke() {
  const exp = experiments.find((e) => e.key === SMOKE_KEY);
  if (!exp) throw new Error(`registry is missing ${SMOKE_KEY}`);
  return exp;
}

describe("experiments registry", () => {
  it("defines the smoke-test experiment and validates (defineExperiments did not throw on import)", () => {
    expect(getSmoke()).toBeDefined();
    expect(experiments.length).toBeGreaterThan(0);
  });

  it("runs a 50/50 control/b split", () => {
    const exp = getSmoke();
    expect(exp.status).toBe("running");
    expect(exp.variants.map((v) => v.key)).toEqual(["control", "b"]);
    const [control, b] = exp.variants;
    expect(control!.weight).toBe(b!.weight); // equal weights = 50/50
    const total = exp.variants.reduce((sum, v) => sum + v.weight, 0);
    expect(total).toBeGreaterThan(0);
    expect(Number.isFinite(total)).toBe(true);
  });

  it("matches exactly /accessories and nothing else", () => {
    const exp = getSmoke();
    expect(experimentMatchesPath(exp, "/accessories")).toBe(true);
    expect(experimentMatchesPath(exp, "/accessories/bench")).toBe(false);
    expect(experimentMatchesPath(exp, "/")).toBe(false);
    expect(experimentMatchesPath(exp, "/customize")).toBe(false);
  });

  it("uses the ab_smoke-accessories-hero cookie and guards variant values", () => {
    const exp = getSmoke();
    expect(abCookieName(exp.key)).toBe("ab_smoke-accessories-hero");
    expect(isVariantOf(exp, "control")).toBe(true);
    expect(isVariantOf(exp, "b")).toBe(true);
    expect(isVariantOf(exp, "nope")).toBe(false);
    expect(isVariantOf(exp, undefined)).toBe(false);
  });
});
