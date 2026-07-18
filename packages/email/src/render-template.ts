/**
 * Template rendering: {{variable}} substitution plus conditional tag blocks.
 *
 * Ported from dreamplay-email-3 `src/lib/render-template.ts` with the dead
 * exploratory regex passes removed (the legacy file carried an unreachable
 * second implementation of the object-fit injection).
 */

/** Escape a string for literal use inside a RegExp. */
function escapeRe(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Evaluate `{{#if tag_X}} ... {{/endif}}` blocks against the subscriber's
 * tags. Content is kept when the subscriber has the tag (case-insensitive),
 * stripped otherwise. Also accepts the `{{/if}}` closer.
 */
export function renderConditionalBlocks(html: string, subscriberTags: string[]): string {
    return html.replace(
        /\{\{#if\s+tag_(\w+)\}\}([\s\S]*?)\{\{\/(?:endif|if)\}\}/gi,
        (_match, tagName: string, content: string) => {
            const hasTag = subscriberTags.some((t) => t.toLowerCase() === tagName.toLowerCase());
            return hasTag ? content.trim() : "";
        }
    );
}

/** Rewrite (or add) a style attribute on a single <img ...> tag string. */
function applyFitToImgTag(imgTag: string, fitValue: string): string {
    const styleMatch = imgTag.match(/style=(["'])(.*?)\1/i);
    if (styleMatch) {
        return imgTag.replace(/style=(["'])(.*?)\1/i, (_m, quote: string, styleContent: string) => {
            let newStyle = styleContent;
            if (/object-fit:/i.test(newStyle)) {
                newStyle = newStyle.replace(/object-fit:\s*[\w-]+/i, `object-fit: ${fitValue}`);
            } else {
                newStyle = `${newStyle}; object-fit: ${fitValue}`;
            }
            // Email clients strip classes; make sure dimensions are inline too.
            if (!newStyle.includes("max-width:")) newStyle = `${newStyle}; max-width: 100%`;
            if (!newStyle.includes("height:")) newStyle = `${newStyle}; height: auto`;
            return `style=${quote}${newStyle}${quote}`;
        });
    }
    const styleAttr = ` style="object-fit: ${fitValue}; max-width: 100%; height: auto;"`;
    if (imgTag.endsWith("/>")) return `${imgTag.slice(0, -2)}${styleAttr} />`;
    return `${imgTag.slice(0, -1)}${styleAttr}>`;
}

/**
 * Render a template by replacing `{{key}}` placeholders with values from
 * `assets`, after evaluating `{{#if tag_X}}` conditional blocks against
 * `subscriberTags`.
 *
 * A companion `<key>_fit` asset injects `object-fit` into `<img>` tags whose
 * `src` is the `{{key}}` placeholder (run before substitution so the tag can
 * still be located by its placeholder).
 */
export function renderTemplate(
    html: string,
    assets: Record<string, string>,
    subscriberTags: string[] = [],
    options: {
        /**
         * Set false for the audience-wide (global) render pass so per-subscriber
         * {{#if tag_X}} blocks survive until the per-recipient pass. (The legacy
         * pipeline evaluated conditionals in the global pass with no tags, which
         * silently stripped them for everyone.)
         */
        evaluateConditionals?: boolean;
    } = {}
): string {
    const evaluateConditionals = options.evaluateConditionals ?? true;
    let result = evaluateConditionals ? renderConditionalBlocks(html, subscriberTags) : html;

    // Pass 1: object-fit injection for image variables with a paired `_fit`.
    for (const key of Object.keys(assets)) {
        const fitValue = assets[`${key}_fit`];
        if (!fitValue) continue;
        const imgTagRegex = new RegExp(`(<img[^>]*src=["']\\{\\{${escapeRe(key)}\\}\\}["'][^>]*>)`, "gi");
        result = result.replace(imgTagRegex, (match) => applyFitToImgTag(match, fitValue));
    }

    // Pass 2: standard {{key}} substitution.
    for (const [key, value] of Object.entries(assets)) {
        result = result.replace(new RegExp(`\\{\\{${escapeRe(key)}\\}\\}`, "g"), value || "");
    }

    return result;
}

/**
 * Subscriber-owned merge tags that must NOT be filled during the global
 * (audience-wide) render pass — they are resolved per recipient.
 * Mirrors the legacy `STANDARD_TAGS` list from variable-rules.ts.
 */
export const STANDARD_TAGS: string[] = [
    "first_name",
    "last_name",
    "email",
    "subscriber_id",
    "location_city",
    "location_country",
    "discount_code",
    "unsubscribe_url",
    "unsubscribe_link",
    "unsubscribe_link_url",
];
