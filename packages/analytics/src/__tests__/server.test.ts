/**
 * Ingest handler tests — node environment (Request/Response are global),
 * no live DB: the admin client is a hand-rolled fake.
 */

import { describe, expect, it, vi } from "vitest";

import type { AdminClient, TablesInsert } from "@dreamplay/db";

import { createTrackHandler, isBotUserAgent, type TrackHandlerOptions } from "../server";

type EventInsert = TablesInsert<"events">;

interface FakeDbState {
  inserted: EventInsert[];
  settingsRows: Array<{ key: string; value: unknown }>;
  subscribers: Record<string, { id: string; email: string }>;
  settingsSelects: number;
  insertError: { message: string } | null;
}

function createFakeDb(partial: Partial<FakeDbState> = {}) {
  const state: FakeDbState = {
    inserted: [],
    settingsRows: [],
    subscribers: {},
    settingsSelects: 0,
    insertError: null,
    ...partial,
  };
  const client = {
    from(table: string) {
      if (table === "events") {
        return {
          insert: async (row: EventInsert) => {
            state.inserted.push(row);
            return { error: state.insertError };
          },
        };
      }
      if (table === "settings") {
        return {
          select: () => ({
            in: async () => {
              state.settingsSelects += 1;
              return { data: state.settingsRows, error: null };
            },
          }),
        };
      }
      if (table === "subscribers") {
        return {
          select: () => ({
            eq: (_col: string, id: string) => ({
              maybeSingle: async () => ({ data: state.subscribers[id] ?? null, error: null }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  } as unknown as AdminClient;
  return { client, state };
}

const ALLOWED = "https://dreamplaypianos.com";

function makeHandler(
  db = createFakeDb(),
  opts: Partial<TrackHandlerOptions> = {}
) {
  const handler = createTrackHandler({
    allowedOrigins: [ALLOWED],
    createClient: () => db.client,
    ...opts,
  });
  return { handler, db };
}

function trackRequest({
  body = validBody(),
  origin = ALLOWED,
  headers = {},
  method = "POST",
}: {
  body?: unknown;
  origin?: string | null;
  headers?: Record<string, string>;
  method?: string;
} = {}) {
  const h = new Headers({ "Content-Type": "application/json", ...headers });
  if (origin) h.set("Origin", origin);
  return new Request("https://dreamplaypianos.com/api/track", {
    method,
    headers: h,
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    eventName: "pageview",
    path: "/pricing",
    sessionId: "sess-1",
    visitorId: "vis-1",
    timestamp: new Date().toISOString(),
    metadata: { utm_source: "youtube" },
    ...overrides,
  };
}

describe("CORS", () => {
  it("grants preflight to allowlisted origins", async () => {
    const { handler } = makeHandler();
    const res = await handler(trackRequest({ method: "OPTIONS" }));
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ALLOWED);
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
  });

  it("gives unlisted origins no CORS grant on preflight", async () => {
    const { handler } = makeHandler();
    const res = await handler(
      trackRequest({ method: "OPTIONS", origin: "https://evil.example" })
    );
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("rejects cross-origin POSTs from unlisted origins with 403 and no insert", async () => {
    const { handler, db } = makeHandler();
    const res = await handler(trackRequest({ origin: "https://evil.example" }));
    expect(res.status).toBe(403);
    expect(db.state.inserted).toHaveLength(0);
  });

  it("accepts same-origin requests (no Origin header)", async () => {
    const { handler, db } = makeHandler();
    const res = await handler(trackRequest({ origin: null }));
    expect(res.status).toBe(200);
    expect(db.state.inserted).toHaveLength(1);
  });

  it("supports a predicate allowlist (e.g. vercel previews)", async () => {
    const db = createFakeDb();
    const { handler } = makeHandler(db, {
      allowedOrigins: (origin) => origin.endsWith(".vercel.app"),
    });
    const ok = await handler(trackRequest({ origin: "https://web-abc123.vercel.app" }));
    expect(ok.status).toBe(200);
    const bad = await handler(trackRequest({ origin: "https://evil.example" }));
    expect(bad.status).toBe(403);
  });
});

describe("validation", () => {
  it("rejects a payload missing sessionId with 400 + issues, no insert", async () => {
    const { handler, db } = makeHandler();
    const body = validBody();
    delete (body as Record<string, unknown>).sessionId;
    const res = await handler(trackRequest({ body }));
    expect(res.status).toBe(400);
    const parsed = (await res.json()) as { error: string; issues: Array<{ path: string }> };
    expect(parsed.error).toBe("Invalid payload");
    expect(parsed.issues.some((i) => i.path === "sessionId")).toBe(true);
    expect(db.state.inserted).toHaveLength(0);
  });

  it("rejects wrong types (durationSeconds as string)", async () => {
    const { handler, db } = makeHandler();
    const res = await handler(trackRequest({ body: validBody({ durationSeconds: "12" }) }));
    expect(res.status).toBe(400);
    expect(db.state.inserted).toHaveLength(0);
  });

  it("rejects non-JSON bodies", async () => {
    const { handler } = makeHandler();
    const req = new Request("https://dreamplaypianos.com/api/track", {
      method: "POST",
      headers: { Origin: ALLOWED },
      body: "not json",
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it("rejects non-POST methods", async () => {
    const { handler } = makeHandler();
    const res = await handler(trackRequest({ method: "GET" }));
    expect(res.status).toBe(405);
  });
});

describe("bot filtering", () => {
  it("classifies legacy bot patterns", () => {
    expect(isBotUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBotUserAgent("Screaming Frog SEO Spider")).toBe(true);
    expect(isBotUserAgent("HeadlessChrome/120.0")).toBe(true);
    expect(isBotUserAgent("Chrome-Lighthouse")).toBe(true);
    expect(
      isBotUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
      )
    ).toBe(false);
    expect(isBotUserAgent(null)).toBe(false);
  });

  it("drops bot-UA requests without inserting", async () => {
    const { handler, db } = makeHandler();
    const res = await handler(
      trackRequest({ headers: { "User-Agent": "Mozilla/5.0 AhrefsBot/7.0" } })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ignored: true });
    expect(db.state.inserted).toHaveLength(0);
  });
});

describe("event enrichment", () => {
  it("maps geo headers, client IP and UA onto the events row", async () => {
    const { handler, db } = makeHandler();
    await handler(
      trackRequest({
        headers: {
          "User-Agent": "Mozilla/5.0 Safari",
          "x-forwarded-for": "203.0.113.9, 10.0.0.1",
          "x-vercel-ip-country": "BE",
          "x-vercel-ip-city": "Li%C3%A8ge",
          "x-vercel-ip-country-region": "WLG",
        },
      })
    );
    const row = db.state.inserted[0];
    expect(row).toMatchObject({
      event_name: "pageview",
      path: "/pricing",
      session_id: "sess-1",
      visitor_id: "vis-1",
      ip_address: "203.0.113.9",
      user_agent: "Mozilla/5.0 Safari",
      country: "BE",
      city: "Liège",
      region: "WLG",
    });
    expect((row?.metadata as Record<string, unknown>).utm_source).toBe("youtube");
  });

  it("flags admin/bot IPs from the settings table instead of dropping them", async () => {
    const db = createFakeDb({
      settingsRows: [
        { key: "admin_ips", value: ["203.0.113.9"] },
        { key: "bot_ips", value: ["198.51.100.7"] },
      ],
    });
    const { handler } = makeHandler(db);
    await handler(trackRequest({ headers: { "x-forwarded-for": "203.0.113.9" } }));
    await handler(trackRequest({ headers: { "x-forwarded-for": "198.51.100.7" } }));
    await handler(trackRequest({ headers: { "x-forwarded-for": "192.0.2.55" } }));

    const metas = db.state.inserted.map((r) => r.metadata as Record<string, unknown>);
    expect(metas[0]?.is_admin).toBe(true);
    expect(metas[0]?.is_bot).toBeUndefined();
    expect(metas[1]?.is_bot).toBe(true);
    expect(metas[2]?.is_admin).toBeUndefined();
    expect(metas[2]?.is_bot).toBeUndefined();
  });

  it("matches IPv4-mapped IPv6 request IPs against IPv4 admin entries", async () => {
    const db = createFakeDb({
      settingsRows: [{ key: "admin_ips", value: ["203.0.113.9"] }],
    });
    const { handler } = makeHandler(db);
    await handler(trackRequest({ headers: { "x-forwarded-for": "::ffff:203.0.113.9" } }));

    const meta = db.state.inserted[0]?.metadata as Record<string, unknown>;
    expect(meta.is_admin).toBe(true);
  });

  it("caches the IP lists for the TTL window", async () => {
    let clock = 0;
    const db = createFakeDb({ settingsRows: [] });
    const { handler } = makeHandler(db, { ipListsCacheTtlMs: 60_000, now: () => clock });
    await handler(trackRequest());
    await handler(trackRequest());
    expect(db.state.settingsSelects).toBe(1);
    clock = 61_000;
    await handler(trackRequest());
    expect(db.state.settingsSelects).toBe(2);
  });

  it("resolves metadata.sid to email + subscriber_id via the subscribers table", async () => {
    const sid = "123e4567-e89b-42d3-a456-426614174000";
    const db = createFakeDb({
      subscribers: { [sid]: { id: sid, email: "fan@example.com" } },
    });
    const { handler } = makeHandler(db);
    await handler(trackRequest({ body: validBody({ metadata: { sid } }) }));
    expect(db.state.inserted[0]).toMatchObject({
      email: "fan@example.com",
      subscriber_id: sid,
    });
  });

  it("ignores non-uuid sids without querying", async () => {
    const { handler, db } = makeHandler();
    await handler(trackRequest({ body: validBody({ metadata: { sid: "nope" } }) }));
    expect(db.state.inserted[0]?.subscriber_id).toBeNull();
    expect(db.state.inserted[0]?.email).toBeNull();
  });

  it("returns 500 when the insert fails", async () => {
    const db = createFakeDb({ insertError: { message: "db down" } });
    const { handler } = makeHandler(db);
    const res = await handler(trackRequest());
    expect(res.status).toBe(500);
  });
});

describe("client factory laziness", () => {
  it("does not construct the admin client until a request needs it", () => {
    const createClient = vi.fn();
    createTrackHandler({ allowedOrigins: [], createClient });
    expect(createClient).not.toHaveBeenCalled();
  });
});
