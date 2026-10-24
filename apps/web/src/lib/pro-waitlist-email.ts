/**
 * Automatic confirmation email for the DreamPlay One Pro waitlist (D21).
 *
 * Joining the waitlist (the sold-out card on /dreamplay-pro) tags the
 * subscriber "Pro Waitlist"; subscribeToNewsletter then emits
 * PRO_WAITLIST_EVENT and the Inngest function in
 * inngest/waitlist-functions.ts sends the template campaign once per person.
 *
 * The copy lives in the campaigns table (seeded by
 * scripts/email/setup-pro-waitlist-email.mjs, matched by send_key
 * PRO_WAITLIST_TEMPLATE_KEY), so it can be edited without a deploy.
 */

export const PRO_WAITLIST_TAG = "Pro Waitlist";
export const PRO_WAITLIST_EVENT = "email/pro-waitlist.joined";
export const PRO_WAITLIST_TEMPLATE_KEY = "pro-waitlist-confirmation";
/** app_settings key: { enabled: boolean }. Ships OFF. */
export const PRO_WAITLIST_SETTING = "automation:pro-waitlist-confirmation";

export interface ProWaitlistSetting {
    /** Master switch. Off until Lionel approves the [TEST] copy. */
    enabled: boolean;
}

export function parseProWaitlistSetting(value: unknown): ProWaitlistSetting {
    if (!value || typeof value !== "object") return { enabled: false };
    return { enabled: (value as Record<string, unknown>).enabled === true };
}

export function hasProWaitlistTag(tags: string[] | undefined): boolean {
    return (tags ?? []).some((tag) => tag.trim() === PRO_WAITLIST_TAG);
}

/**
 * Per-subscriber idempotency key: a retry, a re-submitted form or a second
 * event reuses the same child campaign, and sent_history's UNIQUE
 * (campaign_id, subscriber_id) turns any repeat into a no-op. One
 * confirmation per person, forever.
 */
export function proWaitlistSendKey(subscriberId: string): string {
    return `${PRO_WAITLIST_TEMPLATE_KEY}:${subscriberId}`;
}
