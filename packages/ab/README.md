# @dreamplay/ab

First-class A/B experimentation for the monorepo — the belgium landing-page
pattern (commit `4c6c865`) generalized into a typed registry of named,
concurrent experiments. Edge-safe assignment (CSPRNG only, never
`Math.random`), sticky 30-day `ab_<key>` cookies, `?ab=` preview overrides,
geo pools, and automatic tagging of every analytics event via
`@dreamplay/analytics`.

Entry points:

| Import | Contents |
| --- | --- |
| `@dreamplay/ab` | registry (`defineExperiments`), assignment (`resolveAssignments`, `applyAssignments`), cookie readers |
| `@dreamplay/ab/react` | `<ExperimentProvider>`, `useVariant()`, `<Variant>` |
| `@dreamplay/ab/sync` | `syncExperimentsToDb()` (server-side, admin client) |

## How to launch an experiment

### 1. Add a registry entry

The registry (in apps/web, e.g. `lib/experiments.ts`) is the source of truth:

```ts
import { defineExperiments } from "@dreamplay/ab";

export const experiments = defineExperiments([
  {
    key: "hero_2026",              // cookie becomes ab_hero_2026 — pick once, never rename mid-flight
    name: "Hero: video vs image",
    status: "running",
    paths: [{ type: "exact", path: "/" }],
    variants: [
      { key: "control", weight: 1, label: "Current hero" },
      { key: "image", weight: 1, label: "Image hero" },
      // Whole-page variant? Give it a route and create app/(variants)/b/page.tsx:
      // { key: "b", weight: 1, route: "/b" },
    ],
    // Optional geo pools (belgium LOCAL/INTERNATIONAL pattern):
    // geoPools: {
    //   pools: [
    //     { countries: ["BE", "NL", "LU", "GB", "FR", "DE"], variants: ["control"] },
    //     { variants: ["image"] }, // catch-all for everyone else
    //   ],
    // },
  },
]);
```

Weights are relative (`1/1` = 50/50, `3/1` = 75/25). Bucketing uses
`crypto.getRandomValues` — a test in this package fails if `Math.random()`
ever sneaks into the source (it repeats across reused edge isolates and pins
every visitor to one variant).

### 2. Wire assignment in middleware (already done once, per-app)

```ts
// apps/web middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { applyAssignments, getRewritePath, resolveAssignments } from "@dreamplay/ab";
import { experiments } from "@/lib/experiments";

export function middleware(req: NextRequest) {
  const assignments = resolveAssignments(req, experiments);
  const rewrite = getRewritePath(assignments); // whole-page variants only
  const res = rewrite ? NextResponse.rewrite(new URL(rewrite, req.url)) : NextResponse.next();
  return applyAssignments(res, assignments); // stamps ab_<key> cookies (30d, lax, secure)
}
```

Per-experiment priority: `?ab_<key>=` / `?ab=` override → `forcedVariant` or
non-running status → valid cookie inside the visitor's geo pool → fresh
CSPRNG bucket (cookie re-stamped whenever the resolved variant differs).

### 3. Add the variant content

Component-level (preferred for most tests):

```tsx
// server layout: pass assignments down
import { readAbAssignmentsFromCookieString } from "@dreamplay/ab";
const assignments = readAbAssignmentsFromCookieString((await cookies()).toString(), experiments);
<ExperimentProvider assignments={assignments}>{children}</ExperimentProvider>

// client component
const variant = useVariant("hero_2026");
<Variant experiment="hero_2026" match="image" fallback={<VideoHero />}><ImageHero /></Variant>
```

Whole-page (belgium style): give the variant a `route` and build that page;
the middleware rewrite keeps the visitor's URL on the canonical path.

### 4. Sync to the DB & verify tracking

```ts
import { syncExperimentsToDb } from "@dreamplay/ab/sync";
await syncExperimentsToDb(experiments); // upserts into the experiments table for /admin/experiments
```

Analytics tagging is automatic once the analytics provider is configured with

```ts
createAnalytics({ getAbAssignments: createGetAbAssignments(experiments) });
```

— every event (exposures AND conversions) then carries
`metadata.ab_experiments` plus `metadata.ab_variant` (keep that literal key;
the dashboard reads it). Pass `primaryExperiment: "hero_2026"` to the
analytics config when several experiments run concurrently.

### 5. Verify on preview

- Open `/?ab_hero_2026=image` (or `/?ab=image` while it's the only experiment
  on the path) — the override renders that variant and re-stamps the cookie.
  Share these links for design review.
- Reload without the param: assignment must be sticky (same variant).
- Clear the `ab_hero_2026` cookie a few times: both variants should appear at
  roughly the configured split.
- Check `/admin/experiments` for per-variant exposures/conversions
  (`getVariantResults("hero_2026", "7d")` from `@dreamplay/analytics/queries`).

### 6. Pause / conclude

- **Pause the split** without unshipping: set `forcedVariant: "control"` (or
  `status: "paused"`). Everyone lands on the pinned variant; `?ab=` preview
  links keep working.
- **Conclude:** set `status: "concluded"` + `forcedVariant: "<winner>"`,
  redeploy, run `syncExperimentsToDb` (stamps `concluded_at`). Leave the entry
  in place until traffic with old cookies has drained (30d cookie lifetime).

### 7. Clean up

Fold the winning variant into the default page, delete the losing variant
content/routes, then delete the registry entry. The `experiments` DB row stays
as history. Never reuse a retired experiment key for a different test —
lingering `ab_<key>` cookies would pollute the new results.
