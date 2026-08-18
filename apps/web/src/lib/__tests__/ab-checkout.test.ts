import { describe, expect, it, afterEach } from "vitest";

import { withAbCheckoutMarkers } from "../ab-checkout";

/**
 * Regression cover for the Pro-upgrade attribution gap (found 2026-08-18):
 * every August Pro-upgrade purchase reached `events` with session_id null and
 * no ab_variant, because the checkout URL is built server-side and so never
 * picked up the cookie-derived markers.
 */

const STORE = "https://dreamplay-pianos.myshopify.com";
const VARIANT = "53858415739194";

function proUrl(note: string): string {
  const permalink = `/cart/${VARIANT}:1?note=${encodeURIComponent(note)}`;
  return `${STORE}/cart/clear?return_to=${encodeURIComponent(permalink)}`;
}

/** Decode the note back out of the nested cart-clear URL. */
function noteOf(url: string): string {
  const returnTo = new URL(url).searchParams.get("return_to")!;
  return new URL(returnTo, STORE).searchParams.get("note") ?? "";
}

function setCookie(value: string) {
  Object.defineProperty(globalThis, "document", {
    value: { cookie: value },
    configurable: true,
  });
}

afterEach(() => {
  Reflect.deleteProperty(globalThis as object, "document");
});

describe("withAbCheckoutMarkers", () => {
  it("appends variant and session while preserving the reservation note", () => {
    setCookie("dp_ab=7b");
    const out = withAbCheckoutMarkers(proUrl("Pro upgrade | reservation #1042"), "sess-abcdef12");

    expect(noteOf(out)).toBe(
      "Pro upgrade | reservation #1042 | ab_variant:7b | dp_session:sess-abcdef12",
    );
  });

  it("carries the email campaign markers through", () => {
    const sid = "11111111-2222-3333-4444-555555555555";
    const cid = "66666666-7777-8888-9999-000000000000";
    setCookie(`dp_ab=6a; dp_sid=${sid}; dp_cid=${cid}`);

    const note = noteOf(withAbCheckoutMarkers(proUrl("Pro upgrade"), "sess-abcdef12"));
    expect(note).toContain(`dp_sid:${sid}`);
    expect(note).toContain(`dp_cid:${cid}`);
  });

  it("is idempotent: a second call never stamps a second ab_variant", () => {
    setCookie("dp_ab=7b");
    const once = withAbCheckoutMarkers(proUrl("Pro upgrade"), "sess-abcdef12");
    const twice = withAbCheckoutMarkers(once, "sess-abcdef12");

    expect(twice).toBe(once);
    expect(noteOf(twice).match(/ab_variant:/g)).toHaveLength(1);
  });

  it("returns the URL untouched when there are no markers to add", () => {
    setCookie("");
    const url = proUrl("Pro upgrade");
    expect(withAbCheckoutMarkers(url, undefined)).toBe(url);
  });

  it("never throws on a malformed URL — a payment must not be blocked", () => {
    setCookie("dp_ab=7b");
    expect(withAbCheckoutMarkers("not a url", "sess-abcdef12")).toBe("not a url");
  });

  it("produces a note the orders webhook parser actually matches", () => {
    setCookie("dp_ab=7b");
    const note = noteOf(withAbCheckoutMarkers(proUrl("Pro upgrade"), "sess-abcdef12"));

    // Same expressions as apps/web/src/app/api/webhooks/shopify/orders/route.ts
    expect(note.match(/ab_variant:(\d+[a-z])/)?.[1]).toBe("7b");
    expect(note.match(/dp_session:([A-Za-z0-9_-]{8,64})/)?.[1]).toBe("sess-abcdef12");
  });
});
