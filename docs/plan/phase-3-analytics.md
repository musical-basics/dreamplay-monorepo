# Phase 3 — Analytics: one SDK, one ingest, one dashboard

**Goal:** `packages/analytics` is the single tracking implementation; events land in the new `events` table; a dashboard at /admin/analytics replaces data.dreamplaypianos.com.
**Depends on:** Phase 1. Parallel with Phase 2.
**Reference:** docs/reference/analytics.md, docs/reference/ab-testing.md (beacon pattern).

## Design (fixes the legacy fragmentation)

- **Client:** `createAnalytics()` — session cookie (`dp_session_id`, 365d), visitor id, UTM/referrer/first-touch capture, `pageview` + `page_leave` (duration) + `track(event, metadata)`. Automatically tags `ab_variant` from the A/B cookie on EVERY event (see phase-4). One React `<AnalyticsProvider/>` + beacon component for apps/web.
- **Server ingest:** `POST /api/track` route handler exported from the package: zod-validated payload, bot filtering (UA patterns), geo from Vercel headers (`x-vercel-ip-country/-city` — drop the ip-api.com dependency), identity enrichment (sid → subscriber via same-DB join, replacing the cross-project lookup), writes `events`.
- **Queries:** typed query helpers (summary, funnels, per-variant results, visitor history) as SQL functions/views from Phase 1 — no 20k-rows-into-JS aggregation.
- **Standalone snippet:** build a `tracker.js` (compiled from the same client core) served at `/tracker.js` for legacy non-Next sites at cutover (Decision D6).

## Tasks

- [ ] 1. Implement `packages/analytics` client core + React provider/beacon (port the good parts of belgium's `dp-analytics-beacon.tsx` and analytics repo's `tracker.js`; one session/identity model: session cookie + optional email/sid enrichment; keep `dp_sid`/`dp_cid` URL-param capture from website-2 middleware).
- [ ] 2. Implement server ingest handler + mount at `apps/web/app/api/track/route.ts`. CORS allowlist from env/settings table, not hardcoded. Reject silently-unverifiable input; never `return true` on missing secrets.
- [ ] 3. Optional pixel fan-out (GA4/Meta/TikTok) as a client-side plugin, config-driven, matching belgium's conversion mirroring. Env names consistent (`NEXT_PUBLIC_GA4_MEASUREMENT_ID` — fix the legacy mismatch).
- [ ] 4. Shopify purchase ingestion: `api/webhooks/shopify/orders` (Phase 2 task 8) ALSO emits a `purchase` event into `events` with order metadata + `checkout_source` parsing — this is the attribution join point the old system never had.
- [ ] 5. Bot/admin exclusion: `settings`-table-driven admin IP list + UA filters, applied at query time (flag on row at ingest for cheap filtering).
- [ ] 6. Dashboard at `/admin/analytics` (auth: Supabase auth with an admin role/allowlist — replace the shared-password HMAC): live users, pageviews/uniques time series, top pages, visitor journeys, geo/device, purchase attribution (email → session → purchase), CSV export via paginated server route. Componentized — do not recreate the 1900-line monolith.
- [ ] 7. Instrument apps/web with the provider (pageviews + key conversions: cta clicks, begin_checkout, subscribe, purchase).
- [ ] 8. Build + serve compiled `tracker.js` snippet (for Phase 7 legacy sites).
- [ ] 9. Tests: ingest validation, bot filter, variant tagging, summary queries against seeded local Supabase.

## Acceptance criteria

- Browsing the preview site produces correct `events` rows (session continuity, UTM capture, durations).
- A test Shopify webhook produces a `purchase` event joinable to the browsing session.
- /admin/analytics renders real numbers from the new DB; non-admin users are blocked.
- `pnpm test` green in packages/analytics.
