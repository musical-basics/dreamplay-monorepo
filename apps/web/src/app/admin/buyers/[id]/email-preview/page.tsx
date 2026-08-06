import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPricePaid, formatShipMonth, renderJulyEmailForBuyer } from "@/lib/buyer-update-email";
import { boughtPro, canUpgradeToPro } from "@/lib/buyer-preferences";

/**
 * /admin/buyers/[id]/email-preview — the current buyer-update email rendered
 * with THIS buyer's merge values (name, product, price paid, est. ship date),
 * exactly as it would be sent. Gated by the /admin layout.
 */

export const dynamic = "force-dynamic";

export default async function BuyerEmailPreviewPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const rendered = await renderJulyEmailForBuyer(id);
    if (!rendered) notFound();
    const { buyer, subject, html, firstName } = rendered;

    const facts: [string, string][] = [
        ["To", buyer.email],
        ["Greeting name", firstName],
        ["Kind", buyer.kind],
        ["Product", buyer.product_line ?? "Not on file"],
        ["Configuration", [buyer.size_variant, buyer.finish].filter(Boolean).join(" · ") || "Not on file"],
        ["Paid", formatPricePaid(buyer.price_paid_usd)],
        ["Est. ship", formatShipMonth(buyer.est_ship_date)],
        [
            "Pro upgrade",
            buyer.pro_upgrade_requested
                ? "REQUESTED"
                : boughtPro(buyer)
                  ? "already Pro"
                  : canUpgradeToPro(buyer)
                    ? "eligible (offer shown on prefs page)"
                    : "not eligible",
        ],
    ];

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <Link href="/admin/buyers" className="font-sans text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors">
                        &larr; All buyers
                    </Link>
                    <h1 className="font-serif text-2xl tracking-tight mt-2">Email preview</h1>
                    <p className="font-sans text-sm text-white/40 mt-1">Subject: <span className="text-white/80">{subject}</span></p>
                </div>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-2 border border-white/10 bg-white/[0.03] px-5 py-4 mb-6">
                {facts.map(([label, value]) => (
                    <div key={label}>
                        <p className="font-sans text-[10px] uppercase tracking-widest text-white/40">{label}</p>
                        <p className="font-sans text-sm text-white/85">{value}</p>
                    </div>
                ))}
            </div>

            {buyer.email.endsWith("@no-email.invalid") && (
                <div className="border border-amber-400/40 bg-amber-400/[0.06] px-5 py-3 mb-6 font-sans text-sm text-amber-300">
                    This buyer checked out with a phone number only; there is no email on file, so they cannot
                    receive this update by email. Contact info is in the notes: {buyer.notes}
                </div>
            )}

            {buyer.kind !== "buyer" && (
                <div className="border border-amber-400/40 bg-amber-400/[0.06] px-5 py-3 mb-6 font-sans text-sm text-amber-300">
                    This row is classified as &quot;{buyer.kind}&quot;, not a real buyer. It would be excluded from a
                    default buyers send.
                </div>
            )}

            <iframe
                srcDoc={html}
                title={`Email preview for ${buyer.email}`}
                className="w-full h-[3600px] bg-black border border-white/10"
                sandbox=""
            />
        </div>
    );
}
