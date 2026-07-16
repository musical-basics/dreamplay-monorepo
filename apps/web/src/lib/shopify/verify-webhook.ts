import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify a Shopify webhook HMAC signature against the raw request body.
 *
 * The signing secret depends on how the webhook is registered:
 *   - App / Admin-API-registered webhooks  -> signed with the app's client secret (shpss_...)
 *   - Admin UI (Settings -> Notifications) -> signed with the store webhook secret shown there
 * Set SHOPIFY_WEBHOOK_SECRET to whichever one applies to the registration you used.
 */
export function verifyShopifyWebhook(rawBody: string, hmacHeader: string | null): boolean {
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!secret || !hmacHeader) return false;
    if (secret.startsWith("PLACEHOLDER")) return false;

    const computed = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
    const a = Buffer.from(computed);
    const b = Buffer.from(hmacHeader);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
}
