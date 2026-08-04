import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { GroupScore, ScoringRule, VariationScore } from "@dreamplay/ab";
import type { AbReportData, AbReportSection } from "./ab-report-data";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a1a" },
  title: { fontSize: 18, marginBottom: 2 },
  subtitle: { fontSize: 9, color: "#666", marginBottom: 20 },
  sectionHeading: { fontSize: 13, marginTop: 18, marginBottom: 8 },
  sectionSubheading: { fontSize: 10, marginTop: 14, marginBottom: 6, color: "#333" },
  table: { display: "flex", flexDirection: "column", borderTop: "1px solid #ddd", borderLeft: "1px solid #ddd" },
  row: { flexDirection: "row" },
  headerCell: {
    padding: 4,
    borderRight: "1px solid #ddd",
    borderBottom: "1px solid #ddd",
    backgroundColor: "#f2f2f2",
    fontSize: 8,
    textTransform: "uppercase",
    color: "#555",
  },
  cell: { padding: 4, borderRight: "1px solid #ddd", borderBottom: "1px solid #ddd", fontSize: 9 },
  cellRight: { textAlign: "right" },
  footer: { position: "absolute", bottom: 20, left: 32, right: 32, fontSize: 8, color: "#999", textAlign: "center" },
});

function fmt(n: number, digits = 0): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function GroupTable({ groups }: { groups: GroupScore[] }) {
  const widths = [0.12, 0.45, 0.18, 0.13, 0.12];
  return (
    <View style={styles.table}>
      <View style={styles.row}>
        <Text style={[styles.headerCell, { width: `${widths[0]! * 100}%` }]}>Group</Text>
        <Text style={[styles.headerCell, { width: `${widths[1]! * 100}%` }]}>Variants</Text>
        <Text style={[styles.headerCell, styles.cellRight, { width: `${widths[2]! * 100}%` }]}>Sessions</Text>
        <Text style={[styles.headerCell, styles.cellRight, { width: `${widths[3]! * 100}%` }]}>Total pts</Text>
        <Text style={[styles.headerCell, styles.cellRight, { width: `${widths[4]! * 100}%` }]}>Avg/session</Text>
      </View>
      {groups.length === 0 ? (
        <View style={styles.row}>
          <Text style={[styles.cell, { width: "100%" }]}>No tagged events in this window.</Text>
        </View>
      ) : (
        groups.map((g) => (
          <View style={styles.row} key={g.group}>
            <Text style={[styles.cell, { width: `${widths[0]! * 100}%` }]}>{g.group}</Text>
            <Text style={[styles.cell, { width: `${widths[1]! * 100}%` }]}>{g.variants.join(", ")}</Text>
            <Text style={[styles.cell, styles.cellRight, { width: `${widths[2]! * 100}%` }]}>{fmt(g.sessions)}</Text>
            <Text style={[styles.cell, styles.cellRight, { width: `${widths[3]! * 100}%` }]}>{fmt(g.totalPoints)}</Text>
            <Text style={[styles.cell, styles.cellRight, { width: `${widths[4]! * 100}%` }]}>{fmt(g.avgPoints, 1)}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function VariationTable({ variations, rules }: { variations: VariationScore[]; rules: readonly ScoringRule[] }) {
  // Variation column gets more room; remaining rule/session/total columns share what's left.
  const variationWidth = 0.16;
  const otherCols = rules.length + 3; // sessions, total, avg
  const otherWidth = (1 - variationWidth) / otherCols;

  return (
    <View style={styles.table}>
      <View style={styles.row}>
        <Text style={[styles.headerCell, { width: `${variationWidth * 100}%` }]}>Variation</Text>
        <Text style={[styles.headerCell, styles.cellRight, { width: `${otherWidth * 100}%` }]}>Sess.</Text>
        {rules.map((rule) => (
          <Text key={rule.key} style={[styles.headerCell, styles.cellRight, { width: `${otherWidth * 100}%` }]}>
            {rule.label}
          </Text>
        ))}
        <Text style={[styles.headerCell, styles.cellRight, { width: `${otherWidth * 100}%` }]}>Total</Text>
        <Text style={[styles.headerCell, styles.cellRight, { width: `${otherWidth * 100}%` }]}>Avg</Text>
      </View>
      {variations.length === 0 ? (
        <View style={styles.row}>
          <Text style={[styles.cell, { width: "100%" }]}>No tagged events in this window.</Text>
        </View>
      ) : (
        variations.map((v) => (
          <View style={styles.row} key={v.variant}>
            <Text style={[styles.cell, { width: `${variationWidth * 100}%` }]}>{v.variant}</Text>
            <Text style={[styles.cell, styles.cellRight, { width: `${otherWidth * 100}%` }]}>{fmt(v.sessions)}</Text>
            {rules.map((rule) => (
              <Text key={rule.key} style={[styles.cell, styles.cellRight, { width: `${otherWidth * 100}%` }]}>
                {fmt(v.rules[rule.key]?.points ?? 0)}
              </Text>
            ))}
            <Text style={[styles.cell, styles.cellRight, { width: `${otherWidth * 100}%` }]}>{fmt(v.totalPoints)}</Text>
            <Text style={[styles.cell, styles.cellRight, { width: `${otherWidth * 100}%` }]}>{fmt(v.avgPoints, 1)}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function ReportSection({ title, section, rules }: { title: string; section: AbReportSection; rules: readonly ScoringRule[] }) {
  return (
    <View>
      <Text style={styles.sectionHeading}>
        {title} ({section.window.label})
      </Text>
      <Text style={styles.sectionSubheading}>Layout groups</Text>
      <GroupTable groups={section.groupScores} />
      <Text style={styles.sectionSubheading}>Variations</Text>
      <VariationTable variations={section.variationScores} rules={rules} />
    </View>
  );
}

export function AbReportPdf({ data, rules }: { data: AbReportData; rules: readonly ScoringRule[] }) {
  return (
    <Document title="DreamPlay A/B Report">
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>DreamPlay A/B Test Report</Text>
        <Text style={styles.subtitle}>Generated {new Date(data.generatedAt).toLocaleString("en-US", { timeZone: "America/New_York" })} ET</Text>

        <ReportSection title="Previous day" section={data.yesterday} rules={rules} />
        <ReportSection title="Trailing 7 days" section={data.trailing7Days} rules={rules} />

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
