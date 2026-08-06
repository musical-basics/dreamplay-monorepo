import type { Tables } from "@dreamplay/db";
import { getAdminDb } from "@/lib/db";

/**
 * Rendering for buyer product-update emails (the "Customer Update" campaign
 * templates). The template HTML lives in the campaigns table and uses
 * {{merge_tags}} for the per-buyer order fields; this module fills them from
 * the buyers row so /admin/buyers can preview exactly what each buyer would
 * receive, and the send script can reuse the same rendering.
 */

export const JULY_2026_TEMPLATE_NAME = "Customer Update - July 2026 First Prototype";

export type Buyer = Tables<"buyers">;

const NOT_ON_FILE = "Not on file";

export function formatPricePaid(price: number | null): string {
    if (price == null) return NOT_ON_FILE;
    const whole = Number.isInteger(price);
    return `$${price.toLocaleString("en-US", {
        minimumFractionDigits: whole ? 0 : 2,
        maximumFractionDigits: whole ? 0 : 2,
    })}`;
}

export function formatShipMonth(isoDate: string | null): string {
    if (!isoDate) return "To be confirmed";
    const d = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function buyerMergeValues(buyer: Buyer, firstName: string | null): Record<string, string> {
    return {
        first_name: firstName?.trim() || "there",
        product_name: buyer.product_line || "DreamPlay One",
        size_variant: buyer.size_variant || NOT_ON_FILE,
        finish: buyer.finish || NOT_ON_FILE,
        price_paid: formatPricePaid(buyer.price_paid_usd),
        est_ship_date: formatShipMonth(buyer.est_ship_date),
    };
}

export function renderTemplate(html: string, values: Record<string, string>): string {
    return html.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, tag: string) => values[tag] ?? match);
}

/** Fetch the current July template + render it for one buyer. */
export async function renderJulyEmailForBuyer(buyerId: string): Promise<{
    buyer: Buyer;
    subject: string;
    html: string;
    firstName: string;
} | null> {
    const db = getAdminDb();
    const [{ data: buyer }, { data: template }] = await Promise.all([
        db.from("buyers").select("*").eq("id", buyerId).maybeSingle(),
        db
            .from("campaigns")
            .select("subject_line, html_content")
            .eq("name", JULY_2026_TEMPLATE_NAME)
            .eq("is_template", true)
            .maybeSingle(),
    ]);
    if (!buyer || !template?.html_content) return null;

    const { data: sub } = await db
        .from("subscribers")
        .select("first_name")
        .eq("email", buyer.email)
        .maybeSingle();
    const firstName = sub?.first_name?.trim() || "";

    const values = buyerMergeValues(buyer, firstName);
    return {
        buyer,
        subject: template.subject_line ?? "",
        html: renderTemplate(template.html_content, values),
        firstName: values.first_name ?? "there",
    };
}
