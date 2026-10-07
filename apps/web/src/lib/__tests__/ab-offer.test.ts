import { describe, expect, it } from "vitest";

import { offerModeForVariant } from "@/lib/ab-offer";

describe("offerModeForVariant (D15)", () => {
  it("gives the 7b deposit offer to visitors outside the test (homepage, no cookie)", () => {
    expect(offerModeForVariant(undefined)).toBe("deposit249");
    expect(offerModeForVariant(null)).toBe("deposit249");
    expect(offerModeForVariant("2b")).toBe("deposit249");
    expect(offerModeForVariant("1a")).toBe("deposit249");
  });

  it("keeps the Love-vs-Spec offer arms intact", () => {
    expect(offerModeForVariant("6b")).toBe("deposit249");
    expect(offerModeForVariant("7b")).toBe("deposit249");
    expect(offerModeForVariant("6a")).toBe("standard");
    expect(offerModeForVariant("7a")).toBe("standard");
  });
});
