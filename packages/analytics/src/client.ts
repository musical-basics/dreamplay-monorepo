/**
 * Framework-agnostic browser analytics core.
 *
 * One session/identity model for every DreamPlay property (port of the good
 * parts of dreamplay-analytics/public/tracker.js and belgium's
 * dp-analytics-beacon.tsx):
 *   - `dp_session_id` cookie (365d) — legacy-compatible session identity.
 *   - `dp_visitor_id` in localStorage — device-scoped visitor identity.
 *   - UTM + Google click ids (gclid/wbraid/gbraid) + first-touch referrer
 *     capture (sessionStorage for the session-scoped values, localStorage for
 *     click ids so ad attribution survives browser restarts).
 *   - `dp_sid` / `dp_cid` cookie capture (subscriber/campaign ids stamped by
 *     the email-link middleware) → metadata for email attribution.
 *   - Every event is tagged with the visitor's A/B assignments via the
 *     injectable `getAbAssignments` hook (provided by @dreamplay/ab) as
 *     `metadata.ab_variant` + `metadata.ab_experiments`. The literal key
 *     `ab_variant` is load-bearing — the dashboard reads it (Decision D5).
 *
 * SSR-safe: every public method no-ops when `window`/`document` are absent.
 * No React, no Node APIs — the same core backs the React bindings and the
 * standalone tracker snippet.
 */

export interface AnalyticsConfig {
  /** Ingest endpoint, absolute or relative. Default: "/api/track". */
  endpoint?: string;
  /**
   * Cookie Domain attribute for dp_session_id (e.g. ".dreamplaypianos.com" to
   * share the session across subdomains). Default: host-only cookie.
   */
  cookieDomain?: string;
  /** Merged into every event's metadata (site/brand/offer tags, etc.). */
  defaultMetadata?: Record<string, unknown>;
  /**
   * Returns the visitor's current A/B assignments as an
   * `{ [experimentKey]: variantKey }` map. Provided by @dreamplay/ab
   * (`createGetAbAssignments`). Called fresh on every event so mid-session
   * re-bucketing is reflected. Receives the event's own `path` (pathname +
   * search, the same value sent as `path`), so an implementation can leave
   * events on specific pages untagged.
   */
  getAbAssignments?: (context: { path: string }) => Record<string, string>;
  /**
   * When several experiments run concurrently, which one populates the
   * top-level `ab_variant` metadata key. With exactly one assignment the
   * single variant is used automatically.
   */
  primaryExperiment?: string;
  /**
   * Count document clicks per page and attach `metadata.click_count` to
   * every `page_leave` event (engagement signal for A/B scoring).
   * Default: true.
   */
  trackClicks?: boolean;
  /** Injectable transport (tests). Default: global fetch with keepalive. */
  fetch?: typeof globalThis.fetch;
  /**
   * Injectable page context (tests). Default: reads
   * window.location.href + document.referrer.
   */
  getContext?: () => { url: string; referrer: string };
}

export interface Analytics {
  /** Stable per-device session id (dp_session_id cookie). */
  getSessionId(): string | undefined;
  /** Stable per-device visitor id (localStorage). */
  getVisitorId(): string | undefined;
  /**
   * Fires a `pageview` event and restarts the page-duration timer.
   * Call once per path change.
   */
  pageview(metadata?: Record<string, unknown>): Promise<void>;
  /**
   * Fires a `page_leave` event carrying the seconds since the last pageview.
   * Sent via sendBeacon when available so it survives tab close. Deduped:
   * only one page_leave fires per pageview.
   */
  pageLeave(metadata?: Record<string, unknown>): Promise<void>;
  /** Fires an arbitrary named event. */
  track(eventName: string, metadata?: Record<string, unknown>): Promise<void>;
}

export const SESSION_COOKIE = "dp_session_id";
export const SESSION_COOKIE_DAYS = 365;
export const VISITOR_STORAGE_KEY = "dp_visitor_id";
/** Metadata key the dashboard reads — keep literally "ab_variant" (D5). */
export const AB_VARIANT_METADATA_KEY = "ab_variant";
export const AB_EXPERIMENTS_METADATA_KEY = "ab_experiments";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
/**
 * Google Ads click ids. Browsers don't pass referrers on YouTube ad clicks —
 * these arrive in the landing URL. wbraid = iOS/Safari ATT flows, gbraid =
 * Android privacy flows. Persisted to localStorage so a visitor who clicks an
 * ad today and buys days later still attributes.
 */
const CLICK_ID_KEYS = ["gclid", "wbraid", "gbraid"] as const;
const SS_PREFIX = "dp_";
const INITIAL_REFERRER_KEY = "dp_initial_referrer";
const LANDING_URL_KEY = "dp_landing_url";

/** Cookies stamped by the email-link middleware (subscriber/campaign id). */
const EMAIL_SID_COOKIE = "dp_sid";
const EMAIL_CID_COOKIE = "dp_cid";

function hasDom(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  try {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
    return match?.[1] ? decodeURIComponent(match[1]) : undefined;
  } catch {
    return undefined;
  }
}

function writeCookie(name: string, value: string, days: number, domain?: string): void {
  if (typeof document === "undefined") return;
  try {
    const maxAge = days * 24 * 60 * 60;
    let cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax`;
    if (domain) cookie += `;domain=${domain}`;
    if (typeof location !== "undefined" && location.protocol === "https:") cookie += ";Secure";
    document.cookie = cookie;
  } catch {
    // Cookies disabled — analytics degrades to per-pageload identity.
  }
}

/**
 * UUID v4 via Web Crypto. Never Math.random — the same CSPRNG rule as the
 * A/B bucketing (Math.random can repeat across reused edge/JS isolates).
 */
export function generateId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function safeSessionStorage(): Storage | undefined {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : undefined;
  } catch {
    return undefined;
  }
}

function safeLocalStorage(): Storage | undefined {
  try {
    return typeof window !== "undefined" ? window.localStorage : undefined;
  } catch {
    return undefined;
  }
}

/** Wire payload accepted by the server ingest handler (see server.ts). */
export interface TrackPayload {
  eventName: string;
  path: string;
  sessionId: string;
  visitorId?: string;
  durationSeconds?: number;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export function createAnalytics(config: AnalyticsConfig = {}): Analytics {
  const endpoint = config.endpoint ?? "/api/track";
  const getContext =
    config.getContext ??
    (() => ({
      url: hasDom() ? window.location.href : "",
      referrer: hasDom() ? document.referrer : "",
    }));

  let sessionId: string | undefined;
  let visitorId: string | undefined;
  let firstTouchCaptured = false;
  let pageStartedAt = 0;
  let pageLeaveSent = true; // no pageview yet → nothing to leave
  let currentPath = "";
  let clickCount = 0;
  let clickListenerAttached = false;

  /**
   * Per-page click counter (engagement metric). Attached lazily on the first
   * dispatch — never during render/SSR — and capture-phase so stopPropagation
   * in page code can't hide clicks.
   */
  function ensureClickTracking(): void {
    if (clickListenerAttached || !hasDom() || config.trackClicks === false) return;
    clickListenerAttached = true;
    document.addEventListener(
      "click",
      () => {
        clickCount += 1;
      },
      { capture: true, passive: true }
    );
  }

  function ensureIdentity(): void {
    if (!hasDom()) return;
    if (!sessionId) {
      sessionId = readCookie(SESSION_COOKIE);
      if (!sessionId) {
        sessionId = generateId();
      }
      // Re-stamp on every init so the 365d window is rolling.
      writeCookie(SESSION_COOKIE, sessionId, SESSION_COOKIE_DAYS, config.cookieDomain);
    }
    if (!visitorId) {
      const ls = safeLocalStorage();
      visitorId = ls?.getItem(VISITOR_STORAGE_KEY) ?? undefined;
      if (!visitorId) {
        visitorId = generateId();
        ls?.setItem(VISITOR_STORAGE_KEY, visitorId);
      }
    }
  }

  /**
   * First-touch capture: UTMs + click ids + external referrer + landing URL.
   * UTMs/referrer live in sessionStorage (session-scoped attribution);
   * click ids in localStorage (cross-session ad attribution).
   */
  function captureFirstTouch(): void {
    if (firstTouchCaptured || !hasDom()) return;
    firstTouchCaptured = true;
    const ss = safeSessionStorage();
    const ls = safeLocalStorage();
    let url: URL;
    try {
      url = new URL(getContext().url);
    } catch {
      return;
    }
    const sp = url.searchParams;
    let sawParams = false;
    for (const key of UTM_KEYS) {
      const value = sp.get(key);
      if (value && !ss?.getItem(SS_PREFIX + key)) {
        ss?.setItem(SS_PREFIX + key, value);
        sawParams = true;
      }
    }
    for (const key of CLICK_ID_KEYS) {
      const value = sp.get(key);
      if (value) {
        ls?.setItem(key, value);
        sawParams = true;
      }
    }
    if (sawParams && !ss?.getItem(LANDING_URL_KEY)) {
      ss?.setItem(LANDING_URL_KEY, url.toString());
    }
    const referrer = getContext().referrer;
    if (
      referrer &&
      !referrer.includes(url.hostname) &&
      !referrer.includes("localhost") &&
      !ss?.getItem(INITIAL_REFERRER_KEY)
    ) {
      ss?.setItem(INITIAL_REFERRER_KEY, referrer);
    }
  }

  function attributionMetadata(): Record<string, unknown> {
    const meta: Record<string, unknown> = {};
    const ss = safeSessionStorage();
    const ls = safeLocalStorage();
    for (const key of UTM_KEYS) {
      const value = ss?.getItem(SS_PREFIX + key);
      if (value) meta[key] = value;
    }
    for (const key of CLICK_ID_KEYS) {
      const value = ls?.getItem(key);
      if (value) meta[key] = value;
    }
    const referrer = ss?.getItem(INITIAL_REFERRER_KEY);
    if (referrer) meta.referrer = referrer;
    const landingUrl = ss?.getItem(LANDING_URL_KEY);
    if (landingUrl) meta.landing_url = landingUrl;
    // Email attribution: subscriber/campaign ids stamped as cookies by the
    // email-link middleware (replaces the spoofable ?em= param).
    const sid = readCookie(EMAIL_SID_COOKIE);
    if (sid) meta.sid = sid;
    const cid = readCookie(EMAIL_CID_COOKIE);
    if (cid) meta.cid = cid;
    return meta;
  }

  function abMetadata(path: string): Record<string, unknown> {
    if (!config.getAbAssignments) return {};
    let assignments: Record<string, string>;
    try {
      assignments = config.getAbAssignments({ path });
    } catch {
      return {};
    }
    const keys = Object.keys(assignments);
    if (keys.length === 0) return {};
    const meta: Record<string, unknown> = {
      [AB_EXPERIMENTS_METADATA_KEY]: assignments,
    };
    const primary =
      config.primaryExperiment && assignments[config.primaryExperiment] !== undefined
        ? assignments[config.primaryExperiment]
        : keys.length === 1
          ? assignments[keys[0] as string]
          : undefined;
    if (primary !== undefined) meta[AB_VARIANT_METADATA_KEY] = primary;
    return meta;
  }

  function pathFromContext(): string {
    try {
      const url = new URL(getContext().url);
      return url.pathname + url.search;
    } catch {
      return getContext().url || "/";
    }
  }

  async function send(payload: TrackPayload, preferBeacon: boolean): Promise<void> {
    const body = JSON.stringify(payload);
    if (preferBeacon && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      try {
        // Blob keeps the content-type so the route handler can req.json().
        const ok = navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
        if (ok) return;
      } catch {
        // fall through to fetch
      }
    }
    const doFetch = config.fetch ?? globalThis.fetch;
    if (!doFetch) return;
    try {
      await doFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    } catch {
      // Analytics must never break the page.
    }
  }

  async function dispatch(
    eventName: string,
    metadata: Record<string, unknown> | undefined,
    extra: Partial<TrackPayload> = {},
    preferBeacon = false
  ): Promise<void> {
    if (!hasDom()) return;
    ensureIdentity();
    ensureClickTracking();
    captureFirstTouch();
    const path = extra.path ?? pathFromContext();
    const payload: TrackPayload = {
      eventName,
      path,
      sessionId: sessionId as string,
      visitorId,
      timestamp: new Date().toISOString(),
      metadata: {
        ...config.defaultMetadata,
        ...attributionMetadata(),
        ...abMetadata(path),
        ...metadata,
      },
      ...(extra.durationSeconds !== undefined ? { durationSeconds: extra.durationSeconds } : {}),
    };
    await send(payload, preferBeacon);
  }

  return {
    getSessionId() {
      ensureIdentity();
      return sessionId;
    },
    getVisitorId() {
      ensureIdentity();
      return visitorId;
    },
    async pageview(metadata) {
      pageStartedAt = Date.now();
      pageLeaveSent = false;
      clickCount = 0;
      currentPath = pathFromContext();
      await dispatch("pageview", metadata, { path: currentPath });
    },
    async pageLeave(metadata) {
      if (pageLeaveSent) return;
      pageLeaveSent = true;
      const durationSeconds = Math.max(0, Math.round((Date.now() - pageStartedAt) / 1000));
      await dispatch(
        "page_leave",
        { ...(config.trackClicks === false ? {} : { click_count: clickCount }), ...metadata },
        { durationSeconds, path: currentPath || undefined },
        true
      );
    },
    async track(eventName, metadata) {
      await dispatch(eventName, metadata);
    },
  };
}
