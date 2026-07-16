# DreamPlay Monorepo

Unified replacement for the DreamPlay polyrepo setup (website + email + analytics + A/B testing). One Next.js app, one Supabase project, shared packages.

## ⚠️ Resume protocol (read this first, every session)

This migration is larger than one context window. The plan is designed to survive context resets:

1. **Read [docs/plan/STATE.md](docs/plan/STATE.md)** — it tells you the current phase, what's done, and the exact next action.
2. **Read the current phase file** in `docs/plan/` (e.g. `phase-2-website.md`). Each phase file is self-contained: goals, source material paths, tasks, acceptance criteria.
3. Consult `docs/reference/*.md` for inventories of the legacy repos — **do not re-explore the old repos from scratch**; the inventories were done 2026-07-16 and are trustworthy unless the old repos changed since.
4. After completing each task: check it off in the phase file, update `STATE.md` (current phase / next action / decisions log), then **commit and push**. STATE.md must always reflect reality — it is the single source of truth for progress.
5. Record any new architectural decision in [docs/plan/DECISIONS.md](docs/plan/DECISIONS.md) before acting on it.

## Legacy repos (read-only source material — do not modify)

- Website: `/Users/lionelyu/Documents/DreamPlay Repos/dreamplay-website-2`
- Email: `/Users/lionelyu/Documents/DreamPlay Repos/dreamplay-email-3` (tracking/unsub handlers live in the deployed `dreamplay-email-2` at email.dreamplaypianos.com)
- Analytics: `/Users/lionelyu/Documents/DreamPlay Repos/dreamplay-analytics` (deployed at data.dreamplaypianos.com)
- A/B pattern to port: `/Users/lionelyu/Documents/New Version/belgium-concert-landing-page`

These stay live in production until Phase 7 cutover. Never edit them as part of monorepo work.

## Conventions

- pnpm workspaces + Turborepo. Package manager: pnpm.
- TypeScript everywhere. Next.js App Router.
- Supabase schema changes ONLY via migration files in `packages/db/supabase/migrations/` (`supabase migration new ...`). Never via ad-hoc SQL in the dashboard — that's how the old repos lost track of their schemas.
- Secrets in `.env.local` (gitignored); every env var must also be listed in `.env.example` with a comment.
- No PII/data files committed (the old repos committed subscriber CSVs — don't repeat that).
- Commit style: `feat: / fix: / docs: / chore:` prefixes. Commit + push after every completed unit of work.
