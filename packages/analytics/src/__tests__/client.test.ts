// @vitest-environment happy-dom
/**
 * Browser client tests — happy-dom, no network (fetch injected via config).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createAnalytics,
  SESSION_COOKIE,
  VISITOR_STORAGE_KEY,
  type AnalyticsConfig,
  type TrackPayload,
} from "../client";

function expireCookie(name: string) {
  document.cookie = `${name}=;path=/;max-age=0`;
}

/** Captures every payload the client sends. */
function createHarness(config: Partial<AnalyticsConfig> = {}) {
  const payloads: TrackPayload[] = [];
  const fetchMock = vi.fn(async (_url: unknown, init?: RequestInit) => {
    payloads.push(JSON.parse(String(init?.body)) as TrackPayload);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  });
  let url = "https://dreamplaypianos.com/";
  let referrer = "";
  const analytics = createAnalytics({
    fetch: fetchMock as unknown as typeof fetch,
    getContext: () => ({ url, referrer }),
    ...config,
  });
  return {
    analytics,
    payloads,
    fetchMock,
    setUrl(next: string) {
      url = next;
    },
    setReferrer(next: string) {
      referrer = next;
    },
  };
}

beforeEach(() => {
  expireCookie(SESSION_COOKIE);
  expireCookie("dp_sid");
  expireCookie("dp_cid");
  sessionStorage.clear();
  localStorage.clear();
  // Force the fetch path (sendBeacon would bypass the injected fetch).
  (navigator as unknown as { sendBeacon: unknown }).sendBeacon = vi.fn(() => false);
  vi.restoreAllMocks();
});

describe("session & visitor identity", () => {
  it("mints dp_session_id (cookie) and dp_visitor_id (localStorage) once and reuses them", async () => {
    const h1 = createHarness();
    await h1.analytics.pageview();
    const sessionId = h1.analytics.getSessionId();
    const visitorId = h1.analytics.getVisitorId();
    expect(sessionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(document.cookie).toContain(`${SESSION_COOKIE}=${sessionId}`);
    expect(localStorage.getItem(VISITOR_STORAGE_KEY)).toBe(visitorId);

    // A second instance (new pageload) sees the same identity.
    const h2 = createHarness();
    await h2.analytics.track("cta_click");
    expect(h2.payloads[0]?.sessionId).toBe(sessionId);
    expect(h2.payloads[0]?.visitorId).toBe(visitorId);
  });

  it("sends path derived from the page URL", async () => {
    const h = createHarness();
    h.setUrl("https://dreamplaypianos.com/pricing?x=1");
    await h.analytics.pageview();
    expect(h.payloads[0]?.path).toBe("/pricing?x=1");
    expect(h.payloads[0]?.eventName).toBe("pageview");
  });
});

describe("UTM / referrer / click-id capture", () => {
  it("captures UTMs + gclid from the landing URL and tags every later event", async () => {
    const h = createHarness();
    h.setUrl(
      "https://dreamplaypianos.com/?utm_source=youtube&utm_campaign=launch&gclid=abc123"
    );
    await h.analytics.pageview();

    // Later event on a clean URL still carries the stored attribution.
    h.setUrl("https://dreamplaypianos.com/checkout");
    await h.analytics.track("begin_checkout");

    for (const p of h.payloads) {
      expect(p.metadata.utm_source).toBe("youtube");
      expect(p.metadata.utm_campaign).toBe("launch");
      expect(p.metadata.gclid).toBe("abc123");
    }
    expect(h.payloads[0]?.metadata.landing_url).toContain("utm_source=youtube");
    // gclid persists across sessions (localStorage), UTMs are session-scoped.
    expect(localStorage.getItem("gclid")).toBe("abc123");
    expect(sessionStorage.getItem("dp_utm_source")).toBe("youtube");
  });

  it("stores only external referrers as first-touch", async () => {
    const h1 = createHarness();
    h1.setReferrer("https://dreamplaypianos.com/other-page");
    await h1.analytics.pageview();
    expect(h1.payloads[0]?.metadata.referrer).toBeUndefined();

    sessionStorage.clear();
    const h2 = createHarness();
    h2.setReferrer("https://www.youtube.com/watch?v=x");
    await h2.analytics.pageview();
    expect(h2.payloads[0]?.metadata.referrer).toBe("https://www.youtube.com/watch?v=x");
  });
});

describe("A/B assignment tagging", () => {
  it("tags ab_variant + ab_experiments when exactly one experiment is assigned", async () => {
    const h = createHarness({ getAbAssignments: () => ({ hero_2026: "b" }) });
    await h.analytics.track("cta_click", { location: "hero" });
    expect(h.payloads[0]?.metadata.ab_variant).toBe("b");
    expect(h.payloads[0]?.metadata.ab_experiments).toEqual({ hero_2026: "b" });
    expect(h.payloads[0]?.metadata.location).toBe("hero");
  });

  it("with several experiments, ab_variant comes from primaryExperiment only", async () => {
    const assignments = { hero_2026: "b", pricing_test: "control" };
    const withoutPrimary = createHarness({ getAbAssignments: () => assignments });
    await withoutPrimary.analytics.track("x");
    expect(withoutPrimary.payloads[0]?.metadata.ab_variant).toBeUndefined();
    expect(withoutPrimary.payloads[0]?.metadata.ab_experiments).toEqual(assignments);

    const withPrimary = createHarness({
      getAbAssignments: () => assignments,
      primaryExperiment: "pricing_test",
    });
    await withPrimary.analytics.track("x");
    expect(withPrimary.payloads[0]?.metadata.ab_variant).toBe("control");
  });

  it("survives a throwing getAbAssignments hook", async () => {
    const h = createHarness({
      getAbAssignments: () => {
        throw new Error("boom");
      },
    });
    await h.analytics.track("x");
    expect(h.payloads).toHaveLength(1);
    expect(h.payloads[0]?.metadata.ab_experiments).toBeUndefined();
  });
});

describe("email attribution cookies", () => {
  it("copies dp_sid / dp_cid cookies into metadata when present", async () => {
    document.cookie = "dp_sid=123e4567-e89b-42d3-a456-426614174000;path=/";
    document.cookie = "dp_cid=camp-42;path=/";
    const h = createHarness();
    await h.analytics.pageview();
    expect(h.payloads[0]?.metadata.sid).toBe("123e4567-e89b-42d3-a456-426614174000");
    expect(h.payloads[0]?.metadata.cid).toBe("camp-42");
  });
});

describe("page_leave", () => {
  it("sends duration since pageview and dedupes repeat calls", async () => {
    vi.useFakeTimers();
    try {
      const h = createHarness();
      await h.analytics.pageview();
      vi.advanceTimersByTime(12_400);
      await h.analytics.pageLeave();
      await h.analytics.pageLeave(); // pagehide AND visibilitychange both fire
      const leaves = h.payloads.filter((p) => p.eventName === "page_leave");
      expect(leaves).toHaveLength(1);
      expect(leaves[0]?.durationSeconds).toBe(12);
    } finally {
      vi.useRealTimers();
    }
  });

  it("does nothing before any pageview", async () => {
    const h = createHarness();
    await h.analytics.pageLeave();
    expect(h.payloads).toHaveLength(0);
  });
});
