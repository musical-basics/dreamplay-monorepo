/**
 * Analytics ingest — mounts @dreamplay/analytics createTrackHandler
 * (zod validation, bot filtering, Vercel geo headers, sid → subscriber
 * enrichment, admin/bot IP flagging; writes the `events` table).
 *
 * CORS: browsers send an Origin header on EVERY POST — including same-origin
 * ones — while the package handler treats any present-but-unlisted Origin as
 * cross-origin and rejects it (403). So this route strips the Origin header
 * when it matches the request's own host (same-origin is always allowed by
 * design) and leaves genuinely cross-origin requests to the env-driven
 * allowlist: ANALYTICS_ALLOWED_ORIGINS (comma-separated, exact origins).
 */

import { createTrackHandler } from "@dreamplay/analytics/server";

const allowedOrigins = (process.env.ANALYTICS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const handler = createTrackHandler({ allowedOrigins });

/** Does the Origin header point at this request's own host? */
function isSameOrigin(origin: string, req: Request): boolean {
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = req.headers.get("host");
  return originHost === forwardedHost || originHost === host;
}

async function handle(req: Request): Promise<Response> {
  const origin = req.headers.get("origin");
  if (origin && isSameOrigin(origin, req)) {
    // Re-issue the request without the Origin header so the handler takes
    // its always-allowed same-origin path. Buffer the body as text (analytics
    // payloads are tiny) — passing a stream would require the duplex option.
    const headers = new Headers(req.headers);
    headers.delete("origin");
    const body = req.method === "POST" ? await req.text() : undefined;
    return handler(new Request(req.url, { method: req.method, headers, body }));
  }
  return handler(req);
}

export const POST = handle;
export const OPTIONS = handle;
