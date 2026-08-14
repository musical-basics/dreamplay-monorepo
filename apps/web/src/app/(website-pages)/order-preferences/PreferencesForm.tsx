"use client";

import { useState, useTransition } from "react";
import { saveBuyerPreferences } from "@/actions/buyer-preferences-actions";

interface Option {
    value: string;
    label: string;
    description?: string;
}

export interface PreferencesFormProps {
    token: string;
    initialSize: string | null;
    initialFinish: string | null;
    initialUpgradeRequested: boolean;
    /** Buyer already owns a Pro product: pro options, no upgrade section. */
    alreadyPro: boolean;
    /** May request the $200 upgrade (pre-May 2026 non-Pro buyers only). */
    upgradeEligible: boolean;
    /** Shopify cart permalink for the $200 upgrade, shown right after saving. */
    upgradeCheckoutUrl: string;
    /** Already paid: show a receipt line instead of another payment prompt. */
    upgradePaidAt: string | null;
    standardSizes: Option[];
    proSizes: Option[];
    standardFinishes: Option[];
    proFinishes: Option[];
}

export function PreferencesForm(props: PreferencesFormProps) {
    const [upgrade, setUpgrade] = useState(props.initialUpgradeRequested);
    const usePro = props.alreadyPro || upgrade;
    const sizes = usePro ? props.proSizes : props.standardSizes;
    const finishes = usePro ? props.proFinishes : props.standardFinishes;

    const [size, setSize] = useState(props.initialSize ?? "");
    const [finish, setFinish] = useState(props.initialFinish ?? "");
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    const sizeValid = sizes.some((s) => s.value === size);
    const finishValid = finishes.some((f) => f.value === finish);

    function toggleUpgrade(next: boolean) {
        setUpgrade(next);
        setSaved(false);
        // switching tiers invalidates a finish that only exists on the other tier
        const nextFinishes = props.alreadyPro || next ? props.proFinishes : props.standardFinishes;
        if (!nextFinishes.some((f) => f.value === finish)) setFinish("");
        const nextSizes = props.alreadyPro || next ? props.proSizes : props.standardSizes;
        if (!nextSizes.some((s) => s.value === size)) setSize("");
    }

    function submit() {
        setError(null);
        startTransition(async () => {
            const result = await saveBuyerPreferences(props.token, { size, finish, upgradeToPro: upgrade });
            if (result.ok) {
                setSaved(true);
            } else {
                setError(result.error ?? "Something went wrong. Please try again.");
            }
        });
    }

    const optionButton = (opt: Option, selected: boolean, onClick: () => void) => (
        <button
            key={opt.value}
            type="button"
            onClick={() => {
                onClick();
                setSaved(false);
            }}
            className={`border px-5 py-4 text-left transition-all rounded-lg ${
                selected
                    ? "border-blue-400 bg-blue-500/10 text-white"
                    : "border-white/15 bg-white/[0.03] text-white/70 hover:border-white/40"
            }`}
        >
            <span className="block font-sans text-sm font-bold">{opt.label}</span>
            {opt.description && <span className="block font-sans text-xs text-white/40 mt-1">{opt.description}</span>}
        </button>
    );

    return (
        <div className="space-y-10">
            {/* SIZE */}
            <div>
                <h2 className="font-sans text-xs uppercase tracking-[0.25em] text-blue-400 font-bold mb-4">Key size</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {sizes.map((s) => optionButton(s, size === s.value, () => setSize(s.value)))}
                </div>
            </div>

            {/* FINISH */}
            <div>
                <h2 className="font-sans text-xs uppercase tracking-[0.25em] text-blue-400 font-bold mb-4">Finish</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {finishes.map((f) => optionButton(f, finish === f.value, () => setFinish(f.value)))}
                </div>
            </div>

            {/* PRO UPGRADE */}
            {props.upgradeEligible && (
                <div className={`border p-6 rounded-xl ${upgrade ? "border-amber-400/50 bg-amber-400/[0.06]" : "border-white/15 bg-white/[0.03]"}`}>
                    <label className="flex items-start gap-4 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={upgrade}
                            onChange={(e) => toggleUpgrade(e.target.checked)}
                            className="mt-1 h-5 w-5 accent-amber-400"
                        />
                        <span>
                            <span className="block font-sans font-bold text-white text-base">
                                Upgrade to DreamPlay One Pro for a flat $200 more
                            </span>
                            <span className="block font-sans text-sm text-white/60 leading-relaxed mt-2">
                                As an early supporter, you can move up to the $1,899 DreamPlay One Pro for $200 on top
                                of what you have already paid. The Pro adds premium finishes (Nightmare Black and Aztec
                                Gold), a graded hammer action, and a richer sound and LED system. See the full Pro
                                details on the{" "}
                                <a
                                    href="https://www.dreamplaypianos.com/product-information"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-amber-300 underline hover:text-amber-200"
                                >
                                    product information page
                                </a>
                                . Tick the box, save, and you can pay the $200 right here.
                            </span>
                        </span>
                    </label>

                    {/* Payment lives behind Save on purpose: paying before the
                        size and finish are on file would leave us with money
                        and no configuration to build. */}
                    {upgrade && !props.upgradePaidAt && (
                        <div className="mt-5 pt-5 border-t border-amber-400/20">
                            {saved ? (
                                <>
                                    <a
                                        href={props.upgradeCheckoutUrl}
                                        className="inline-flex items-center justify-center border border-amber-400 bg-amber-400 px-8 py-4 font-sans text-xs font-bold uppercase tracking-widest text-black transition-all hover:bg-amber-300 rounded-full"
                                    >
                                        Pay $200 and Upgrade
                                    </a>
                                    <p className="font-sans text-xs text-white/45 mt-3">
                                        Opens our secure Shopify checkout. Your place in line and your estimated ship
                                        date do not change.
                                    </p>
                                </>
                            ) : (
                                <p className="font-sans text-sm text-amber-200/80">
                                    Save your configuration below and the payment button appears here.
                                </p>
                            )}
                        </div>
                    )}

                    {props.upgradePaidAt && (
                        <p className="font-sans text-sm text-emerald-400 mt-5 pt-5 border-t border-amber-400/20">
                            Your $200 upgrade is paid. You are on the DreamPlay One Pro.
                        </p>
                    )}
                </div>
            )}

            {/* SUBMIT */}
            <div>
                <button
                    type="button"
                    disabled={!sizeValid || !finishValid || pending}
                    onClick={submit}
                    className="inline-flex items-center justify-center border border-white bg-white px-8 py-4 font-sans text-xs font-bold uppercase tracking-widest text-black transition-all hover:bg-neutral-200 rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {pending ? "Saving..." : "Save My Configuration"}
                </button>
                {saved && (
                    <p className="font-sans text-sm text-emerald-400 mt-4">
                        Saved. Your configuration is on file
                        {upgrade && !props.upgradePaidAt
                            ? ". Use the Pay $200 button above to finish your upgrade."
                            : "."}
                    </p>
                )}
                {error && <p className="font-sans text-sm text-red-400 mt-4">{error}</p>}
            </div>
        </div>
    );
}
