import { describe, expect, it } from "vitest";
import { renderConditionalBlocks, renderTemplate } from "../render-template";

describe("renderTemplate", () => {
    it("replaces {{var}} placeholders", () => {
        expect(renderTemplate("<p>{{greeting}} {{name}}</p>", { greeting: "Hi", name: "Ada" })).toBe("<p>Hi Ada</p>");
    });

    it("replaces missing values with empty string", () => {
        expect(renderTemplate("<p>{{name}}</p>", { name: "" })).toBe("<p></p>");
    });

    it("keeps {{#if tag_X}} content when the subscriber has the tag (case-insensitive)", () => {
        const html = "A{{#if tag_Europe}}EU-only{{/endif}}B";
        expect(renderTemplate(html, {}, ["europe"])).toBe("AEU-onlyB");
        expect(renderTemplate(html, {}, ["Europe", "other"])).toBe("AEU-onlyB");
    });

    it("strips {{#if tag_X}} content when the subscriber lacks the tag", () => {
        const html = "A{{#if tag_Europe}}EU-only{{/endif}}B";
        expect(renderTemplate(html, {}, [])).toBe("AB");
        expect(renderTemplate(html, {}, ["USA"])).toBe("AB");
    });

    it("accepts {{/if}} as a closer too", () => {
        expect(renderTemplate("A{{#if tag_vip}}gold{{/if}}B", {}, ["vip"])).toBe("AgoldB");
    });

    it("handles multiple conditional blocks independently", () => {
        const html = "{{#if tag_a}}A{{/endif}}{{#if tag_b}}B{{/endif}}";
        expect(renderTemplate(html, {}, ["a"])).toBe("A");
    });

    it("preserves conditional blocks when evaluateConditionals=false (global pass)", () => {
        const html = "X{{#if tag_a}}A{{/endif}}Y";
        expect(renderTemplate(html, {}, [], { evaluateConditionals: false })).toBe(html);
        // ...and the per-recipient pass can then evaluate them.
        expect(renderConditionalBlocks(html, ["a"])).toBe("XAY");
    });

    it("injects object-fit for _fit companion variables", () => {
        const html = `<img src="{{hero_img}}" style="width:100%">`;
        const out = renderTemplate(html, { hero_img: "https://x/y.jpg", hero_img_fit: "cover" });
        expect(out).toContain("object-fit: cover");
        expect(out).toContain("https://x/y.jpg");
    });

    it("adds a style attribute when the img has none", () => {
        const out = renderTemplate(`<img src="{{hero_img}}">`, { hero_img: "https://x/y.jpg", hero_img_fit: "contain" });
        expect(out).toContain(`style="object-fit: contain; max-width: 100%; height: auto;"`);
    });
});
