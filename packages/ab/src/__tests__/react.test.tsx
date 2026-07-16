/**
 * React bindings — rendered with react-dom/server (no DOM needed).
 */

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ExperimentProvider, useVariant, Variant } from "../react";

function ShowVariant({ experiment }: { experiment: string }) {
  const variant = useVariant(experiment);
  return <span>{variant ?? "unassigned"}</span>;
}

describe("ExperimentProvider / useVariant", () => {
  it("exposes assignments to hooks", () => {
    const html = renderToStaticMarkup(
      <ExperimentProvider assignments={{ hero: "b" }}>
        <ShowVariant experiment="hero" />
        <ShowVariant experiment="missing" />
      </ExperimentProvider>
    );
    expect(html).toBe("<span>b</span><span>unassigned</span>");
  });

  it("returns undefined without a provider", () => {
    const html = renderToStaticMarkup(<ShowVariant experiment="hero" />);
    expect(html).toBe("<span>unassigned</span>");
  });
});

describe("<Variant match>", () => {
  const tree = (
    <ExperimentProvider assignments={{ hero: "b" }}>
      <Variant experiment="hero" match="b">
        <p>b-content</p>
      </Variant>
      <Variant experiment="hero" match="a" fallback={<p>fallback</p>}>
        <p>a-content</p>
      </Variant>
      <Variant experiment="hero" match={["b", "c"]}>
        <p>multi</p>
      </Variant>
      <Variant experiment="unassigned_exp" match="a">
        <p>never</p>
      </Variant>
    </ExperimentProvider>
  );

  it("renders children on match, fallback otherwise, nothing when unassigned", () => {
    const html = renderToStaticMarkup(tree);
    expect(html).toContain("b-content");
    expect(html).not.toContain("a-content");
    expect(html).toContain("fallback");
    expect(html).toContain("multi");
    expect(html).not.toContain("never");
  });
});
