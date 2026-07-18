/**
 * EmailSender — the single seam between the send pipeline and Resend.
 *
 * Implemented against Resend's HTTP API directly (rather than the SDK) so the
 * HTTP status code is available for the 429/5xx retry policy, and so tests can
 * inject a fake sender with zero network.
 */

import { HttpStatusError } from "./retry";

export interface SendEmailPayload {
    from: string;
    to: string;
    subject: string;
    html: string;
    headers?: Record<string, string>;
}

export interface SendEmailResult {
    /** Resend email id (null when the provider doesn't return one). */
    id: string | null;
}

export interface EmailSender {
    /**
     * Send one email. MUST throw HttpStatusError(status) on non-2xx so the
     * retry layer can distinguish transient (429/5xx) from permanent (4xx).
     */
    send(payload: SendEmailPayload): Promise<SendEmailResult>;
}

const RESEND_API_URL = "https://api.resend.com/emails";

export function createResendSender(options: { apiKey?: string } = {}): EmailSender {
    const apiKey = options.apiKey ?? process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

    return {
        async send(payload: SendEmailPayload): Promise<SendEmailResult> {
            const res = await fetch(RESEND_API_URL, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new HttpStatusError(res.status, `Resend responded ${res.status}: ${text.slice(0, 500)}`);
            }
            const data = (await res.json().catch(() => ({}))) as { id?: string };
            return { id: data.id ?? null };
        },
    };
}

/** Default From used when neither the campaign nor the caller specifies one. */
export function defaultFromAddress(): string {
    return process.env.RESEND_FROM_EMAIL || "DreamPlay <hello@email.dreamplaypianos.com>";
}
