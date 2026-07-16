# Migration Overview — DreamPlay Monorepo

**Created:** 2026-07-16 · **Status:** planning complete, execution not started

## Mission

Replace the failing polyrepo setup (dreamplay-website-2, dreamplay-email-3, dreamplay-analytics, plus the deployed dreamplay-email-2 tracking app) with a single monorepo containing the website, email system, and analytics with first-class A/B testing. Fresh Supabase project, buyers ported from website-2, same Shopify stores reconnected. Old deployments deprecated only after the monorepo is verified working (Phase 7).

## Why the polyrepo failed (from the 2026-07-16 inventories — see docs/reference/)

- **Fragmented tracking:** three different client tracking implementations and two disconnected A/B systems (website's `/api/track-ab` vs analytics' non-sticky `/api/decide`), none sharing code.
- **Cross-repo runtime coupling:** analytics reads the email repo's Supabase for identity; the website calls email.dreamplaypianos.com to resolve subscribers; a change in one repo silently breaks another.
- **Three Supabase projects, no migrations anywhere** — schema exists only implicitly in code plus ad-hoc SQL-editor scripts.
- **Email pipeline is incident-scarred and hand-operated:** double-send incident (2026-05-12), no bounce/complaint webhook, no retry on transient 5xx aborts whole sends, done-marker race drops recipients, sends driven by gitignored one-off scripts.
- **Zero conversion attribution** — email → Shopify purchase funnel never stitched together.

## Target architecture (see DECISIONS.md for rationale)

```
dreamplay-monorepo/
├── apps/
│   └── web/                  # ONE Next.js app: marketing site, buyer portal,
│                             # checkout, /admin (analytics dashboard + email admin),
│                             # all API routes (track, ab, email agent API, inngest,
│                             # Shopify webhooks, open/click/unsubscribe tracking)
├── packages/
│   ├── db/                   # Supabase clients, generated types, migrations (supabase CLI)
│   ├── analytics/            # ONE tracking SDK: client beacon + server ingest + queries
│   ├── ab/                   # experiment registry, cookie assignment, React context
│   └── email/                # send engine: idempotent sends, waves, templates, merge tags
├── docs/
│   ├── plan/                 # this plan + STATE.md + DECISIONS.md
│   └── reference/            # legacy repo inventories (source of truth for porting)
└── turbo.json / pnpm-workspace.yaml
```

- **One Supabase project** (new) with unified schema: buyers/reservations, subscribers/campaigns/sends, analytics events, experiments. All cross-domain joins (email → purchase attribution) become plain SQL.
- **One Vercel project** serving dreamplaypianos.com; data./email. subdomains point at the same app after cutover.
- Inngest for email jobs (kept — it works; the bugs were in app code). Resend for sending (kept).

## Phase index

| Phase | File | Summary | Depends on |
|---|---|---|---|
| 0 | phase-0-foundation.md | Scaffold repo, tooling, CI, Vercel, GitHub | — |
| 1 | phase-1-supabase.md | New Supabase project, unified schema, migrations | 0 |
| 2 | phase-2-website.md | Port website: pages, auth, buyer portal, Shopify cart/admin | 1 |
| 3 | phase-3-analytics.md | Unified tracking SDK, ingest, dashboard | 1 (parallel with 2) |
| 4 | phase-4-ab-testing.md | Middleware assignment, experiments, reporting | 2, 3 |
| 5 | phase-5-email.md | Subscribers, idempotent send pipeline, tracking, bounce handling | 1, 3 |
| 6 | phase-6-data-migration.md | Port buyers + auth users (+ subscribers) into new DB | 1, 2, 5 |
| 7 | phase-7-cutover.md | Shopify webhooks, DNS, deprecate old deployments | all |
| 8 | phase-8-hardening.md | Post-cutover verification, monitoring, cleanup | 7 |

Phases 2 and 3 can proceed in parallel. Everything else is roughly sequential.

## Ground rules for execution

- Old repos/deployments stay untouched and live until Phase 7. The monorepo is built and verified alongside them.
- Every schema change is a migration file. Every env var goes in `.env.example`.
- Each phase ends with its acceptance criteria verified and STATE.md updated.
- Steps requiring human action (creating accounts, DNS, Shopify admin, Vercel domains) are marked **[HUMAN]** in phase files — batch them and ask Lionel rather than stalling mid-phase.
