import { describe, expect, it } from "vitest";
import { computeVariationScores, rollUpGroups, type ScoringRule } from "@dreamplay/ab";
import { previousNyCalendarDay, trailing7NyCalendarDays } from "../date-windows";
import { renderAbReportPdfBase64 } from "../render";
import type { AbReportData } from "../ab-report-data";

const RULES: readonly ScoringRule[] = [
  { kind: "once", key: "cta_click", label: "CTA click", event: "cta_click", points: 5 },
  { kind: "once", key: "purchase", label: "Purchase", event: "purchase", points: 100 },
];

function syntheticSection(windowLabel: string, startIso: string, endIso: string) {
  const rows = [
    { event_name: "cta_click", session_id: "s1", metadata: { ab_variant: "1a" } },
    { event_name: "purchase", session_id: "s1", metadata: { ab_variant: "1a" } },
    { event_name: "cta_click", session_id: "s2", metadata: { ab_variant: "5a" } },
  ];
  const variationScores = computeVariationScores(rows, RULES);
  return {
    window: { label: windowLabel, startIso, endIso },
    groupScores: rollUpGroups(variationScores),
    variationScores,
  };
}

describe("date windows (America/New_York)", () => {
  it("computes the previous NY calendar day during EDT", () => {
    // 2026-08-04 12:00 UTC = 8:00 AM EDT Aug 4 → previous day = Aug 3 (UTC-4)
    const win = previousNyCalendarDay(new Date("2026-08-04T12:00:00Z"));
    expect(win.startIso).toBe("2026-08-03T04:00:00.000Z");
    expect(win.endIso).toBe("2026-08-04T04:00:00.000Z");
    expect(win.label).toContain("Aug 3");
  });

  it("computes the previous NY calendar day during EST", () => {
    // Jan: UTC-5
    const win = previousNyCalendarDay(new Date("2026-01-15T13:00:00Z"));
    expect(win.startIso).toBe("2026-01-14T05:00:00.000Z");
    expect(win.endIso).toBe("2026-01-15T05:00:00.000Z");
  });

  it("trailing 7 days ends at today's NY midnight and spans 7 days", () => {
    const win = trailing7NyCalendarDays(new Date("2026-08-04T12:00:00Z"));
    expect(win.endIso).toBe("2026-08-04T04:00:00.000Z");
    expect(win.startIso).toBe("2026-07-28T04:00:00.000Z");
    expect(win.label).toContain("Jul 28");
    expect(win.label).toContain("Aug 3");
  });
});

describe("renderAbReportPdfBase64", () => {
  it("renders a non-empty PDF from scored data", async () => {
    const data: AbReportData = {
      generatedAt: "2026-08-04T12:00:00.000Z",
      yesterday: syntheticSection("Aug 3, 2026", "2026-08-03T04:00:00.000Z", "2026-08-04T04:00:00.000Z"),
      trailing7Days: syntheticSection("Jul 28 – Aug 3, 2026", "2026-07-28T04:00:00.000Z", "2026-08-04T04:00:00.000Z"),
    };
    const base64 = await renderAbReportPdfBase64(data, RULES);
    const bytes = Buffer.from(base64, "base64");
    expect(bytes.subarray(0, 5).toString("utf8")).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(1000);
  });

  it("renders an empty-window report without crashing", async () => {
    const empty = {
      window: { label: "Aug 3, 2026", startIso: "2026-08-03T04:00:00.000Z", endIso: "2026-08-04T04:00:00.000Z" },
      groupScores: [],
      variationScores: [],
    };
    const data: AbReportData = { generatedAt: "2026-08-04T12:00:00.000Z", yesterday: empty, trailing7Days: empty };
    const base64 = await renderAbReportPdfBase64(data, RULES);
    expect(Buffer.from(base64, "base64").subarray(0, 5).toString("utf8")).toBe("%PDF-");
  });
});
