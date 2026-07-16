# Phase 0 — Foundation

**Goal:** A scaffolded, building, deployable (empty) monorepo with CI, so every later phase lands on working rails.
**Depends on:** nothing.

## Tasks

- [ ] 1. Scaffold pnpm workspace: `pnpm-workspace.yaml` (`apps/*`, `packages/*`), root `package.json`, Turborepo (`turbo.json` with build/lint/typecheck/test pipelines), root `tsconfig.base.json`, `.gitignore` (node_modules, .next, .env*.local, .turbo, .vercel), `.env.example` (starts empty, grows every phase).
- [ ] 2. Create `apps/web`: fresh Next.js (latest stable, App Router, TS, Tailwind) named `@dreamplay/web`. Dev port 3000. Boots to a placeholder page.
- [ ] 3. Create empty package stubs with correct exports/tsconfig: `packages/db` (`@dreamplay/db`), `packages/analytics` (`@dreamplay/analytics`), `packages/ab` (`@dreamplay/ab`), `packages/email` (`@dreamplay/email`). Each has one exported placeholder to prove workspace linking (`apps/web` imports from each and builds).
- [ ] 4. Tooling: ESLint + Prettier at root, shared config; Vitest wired in each package; `pnpm build && pnpm lint && pnpm typecheck && pnpm test` all green.
- [ ] 5. GitHub: create private repo `musical-basics/dreamplay-monorepo`, push. **[HUMAN if gh auth missing]**
- [ ] 6. CI: GitHub Actions workflow running build/lint/typecheck/test on push/PR (the legacy repos had zero CI — this is a fix).
- [ ] 7. Vercel: create NEW Vercel project `dreamplay-monorepo` linked to the repo, root directory `apps/web`. Do NOT touch the existing `dreamplay-pianos` Vercel project. No custom domains yet (preview URLs only until Phase 7). **[HUMAN: Vercel dashboard or `vercel link` auth]**

## Acceptance criteria

- `pnpm install && pnpm build` green from clean clone; CI green on GitHub.
- Vercel preview deploy serves the placeholder page.
- All four packages importable from `apps/web`.

## Notes

- Choose latest stable Next.js at execution time (legacy repos are on 16.0.10 / 16.2 — match or exceed 16.2).
- Keep `apps/web` middleware file location in mind: Next 16 uses `proxy.ts` convention (see docs/reference/ab-testing.md).
