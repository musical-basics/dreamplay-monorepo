import { describe, expect, it } from "vitest";

import { computeVariationScores, rollUpGroups, type ScoringRule } from "../scoring";

const rules: ScoringRule[] = [
  { kind: "duration", key: "time", label: "Time", event: "page_leave", points: 1, unitSeconds: 30, maxPoints: 5 },
  { kind: "clicks", key: "clicks", label: "Clicks", event: "page_leave", points: 1, unitClicks: 5, maxPoints: 4 },
  { kind: "once", key: "email", label: "Email", event: "email_signup", points: 15 },
  { kind: "once", key: "purchase", label: "Purchase", event: "purchase", points: 100 },
  { kind: "once", key: "checkout_page", label: "Checkout pageview", event: "pageview", paths: ["/checkout"], points: 8 },
];

const row = (
  variant: string | undefined,
  session: string | null,
  event: string,
  extra: Partial<{
    duration: number;
    clicks: number;
    path: string;
    is_bot: boolean;
    is_admin: boolean;
  }> = {}
) => ({
  event_name: event,
  path: extra.path ?? "/ab",
  session_id: session,
  duration_seconds: extra.duration ?? null,
  metadata: {
    ...(variant ? { ab_variant: variant } : {}),
    ...(extra.clicks !== undefined ? { click_count: extra.clicks } : {}),
    ...(extra.is_bot ? { is_bot: true } : {}),
    ...(extra.is_admin ? { is_admin: true } : {}),
  },
});

describe("computeVariationScores", () => {
  it("scores per session with caps, dedupes 'once' rules, ignores untagged/bot rows", () => {
    const rows = [
      // session s1 on 1a: 95s + 70s time (5pts), 12 clicks (2pts), 2 email signups (15 once)
      row("1a", "s1", "page_leave", { duration: 95, clicks: 7 }),
      row("1a", "s1", "page_leave", { duration: 70, clicks: 5 }),
      row("1a", "s1", "email_signup"),
      row("1a", "s1", "email_signup"),
      // checkout pageview path-filtered rule
      row("1a", "s1", "pageview", { path: "/checkout?x=1" }),
      row("1a", "s1", "pageview", { path: "/checkout-pages/other" }), // no match (boundary)
      // session s2 on 1a: below every threshold
      row("1a", "s2", "page_leave", { duration: 10, clicks: 1 }),
      // untagged main-funnel row and bot row must be ignored
      row(undefined, "s3", "purchase"),
      row("1a", "s4", "purchase", { is_bot: true }),
    ];

    const scores = computeVariationScores(rows, rules);
    expect(scores).toHaveLength(1);
    const s = scores[0]!;
    expect(s.variant).toBe("1a");
    expect(s.group).toBe("1");
    expect(s.sessions).toBe(2);
    expect(s.rules["time"]).toEqual({ points: 5, sessions: 1, raw: 175 });
    expect(s.rules["clicks"]).toEqual({ points: 2, sessions: 1, raw: 13 });
    expect(s.rules["email"]).toEqual({ points: 15, sessions: 1, raw: 2 });
    expect(s.rules["checkout_page"]).toEqual({ points: 8, sessions: 1, raw: 1 });
    expect(s.totalPoints).toBe(30);
    expect(s.avgPoints).toBe(15);
  });

  it("counts sessionless rows (webhook purchases) individually", () => {
    const rows = [
      row("2a", null, "purchase"),
      row("2a", null, "purchase"),
    ];
    const scores = computeVariationScores(rows, rules);
    expect(scores[0]!.sessions).toBe(2);
    expect(scores[0]!.rules["purchase"]).toEqual({ points: 200, sessions: 2, raw: 2 });
  });

  it("ranks variations by avg points per session", () => {
    const rows = [
      row("1a", "a1", "email_signup"),
      row("2a", "b1", "purchase"),
      row("2a", "b2", "page_leave", { duration: 5 }),
    ];
    const scores = computeVariationScores(rows, rules);
    expect(scores.map((s) => s.variant)).toEqual(["2a", "1a"]);
  });
});

describe("rollUpGroups", () => {
  it("aggregates variations into their layout group", () => {
    const rows = [
      row("1a", "s1", "email_signup"),
      row("1b", "s2", "purchase"),
      row("2a", "s3", "email_signup"),
    ];
    const groups = rollUpGroups(computeVariationScores(rows, rules));
    const g1 = groups.find((g) => g.group === "1")!;
    expect(g1.sessions).toBe(2);
    expect(g1.totalPoints).toBe(115);
    expect(g1.variants).toEqual(["1a", "1b"]);
  });
});
