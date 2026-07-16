"use client";

import { useVariant } from "@dreamplay/ab/react";

/**
 * Hero for /accessories — the smoke-accessories-hero experiment surface.
 * Variant "b" swaps the headline for the "upgrade your studio today" angle
 * already present in the sub-copy; control (or unassigned) keeps the
 * original. Assignment comes from the middleware-stamped cookie via
 * <ExperimentProvider> in page.tsx, so SSR and client render agree.
 */
export function AccessoriesHero() {
  const variant = useVariant("smoke-accessories-hero");

  return (
    <section className="max-w-7xl mx-auto px-6 mb-20 text-center">
      <h1 className="font-serif text-5xl md:text-7xl mb-6 tracking-tight">
        {variant === "b" ? (
          <>
            Upgrade Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Studio</span> Today
          </>
        ) : (
          <>
            Complete the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Ecosystem</span>
          </>
        )}
      </h1>
      <p className="text-lg text-gray-400 max-w-2xl mx-auto font-sans">
        The DreamPlay One Pro takes six months to hand-build. But you can upgrade your studio posture, workflow, and comfort today.
      </p>
    </section>
  );
}
