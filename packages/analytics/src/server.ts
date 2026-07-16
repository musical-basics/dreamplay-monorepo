/**
 * Server ingest for @dreamplay/analytics.
 *
 * `createTrackHandler(opts)` returns a standard `(req: Request) => Response`
 * handler that apps/web mounts at `app/api/track/route.ts`:
 *
 * ```ts
 * import { createTrackHandler } from "@dreamplay/analytics/server";
 * const handler = createTrackHandler({ allowedOrigins: [...] });
 * export const POST = handler;
 * export const OPTIONS = handler;
 * ```
 *
 * Fixes over the legacy dreamplay-analytics /api/track route:
 *   - zod-validated payload — invalid input is a 400, never silently coerced.
 *   - CORS allowlist injected via opts (env/settings-driven), not hardcoded.
 *   - Geo from Vercel headers only (x-vercel-ip-country/-city/-country-region)
 *     — no ip-api.com dependency.
 *   - sid → subscriber enrichment via the same-DB subscribers table
 *     (@dreamplay/db admin client), replacing the cross-project lookup.
 *   - Admin/bot IPs come from the settings table ('admin_ips', 'bot_ips',
 *     cached 60s) and are FLAGGED on the row (metadata.is_admin/is_bot) so
 *     query-time exclusion is cheap; obvious bot user agents are dropped
 *     before insert (legacy UA patterns, ported).
 */

import { createAdminClient, type AdminClient, type Json } from "@dreamplay/db";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Payload schema (mirror of TrackPayload in client.ts)
// ---------------------------------------------------------------------------

export const trackPayloadSchema = z.object({
  eventName: z.string().min(1).max(120),
  path: z.string().max(4096).optional(),
  sessionId: z.string().min(1).max(128),
  visitorId: z.string().min(1).max(128).optional(),
  durationSeconds: z
    .number()
    .int()
    .min(0)
    .max(60 * 60 * 24 * 7)
    .optional(),
  timestamp: z.string().max(64).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type ValidatedTrackPayload = z.infer<typeof trackPayloadSchema>;

// ---------------------------------------------------------------------------
// Bot filtering (legacy UA patterns, ported from dreamplay-analytics)
// ---------------------------------------------------------------------------

/**
 * Deliberately conservative — the legacy list dropped over-aggressive terms
 * like "monitor"/"status" after they ate real events.
 */
export const BOT_UA_PATTERNS = [
  "bot",
  "spider",
  "crawl",
  "headless",
  "lighthouse",
  "pingdom",
  "phantomjs",
  "slurp",
  "python-requests",
  "curl/",
  "wget/",
] as const;

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_UA_PATTERNS.some((pattern) => ua.includes(pattern));
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export interface TrackHandlerOptions {
  /**
   * CORS allowlist: exact-match origin strings, or a predicate for dynamic
   * rules (e.g. allow *.vercel.app previews). Same-origin requests (no Origin
   * header) are always accepted. REQUIRED — there is no permissive default.
   */
  allowedOrigins: readonly string[] | ((origin: string) => boolean);
  /** Injectable admin-client factory (tests). Default: createAdminClient(). */
  createClient?: () => AdminClient;
  /** admin_ips/bot_ips settings cache TTL. Default 60s. */
  ipListsCacheTtlMs?: number;
  /** Clock (tests). */
  now?: () => number;
}

const PATH_COLUMN_MAX = 2000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface IpLists {
  adminIps: Set<string>;
  botIps: Set<string>;
}

function json(status: number, body: unknown, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

export function createTrackHandler(
  opts: TrackHandlerOptions
): (req: Request) => Promise<Response> {
  const { allowedOrigins } = opts;
  const cacheTtl = opts.ipListsCacheTtlMs ?? 60_000;
  const now = opts.now ?? Date.now;

  let client: AdminClient | undefined;
  function getClient(): AdminClient {
    client ??= (opts.createClient ?? createAdminClient)();
    return client;
  }

  const isOriginAllowed = (origin: string): boolean =>
    typeof allowedOrigins === "function"
      ? allowedOrigins(origin)
      : allowedOrigins.includes(origin);

  function corsHeaders(origin: string | null): Record<string, string> {
    const headers: Record<string, string> = { Vary: "Origin" };
    if (origin && isOriginAllowed(origin)) {
      headers["Access-Control-Allow-Origin"] = origin;
      headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
      headers["Access-Control-Allow-Headers"] = "Content-Type";
      headers["Access-Control-Max-Age"] = "86400";
    }
    return headers;
  }

  // 60s-cached admin/bot IP lists from the settings table. A failed read
  // degrades to empty lists (events still land, just unflagged) — never
  // blocks ingest.
  let ipListsCache: { lists: IpLists; fetchedAt: number } | undefined;
  async function getIpLists(): Promise<IpLists> {
    if (ipListsCache && now() - ipListsCache.fetchedAt < cacheTtl) {
      return ipListsCache.lists;
    }
    const lists: IpLists = { adminIps: new Set(), botIps: new Set() };
    try {
      const { data } = await getClient()
        .from("settings")
        .select("key, value")
        .in("key", ["admin_ips", "bot_ips"]);
      for (const row of data ?? []) {
        if (!Array.isArray(row.value)) continue;
        const target = row.key === "admin_ips" ? lists.adminIps : lists.botIps;
        for (const entry of row.value) {
          if (typeof entry === "string" && entry.length > 0) target.add(entry);
        }
      }
      ipListsCache = { lists, fetchedAt: now() };
    } catch {
      // Leave cache untouched so a transient failure retries next request.
    }
    return ipListsCache?.lists ?? lists;
  }

  /** sid (subscriber uuid from email links) → email + subscriber_id. */
  async function resolveSubscriber(
    sid: string
  ): Promise<{ email: string; subscriberId: string } | undefined> {
    if (!UUID_RE.test(sid)) return undefined;
    try {
      const { data } = await getClient()
        .from("subscribers")
        .select("id, email")
        .eq("id", sid)
        .maybeSingle();
      if (data?.email) return { email: data.email, subscriberId: data.id };
    } catch {
      // Enrichment is best-effort; the raw sid stays in metadata regardless.
    }
    return undefined;
  }

  return async function handleTrack(req: Request): Promise<Response> {
    const origin = req.headers.get("origin");
    const headers = corsHeaders(origin);

    if (req.method === "OPTIONS") {
      // Preflight: allowed origins get the Access-Control-* grant above;
      // everything else gets a bare 204 (browser will block the real call).
      return new Response(null, { status: 204, headers });
    }

    if (req.method !== "POST") {
      return json(405, { error: "Method not allowed" }, { ...headers, Allow: "POST, OPTIONS" });
    }

    // Cross-origin callers must be on the allowlist.
    if (origin && !isOriginAllowed(origin)) {
      return json(403, { error: "Origin not allowed" }, headers);
    }

    const userAgent = req.headers.get("user-agent");
    if (isBotUserAgent(userAgent)) {
      return json(200, { ignored: true, reason: "bot_user_agent" }, headers);
    }

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return json(400, { error: "Invalid JSON body" }, headers);
    }

    const parsed = trackPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      return json(
        400,
        {
          error: "Invalid payload",
          issues: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        headers
      );
    }
    const payload = parsed.data;

    // Request context: IP + Vercel geo headers.
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ipAddress =
      forwardedFor?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
    const country = req.headers.get("x-vercel-ip-country");
    const cityHeader = req.headers.get("x-vercel-ip-city");
    let city: string | null = cityHeader;
    if (cityHeader) {
      try {
        city = decodeURIComponent(cityHeader);
      } catch {
        city = cityHeader;
      }
    }
    const region = req.headers.get("x-vercel-ip-country-region");

    const metadata: Record<string, unknown> = { ...(payload.metadata ?? {}) };

    // Flag (don't drop) admin/bot IPs so dashboards can exclude cheaply.
    const { adminIps, botIps } = await getIpLists();
    if (ipAddress && adminIps.has(ipAddress)) metadata.is_admin = true;
    if (ipAddress && botIps.has(ipAddress)) metadata.is_bot = true;

    // Identity enrichment: explicit metadata.email wins; otherwise resolve
    // metadata.sid (subscriber id from email-link cookies) in the same DB.
    let email = typeof metadata.email === "string" && metadata.email ? metadata.email : null;
    let subscriberId: string | null = null;
    const sid = typeof metadata.sid === "string" ? metadata.sid : undefined;
    if (sid) {
      const resolved = await resolveSubscriber(sid);
      if (resolved) {
        email ??= resolved.email;
        subscriberId = resolved.subscriberId;
      }
    }

    const { error } = await getClient()
      .from("events")
      .insert({
        event_name: payload.eventName,
        path: payload.path ? payload.path.slice(0, PATH_COLUMN_MAX) : null,
        session_id: payload.sessionId,
        visitor_id: payload.visitorId ?? null,
        ip_address: ipAddress,
        user_agent: userAgent,
        country,
        city,
        region,
        email,
        subscriber_id: subscriberId,
        duration_seconds: payload.durationSeconds ?? null,
        metadata: metadata as Json,
      });

    if (error) {
      return json(500, { error: "Failed to record event" }, headers);
    }
    return json(200, { success: true }, headers);
  };
}
