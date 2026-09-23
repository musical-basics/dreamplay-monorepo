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

## D11 — A/B v2: funnel model (groups × variations) replaces the experiment registry (2026-08-04)

**What:** The D5 multi-experiment registry (`ab_<key>` cookies, per-path experiments) is replaced by a single-funnel model, per Lionel's spec:
- One cookie `dp_ab` holding a variation key shaped `<group><letter>` (1a, 1b, 2a…). Group = layout family; letter = variation of that layout. 30d, CSPRNG-assigned, sticky.
- `/` redirects to `/ab` when a `dp_ab` cookie exists, else to `/main`. Both `/main` and `/ab` are middleware-rewritten (URL preserved) to the route of the configured layout, so analytics `path` cleanly separates the funnels.
- `/main` is manually pinned in config (route + CTA) and NEVER variant-tagged — its traffic/conversions are excluded from A/B scoring by construction, even when its layout matches a variant.
- `/ab` assigns among active variations (weighted CSPRNG); `/ab/<key>` is a shareable preview/forced link. Deactivation per-variation or per-group via `active` flags in config; users on a deactivated variation are reassigned on their next `/ab` (or `/`) hit.
- A main-funnel user who later clicks an `/ab` link is assigned and stays in the A/B funnel (cookie wins from then on).
- Per-variation CTA (`/customize` vs `/shop` etc.) swaps client-side via a `useAbCta()` hook reading the cookie + registry — landing pages stay untouched apart from their CTA components.
- Scoring: point-valued rules over the existing `events` table (time-on-page, clicks, email_signup, add_to_cart, cta_click, begin_checkout, checkout_info_entered, purchase) computed in a pure helper + `/admin/ab-tests` score sheet. No new DB tables/migrations; code registry is the source of truth (the `experiments` table is left as history, unused).
- Purchase attribution fix: the Shopify order note now carries `ab_variant:<key> | dp_session:<id>`; the orders webhook parses both so `purchase` events join per-session variant scoring (previously impossible — webhooks have no cookies).

**Why:** Lionel's directive 2026-08-04. The old model optimized for many small concurrent experiments; the real need is one landing-page funnel testing whole layouts (groups) and tweaks within a layout (letters), with an explicit manually-controlled main page outside the test. Keeps D5's invariants: CSPRNG only, literal `ab_variant` metadata key, cookie re-stamp semantics.
**Revisit if:** concurrent independent experiments are ever needed again — resurrect the D5 registry from git alongside the funnel.

## D12 — Daily A/B report: @react-pdf/renderer + Inngest cron, direct Resend send (2026-08-04)

**What:** The daily A/B performance report (8am ET to support@dreamplaypianos.com) is a new `@dreamplay/reports` package: report windows are ET calendar days ([previous day] + [trailing 7 days]) computed via Intl (no tz library), data comes from a new explicit-range query `fetchAbTaggedEventsBetween` fed into the existing pure scoring engine, and the PDF is rendered with **@react-pdf/renderer**. Scheduling is an **Inngest cron function** (`daily-ab-report`, `TZ=America/New_York 0 8 * * *`) — the repo's first cron trigger. The email is sent via `createResendSender` **directly**, not through the campaign pipeline, with the PDF as a base64 attachment (`SendEmailPayload.attachments`, new).
**Why:** @react-pdf/renderer runs in Vercel serverless without headless Chrome (puppeteer would need @sparticuz/chromium and ~50MB of binary); Inngest is already live/registered (D4) so no vercel.json cron needed; the campaign machinery (suppression, sent_history, global-send-lock) exists to protect bulk subscriber sends — a single fixed admin recipient needs none of it and routing through it would create a fake campaign row per day.
**Revisit if:** the report needs charts/graphics beyond tables (react-pdf's primitives get painful — switch to headless Chrome rendering of an HTML page) or more recipients/preferences (move recipient list to the settings table).

## D13: Homepage pinned to a verbatim Webflow-era port; Webflow CSS/JS scoped by route group (2026-09-23)

**What:** Lionel asked for the homepage to be the site exactly as at dreamplay-website commit `1d47b9f` (2026-01-02: the original Webflow-export homepage, the last state before /special-offer and /premium-offer existed). Rather than adapting the Tailwind rewrite at `/legacy-home` (variation 2a, which is the later Feb to Apr 2026 copy and is live in the 6a/6b test cells), that commit's `page.tsx`, `Navbar.tsx` and `Footer.tsx` are ported verbatim to `/webflow-home` inside a new route group `(webflow-home)`, together with the three Webflow stylesheets (`public/css/`) and the exported runtime (`public/js/webflow.js`, plus Webflow's jQuery build and Swiper from their CDNs). The route-group layout renders the stylesheets as plain `<link>` elements without a `precedence` prop, so React keeps them in place and they exist only while that layout is mounted; `WebflowRuntime` boots webflow.js on mount and calls `destroy()` on unmount. `abFunnel.main` now points at `/webflow-home`; the page is also registered as variation 2b (group 2 stays paused) so it can be previewed at /ab/2b and scored later. Deliberate deviations from 1d47b9f: asset paths follow the March-2026 /public reorganisation; the purged `-p-` srcset variants are replaced by `/_next/image` candidates (see `components/webflow-home/responsive.ts`); the conversion CTAs use `AbCtaLink` (destination /customize, `cta_click` scoring); the footer form posts to `subscribeToNewsletter` instead of the retired Mailchimp list; dead footer links (`/reserve`, `#`) point at /terms, /contact and /privacy; the copyright year is dynamic; `<title>`/description keep the current SEO values instead of the 2025 ones. Lenis was loaded but never initialised in the original, so it is not loaded.
**Why:** "The commit" is what was asked for, and /legacy-home is both a different, later copy and mid-test. Scoping via a route group is the technique the legacy repo itself settled on (2026-03-12, commit 1c1db49) after global Webflow CSS broke the v0 pages; React's in-place rendering of un-prioritised stylesheet links makes the scoping deterministic (verified: the links and the `data-wf-site` attribute disappear on client-side navigation to /how-it-works and return on navigation back).
**Revisit if:** the Webflow runtime misbehaves on client-side revisits (fallback: React-controlled navbar and slider as in /legacy-home), or the homepage decision is reversed (`main.route` back to `/premium-offer` is one line).
