# Migration State

> **This file is the single source of truth for progress. Update it after every completed task, then commit + push.**

## Current position

- **Current phase:** 1 — Supabase (in progress)
- **Next action:** Author migrations per phase-1-supabase.md; Supabase project creation is [HUMAN]-blocked (no supabase CLI/token/Docker on this machine — Lionel must create the project or provide SUPABASE_ACCESS_TOKEN)
- **Blocked on:** nothing locally (remote Supabase steps deferred to human review round)

## Phase status

| Phase | Status | Completed on |
|---|---|---|
| 0 — Foundation | **done** | 2026-07-16 |
| 1 — Supabase | not started | — |
| 2 — Website port | not started | — |
| 3 — Analytics | not started | — |
| 4 — A/B testing | not started | — |
| 5 — Email | not started | — |
| 6 — Data migration | not started | — |
| 7 — Cutover | not started | — |
| 8 — Hardening | not started | — |

## Pending [HUMAN] items

_(none surfaced yet — phase files mark them; move them here when they become the blocker)_

## Log

- **2026-07-16** — Phase 0 complete: pnpm workspace + Turborepo + apps/web (Next 16.2, Tailwind 3.4 — chosen over TW4 for copy-clean shadcn port, see D8) + 4 package stubs; build/lint/typecheck/test green; GitHub Actions CI; Vercel project `dreamplay-monorepo` (root dir apps/web, GitHub connected, first deploy Ready). Tooling notes: machine has pnpm 10 + Vercel CLI (authed `musicalbasics`) + gh (authed `musical-basics`); NO supabase CLI, NO Docker, NO SUPABASE_ACCESS_TOKEN — Phase 1 remote steps are [HUMAN].
- **2026-07-16** — Plan created. Legacy repos inventoried (reports in docs/reference/). Repo initialized with plan docs only; no code yet.

## Notes for the next session

- Nothing yet.
