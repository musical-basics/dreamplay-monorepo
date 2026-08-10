import Link from "next/link";
import type { BuyerKind, Tables } from "@dreamplay/db";
import { getAdminDb } from "@/lib/db";
import { formatPricePaid, formatShipMonth } from "@/lib/buyer-update-email";
import { buildPreferencesPath, canUpgradeToPro } from "@/lib/buyer-preferences";
import { getStoreCreditBalances } from "@/lib/store-credit";

/**
 * /admin/buyers — every row in the buyers table with the order details we
 * have on file (what they bought, what they paid, estimated ship date), so
 * outgoing buyer-update emails can be audited before they are sent. Each row
 * links to a rendered preview of the current update email for that buyer.
 */

export const dynamic = "force-dynamic";

type Buyer = Tables<"buyers">;

// Default view = real purchasers only; the rest are opt-in via the chips.
const KINDS: readonly (BuyerKind | "all")[] = ["buyer", "all", "waitlist", "founder", "test", "unknown"];

const KIND_BADGE: Record<BuyerKind, string> = {
    buyer: "border-emerald-400/40 text-emerald-300",
    waitlist: "border-sky-400/40 text-sky-300",
    founder: "border-purple-400/40 text-purple-300",
    test: "border-white/20 text-white/40",
    unknown: "border-amber-400/50 text-amber-300",
};

function fmtDate(iso: string | null): string {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

function displayName(b: Buyer): string {
    const n = (b.notes ?? "").split(/[—|]|reconciliation backfill/)[0]?.trim() ?? "";
    return n.length > 1 && !/^csv import/i.test(n) ? n : "";
}

export default async function AdminBuyersPage({
    searchParams,
}: {
    searchParams: Promise<{ kind?: string }>;
}) {
    const params = await searchParams;
    const kind = (KINDS as readonly string[]).includes(params.kind ?? "") ? (params.kind as BuyerKind | "all") : "buyer";

    let buyers: Buyer[] = [];
    let credits = new Map<string, number>();
    let loadError: string | null = null;
    try {
        const db = getAdminDb();
        const { data, error } = await db
            .from("buyers")
            .select("*")
            .order("purchase_date", { ascending: true, nullsFirst: false })
            .limit(1000);
        if (error) throw new Error(error.message);
        buyers = data ?? [];
        credits = await getStoreCreditBalances(db);
    } catch (error) {
        loadError = error instanceof Error ? error.message : "Failed to load buyers.";
    }

    const counts = new Map<string, number>();
    for (const b of buyers) counts.set(b.kind, (counts.get(b.kind) ?? 0) + 1);
    const shown = kind === "all" ? buyers : buyers.filter((b) => b.kind === kind);
    const missingDetails = buyers.filter((b) => b.kind === "buyer" && (!b.size_variant || !b.finish || !b.est_ship_date)).length;

    return (
        <div>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="font-serif text-3xl tracking-tight">Buyers</h1>
                    <p className="font-sans text-sm text-white/40 mt-1">
                        Order details on file per buyer · preview the current update email before sending ·{" "}
                        <Link href="/admin/buyers/activity" className="text-amber-300 underline hover:text-amber-200">email activity</Link> ·{" "}
                        <Link href="/admin/ab-test-august-10" className="text-amber-300 underline hover:text-amber-200">AB test editor</Link> ·{" "}
                        <Link href="/admin/buyers/research" className="text-amber-300 underline hover:text-amber-200">AB results</Link>
                    </p>
                </div>
                <nav className="flex gap-2 flex-wrap">
                    <Link
                        href="/admin/buyers/activity"
                        className="px-4 py-2 font-sans text-xs uppercase tracking-widest border border-amber-400/40 text-amber-300 hover:border-amber-300 transition-colors"
                    >
                        Email activity
                    </Link>
                    {KINDS.map((k) => (
                        <Link
                            key={k}
                            href={k === "buyer" ? "/admin/buyers" : `/admin/buyers?kind=${k}`}
                            className={`px-4 py-2 font-sans text-xs uppercase tracking-widest border transition-colors ${
                                k === kind
                                    ? "border-white bg-white text-black"
                                    : "border-white/20 text-white/60 hover:border-white/50 hover:text-white"
                            }`}
                        >
                            {k}
                            {k !== "all" && <span className="ml-1.5 opacity-60">{counts.get(k) ?? 0}</span>}
                        </Link>
                    ))}
                </nav>
            </div>

            {loadError && (
                <div className="border border-red-500/30 bg-red-500/10 p-4 font-sans text-sm text-red-300 mb-8">{loadError}</div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {[
                    { label: "Real buyers", value: counts.get("buyer") ?? 0 },
                    { label: "DS5.5 orders", value: buyers.filter((b) => b.kind === "buyer" && b.size_variant === "DS5.5").length },
                    { label: "DS6.0 orders", value: buyers.filter((b) => b.kind === "buyer" && b.size_variant === "DS6.0").length },
                    { label: "Size not on file", value: buyers.filter((b) => b.kind === "buyer" && !b.size_variant).length, warn: buyers.some((b) => b.kind === "buyer" && !b.size_variant) },
                    { label: "Waitlist ($1)", value: counts.get("waitlist") ?? 0 },
                    { label: "Founders ($0)", value: counts.get("founder") ?? 0 },
                    { label: "Buyers missing details", value: missingDetails, warn: missingDetails > 0 },
                    { label: "No email (phone only)", value: buyers.filter((b) => b.email.endsWith("@no-email.invalid")).length, warn: buyers.some((b) => b.email.endsWith("@no-email.invalid")) },
                ].map((s) => (
                    <div key={s.label} className={`border p-4 ${s.warn ? "border-amber-400/40 bg-amber-400/[0.06]" : "border-white/10 bg-white/[0.03]"}`}>
                        <p className="font-sans text-2xl">{s.value}</p>
                        <p className={`font-sans text-[11px] uppercase tracking-widest mt-1 ${s.warn ? "text-amber-300/80" : "text-white/40"}`}>{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="overflow-x-auto border border-white/10">
                <table className="w-full font-sans text-sm">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/[0.03] text-left">
                            {["Buyer", "Kind", "Purchased", "Paid", "Product", "Size", "Finish", "Est. ship", "Email"].map((h) => (
                                <th key={h} className="px-3 py-2.5 font-sans text-[11px] uppercase tracking-widest text-white/40 whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {shown.map((b) => {
                            const name = displayName(b);
                            const missing = b.kind === "buyer" && (!b.size_variant || !b.finish);
                            const noEmail = b.email.endsWith("@no-email.invalid");
                            return (
                                <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                                    <td className="px-3 py-2.5">
                                        {noEmail ? (
                                            <p className="text-amber-300">
                                                No email · phone-only order {b.shopify_order_number}
                                            </p>
                                        ) : (
                                            <p className="text-white/90">{b.email}</p>
                                        )}
                                        {name && <p className="text-white/40 text-xs">{name}</p>}
                                        {noEmail && (
                                            <p className="text-white/40 text-xs">{(b.notes ?? "").split("|")[1]?.trim()}</p>
                                        )}
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <span className={`inline-block border px-2 py-0.5 text-[10px] uppercase tracking-widest ${KIND_BADGE[b.kind]}`}>{b.kind}</span>
                                        {b.pro_upgrade_requested && (
                                            <span className="mt-1 block border border-amber-400/50 px-2 py-0.5 text-[10px] uppercase tracking-widest text-amber-300 w-fit">
                                                Pro upgrade requested
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2.5 whitespace-nowrap text-white/70">{fmtDate(b.purchase_date)}</td>
                                    <td className="px-3 py-2.5 whitespace-nowrap text-white/70">
                                        {b.price_paid_usd != null ? formatPricePaid(b.price_paid_usd) : ""}
                                        {(credits.get(b.id) ?? 0) > 0 && (
                                            <p className="text-xs text-emerald-300">+${credits.get(b.id)} credit</p>
                                        )}
                                    </td>
                                    <td className="px-3 py-2.5 text-white/70 max-w-[220px] truncate" title={b.product_line ?? ""}>{b.product_line ?? ""}</td>
                                    <td className={`px-3 py-2.5 whitespace-nowrap ${missing && !b.size_variant ? "text-amber-300" : "text-white/70"}`}>{b.size_variant ?? (missing ? "missing" : "")}</td>
                                    <td className={`px-3 py-2.5 whitespace-nowrap ${missing && !b.finish ? "text-amber-300" : "text-white/70"}`}>{b.finish ?? (missing ? "missing" : "")}</td>
                                    <td className="px-3 py-2.5 whitespace-nowrap text-white/70">{b.kind === "buyer" ? formatShipMonth(b.est_ship_date) : ""}</td>
                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                        <div className="flex flex-col gap-1.5">
                                            <Link
                                                href={`/admin/buyers/${b.id}/email-preview`}
                                                className="border border-white/25 px-3 py-1.5 text-center text-[11px] uppercase tracking-widest text-white/70 hover:border-white hover:text-white transition-colors"
                                            >
                                                Preview email
                                            </Link>
                                            <Link
                                                href={buildPreferencesPath(b.id)}
                                                target="_blank"
                                                className="border border-white/15 px-3 py-1.5 text-center text-[11px] uppercase tracking-widest text-white/50 hover:border-white/60 hover:text-white transition-colors"
                                            >
                                                Prefs page{canUpgradeToPro(b) ? " · upg" : ""}
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {shown.length === 0 && !loadError && (
                            <tr><td colSpan={9} className="px-3 py-8 text-center text-white/40">No rows.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <p className="font-sans text-xs text-white/35 mt-4 leading-relaxed">
                kind=buyer rows are the real product purchasers and the default audience for buyer updates. Estimated
                ship dates follow the policy: order date + 12 months, never earlier than January 2027. Data source per
                row is recorded in buyers.order_details_source (Shopify Admin API, with the April CSV as fallback).
            </p>
        </div>
    );
}
