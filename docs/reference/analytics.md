# Legacy inventory: dreamplay-analytics (2026-07-16)

Repo: `/Users/lionelyu/Documents/DreamPlay Repos/dreamplay-analytics` · Vercel → data.dreamplaypianos.com. Self-hosted first-party analytics + visitor identity + dashboard. Own Supabase project.

## Stack
Next.js 14.2.35 (App Router), React 18, TS, pnpm, @supabase/supabase-js, recharts, Tailwind. No tests, no ORM, no migrations dir (one SQL file). PostHog env vars present but zero PostHog code — dead config.

## Ingestion
Single endpoint `POST /api/track` (`src/app/api/track/route.ts`), CORS allowlist **hardcoded** in the route (+ *.vercel.app/localhost). Fed by:
- `public/tracker.js` — vanilla IIFE for legacy sites (Shopify store, blog, crowdfund, ultimatepianist.com, musicalbasics.com). `dp_session_id` cookie (365d, `.dreamplaypianos.com`), UTM/referrer capture, sid/cid → email resolution via email.dreamplaypianos.com/api/resolve-subscriber, pageview + page_leave(duration).
- website-2's `AnalyticsTracker.tsx`/`logEvent()`.
- belgium's beacon — but belgium posts to its own relative `/api/track`, NOT this host (mis-wired/split-brain).

Event types: pageview, page_leave, purchase (Shopify webhook), slide_view, experiment_view, conversion, click_preorder.
Purchases: `src/app/api/shopify-order/route.ts` — HMAC-verified Shopify order webhook, parses `checkout_source:` from order note. ⚠️ HMAC check silently returns true when secret unset.
Bot/admin filtering: UA patterns in track route; `src/lib/botDetection.ts` + `src/lib/adminIPs.ts`; admin IPs ALSO hardcoded inside the SQL RPC (two places to edit).

## Storage
- **`analytics_logs`**: id, created_at, event_name, path, session_id, ip_address, user_agent, country, metadata JSONB (email, utm_*, referrer, variant, duration_seconds, checkout_source, city/region…).
- `ip_email_map` (manual IP→email overrides), `chat_sessions`/`chat_messages`.
- Cross-project read of email repo's `subscribers` (EMAIL_SUPABASE_URL) for sid→email enrichment — the coupling to kill.
- RPC `get_analytics_summary(p_range, p_exclude_admin, p_exclude_bots)` in `supabase/get_analytics_summary.sql`: live users, pageviews, uniques, hourly/daily series, ab_results.

## Dashboard / reporting
`src/app/page.tsx` (~1900-line client component): charts, live users, visitor journeys, A/B results, chat sessions, geo/device. Auth: HMAC cookie `dp_auth`, shared password `DASHBOARD_PASS` (`src/middleware.ts`). API: stats, stats-v2, insights (pull up to 20k rows and aggregate in JS — scalability landmine), email-visitors, visitor-history, export-visitors (manual pagination past Supabase 1000-row cap). No cron reports.

## A/B here
`src/app/api/decide/route.ts` — `Math.random() < 0.5`, **no stickiness**, CORS *. Results read from metadata.variant + experiment_view/conversion events. The real A/B logic lives in the websites; systems are disconnected.

## Env var names
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, EMAIL_SUPABASE_URL, EMAIL_SUPABASE_SERVICE_KEY, DASHBOARD_PASS, SHOPIFY_WEBHOOK_SECRET, RESEND_API_KEY, NEXT_PUBLIC_POSTHOG_* (dead), POSTHOG_* (dead). Website side: NEXT_PUBLIC_ANALYTICS_TRACK_URL.

## Brittleness summary
Fragmented tracking (3 client impls, 2 A/B systems), cross-repo Supabase coupling, hardcoded origins/IPs in two places, 20k-row in-JS aggregation, non-sticky A/B, silently-skipped HMAC, single-password auth, constant fix-commit churn, identity keyed loosely on `COALESCE(ip_address, session_id)`.
