import {
    BACKUP_STALE_HOURS,
    type CaptureDecision,
    type CaptureOrder,
    DEADLINE_WARNING_HOURS,
    HOLD_REASON_LABEL,
    MANUAL_CAPTURE_TAG,
    decideCapture,
    formatEastern,
    formatMoney,
} from "@/lib/auto-capture";
import {
    fetchAuthorizedOrders,
    loadAutoCaptureSetting,
    readAutoCaptureStatus,
    readBackupHeartbeat,
} from "@/lib/auto-capture-data";
import { getAdminDb } from "@/lib/db";
import { shopifyAdminOrderUrl } from "@/lib/shopify/admin";
import { AutoCaptureControls } from "./AutoCaptureControls";

/**
 * /admin/auto-capture: control room for the hourly payment capture sweep.
 * Shows every order whose card is authorized but not captured, and what the
 * sweep will do with it, computed by the same decideCapture() the sweep uses.
 */

export const dynamic = "force-dynamic";

const IGNORE_LABEL: Record<string, string> = {
    not_capturable: "Nothing left to capture",
    cancelled: "Cancelled",
    test: "Test order",
    capture_in_flight: "Capture pending at the gateway",
};

/** The hourly cron plus generous slack before the heartbeat counts as stale. */
const STALE_AFTER_MS = 2.5 * 3_600_000;

function Plan({ decision }: { decision: CaptureDecision }) {
    switch (decision.action) {
        case "capture":
            return <span className="text-emerald-300">Due now, captured at the next hourly sweep</span>;
        case "wait":
            return <span className="text-white/80">Captures {formatEastern(decision.captureAt)}</span>;
        case "hold":
            return (
                <span className="text-red-300">
                    <span className="font-bold">{HOLD_REASON_LABEL[decision.reason]}.</span>{" "}
                    <span className="text-red-300/70">{decision.detail}. Capture or cancel it by hand in Shopify.</span>
                </span>
            );
        case "ignore":
            return <span className="text-white/40">{IGNORE_LABEL[decision.reason] ?? decision.reason}</span>;
    }
}

export default async function AutoCapturePage() {
    const db = getAdminDb();
    const now = new Date();
    const [setting, status, backup] = await Promise.all([
        loadAutoCaptureSetting(db),
        readAutoCaptureStatus(db),
        readBackupHeartbeat(db),
    ]);

    let orders: CaptureOrder[] = [];
    let loadError: string | null = null;
    try {
        orders = await fetchAuthorizedOrders();
    } catch (err) {
        loadError = err instanceof Error ? err.message : String(err);
    }
    const items = orders.map((order) => ({ order, decision: decideCapture(order, setting, now) }));

    const stale = !status.lastRunAt || now.getTime() - new Date(status.lastRunAt).getTime() > STALE_AFTER_MS;
    const backupStale =
        !backup.lastRunAt || now.getTime() - new Date(backup.lastRunAt).getTime() > BACKUP_STALE_HOURS * 3_600_000;

    return (
        <div>
            <h1 className="font-serif text-3xl tracking-tight mb-2">Payment Auto-Capture</h1>
            <p className="font-sans text-sm text-white/40 mb-8 max-w-3xl">
                Shopify authorizes the card at checkout and the store captures by hand, so every order has a review
                window. An hourly sweep captures each payment {setting.holdHours} hours after checkout, in the
                buyer&apos;s own currency. Shopify voids an uncaptured authorization after 7 days. Orders Shopify rates
                medium or high fraud risk, and anything unusual (an edited total, a failed capture), are never captured
                automatically: they are tagged <code className="text-white/70">{MANUAL_CAPTURE_TAG}</code> and emailed
                to support@. Add that tag to any order in Shopify to keep the sweep away from it. Anything still
                uncaptured {DEADLINE_WARNING_HOURS} hours before expiry gets one final warning email.
            </p>

            <AutoCaptureControls initialEnabled={setting.enabled} initialHoldHours={setting.holdHours} />

            <div className="my-8 space-y-3">
                <p className={`font-sans text-sm ${stale ? "text-amber-300" : "text-white/60"}`}>
                    {status.lastRunAt
                        ? `Last sweep ${formatEastern(status.lastRunAt)}${
                              status.lastCounts
                                  ? `: captured ${status.lastCounts.captured}, handed over ${status.lastCounts.handedOver}, warned ${status.lastCounts.warned}, waiting ${status.lastCounts.waiting}.`
                                  : status.lastOutcome === "disabled"
                                    ? ", switched off."
                                    : "."
                          }`
                        : "The sweep has not run yet."}
                    {stale && " It should run every hour: check the Inngest dashboard (function shopify-auto-capture-sweep)."}
                </p>
                <p className={`font-sans text-sm ${backupStale ? "text-amber-300" : "text-white/60"}`}>
                    {backup.lastRunAt
                        ? `Backup job (GitHub Actions, captures on day 5 whatever the sweep missed) last ran ${formatEastern(backup.lastRunAt)}${
                              backup.lastCounts
                                  ? `: captured ${backup.lastCounts.captured}, handed over ${backup.lastCounts.handedOver}, warned ${backup.lastCounts.warned}.`
                                  : "."
                          }`
                        : "The backup job (GitHub Actions) has not run yet."}
                    {backupStale &&
                        " It should run every hour: check GitHub, Actions, payment-capture-backup (public repos lose scheduled workflows after 60 days without a commit)."}
                    {backup.lastError && ` Last error: ${backup.lastError}`}
                </p>
                {status.lastError && (
                    <p className="font-sans text-sm text-red-300 border border-red-400/30 bg-red-400/5 p-4">
                        Last failure{status.lastErrorAt ? ` ${formatEastern(status.lastErrorAt)}` : ""}: {status.lastError}
                    </p>
                )}
            </div>

            {loadError ? (
                <p className="font-sans text-sm text-red-300 border border-red-400/30 bg-red-400/5 p-4">
                    Could not load orders from Shopify: {loadError}
                </p>
            ) : items.length === 0 ? (
                <p className="font-sans text-sm text-white/40 border border-white/10 bg-white/[0.02] p-6">
                    No authorized, uncaptured payments right now. Every order is either captured or closed.
                </p>
            ) : (
                <div className="overflow-x-auto border border-white/10">
                    <table className="w-full font-sans text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-[0.2em] text-white/40">
                                <th className="px-4 py-3">Order</th>
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3">Ordered</th>
                                <th className="px-4 py-3">What happens</th>
                                <th className="px-4 py-3">Authorization expires</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(({ order, decision }) => {
                                const expiresAt =
                                    decision.action === "ignore" ? null : decision.expiresAt;
                                return (
                                    <tr key={order.id} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.03]">
                                        <td className="px-4 py-3">
                                            <a
                                                href={shopifyAdminOrderUrl(order.id)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-amber-300 underline hover:text-amber-200"
                                            >
                                                {order.name}
                                            </a>
                                        </td>
                                        <td className="px-4 py-3 text-white/70">
                                            {formatMoney(order.currentTotal.amount, order.currentTotal.currencyCode)}
                                        </td>
                                        <td className="px-4 py-3 text-white/50">{formatEastern(order.createdAt)}</td>
                                        <td className="px-4 py-3">
                                            <Plan decision={decision} />
                                        </td>
                                        <td className="px-4 py-3 text-white/50">{expiresAt ? formatEastern(expiresAt) : "-"}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
