import { describe, expect, it } from "vitest";

import {
  abAssignmentsToMetadata,
  hasAssignment,
  readAbAssignmentsFromCookieString,
} from "../cookies";
import { defineExperiments } from "../experiments";

const registry = defineExperiments([
  {
    key: "hero",
    name: "Hero",
    paths: [{ type: "exact", path: "/" }],
    variants: [
      { key: "a", weight: 1 },
      { key: "b", weight: 1 },
    ],
    status: "running",
  },
  {
    key: "old_test",
    name: "Concluded",
    paths: [{ type: "exact", path: "/" }],
    variants: [{ key: "winner", weight: 1 }],
    status: "concluded",
    forcedVariant: "winner",
  },
]);

describe("readAbAssignmentsFromCookieString", () => {
  it("parses ab_* cookies out of a mixed cookie string", () => {
    const str = "dp_session_id=s1; ab_hero=b; other=1; ab_old_test=winner";
    expect(readAbAssignmentsFromCookieString(str)).toEqual({
      hero: "b",
      old_test: "winner",
    });
  });

  it("validates against the registry when provided (drops unknown keys/values)", () => {
    const str = "ab_hero=zz; ab_unknown=x; ab_old_test=winner";
    expect(readAbAssignmentsFromCookieString(str, registry)).toEqual({
      old_test: "winner",
    });
  });

  it("handles empty/absent cookie strings and URI-encoded values", () => {
    expect(readAbAssignmentsFromCookieString("")).toEqual({});
    expect(readAbAssignmentsFromCookieString(null)).toEqual({});
    expect(readAbAssignmentsFromCookieString("ab_hero=b%20x")).toEqual({ hero: "b x" });
  });
});

describe("abAssignmentsToMetadata", () => {
  it("emits ab_variant + ab_experiments for a single assignment", () => {
    expect(abAssignmentsToMetadata({ hero: "b" })).toEqual({
      ab_variant: "b",
      ab_experiments: { hero: "b" },
    });
  });

  it("omits ab_variant when several assignments are ambiguous", () => {
    const meta = abAssignmentsToMetadata({ hero: "b", pricing: "a" });
    expect(meta.ab_variant).toBeUndefined();
    expect(meta.ab_experiments).toEqual({ hero: "b", pricing: "a" });
  });

  it("with a registry, ab_variant comes from the single RUNNING experiment", () => {
    const meta = abAssignmentsToMetadata({ hero: "b", old_test: "winner" }, registry);
    expect(meta.ab_variant).toBe("b"); // old_test is concluded → not a candidate
    expect(meta.ab_experiments).toEqual({ hero: "b", old_test: "winner" });
  });

  it("returns {} for no assignments", () => {
    expect(abAssignmentsToMetadata({})).toEqual({});
  });
});

describe("hasAssignment", () => {
  it("detects presence per experiment", () => {
    expect(hasAssignment("ab_hero=b", "hero")).toBe(true);
    expect(hasAssignment("ab_hero=b", "pricing")).toBe(false);
  });
});
