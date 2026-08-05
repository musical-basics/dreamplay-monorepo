"use client";

import { useState } from "react";
import { useAnalytics } from "@dreamplay/analytics/react";
import { subscribeToNewsletter } from "@/actions/email-actions";
import { trackEmailConversion } from "@/components/EmailTracker";

/**
 * Inline email capture for the "Small Hands Guide to Classical Piano Music"
 * lead magnet. Value-first framing (a genuinely useful free guide), no
 * discount language — mounted mid-page on the A/B landing layouts.
 *
 * Subscribes with the "Small Hands Guide" tag so the release campaign can
 * target exactly these signups, and fires the email_signup scoring event
 * (source: small_hands_guide) so captures attribute to the visitor's variant.
 */
export function SmallHandsGuideCapture({ tone = "light" }: { tone?: "light" | "dark" }) {
  const analytics = useAnalytics();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const dark = tone === "dark";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await subscribeToNewsletter({
        email,
        first_name: "",
        tags: ["Small Hands Guide"],
        temp_session_id:
          typeof localStorage !== "undefined"
            ? localStorage.getItem("dp_temp_session") || undefined
            : undefined,
      });
      if (!res.success) throw new Error(res.error || "Failed to subscribe");

      localStorage.setItem("dp_v2_subscribed", "true");
      localStorage.setItem("dp_user_email", email);
      if (res.id) localStorage.setItem("dp_subscriber_id", res.id);

      void analytics.track("email_signup", { source: "small_hands_guide", email });
      trackEmailConversion("conversion_t1", window.location.pathname);
      setStatus("done");
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  return (
    <section
      className={`px-6 py-16 md:py-20 ${dark ? "bg-[#0b0b0d] text-white" : "bg-[#f7f4ee] text-neutral-900"}`}
    >
      <div className="mx-auto max-w-2xl text-center">
        <p
          className={`font-sans text-[10px] uppercase tracking-[0.3em] md:text-xs ${dark ? "text-white/60" : "text-neutral-500"}`}
        >
          Free guide — releasing soon
        </p>
        <h2 className="mt-3 font-serif text-3xl md:text-4xl text-balance">
          The Small Hands Guide to Classical Piano Music
        </h2>
        <p
          className={`mt-4 font-sans text-sm leading-relaxed md:text-base ${dark ? "text-white/75" : "text-neutral-600"}`}
        >
          Which pieces flatter a smaller hand span, the fingerings that tame the wide
          stretches, and how to build a repertoire that works with your hands instead of
          against them. Written by the DreamPlay team — yours free the day it&apos;s released.
        </p>

        {status === "done" ? (
          <p
            className={`mt-8 font-sans text-sm md:text-base ${dark ? "text-emerald-300" : "text-emerald-700"}`}
          >
            You&apos;re on the list — the guide will land in your inbox the day it comes out.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className={`w-full sm:w-80 border px-4 py-3 font-sans text-sm outline-none transition-colors ${
                dark
                  ? "border-white/25 bg-transparent text-white placeholder:text-white/40 focus:border-white"
                  : "border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900"
              }`}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className={`px-8 py-3 font-sans text-xs uppercase tracking-widest transition-colors disabled:opacity-60 ${
                dark
                  ? "bg-white text-black hover:bg-white/90"
                  : "bg-neutral-900 text-white hover:bg-neutral-700"
              }`}
            >
              {status === "loading" ? "Sending…" : "Get the guide"}
            </button>
          </form>
        )}
        {status === "error" ? (
          <p className="mt-3 font-sans text-sm text-red-500">{errorMsg}</p>
        ) : null}
        <p className={`mt-4 font-sans text-xs ${dark ? "text-white/40" : "text-neutral-400"}`}>
          No spam — just the guide and occasional notes on playing with smaller hands.
        </p>
      </div>
    </section>
  );
}
