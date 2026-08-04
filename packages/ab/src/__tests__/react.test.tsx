/**
 * React bindings — rendered with react-dom/server (no DOM in this test env).
 * The cookie is only read in a client effect, so SSR output always reflects
 * the unassigned state; that IS the hydration contract we assert here. The
 * cookie-parsing itself is covered in cookies.test.ts.
 */

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { defineAbFunnel } from "../funnel";
import { AbFunnelProvider, useAbCta, useAbVariation } from "../react";

const config = defineAbFunnel({
  main: { route: "/premium-offer", cta: "/shop" },
  groups: [
    {
      group: "1",
      name: "x",
      active: true,
      variations: [{ key: "1a", route: "/legacy-home", cta: "/customize", active: true }],
    },
  ],
});

function Cta({ fallback }: { fallback: string }) {
  return <a href={useAbCta(fallback)}>cta</a>;
}

function ShowVariation() {
  const variation = useAbVariation();
  return <span>{variation?.key ?? "main-funnel"}</span>;
}

describe("AbFunnelProvider SSR contract", () => {
  it("renders the unassigned state on the server (cookie is read post-hydration)", () => {
    const html = renderToStaticMarkup(
      <AbFunnelProvider config={config} pathname="/premium-offer">
        <ShowVariation />
        <Cta fallback="/customize?product=pro" />
      </AbFunnelProvider>
    );
    expect(html).toContain("main-funnel");
    expect(html).toContain('href="/customize?product=pro"');
  });

  it("applies the manual main CTA on /main", () => {
    const html = renderToStaticMarkup(
      <AbFunnelProvider config={config} pathname="/main">
        <Cta fallback="/customize?product=pro" />
      </AbFunnelProvider>
    );
    expect(html).toContain('href="/shop?product=pro"');
  });

  it("falls back gracefully without a provider", () => {
    expect(renderToStaticMarkup(<Cta fallback="/customize" />)).toContain('href="/customize"');
    expect(renderToStaticMarkup(<ShowVariation />)).toContain("main-funnel");
  });
});
