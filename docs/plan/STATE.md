# Migration State

> **This file is the single source of truth for progress. Update it after every completed task, then commit + push.**

## Current position

- **Current phase:** 3/4 — analytics + A/B integration into apps/web (in progress)
- **Next action:** Finish Phase 3/4 integration (track route, provider, middleware, /admin dashboards, smoke experiment), then Lionel review round
- **Blocked on:** [HUMAN] items listed below (needed before runtime verification against a live DB)

## Phase status

| Phase | Status | Completed on |
|---|---|---|
| 0 — Foundation | **done** | 2026-07-16 |
| 1 — Supabase | **done (offline)** — remote project creation + db push are [HUMAN] | 2026-07-16 |
| 2 — Website port | **done** — task 10 (live end-to-end verify) awaits Supabase env | 2026-07-16 |
| 3 — Analytics | in progress (package done; app integration running) | — |
| 4 — A/B testing | in progress (package done; app integration running) | — |
| 5 — Email | not started | — |
| 6 — Data migration | not started | — |
| 7 — Cutover | not started | — |
| 8 — Hardening | not started | — |

## Pending [HUMAN] items

1. **Create the Supabase project** (phase-1 task 1) — dashboard or `supabase projects create`; put URL + anon + service-role keys in `apps/web/.env.local` and Vercel project env. Then apply migrations: install supabase CLI, `supabase link`, `supabase db push` from `packages/db` (or paste `packages/db/supabase/migrations/*.sql` into the SQL editor in filename order).
2. **Vercel env vars** — copy the secret values for everything in `.env.example` (Shopify, Resend, AI keys) into the `dreamplay-monorepo` Vercel project.
3. **Add admin emails** — `settings` table key `admin_emails` (jsonb array) to unlock /admin dashboards.
4. After 1–3: run phase-2 task 10 + phase-3/4 live acceptance checks on the preview URL.

## Log

- **2026-07-16** — Phase 2 complete (minus live verify): full website ported by 5 parallel workers (A+E foundation/actions, B marketing, C commerce, D auth/portal, F webhook/scripts). 50 routes build green; forbidden-import sweep clean; Shopify guard hook ported to .claude/. Key adaptations: root / redirects to /premium-offer (journey engine's target); /buy → /shop redirect added; variant-map relocated to src/config/; webhook now also emits deduped `purchase` events; intro-offer slide tracking removed pending Phase 3 re-add via new SDK.
- **2026-07-16** — Phase 1 offline portion complete: migrations (5 files, 24 tables), hand-authored types, @dreamplay/db clients, 13 tests. Phase 3/4 package cores complete: @dreamplay/analytics + @dreamplay/ab, 75 tests.
- **2026-07-16** — Phase 0 complete: pnpm workspace + Turborepo + apps/web (Next 16.2, Tailwind 3.4 — chosen over TW4 for copy-clean shadcn port, see D8) + 4 package stubs; build/lint/typecheck/test green; GitHub Actions CI; Vercel project `dreamplay-monorepo` (root dir apps/web, GitHub connected, first deploy Ready). Tooling notes: machine has pnpm 10 + Vercel CLI (authed `musicalbasics`) + gh (authed `musical-basics`); NO supabase CLI, NO Docker, NO SUPABASE_ACCESS_TOKEN — Phase 1 remote steps are [HUMAN].
- **2026-07-16** — Plan created. Legacy repos inventoried (reports in docs/reference/). Repo initialized with plan docs only; no code yet.

## Notes for the next session

- Nothing yet.
