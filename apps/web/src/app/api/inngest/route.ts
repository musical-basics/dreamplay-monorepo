import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { couponFunctions } from "@/inngest/coupon-functions";
import { emailFunctions } from "@/inngest/functions";
import { reportFunctions } from "@/inngest/report-functions";

/**
 * Inngest serve endpoint. maxDuration must cover a full send loop: at the
 * default 5 req/s a 500-recipient child takes ~100s + Resend latency, so 300s
 * leaves comfortable headroom (matches the legacy send-stream budget).
 *
 * Requires INNGEST_EVENT_KEY + INNGEST_SIGNING_KEY in production.
 */
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [...emailFunctions, ...reportFunctions, ...couponFunctions],
});
