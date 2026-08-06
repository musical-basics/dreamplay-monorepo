import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getAdminDb } from "@/lib/db";
import {
    PRO_FINISHES,
    PRO_SIZES,
    STANDARD_FINISHES,
    STANDARD_SIZES,
    boughtPro,
    canUpgradeToPro,
    parsePreferencesToken,
} from "@/lib/buyer-preferences";
import { formatPricePaid, formatShipMonth } from "@/lib/buyer-update-email";
import { PreferencesForm } from "./PreferencesForm";

/**
 * /order-preferences?t=<signed token>: self-service page (linked from buyer
 * update emails) where a buyer confirms or switches their configuration, and
 * eligible buyers can request the $200 DreamPlay One Pro upgrade.
 */

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Your DreamPlay Configuration | DreamPlay Pianos",
    robots: { index: false, follow: false },
};

const SIZE_DESCRIPTIONS: Record<string, string> = {
    "DS5.5": "7/8 key width",
    "DS6.0": "15/16 key width",
    "DS6.5": "Standard width",
};

function InvalidLink() {
    return (
        <section className="max-w-2xl mx-auto px-6 pt-40 pb-32 text-center">
            <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-6">This link is not valid.</h1>
            <p className="font-sans text-base text-white/60 leading-relaxed">
                Please use the personal link from your DreamPlay update email. If you need a new one, write to{" "}
                <a href="mailto:support@dreamplaypianos.com" className="text-white/80 underline">support@dreamplaypianos.com</a>{" "}
                from the email address on your order.
            </p>
        </section>
    );
}

export default async function OrderPreferencesPage({
    searchParams,
}: {
    searchParams: Promise<{ t?: string }>;
}) {
    const { t } = await searchParams;
    const buyerId = parsePreferencesToken(t);

    let content: React.ReactNode;
    if (!buyerId) {
        content = <InvalidLink />;
    } else {
        const db = getAdminDb();
        const { data: buyer } = await db.from("buyers").select("*").eq("id", buyerId).maybeSingle();
        if (!buyer) {
            content = <InvalidLink />;
        } else {
            const alreadyPro = boughtPro(buyer);
            const upgradeEligible = canUpgradeToPro(buyer);
            content = (
                <div className="max-w-2xl mx-auto px-6 pt-36 pb-28">
                    <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-blue-400 font-bold mb-4">
                        Your DreamPlay One
                    </p>
                    <h1 className="font-serif text-3xl md:text-5xl font-semibold tracking-tight mb-6">
                        Confirm your configuration.
                    </h1>
                    <p className="font-sans text-base text-white/60 leading-relaxed mb-10">
                        Before manufacturing begins, tell us exactly how you want your instrument built. You can change
                        this any time until your order enters production. Not sure what to pick? Compare sizes, finishes
                        and models on the{" "}
                        <a href="https://www.dreamplaypianos.com/product-information" className="text-blue-400 underline hover:text-blue-300">
                            product information page
                        </a>.
                    </p>

                    {/* ORDER SUMMARY */}
                    <div className="border border-white/10 bg-white/[0.03] rounded-xl p-6 mb-12">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                                <p className="font-sans text-[10px] uppercase tracking-widest text-white/40 mb-1">Product</p>
                                <p className="font-sans text-sm text-white/85">{buyer.product_line ?? "DreamPlay One"}</p>
                            </div>
                            <div>
                                <p className="font-sans text-[10px] uppercase tracking-widest text-white/40 mb-1">Amount paid</p>
                                <p className="font-sans text-sm text-white/85">{formatPricePaid(buyer.price_paid_usd)}</p>
                            </div>
                            <div>
                                <p className="font-sans text-[10px] uppercase tracking-widest text-white/40 mb-1">Est. ship</p>
                                <p className="font-sans text-sm text-white/85">{formatShipMonth(buyer.est_ship_date)}</p>
                            </div>
                            <div>
                                <p className="font-sans text-[10px] uppercase tracking-widest text-white/40 mb-1">On file now</p>
                                <p className="font-sans text-sm text-white/85">
                                    {[buyer.size_variant, buyer.finish].filter(Boolean).join(" · ") || "Not chosen yet"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {buyer.unit_count > 1 ? (
                        <div className="border border-blue-500/30 bg-blue-900/10 rounded-xl p-8">
                            <h2 className="font-sans text-xs uppercase tracking-[0.25em] text-blue-400 font-bold mb-4">
                                Your order includes {buyer.unit_count} keyboards
                            </h2>
                            <p className="font-sans text-base text-white/70 leading-relaxed mb-5">
                                You reserved {buyer.unit_count} instruments ({[buyer.size_variant, buyer.finish].filter(Boolean).join(" · ")}), so we handle
                                configuration changes for each keyboard individually. Just email us with what you would
                                like for each one and we will update your order.
                            </p>
                            {upgradeEligible && (
                                <p className="font-sans text-base text-white/70 leading-relaxed mb-6">
                                    As an early supporter you can also upgrade any of your keyboards to the DreamPlay
                                    One Pro for a flat $200 per keyboard. Mention it in your email and we will send a
                                    secure payment link.
                                </p>
                            )}
                            <a
                                href={`mailto:support@dreamplaypianos.com?subject=Configuration for order ${buyer.shopify_order_number ?? ""}`}
                                className="inline-block border border-white bg-white px-8 py-4 font-sans text-xs font-bold uppercase tracking-widest text-black transition-all hover:bg-neutral-200 rounded-full"
                            >
                                Email Us Your Configuration
                            </a>
                        </div>
                    ) : (
                        <PreferencesForm
                            token={t!}
                            initialSize={buyer.size_variant}
                            initialFinish={buyer.finish}
                            initialUpgradeRequested={buyer.pro_upgrade_requested}
                            alreadyPro={alreadyPro}
                            upgradeEligible={upgradeEligible}
                            standardSizes={STANDARD_SIZES.map((s) => ({ value: s, label: s, description: SIZE_DESCRIPTIONS[s] }))}
                            proSizes={PRO_SIZES.map((s) => ({ value: s, label: s, description: SIZE_DESCRIPTIONS[s] }))}
                            standardFinishes={STANDARD_FINISHES.map((f) => ({ ...f }))}
                            proFinishes={PRO_FINISHES.map((f) => ({ ...f }))}
                        />
                    )}

                    <p className="font-sans text-xs text-white/35 leading-relaxed mt-12">
                        Questions, or want to change something else about your order? Email{" "}
                        <a href="mailto:support@dreamplaypianos.com" className="text-white/60 underline">support@dreamplaypianos.com</a>.
                    </p>
                </div>
            );
        }
    }

    return (
        <div className="min-h-screen font-sans bg-[#050505] text-white selection:bg-blue-500/20">
            <Navbar forceOpaque={true} darkMode={true} className="border-b border-white/10 bg-[#050505] backdrop-blur-md" />
            <main>{content}</main>
            <Footer />
        </div>
    );
}
