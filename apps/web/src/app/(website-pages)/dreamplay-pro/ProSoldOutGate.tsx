"use client";

import { useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useAbVariation } from "@dreamplay/ab/react";
import { useAnalytics } from "@dreamplay/analytics/react";
import { subscribeToNewsletter } from "@/actions/email-actions";
import { trackEmailConversion } from "@/components/EmailTracker";
import { offerModeForVariant, type OfferMode } from "@/lib/ab-offer";

/**
 * Sold-out gating for /dreamplay-pro in the Love-vs-Spec 2x2 test
 * (docs/plan/AB-TEST-LOVE-VS-SPEC.md).
 *
 * Visitors on the deposit249 offer (everyone except test cells 6a/7a since
 * D15; see lib/ab-offer.ts) see the Pro as SOLD OUT:
 * a banner plus a waitlist capture card replace the purchase path. Everyone
 * else (standard mode) sees the page exactly as before; every component in
 * this file renders the unmodified standard markup in that case.
 *
 * The waitlist capture follows the SmallHandsGuideCapture pattern: it calls
 * the central subscribeToNewsletter action (which notifies support@ and
 * records the tags) with the "Pro Waitlist" tag, then fires the email_signup
 * scoring event with source "pro_waitlist" so captures attribute to the
 * visitor's variant.
 */

function useProOfferMode(): OfferMode {
    const variation = useAbVariation();
    return offerModeForVariant(variation?.key);
}

/**
 * SOLD OUT banner + waitlist capture card. Renders nothing in standard mode.
 * Mount at the top of <main> so the banner sits directly under the navbar and
 * /dreamplay-pro#waitlist lands on the card.
 */
export function ProSoldOutGate() {
    const mode = useProOfferMode();
    if (mode !== "deposit249") return null;

    return (
        <>
            <a
                href="#waitlist"
                className="block bg-[#c5a059] px-6 py-3 text-center font-sans text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-950 transition hover:bg-white"
            >
                Sold out. The current Pro production run is fully reserved. Join the waitlist
            </a>
            <ProWaitlistCard />
        </>
    );
}

function ProWaitlistCard() {
    const analytics = useAnalytics();
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!email || status === "loading") return;
        setStatus("loading");
        setErrorMsg("");
        try {
            const res = await subscribeToNewsletter({
                email,
                first_name: "",
                tags: ["Pro Waitlist"],
                temp_session_id:
                    typeof localStorage !== "undefined"
                        ? localStorage.getItem("dp_temp_session") || undefined
                        : undefined,
            });
            if (!res.success) throw new Error(res.error || "Failed to subscribe");

            localStorage.setItem("dp_v2_subscribed", "true");
            localStorage.setItem("dp_user_email", email);
            if (res.id) localStorage.setItem("dp_subscriber_id", res.id);

            void analytics.track("email_signup", { source: "pro_waitlist", email });
            trackEmailConversion("conversion_t1", window.location.pathname);
            setStatus("done");
        } catch (error) {
            console.error(error);
            setErrorMsg(error instanceof Error ? error.message : "Something went wrong. Please try again.");
            setStatus("error");
        }
    };

    return (
        <section id="waitlist" className="scroll-mt-20 border-b border-white/10 bg-neutral-950 px-6 py-16 md:px-16">
            <div className="mx-auto max-w-2xl border border-[#c5a059]/50 bg-neutral-900/40 p-8 text-center md:p-12">
                <p className="mb-4 font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-[#c5a059]">
                    Pro Waitlist
                </p>
                <h2 className="mb-4 font-serif text-3xl md:text-4xl">The Pro is sold out</h2>
                <p className="mx-auto mb-8 max-w-md font-sans text-sm font-light leading-relaxed text-white/60">
                    The current production run is fully spoken for. Leave your email and you are first in line
                    when Pro production reopens.
                </p>

                {status === "done" ? (
                    <p className="font-sans text-sm leading-relaxed text-white/80">
                        You are on the waitlist. We will email you when Pro production reopens.
                    </p>
                ) : (
                    <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@email.com"
                            className="w-full border border-white/20 bg-transparent px-4 py-4 font-sans text-sm text-white placeholder-white/40 outline-none transition-all focus:border-white focus:ring-1 focus:ring-white"
                        />
                        <button
                            type="submit"
                            disabled={status === "loading"}
                            className="shrink-0 bg-white px-6 py-4 font-sans text-xs font-bold uppercase tracking-[0.2em] text-neutral-950 transition hover:bg-[#c5a059] disabled:opacity-70"
                        >
                            {status === "loading" ? "Joining..." : "Join the Pro Waitlist"}
                        </button>
                    </form>
                )}

                {status === "error" && errorMsg && (
                    <p className="mt-4 font-sans text-xs text-red-400">{errorMsg}</p>
                )}
            </div>
        </section>
    );
}

/**
 * Buy/checkout CTA. Standard mode renders the page's original <Link>
 * unchanged; deposit249 mode replaces it with an anchor to the #waitlist card
 * using the same styling.
 */
export function ProBuyCta({
    href,
    className,
    children,
}: {
    href: string;
    className?: string;
    children: ReactNode;
}) {
    const mode = useProOfferMode();
    if (mode === "deposit249") {
        return (
            <a href="#waitlist" className={className}>
                Join the Pro Waitlist
            </a>
        );
    }
    return (
        <Link href={href} className={className}>
            {children}
        </Link>
    );
}

/**
 * Renders `standard` as-is for standard-mode visitors, `soldOut` for
 * deposit249 visitors. Used for the handful of purchase-framing copy blocks
 * that would contradict the SOLD OUT state.
 */
export function ProOfferSwitch({ standard, soldOut }: { standard: ReactNode; soldOut: ReactNode }) {
    const mode = useProOfferMode();
    return <>{mode === "deposit249" ? soldOut : standard}</>;
}
