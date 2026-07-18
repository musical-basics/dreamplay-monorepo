# Migration State

> **This file is the single source of truth for progress. Update it after every completed task, then commit + push.**

## Current position

- **Current phase:** Phases 0–6 COMPLETE. Phase 7 (cutover) prepped and [HUMAN]-gated.
- **Next action:** Lionel: cutover session per phase-7 (batch: Inngest app + Resend webhook + DNS/domains + Shopify webhook registration + optional password-hash import). Everything up to that line is done.
- **Blocked on:** nothing

## Phase status

| Phase | Status | Completed on |
|---|---|---|
| 0 — Foundation | **done** | 2026-07-16 |
| 1 — Supabase | **done (offline)** — remote project creation + db push are [HUMAN] | 2026-07-16 |
| 2 — Website port | **done** — task 10 (live end-to-end verify) awaits Supabase env | 2026-07-16 |
| 3 — Analytics | **done** — pixels + tracker.js serve deferred to Phase 7; live-DB checks await env | 2026-07-16 |
| 4 — A/B testing | **done** — smoke experiment verified via curl; dashboard DB-side check awaits env | 2026-07-16 |
| 5 — Email | **done** — task 10 (live verification send) is [HUMAN]-gated on Inngest+Resend-webhook keys | 2026-07-18 |
| 6 — Data migration | **done** — passwords pending choice (reset-once vs hash import); Lionel test-login outstanding | 2026-07-18 |
| 7 — Cutover | not started | — |
| 8 — Hardening | not started | — |

## Pending [HUMAN] items

*(2026-07-18: items 1–3 DONE — project huviqtkjkdkcfneorrmo live, migrations applied+verified, 15 env vars in Vercel, admin_emails seeded. Remaining: item 4 below.)*

1. ~~**Create the Supabase project**~~ DONE — huviqtkjkdkcfneorrmo. Original text: **Create the Supabase project** (phase-1 task 1) — dashboard or `supabase projects create`; put URL + anon + service-role keys in `apps/web/.env.local` and Vercel project env. Then apply migrations: install supabase CLI, `supabase link`, `supabase db push` from `packages/db` (or paste `packages/db/supabase/migrations/*.sql` into the SQL editor in filename order).
2. **Vercel env vars** — copy the secret values for everything in `.env.example` (Shopify, Resend, AI keys) into the `dreamplay-monorepo` Vercel project.
3. **Add admin emails** — `settings` table key `admin_emails` (jsonb array) to unlock /admin dashboards.
4. After 1–3: run phase-2 task 10 + phase-3/4 live acceptance checks on the preview URL.

## Log

- **2026-07-18** — Phase 5 complete: packages/email + Inngest v4 fns + agent API (suppression-aware, ≥50-recipient count confirmation) + tracking endpoints (open/click/resolve-subscriber/unsubscribe, absorbing dp-email-2) + Resend webhook (svix) + /admin/email UI + send-wave CLI. All four legacy incident classes have enforced fixes with reproducing tests (65 new; 153 total green). AGENT_API_KEY + EMAIL_UNSUBSCRIBE_SECRET generated and set in Vercel + .env.local; NEXT_PUBLIC_APP_URL points at preview until cutover. Outstanding external keys: INNGEST_EVENT_KEY/SIGNING_KEY, RESEND_WEBHOOK_SECRET ([HUMAN] dashboards). Rotation schedule state lives in app_settings key rotation-schedule:<id>.

- **2026-07-18** — Phase 6 EXECUTED against live DBs (idempotent scripts in scripts/migrate/, re-runnable for delta sync pre-cutover): 68 auth users, 77 buyers, 22 decisions (user_ids remapped), 78 customers, 32 waitlist, 9,450 subscribers (6,069 cross-workspace dupes merged, most-restrictive status wins), 1,021 suppressions seeded (COMPLIANCE ASSERTION PASSED), 111 tags, 16 merge_tags, 6 rotations, 1,555 campaigns (65 templates + children referenced by sent_history), 61,806 sent_history. analytics_logs + subscriber_events intentionally not ported. Passwords NOT migratable via API — users are email-confirmed/passwordless; import-password-hashes.mjs ready if old DB connection string provided pre-cutover.

- **2026-07-18** — Supabase project huviqtkjkdkcfneorrmo live (Lionel created + applied migrations). Verified: 24 tables + get_analytics_summary RPC, RLS anon-blocked, service-role CRUD OK. admin_emails seeded (lionel@musicalbasics.com). .env.local reformatted + mirrored to apps/web (legacy secrets merged; 4 Storefront vars missing in legacy too — permalink fallback covers checkout). 15 env vars upserted to Vercel (all envs). LIVE acceptance passed locally: /accessories experiment SSR + sticky cookie, /my-reservation gating redirect, /api/track → events row with ab_variant tag (localhost correctly is_bot-flagged). Preview redeployed with env.

- **2026-07-16** — Phases 3+4 integration complete: /api/track live, AnalyticsProvider+Beacon in layout, A/B assignment in middleware (pre-session, SSR-correct first paint), smoke-accessories-hero experiment verified (sticky, ?ab= override, 50/50 over 12 draws), conversions instrumented (begin_checkout/email_signup/cta_click/slide_view), /admin/analytics + /admin/experiments gated by settings.admin_emails. All gates green; preview deployed.

- **2026-07-16** — Phase 2 complete (minus live verify): full website ported by 5 parallel workers (A+E foundation/actions, B marketing, C commerce, D auth/portal, F webhook/scripts). 50 routes build green; forbidden-import sweep clean; Shopify guard hook ported to .claude/. Key adaptations: root / redirects to /premium-offer (journey engine's target); /buy → /shop redirect added; variant-map relocated to src/config/; webhook now also emits deduped `purchase` events; intro-offer slide tracking removed pending Phase 3 re-add via new SDK.
- **2026-07-16** — Phase 1 offline portion complete: migrations (5 files, 24 tables), hand-authored types, @dreamplay/db clients, 13 tests. Phase 3/4 package cores complete: @dreamplay/analytics + @dreamplay/ab, 75 tests.
- **2026-07-16** — Phase 0 complete: pnpm workspace + Turborepo + apps/web (Next 16.2, Tailwind 3.4 — chosen over TW4 for copy-clean shadcn port, see D8) + 4 package stubs; build/lint/typecheck/test green; GitHub Actions CI; Vercel project `dreamplay-monorepo` (root dir apps/web, GitHub connected, first deploy Ready). Tooling notes: machine has pnpm 10 + Vercel CLI (authed `musicalbasics`) + gh (authed `musical-basics`); NO supabase CLI, NO Docker, NO SUPABASE_ACCESS_TOKEN — Phase 1 remote steps are [HUMAN].
- **2026-07-16** — Plan created. Legacy repos inventoried (reports in docs/reference/). Repo initialized with plan docs only; no code yet.

## Notes for the next session

- Nothing yet.
