import Link from "next/link";
import { getAdminDb } from "@/lib/db";
import {
    AB_TEMPLATE_NAMES,
    ARMS,
    loadArmOverrides,
    resolveArm,
    type ResearchArm,
} from "@/lib/buyer-research";
import { formatPricePaid } from "@/lib/buyer-update-email";
import { AbTestEditor, type EditorBuyer, type EditorTemplate } from "./AbTestEditor";

/**
 * /admin/ab-test-august-10: the control room for the AB Test August 10 buyer
 * research send. Edit all four email wordings (subject + body, live
 * preview), and fine-tune the four buyer groups by dragging buyers between
 * columns. Manual assignments are stored as overrides on top of the
 * deterministic split and honored everywhere (pages, credit grants,
 * analytics, the send script). Open/click analytics live on the linked
 * results dashboard once the emails go out.
 */

export const dynamic = "force-dynamic";

const ARM_TITLES: Record<ResearchArm, string> = {
    A1: "A1 · Survey + $5 credit",
    A2: "A2 · Survey, no offer",
    B1: "B1 · Call + $10 credit",
    B2: "B2 · Call, no offer",
};

function displayName(notes: string | null): string {
    const n = (notes ?? "").split(/[|—]/)[0]?.trim() ?? "";
    return n.length > 1 && !/^csv import/i.test(n) ? n : "";
}

export default async function AbTestAugust10Page() {
    const db = getAdminDb();

    const [{ data: buyers }, { data: templateRows }, overrides] = await Promise.all([
        db.from("buyers").select("*").eq("kind", "buyer").order("purchase_date", { ascending: true }).limit(1000),
        db
            .from("campaigns")
            .select("name, subject_line, html_content")
            .in("name", Object.values(AB_TEMPLATE_NAMES))
            .eq("is_template", true),
        loadArmOverrides(db),
    ]);

    const templateByName = new Map((templateRows ?? []).map((t) => [t.name, t]));
    const templates: EditorTemplate[] = ARMS.map((arm) => {
        const row = templateByName.get(AB_TEMPLATE_NAMES[arm]);
        return {
            arm,
            title: ARM_TITLES[arm],
            subject: row?.subject_line ?? "",
            html: row?.html_content ?? "",
        };
    });

    const editorBuyers: EditorBuyer[] = (buyers ?? [])
        .filter((b) => !b.email.endsWith("@no-email.invalid"))
        .map((b) => ({
            id: b.id,
            email: b.email,
            name: displayName(b.notes),
            product: b.product_line ?? "Not on file",
            paid: b.price_paid_usd != null ? formatPricePaid(b.price_paid_usd) : "?",
            date: b.purchase_date
                ? new Date(b.purchase_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })
                : "?",
            arm: resolveArm(b.id, overrides),
        }));

    return (
        <div>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                <div>
                    <Link href="/admin/buyers" className="font-sans text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors">
                        &larr; All buyers
                    </Link>
                    <h1 className="font-serif text-3xl tracking-tight mt-2">AB Test August 10</h1>
                    <p className="font-sans text-sm text-white/40 mt-1">
                        Edit each variant&apos;s wording, drag buyers between groups, save both. Results (open rates,
                        click rates, completions):{" "}
                        <Link href="/admin/buyers/research" className="text-amber-300 underline hover:text-amber-200">
                            results dashboard
                        </Link>
                        . Emails are sent only when you give the word.
                    </p>
                </div>
            </div>

            <AbTestEditor templates={templates} buyers={editorBuyers} />

            <p className="font-sans text-xs text-white/35 mt-6 leading-relaxed">
                Wording saves straight to the four campaign templates (merge tags: {"{{first_name}}"},{" "}
                {"{{research_url}}"}, and {"{{survey_url}}"} for the call variants&apos; fallback link). Group changes
                are stored as overrides on top of the deterministic split and take effect everywhere immediately:
                page access, credit rules, analytics attribution and the eventual send.
            </p>
        </div>
    );
}
