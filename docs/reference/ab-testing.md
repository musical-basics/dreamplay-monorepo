# Legacy inventory: A/B pattern — belgium-concert-landing-page (2026-07-16)

Repo: `/Users/lionelyu/Documents/New Version/belgium-concert-landing-page`. This is the proven A/B implementation to port (per user directive).

## Stack
Next.js 16.2 (App Router, React 19), TS 5.9, Tailwind 4, pnpm, Vitest, Vercel. Analytics via `@dreamplay/analytics` package (from `github:musical-basics/dreamplay-packages#path:/packages/analytics`) + GA4 + Meta Pixel + TikTok Pixel + @vercel/analytics.

## Mechanism (files to port)
- **`src/proxy.ts`** — Next 16 middleware-equivalent (exports `proxy(req)` + config.matcher). THE core file.
  - Cookie `ab_v2`, 30d, sameSite=lax, secure, path=/. Re-stamps when cookie ≠ resolved variant.
  - Priority on `/`: (1) `?ab=<variant>` query override (shareable previews) → (2) `FORCED_VARIANT` — **currently hardcoded `"t"`, split is paused**. The real random split (geo pools LOCAL/INTERNATIONAL via `x-vercel-ip-country`, bucketing via `crypto.getRandomValues`) lives at **belgium commit `4c6c865`** — restore from there. Comment explicitly warns `Math.random()` is unsafe in reused Edge isolates → **always CSPRNG**.
  - Non-control variants rendered by `NextResponse.rewrite('/'+variant)` → `src/app/<letter>/page.tsx`; control `a` at `/`. Also stamps `dp_country` cookie.
  ```ts
  const existing = req.cookies.get(AB_COOKIE)?.value;
  const variant: Variant = urlOverride ?? FORCED_VARIANT;
  const shouldSetCookie = !!urlOverride || existing !== variant;
  rewrittenUrl.pathname = `/${variant}`;
  return applyCountryCookie(setCookieOnResponse(NextResponse.rewrite(rewrittenUrl)));
  ```
- **`src/lib/variants/config.ts`** — `VARIANT_ORDER` tuple ("a".."t") → `Variant` union, `isVariant()` guard, `VARIANT_META` (label/path), `VARIANT_CONFIG` (per-variant content knobs: video IDs, urgency copy, seat overrides, badges; i18n'd). Single source of truth for variant content.
- **`src/lib/variants/context.tsx`** — `VariantProvider`/`useVariant()` injecting VariantConfig into components.
- **`src/components/dp-analytics-beacon.tsx`** — exposure: pageview once/session, reads `ab_v2` client-side, tags `metadata.ab_variant`; page_leave with duration.
- **`src/components/analytics.tsx`** — conversions (cta_click w/ variant, begin_checkout, email_signup, scroll depth) fanning out to Supabase + GA4 + Meta + TikTok + Vercel.
- **`src/app/api/track/route.ts`** — server ingest (`@dreamplay/analytics/track-server`) → Supabase table `dp_analytics_events`.
- Static-snapshot variants (N/P/Q): route handlers serving frozen HTML + `src/lib/variants/snapshot-beacon.ts` inline beacon.

## Reporting
- `src/app/api/analytics/ab-stats/route.ts` — per-variant counts (IP-gated via ADMIN_IPS). ⚠️ Known weakness: conversions filtered by *path* as a proxy because rewrites collapse variant paths to `/` — only pageviews reliably variant-tagged.
- `src/app/variants/page.tsx` — multi-variant dashboard via `@dreamplay/analytics/dashboard-server`, aggregates by `metadata.ab_variant`, 24h/48h/7d/30d/all, bounce/engagement, admin-IP exclusion. Dashboard reads the exact key **`ab_variant`** — keep that metadata key name stable.

## Porting rules (carry into monorepo design)
1. Restore CSPRNG bucketing from commit `4c6c865`; never `Math.random` in edge code.
2. Tag `ab_variant` on **all** events (exposures AND conversions) — fixes the path-proxy weakness.
3. Keep metadata key literally `ab_variant`.
4. Keep `?ab=` override + cookie re-stamp semantics; 30d cookie.
5. Make experiments first-class (multiple concurrent experiments, registry + typed config) instead of one hardcoded letter-set.

## Env vars involved (names)
ANALYTICS_SUPABASE_URL, ANALYTICS_SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (code) vs SUPABASE_SERVICE_KEY (.env.local — mismatch), EMAIL_SUPABASE_URL, EMAIL_SUPABASE_SERVICE_KEY, NEXT_PUBLIC_GA4_ID (code) vs NEXT_PUBLIC_GA4_MEASUREMENT_ID (.env.local — mismatch, GA4 likely inert), NEXT_PUBLIC_META_PIXEL_ID, NEXT_PUBLIC_TIKTOK_PIXEL_ID, VARIANT_OVERRIDE (historical).
