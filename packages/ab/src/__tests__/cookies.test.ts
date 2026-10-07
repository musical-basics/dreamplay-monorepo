import { describe, expect, it } from "vitest";

import { createGetAbAssignments, readAbVariantFromCookieString } from "../cookies";
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

describe("createGetAbAssignments", () => {
  // Minimal document stub: this package's tests run without a DOM.
  const withCookie = (cookie: string, fn: () => void) => {
    const g = globalThis as { document?: { cookie: string } };
    const prev = g.document;
    g.document = { cookie };
    try {
      fn();
    } finally {
      if (prev === undefined) delete g.document;
      else g.document = prev;
    }
  };

  it("tags every event from the cookie by default", () => {
    withCookie("dp_ab=1a", () => {
      const get = createGetAbAssignments(config);
      expect(get({ path: "/main" })).toEqual({ funnel: "1a" });
      expect(get()).toEqual({ funnel: "1a" });
    });
  });

  it("leaves untaggedPaths untagged (query ignored) and tags everything else", () => {
    withCookie("dp_ab=1a", () => {
      const get = createGetAbAssignments(config, { untaggedPaths: ["/main"] });
      expect(get({ path: "/main" })).toEqual({});
      expect(get({ path: "/main?utm_source=x&v=1a" })).toEqual({});
      expect(get({ path: "/customize" })).toEqual({ funnel: "1a" });
      expect(get({ path: "/main-street" })).toEqual({ funnel: "1a" });
      // No path supplied → no exclusion possible, tag as before
      expect(get()).toEqual({ funnel: "1a" });
    });
  });
});
