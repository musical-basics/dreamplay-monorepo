import { describe, expect, it } from "vitest";

import { readAbVariantFromCookieString } from "../cookies";
import { defineAbFunnel } from "../funnel";

const config = defineAbFunnel({
  main: { route: "/premium-offer", cta: "/customize" },
  groups: [
    {
      group: "1",
      name: "x",
      active: true,
      variations: [
        { key: "1a", route: "/legacy-home", cta: "/customize", active: true },
        { key: "1b", route: "/legacy-home", cta: "/shop", active: false },
      ],
    },
  ],
});

describe("readAbVariantFromCookieString", () => {
  it("parses dp_ab out of a mixed cookie string", () => {
    expect(readAbVariantFromCookieString("dp_session_id=s1; dp_ab=1a; other=1")).toBe("1a");
  });

  it("handles absent/empty strings", () => {
    expect(readAbVariantFromCookieString("")).toBeUndefined();
    expect(readAbVariantFromCookieString(null)).toBeUndefined();
    expect(readAbVariantFromCookieString("dp_session_id=s1")).toBeUndefined();
  });

  it("validates against the registry: unknown values drop, inactive ones survive", () => {
    expect(readAbVariantFromCookieString("dp_ab=9z", config)).toBeUndefined();
    expect(readAbVariantFromCookieString("dp_ab=1b", config)).toBe("1b");
  });
});
