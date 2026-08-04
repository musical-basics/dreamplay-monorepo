import { renderToBuffer } from "@react-pdf/renderer";
import type { ScoringRule } from "@dreamplay/ab";
import type { AbReportData } from "./ab-report-data";
import { AbReportPdf } from "./ab-report-pdf";

/** Renders the A/B report PDF and returns it base64-encoded (Resend attachment format). */
export async function renderAbReportPdfBase64(data: AbReportData, rules: readonly ScoringRule[]): Promise<string> {
  const buffer = await renderToBuffer(AbReportPdf({ data, rules }));
  return Buffer.from(buffer).toString("base64");
}
