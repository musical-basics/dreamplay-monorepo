/**
 * Hero for /accessories. Previously the surface of the smoke-accessories-hero
 * pipeline test (retired with the D5 experiment registry — the funnel model
 * from D11 replaced it); the control headline won by default.
 */
export function AccessoriesHero() {
  return (
    <section className="max-w-7xl mx-auto px-6 mb-20 text-center">
      <h1 className="font-serif text-5xl md:text-7xl mb-6 tracking-tight">
        Complete the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Ecosystem</span>
      </h1>
      <p className="text-lg text-gray-400 max-w-2xl mx-auto font-sans">
        The DreamPlay One Pro takes six months to hand-build. But you can upgrade your studio posture, workflow, and comfort today.
      </p>
    </section>
  );
}
