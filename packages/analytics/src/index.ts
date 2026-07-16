/**
 * @dreamplay/analytics — the single tracking implementation for every
 * DreamPlay property (Phase 3).
 *
 * Entry points:
 *   "."          — framework-agnostic browser client (this file)
 *   "./react"    — <AnalyticsProvider/>, useAnalytics(), <AnalyticsBeacon/>
 *   "./server"   — createTrackHandler() route-handler factory (ingest)
 *   "./queries"  — server-side typed query helpers (dashboard/exports)
 */

export {
  createAnalytics,
  generateId,
  readCookie,
  AB_VARIANT_METADATA_KEY,
  AB_EXPERIMENTS_METADATA_KEY,
  SESSION_COOKIE,
  SESSION_COOKIE_DAYS,
  VISITOR_STORAGE_KEY,
  type Analytics,
  type AnalyticsConfig,
  type TrackPayload,
} from "./client";
