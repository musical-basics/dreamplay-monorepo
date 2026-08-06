import type { Tables } from "@dreamplay/db";

/**
 * Transactional payment email sent automatically when an eligible buyer
 * requests the $200 DreamPlay One Pro upgrade on /order-preferences.
 *
 * The checkout link is a cart permalink for the dedicated upgrade product
 * (variant PRO_UPGRADE_VARIANT_ID, $200 flat, shipping not required),
 * cart-clear wrapped like the site's other checkout links, with an order
 * note tying the payment back to the reservation.
 */

type Buyer = Tables<"buyers">;

export const PRO_UPGRADE_VARIANT_ID = "53858415739194";
const STORE_DOMAIN = "dreamplay-pianos.myshopify.com";

export function proUpgradeCheckoutUrl(buyer: Pick<Buyer, "shopify_order_number" | "email">): string {
    const note = `Pro upgrade | reservation ${buyer.shopify_order_number ?? buyer.email}`;
    const permalink = `/cart/${PRO_UPGRADE_VARIANT_ID}:1?note=${encodeURIComponent(note)}`;
    return `https://${STORE_DOMAIN}/cart/clear?return_to=${encodeURIComponent(permalink)}`;
}

export function buildProUpgradeEmail(
    buyer: Buyer,
    firstName: string,
): { subject: string; html: string } {
    const checkoutUrl = proUpgradeCheckoutUrl(buyer);
    const subject = "Complete your DreamPlay One Pro upgrade";
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body, html { margin:0; padding:0; background:#0b0b0b; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color:#f3efe7; }
    table { border-collapse:collapse; }
    .muted { color:#c8bea0; }
    .gold { color:#d8b25c; }
    @media only screen and (max-width:620px) { .pad { padding-left:24px !important; padding-right:24px !important; } }
  </style>
</head>
<body>
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">One step left: complete your $200 Pro upgrade payment and your reservation moves up to the DreamPlay One Pro.</div>
  <table role="presentation" width="100%" style="background:#0b0b0b;">
    <tr><td align="center">
      <table role="presentation" width="640" style="max-width:640px; background:#111111;">
        <tr>
          <td align="center" style="padding:28px 20px 18px 20px; background:#0b0b0b;" class="gold">D R E A M P L A Y</td>
        </tr>
        <tr>
          <td class="pad" style="padding:36px 56px 8px 56px;">
            <p class="gold" style="margin:0 0 14px 0; font-size:11px; letter-spacing:4px; text-transform:uppercase;">Your Pro Upgrade</p>
            <h1 style="margin:0 0 20px 0; font-size:32px; line-height:1.25; font-weight:400; color:#f7f3ea;">One step left, ${firstName}.</h1>
            <p class="muted" style="margin:0 0 16px 0; font-size:16px; line-height:1.85;">We received your request to upgrade your reservation to the DreamPlay One Pro. As an early supporter, your upgrade is a flat <strong style="color:#f7f3ea;">$200</strong> on top of what you have already paid.</p>
            <p class="muted" style="margin:0 0 16px 0; font-size:16px; line-height:1.85;">The Pro adds a graded hammer action, a richer sound and LED system, and premium finishes. Complete the payment below and your reservation is upgraded.</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:20px 56px 12px 56px;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td align="center" bgcolor="#d8b25c" style="border-radius:2px;">
                <a href="${checkoutUrl}" style="display:inline-block; padding:17px 44px; font-family: Arial, Helvetica, sans-serif; font-size:14px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#1a1505; text-decoration:none;">Complete My Upgrade &nbsp;&middot;&nbsp; $200</a>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:24px 56px 40px 56px;">
            <p class="muted" style="margin:0 0 14px 0; font-size:15px; line-height:1.8;"><strong style="color:#f7f3ea;">What happens after payment:</strong> we mark your reservation as a DreamPlay One Pro, and you pick your Pro finish (Nightmare Black, Aztec Gold, or Midnight Black with standard keys) on your configuration page. Your estimated ship date does not change.</p>
            <p class="muted" style="margin:0 0 24px 0; font-size:15px; line-height:1.8;">Changed your mind? Just ignore this email, or reply and we will remove the upgrade request. Nothing is charged until you complete the payment.</p>
            <p style="margin:0; font-size:16px; line-height:1.8; color:#f7f3ea;">Lionel Yu<br/><span class="muted">Founder, DreamPlay Pianos</span></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
    return { subject, html };
}

/**
 * Fire the payment email via Resend. Never throws: preference saving must
 * succeed even if the email fails (the request is still visible on
 * /admin/buyers for manual follow-up).
 */
export async function sendProUpgradeEmail(buyer: Buyer, firstName: string): Promise<boolean> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || buyer.email.endsWith("@no-email.invalid")) return false;
    try {
        const { subject, html } = buildProUpgradeEmail(buyer, firstName);
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                from: "Lionel from DreamPlay <lionel@email.dreamplaypianos.com>",
                to: [buyer.email],
                reply_to: "support@dreamplaypianos.com",
                subject,
                html,
            }),
        });
        return res.ok;
    } catch {
        return false;
    }
}
