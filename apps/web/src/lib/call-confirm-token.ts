import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed links for /confirm-call.
 *
 * Kept OUT of call-scheduling.ts on purpose: that module is imported by a
 * client component, and pulling node:crypto into a client bundle breaks the
 * build. Only server code imports this file.
 *
 * The token is scoped to ONE call request: `<requestId>.<hmac>`, verified in
 * constant time. Signing the request id rather than the buyer id means a
 * link stops working the moment that request is replaced.
 */

function secret(): string {
    const value = process.env.EMAIL_UNSUBSCRIBE_SECRET;
    if (!value) throw new Error("EMAIL_UNSUBSCRIBE_SECRET is not set: refusing to build/verify confirm links.");
    return value;
}

export function confirmToken(requestId: string): string {
    return createHmac("sha256", secret()).update(`call-confirm:${requestId}`).digest("hex").slice(0, 32);
}

export function buildConfirmPath(requestId: string): string {
    return `/confirm-call?t=${encodeURIComponent(`${requestId}.${confirmToken(requestId)}`)}`;
}

export function parseConfirmToken(t: string | null | undefined): string | null {
    if (!t) return null;
    const dot = t.lastIndexOf(".");
    if (dot <= 0) return null;
    const id = t.slice(0, dot);
    const expected = Buffer.from(confirmToken(id));
    const got = Buffer.from(t.slice(dot + 1));
    if (expected.length !== got.length) return null;
    return timingSafeEqual(expected, got) ? id : null;
}
