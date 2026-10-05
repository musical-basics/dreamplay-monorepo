"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveAutoCaptureSetting } from "@/actions/auto-capture-actions";
import { MAX_HOLD_HOURS } from "@/lib/auto-capture";

/**
 * The two knobs on the auto-capture sweep: the master switch and how many
 * hours after checkout it captures. Both live in app_settings.
 */
export function AutoCaptureControls({
    initialEnabled,
    initialHoldHours,
}: {
    initialEnabled: boolean;
    initialHoldHours: number;
}) {
    const [enabled, setEnabled] = useState(initialEnabled);
    const [hours, setHours] = useState(String(initialHoldHours));
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();
    const router = useRouter();

    const holdHours = Number(hours);
    const dirty = enabled !== initialEnabled || holdHours !== initialHoldHours;

    function save() {
        setError(null);
        startTransition(async () => {
            const result = await saveAutoCaptureSetting({ enabled, holdHours });
            if (result.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
                // Re-render the page so the status line and the order plans
                // reflect the saved setting.
                router.refresh();
            } else setError(result.error ?? "Save failed");
        });
    }

    return (
        <div className={`border ${initialEnabled ? "border-emerald-400/40" : "border-white/15"} bg-white/[0.02] p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div>
                    <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Sweep status</p>
                    <p className={`font-sans text-sm font-bold ${initialEnabled ? "text-emerald-400" : "text-amber-300"}`}>
                        {initialEnabled
                            ? `On. Payments are captured ${initialHoldHours} hours after checkout.`
                            : "Off. Nothing is captured automatically; authorizations expire 7 days after checkout."}
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
                    {enabled ? "Auto-capture on" : "Auto-capture off"}
                </button>
            </div>

            <div className="max-w-xs">
                <label className="block font-sans text-[10px] uppercase tracking-widest text-white/40 mb-1">
                    Capture after (hours)
                </label>
                <input
                    type="number"
                    min={0}
                    max={MAX_HOLD_HOURS}
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className="w-full border border-white/15 bg-black/40 rounded px-3 py-2 font-mono text-sm text-amber-200 focus:border-amber-300 focus:outline-none"
                />
                <p className="font-sans text-[11px] text-white/35 mt-1.5 leading-relaxed">
                    72 = 3 days. Whatever this says, a payment is captured at least 24 hours before its authorization
                    expires.
                </p>
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
