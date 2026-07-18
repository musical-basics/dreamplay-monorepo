/**
 * Click-link rewriting and open-pixel injection.
 *
 * The tracking base URL is chosen to ALIGN with the From-address domain:
 * a mismatch between the visible sender and embedded link domains is a strong
 * phishing signal for mailbox providers and tanks deliverability (see legacy
 * send-stream notes). All tracking hosts CNAME to this same app; the paths
 * are /api/email/open, /api/email/click, /unsubscribe.
 */

const FROM_DOMAIN_TO_TRACKING_BASE: Record<string, string> = {
    "musicalbasics.com": "https://link.musicalbasics.com",
    "ultimatepianist.com": "https://link.ultimatepianist.com",
    "dreamplaypianos.com": "https://email.dreamplaypianos.com",
    "email.dreamplaypianos.com": "https://email.dreamplaypianos.com",
};

/**
 * Pick the tracking base URL for a send. Falls back to TRACKING_BASE_URL
 * (default: same app via NEXT_PUBLIC_APP_URL) when the From domain has no
 * dedicated tracking host.
 */
export function pickTrackingBaseUrl(fromEmail: string | null | undefined): string {
    if (fromEmail) {
        const domain = fromEmail.split("@").pop()?.toLowerCase().trim();
        if (domain && FROM_DOMAIN_TO_TRACKING_BASE[domain]) {
            return FROM_DOMAIN_TO_TRACKING_BASE[domain];
        }
    }
    return (
        process.env.TRACKING_BASE_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://email.dreamplaypianos.com"
    );
}

export type ClickTrackingMode = "append" | "redirect";

export interface RewriteLinksOptions {
    baseUrl: string;
    subscriberId: string;
    campaignId: string;
    /**
     * - "append" (default): sid/cid appended to each href; destination-side
     *   analytics read them. No server hop.
     * - "redirect": link wrapped in /api/email/click so a click event is
     *   captured server-side before redirecting. WARNING: on bulk sends,
     *   redirect mode triggered Gmail bulk-flagging (2026-05-03 incident,
     *   open rates collapsed from ~42% to <2%). Use append for bulk.
     */
    mode?: ClickTrackingMode;
}

/**
 * Append sid/cid params to every external http(s) link (and optionally wrap
 * in the click-redirect endpoint). Unsubscribe links are left untouched.
 */
export function rewriteLinks(html: string, options: RewriteLinksOptions): string {
    const mode = options.mode ?? "append";
    return html.replace(/href=(["'])(https?:\/\/[^"']+)\1/g, (match, quote: string, url: string) => {
        if (url.includes("/unsubscribe") || url.includes("/api/email/unsubscribe")) return match;
        let withParams: string;
        try {
            const parsed = new URL(url);
            parsed.searchParams.set("sid", options.subscriberId);
            parsed.searchParams.set("cid", options.campaignId);
            withParams = parsed.toString();
        } catch {
            const sep = url.includes("?") ? "&" : "?";
            withParams = `${url}${sep}sid=${options.subscriberId}&cid=${options.campaignId}`;
        }
        if (mode === "redirect") {
            const redirectUrl =
                `${options.baseUrl}/api/email/click?c=${encodeURIComponent(options.campaignId)}` +
                `&s=${encodeURIComponent(options.subscriberId)}&u=${encodeURIComponent(withParams)}`;
            return `href=${quote}${redirectUrl}${quote}`;
        }
        return `href=${quote}${withParams}${quote}`;
    });
}

/** Inject the 1x1 open-tracking pixel just before </body> (or append). */
export function injectOpenPixel(
    html: string,
    options: { baseUrl: string; subscriberId: string; campaignId: string }
): string {
    const pixel = `<img src="${options.baseUrl}/api/email/open?c=${encodeURIComponent(
        options.campaignId
    )}&s=${encodeURIComponent(options.subscriberId)}" width="1" height="1" alt="" style="display:none !important;width:1px;height:1px;opacity:0;" />`;
    if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${pixel}</body>`);
    return html + pixel;
}
