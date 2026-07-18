import { describe, expect, it } from "vitest";
import { injectOpenPixel, rewriteLinks } from "../tracking-links";

const base = { baseUrl: "https://link.test", subscriberId: "sid-1", campaignId: "cid-1" };

describe("rewriteLinks", () => {
    it("appends sid/cid to external links in append mode", () => {
        const out = rewriteLinks(`<a href="https://example.com/page?x=1">go</a>`, base);
        expect(out).toContain("sid=sid-1");
        expect(out).toContain("cid=cid-1");
        expect(out).toContain("x=1");
    });

    it("leaves unsubscribe links untouched", () => {
        const html = `<a href="https://link.test/unsubscribe?s=1&c=2&t=x">unsub</a>`;
        expect(rewriteLinks(html, base)).toBe(html);
    });

    it("wraps links in the click endpoint in redirect mode", () => {
        const out = rewriteLinks(`<a href="https://example.com/">go</a>`, { ...base, mode: "redirect" });
        expect(out).toContain(`https://link.test/api/email/click?c=cid-1&s=sid-1&u=`);
        expect(out).toContain(encodeURIComponent("https://example.com/"));
    });
});

describe("injectOpenPixel", () => {
    it("injects the pixel before </body>", () => {
        const out = injectOpenPixel("<body><p>hi</p></body>", base);
        expect(out).toMatch(/<img src="https:\/\/link.test\/api\/email\/open\?c=cid-1&s=sid-1"[^>]*\/><\/body>/);
    });

    it("appends when there is no body tag", () => {
        const out = injectOpenPixel("<p>hi</p>", base);
        expect(out).toContain("/api/email/open?c=cid-1&s=sid-1");
    });
});
