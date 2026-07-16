'use server';

import { headers } from "next/headers";

interface SubscribePayload {
    email: string;
    first_name?: string;
    tags?: string[];
    temp_session_id?: string;
}

interface SubscribeResponse {
    success: boolean;
    error?: string;
    id?: string;
}

// External subscribe webhook (deployed email app). The email app's trigger
// system handles sending automated emails. Env-driven so staging/preview can
// point elsewhere; defaults to the production endpoint.
const SUBSCRIBE_WEBHOOK_URL =
    process.env.EMAIL_SUBSCRIBE_WEBHOOK_URL ||
    "https://email.dreamplaypianos.com/api/webhooks/subscribe";

export async function subscribeToNewsletter(payload: SubscribePayload): Promise<SubscribeResponse> {
    try {
        const headerStore = await headers();
        const city = headerStore.get("x-vercel-ip-city") || "Unknown";
        const country = headerStore.get("x-vercel-ip-country") || "Unknown";
        const ip = headerStore.get("x-forwarded-for") || "Unknown";

        const apiPayload = {
            ...payload,
            first_name: payload.first_name || "",
            city,
            country,
            ip_address: ip,
            temp_session_id: payload.temp_session_id
        };

        // Subscribe via email repo webhook
        // The email repo's trigger system handles sending automated emails
        const response = await fetch(SUBSCRIBE_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(apiPayload)
        });

        if (!response.ok) {
            let errorMessage = "Failed to subscribe";
            try {
                const errorData = await response.json();

                // If the error is "email already exists", treat as success
                if (response.status === 400 || response.status === 422) {
                    console.log("Subscriber likely already exists, proceeding anyway.");
                    return { success: true };
                }

                if (errorData.error) errorMessage = errorData.error;
            } catch {
                // failed to parse json
            }
            console.error('Subscription API error:', response.status, errorMessage);
            return { success: false, error: errorMessage };
        }

        const data = await response.json();
        return { success: true, id: data.id };

    } catch (error: unknown) {
        console.error('Server Action subscription error:', error);
        return { success: false, error: error instanceof Error ? error.message : "Internal server error" };
    }
}

// ─── Contact Form: subscribes email + sends notification to support ───

interface ContactFormPayload {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export async function submitContactForm(payload: ContactFormPayload): Promise<SubscribeResponse> {
    try {
        // 1. Subscribe the email to the audience with "contact-form" tag
        const subscribeResult = await subscribeToNewsletter({
            email: payload.email,
            first_name: payload.name,
            tags: ["contact-form"],
        });

        // Don't fail if subscribe fails — still send the notification
        if (!subscribeResult.success) {
            console.error("Contact form subscribe failed (non-blocking):", subscribeResult.error);
        }

        // 2. Send notification email to support via Resend
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey) {
            const { Resend } = await import("resend");
            const resend = new Resend(resendApiKey);

            await resend.emails.send({
                from: "DreamPlay <lionel@email.dreamplaypianos.com>",
                to: "support@dreamplaypianos.com",
                replyTo: payload.email,
                subject: `[Contact Form] ${payload.subject} — from ${payload.name}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="margin-bottom: 4px;">New Contact Form Submission</h2>
                        <p style="color: #666; font-size: 13px; margin-top: 0;">Received ${new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })} PT</p>

                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 10px 0; font-weight: bold; width: 100px; vertical-align: top;">Name</td>
                                <td style="padding: 10px 0;">${payload.name}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 10px 0; font-weight: bold; vertical-align: top;">Email</td>
                                <td style="padding: 10px 0;"><a href="mailto:${payload.email}">${payload.email}</a></td>
                            </tr>
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 10px 0; font-weight: bold; vertical-align: top;">Subject</td>
                                <td style="padding: 10px 0;">${payload.subject}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; font-weight: bold; vertical-align: top;">Message</td>
                                <td style="padding: 10px 0; white-space: pre-wrap;">${payload.message}</td>
                            </tr>
                        </table>

                        <p style="font-size: 12px; color: #999; margin-top: 30px;">
                            You can reply directly to this email to respond to ${payload.name}.
                        </p>
                    </div>
                `,
            });
            console.log("📬 Contact notification sent to support@dreamplaypianos.com");
        }

        return { success: true };
    } catch (error: unknown) {
        console.error("Contact form error:", error);
        return { success: false, error: "Failed to process message" };
    }
}
