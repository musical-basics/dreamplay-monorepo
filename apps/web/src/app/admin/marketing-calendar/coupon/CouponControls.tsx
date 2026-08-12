"use client";

import { useState, useTransition } from "react";
import { saveCouponSetting } from "@/actions/marketing-calendar-actions";

/**
 * The two gates on the automatic coupon: the master switch and the Shopify
 * discount code. Both live in app_settings; the sweep refuses to send unless
 * the switch is on AND a code is present.
 */
export function CouponControls({
    initialEnabled,
    initialCode,
    initialNote,
    readyCount,
}: {
    initialEnabled: boolean;
    initialCode: string;
    initialNote: string;
    readyCount: number;
}) {
    const [enabled, setEnabled] = useState(initialEnabled);
    const [code, setCode] = useState(initialCode);
    const [note, setNote] = useState(initialNote);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    const dirty = enabled !== initialEnabled || code !== initialCode || note !== initialNote;
    const live = initialEnabled && initialCode.length > 0;

    function save() {
        setError(null);
        startTransition(async () => {
            const result = await saveCouponSetting({ enabled, discountCode: code, codeNote: note });
            if (result.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
            } else setError(result.error ?? "Save failed");
        });
    }

    return (
        <div className={`border ${live ? "border-emerald-400/40" : "border-white/15"} bg-white/[0.02] p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div>
                    <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Trigger status</p>
                    <p className={`font-sans text-sm font-bold ${live ? "text-emerald-400" : "text-amber-300"}`}>
                        {live
                            ? `Live. ${readyCount} ${readyCount === 1 ? "person" : "people"} would be emailed at the next 10:00 AM ET sweep.`
                            : initialEnabled
                              ? "Switched on but no discount code saved, so nothing will send."
                              : "Off. No coupons will send."}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setEnabled((v) => !v)}
                    className={`border px-5 py-2 font-sans text-[11px] font-bold uppercase tracking-widest ${
                        enabled
                            ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
                            : "border-white/25 text-white/60 hover:border-white/50"
                    }`}
                >
                    {enabled ? "Automation on" : "Automation off"}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block font-sans text-[10px] uppercase tracking-widest text-white/40 mb-1">
                        Shopify discount code
                    </label>
                    <input
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="DREAMPLAY100"
                        className="w-full border border-white/15 bg-black/40 rounded px-3 py-2 font-mono text-sm tracking-widest text-amber-200 focus:border-amber-300 focus:outline-none"
                    />
                    <p className="font-sans text-[11px] text-white/35 mt-1.5 leading-relaxed">
                        Create this by hand in Shopify (Discounts, amount off order, $100). Our API token has no
                        write_discounts scope, so nothing here can create it for you.
                    </p>
                </div>
                <div>
                    <label className="block font-sans text-[10px] uppercase tracking-widest text-white/40 mb-1">
                        Note (expiry, usage limits)
                    </label>
                    <input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="One use per customer, no expiry"
                        className="w-full border border-white/15 bg-black/40 rounded px-3 py-2 font-sans text-sm text-white focus:border-amber-300 focus:outline-none"
                    />
                    <p className="font-sans text-[11px] text-white/35 mt-1.5 leading-relaxed">
                        For your own reference. Recommended in Shopify: limit to one use per customer so the code
                        cannot be shared around.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 mt-5">
                <button
                    type="button"
                    onClick={save}
                    disabled={pending || !dirty}
                    className="border border-white bg-white px-5 py-2 font-sans text-[11px] font-bold uppercase tracking-widest text-black hover:bg-neutral-200 disabled:opacity-40"
                >
                    {pending ? "Saving..." : "Save settings"}
                </button>
                {dirty && !pending && <span className="font-sans text-xs text-amber-300">Unsaved changes</span>}
                {saved && !dirty && <span className="font-sans text-xs text-emerald-400">Saved.</span>}
                {error && <span className="font-sans text-xs text-red-400">{error}</span>}
            </div>
        </div>
    );
}
