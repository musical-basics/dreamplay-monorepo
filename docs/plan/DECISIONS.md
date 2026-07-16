# Architectural Decisions

Record decisions here BEFORE acting on them. Format: what / why / revisit-if.

## D1 — Single Next.js app, not app-per-domain (2026-07-16)

**What:** One `apps/web` Next.js app hosts the website, analytics dashboard, email admin, and all API routes. Shared logic lives in `packages/*`.
**Why:** The polyrepo's core failure was fragmentation and cross-repo HTTP coupling. One app = one deploy, one env, in-process calls instead of cross-domain fetches, one place to look. Traffic volume doesn't justify separate deploys.
**Revisit if:** email job load or admin surface grows enough to want independent deploy cadence — packages are already separated, so splitting an app out later is cheap.
**Note (2026-07-16, confirmed with Lionel):** existing subdomains (data./analytics.dreamplaypianos.com, email.dreamplaypianos.com, link.musicalbasics.com, link.ultimatepianist.com, shop.) are kept — all attach to the one Vercel project and middleware routes by hostname, same pattern website-2 already uses for shop. One app ≠ one hostname.

## D2 — One new Supabase project for everything (2026-07-16)

**What:** Single fresh Supabase project replaces the three existing ones (website `tqhfpcdqxylrknwbrqqi`, email `quyqwdjygzalqqmrgkfk`, analytics). Domains separated by schema/table naming, not by project.
**Why:** Per user directive ("initialize a new everything including supabase DB"). Kills cross-project service-role lookups. Email→purchase attribution becomes a SQL join instead of a manual spreadsheet exercise.
**Revisit if:** analytics event volume ever threatens the shared DB's performance — events table can move to a second project/warehouse later.

## D3 — Schema managed exclusively via supabase CLI migrations (2026-07-16)

**What:** `packages/db/supabase/migrations/*.sql`, applied with `supabase db push` / `supabase migration up`. Generated TS types checked in.
**Why:** None of the legacy repos had a migrations system; schema knowledge was scattered across code and ad-hoc SQL-editor scripts, which is a stated cause of breakage.
**Revisit if:** never. This is non-negotiable.

## D4 — Keep Resend + Inngest for email (2026-07-16)

**What:** Same providers as dreamplay-email-3; rewrite the app-level pipeline (idempotency, retries, bounce webhook, suppressions) rather than switching vendors.
**Why:** The incidents were app-code bugs (non-idempotent retry loops, no 5xx retry, done-marker race), not vendor failures. Domain/deliverability reputation on Resend is already established for musicalbasics.com / ultimatepianist.com / email.dreamplaypianos.com.
**Revisit if:** Resend account limits (currently throttled to 5 req/s) block growth.

## D5 — A/B testing ported from belgium-concert-landing-page pattern (2026-07-16)

**What:** Cookie-based assignment in middleware (`ab_v2`-style cookie, 30d), CSPRNG bucketing (never `Math.random` in edge isolates — restore the split logic pattern from belgium commit `4c6c865`), `?ab=` preview override, variant registry in code, React context provider, rewrites to variant routes. Exposure AND conversion events tagged with `ab_variant` metadata into the unified analytics events table.
**Why:** It's the proven implementation. Known weaknesses to fix in the port: tag `ab_variant` on all conversion events (belgium only reliably tagged pageviews, forcing path-based proxies); make experiments first-class (registry table + typed config) instead of one hardcoded experiment.
**Revisit if:** —

## D6 — Legacy tracking compatibility is out of scope pre-cutover (2026-07-16)

**What:** The new analytics ingest accepts the new SDK's payload. Legacy `tracker.js` sites (Shopify store pages, blog, ultimatepianist.com, musicalbasics.com) get a compatibility snippet at cutover (Phase 7) pointing at the new endpoint.
**Why:** Don't let long-tail legacy sites block the core build.
**Revisit if:** those sites matter earlier than expected.

## D7 — dreamplay-email-2's deployed tracking endpoints get absorbed (2026-07-16)

**What:** Open-pixel, click-redirect, unsubscribe, and resolve-subscriber endpoints (currently the deployed dreamplay-email-2 at email.dreamplaypianos.com, a repo NOT in the working set — Lionel confirmed 2026-07-16 that BOTH email-2 and email-3 are actively in use) are re-implemented in the monorepo email package. At cutover, email.dreamplaypianos.com + link.musicalbasics.com + link.ultimatepianist.com point at the monorepo.
**Why:** Otherwise the monorepo still depends on an orphaned legacy deploy for unsubscribes — a compliance-critical path.
**Revisit if:** —

## D8 — Tailwind 3.4 in apps/web, not Tailwind 4 (2026-07-16)

**What:** apps/web pins tailwindcss ^3.4 + tailwindcss-animate, matching dreamplay-website-2's shadcn/Radix component library.
**Why:** Phase 2 ports ~all of website-2's UI; identical Tailwind major means components copy clean without config/class rewrites. Belgium's TW4 usage doesn't transfer — we port its logic, not its styles.
**Revisit if:** post-migration, upgrade to TW4 as a standalone chore.

## D9 — Port public/ assets into git, minus junk (2026-07-16)

**What:** Copy website-2's `public/` into apps/web/public excluding: `images/factory-pictures/other pictures (no need to use)/` (363MB of raw .MOV/Final Cut files — 15 referenced images total ~7MB stay), Next starter SVGs, and Webflow leftovers in `public/js`/`public/css` if grep shows no references. Net ~175MB committed.
**Why:** Parity requires the assets; GitHub rejects the >100MB junk files anyway; a full R2/CDN offload is a Phase 8 chore, not a Phase 2 blocker.
**Revisit if:** repo size becomes painful — move `images/` to R2 (creds + remotePattern already exist).

## D10 — EmailTracker is KEPT, not deleted (2026-07-16)

**What:** `EmailTracker.tsx` + `trackEmailConversion` + the middleware dp_sid/dp_cid cookie capture port as-is (env-driven endpoint). Only AnalyticsTracker/ABTracker/journey-engine die.
**Why:** EmailTracker is the consumer of the email-attribution chain (sid/cid → subscriber). In Phase 5 its endpoint env var flips from email.dreamplaypianos.com to the in-app route — the component survives.
**Revisit if:** Phase 5 replaces it with the unified @dreamplay/analytics client (likely; delete then, not now).
