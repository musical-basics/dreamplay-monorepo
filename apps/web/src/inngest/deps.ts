import { createResendSender, proxyEmailImages, type LogFn, type SendCampaignDeps } from "@dreamplay/email";
import { getAdminDb } from "@/lib/db";

/**
 * Production wiring for the send engine: service-role DB + real Resend sender
 * + the image proxy as the HTML preparation step.
 */
export function createSendDeps(): SendCampaignDeps {
    const db = getAdminDb();
    return {
        db,
        sender: createResendSender(),
        prepareHtml: async (html: string, log: LogFn) => {
            const { html: proxied, stats } = await proxyEmailImages(db, html, log);
            if (stats.failures.length > 0) {
                log("error", `${stats.failures.length} image(s) failed to proxy; recipients get original URLs`, {
                    failures: stats.failures,
                });
            }
            return proxied;
        },
    };
}
