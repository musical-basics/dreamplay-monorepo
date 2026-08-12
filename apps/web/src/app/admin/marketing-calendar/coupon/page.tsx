import Link from "next/link";
import { getAdminDb } from "@/lib/db";
import {
    COUPON_AMOUNT_USD,
    COUPON_MIN_OPENS,
    COUPON_OPEN_LOOKBACK_DAYS,
    COUPON_WAIT_DAYS,
} from "@/lib/coupon-trigger";
import { loadCouponPipeline } from "@/lib/coupon-trigger-data";
import { CouponControls } from "./CouponControls";

/**
 * /admin/marketing-calendar/coupon — control room for the automatic
 * $100-off trigger. Shows the live pipeline (who qualified, who is waiting
 * out the 3 days, who was held back and why) and holds the two things that
 * gate it: the master switch and the Shopify discount code.
 */

export const dynamic = "force-dynamic";

const HOLD_LABEL: Record<string, string> = {
    waiting: "Waiting out the 3 days",
    purchased: "Purchased, no coupon needed",
    already_sent: "Coupon already sent",
    suppressed: "Suppressed / unsubscribed",
    not_in_audience: "Excluded from the audience",
};

const HOLD_TINT: Record<string, string> = {
    waiting: "border-amber-300/30 text-amber-200/80",
    purchased: "border-emerald-400/30 text-emerald-300/80",
    already_sent: "border-white/20 text-white/50",
    suppressed: "border-red-400/30 text-red-300/80",
    not_in_audience: "border-white/20 text-white/50",
};

export default async function CouponTriggerPage() {
    const pipeline = await loadCouponPipeline(getAdminDb());

    const ready = pipeline.candidates.filter((c) => c.hold === null);
    const waiting = pipeline.candidates.filter((c) => c.hold === "waiting");
    const held = pipeline.candidates.filter((c) => c.hold !== null && c.hold !== "waiting");

    return (
        <div>
            <div className="flex items-end justify-between gap-6 mb-2">
                <h1 className="font-serif text-3xl tracking-tight">${COUPON_AMOUNT_USD} Coupon Trigger</h1>
                <Link
                    href="/admin/marketing-calendar"
                    className="font-sans text-xs uppercase tracking-widest text-amber-300 underline hover:text-amber-200"
                >
                    Back to calendar
                </Link>
            </div>
            <p className="font-sans text-sm text-white/40 mb-8 max-w-3xl">
                Anyone who opens {COUPON_MIN_OPENS} or more marketing emails but has not bought gets a one-time $
                {COUPON_AMOUNT_USD}-off email, {COUPON_WAIT_DAYS} days after the open that qualified them. This is on
                top of the scheduled nurture emails, never instead of them. Opens older than{" "}
                {COUPON_OPEN_LOOKBACK_DAYS} days stop counting. The sweep runs daily at 10:00 AM ET.
            </p>

            <CouponControls
                initialEnabled={pipeline.setting.enabled}
                initialCode={pipeline.setting.discountCode}
                initialNote={pipeline.setting.codeNote}
                readyCount={ready.length}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-8">
                {[
                    { label: "Ready to send", value: ready.length, tint: "text-emerald-400" },
                    { label: `Waiting ${COUPON_WAIT_DAYS}d`, value: waiting.length, tint: "text-amber-300" },
                    { label: "Coupons sent", value: pipeline.sentCount, tint: "text-white" },
                    { label: "Engaged, held", value: held.length, tint: "text-white/60" },
                ].map((s) => (
                    <div key={s.label} className="border border-white/10 bg-white/[0.02] p-4">
                        <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">{s.label}</p>
                        <p className={`font-serif text-3xl ${s.tint}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {pipeline.trackedCampaignIds.length === 0 && (
                <p className="font-sans text-sm text-amber-300/80 border border-amber-300/30 bg-amber-300/5 p-4 mb-8">
                    No marketing-calendar campaigns exist yet, so no opens can be counted. Seed the calendar first.
                </p>
            )}

            {pipeline.candidates.length === 0 ? (
                <p className="font-sans text-sm text-white/40 border border-white/10 bg-white/[0.02] p-6">
                    Nobody has opened {COUPON_MIN_OPENS} marketing emails yet. This fills in once the calendar has
                    been sending for a week or two.
                </p>
            ) : (
                <div className="overflow-x-auto border border-white/10">
                    <table className="w-full font-sans text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-[0.2em] text-white/40">
                                <th className="px-4 py-3">Subscriber</th>
                                <th className="px-4 py-3">Emails opened</th>
                                <th className="px-4 py-3">Qualified</th>
                                <th className="px-4 py-3">Coupon due</th>
                                <th className="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pipeline.candidates.map((c) => (
                                <tr key={c.subscriberId} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.03]">
                                    <td className="px-4 py-3">
                                        <p className="text-white/90">{c.email}</p>
                                        {c.firstName && <p className="text-[12px] text-white/40">{c.firstName}</p>}
                                    </td>
                                    <td className="px-4 py-3 text-white/70">{c.distinctOpens}</td>
                                    <td className="px-4 py-3 text-white/50">{c.qualifiedAt.slice(0, 10)}</td>
                                    <td className="px-4 py-3 text-white/50">{c.eligibleAt.slice(0, 10)}</td>
                                    <td className="px-4 py-3">
                                        {c.hold === null ? (
                                            <span className="border border-emerald-400/40 text-emerald-300 px-2 py-0.5 text-[10px] uppercase tracking-widest">
                                                Ready
                                            </span>
                                        ) : (
                                            <span
                                                className={`border px-2 py-0.5 text-[10px] tracking-wide ${HOLD_TINT[c.hold] ?? "border-white/20 text-white/50"}`}
                                            >
                                                {HOLD_LABEL[c.hold] ?? c.hold}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
