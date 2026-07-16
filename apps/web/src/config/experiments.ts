/**
 * A/B experiment registry for apps/web (Phase 4).
 *
 * This is the source of truth for every experiment: the middleware resolves
 * assignments from it, components read variants via @dreamplay/ab/react, the
 * analytics client tags every event from the ab_* cookies it produces, and
 * /admin/experiments mirrors it into the `experiments` table ("Sync to DB").
 *
 * Runbook (add/pause/conclude/clean up): packages/ab/README.md.
 * Edge-safe: imported by middleware.ts — keep this module free of Node APIs.
 */

import { defineExperiments } from "@dreamplay/ab";

export const experiments = defineExperiments([
  {
    // Smoke test (phase-4 task 6): low-stakes headline swap on /accessories.
    // Verifies the full pipeline end-to-end: middleware bucketing → sticky
    // ab_smoke-accessories-hero cookie → useVariant rendering → ab_variant
    // tagging on analytics events → /admin/experiments results.
    key: "smoke-accessories-hero",
    name: "Smoke test: accessories hero headline",
    status: "running",
    paths: [{ type: "exact", path: "/accessories" }],
    variants: [
      { key: "control", weight: 1, label: '"Complete the Ecosystem" (current)' },
      { key: "b", weight: 1, label: '"Upgrade Your Studio Today"' },
    ],
  },
]);

export type AppExperiments = typeof experiments;
