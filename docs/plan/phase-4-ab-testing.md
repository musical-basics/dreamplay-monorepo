# Phase 4 — A/B testing

**Goal:** First-class experimentation in `packages/ab`, ported from the belgium pattern, integrated with analytics, with a results dashboard.
**Depends on:** Phases 2 & 3.
**Reference:** docs/reference/ab-testing.md (mechanism + porting rules). Source: `/Users/lionelyu/Documents/New Version/belgium-concert-landing-page` — assignment logic at commit `4c6c865` (the un-paused CSPRNG split), current HEAD for config/context/dashboard patterns.

## Design

Generalize belgium's single-experiment letter system into a registry of named experiments:

- **Registry** (`packages/ab/src/experiments.ts`): typed experiment definitions — key, paths it applies to, variants with weights, optional geo pools (belgium's LOCAL/INTERNATIONAL pattern), status. Mirrored to the `experiments` table for dashboard/status control; code registry is source of truth for variant content.
- **Assignment** (edge-safe helper called from `apps/web` proxy/middleware): per-experiment cookie `ab_<key>` (30d, lax, secure), CSPRNG bucketing (`crypto.getRandomValues` — NEVER Math.random in edge isolates), `?ab=<variant>` preview override with cookie re-stamp, forced-variant support for pausing splits (env/registry-driven, not hardcoded).
- **Rendering:** either `NextResponse.rewrite` to variant routes (belgium style, for whole-page variants) or `<ExperimentProvider>`/`useVariant(key)` for component-level variants. Support both.
- **Tracking:** assignment exposed to the analytics client so **every event** (exposure AND conversion) carries `metadata.ab_variant` (and `ab_experiments` map for multi-experiment). This kills the legacy path-based-proxy weakness. Keep the literal key `ab_variant`.
- **Results:** per-experiment SQL (exposures, conversion events, rates, per-variant deltas) + `/admin/experiments` dashboard page (port the intent of belgium's `/variants` page). Statistical significance display is a nice-to-have, not a blocker.

## Tasks

- [ ] 1. Implement registry + types + `isVariant` guards; `experiments` table sync helper.
- [ ] 2. Implement assignment helper + wire into apps/web middleware/proxy for experiment-matched paths; unit-test bucketing distribution, stickiness, override, forced-variant, geo pools.
- [ ] 3. Implement ExperimentProvider/useVariant + rewrite-based whole-page variant support.
- [ ] 4. Integrate with `packages/analytics` client: variant tags on all events.
- [ ] 5. Results queries + /admin/experiments dashboard.
- [ ] 6. Create one real smoke-test experiment on a low-stakes page of apps/web and verify end-to-end on preview: assignment sticky across reloads, both variants render, exposures + conversions per-variant visible in dashboard.
- [ ] 7. Document "how to launch an experiment" in `packages/ab/README.md` (registry entry → variant content → verify → conclude → clean up).

## Acceptance criteria

- Smoke-test experiment shows correct sticky assignment, ~expected split distribution, and per-variant exposure/conversion counts in the dashboard.
- `?ab=` preview links work and re-stamp cookies.
- No `Math.random` anywhere in edge-executed code (lint rule or grep check).
