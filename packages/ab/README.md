# @dreamplay/ab

The A/B **funnel** for the monorepo (Decision D11): whole-layout groups ×
in-layout variations behind `/ab`, a manually-pinned `/main` outside the test,
sticky CSPRNG assignment (never `Math.random`), one `dp_ab` cookie, and a
point-based score engine over the unified `events` table.

Entry points:

| Import | Contents |
| --- | --- |
| `@dreamplay/ab` | registry (`defineAbFunnel`), router (`resolveFunnel`), cookie readers (`createGetAbAssignments`), scoring (`computeVariationScores`, `rollUpGroups`) — all edge-safe |
| `@dreamplay/ab/react` | `<AbFunnelProvider>`, `useAbVariation()`, `useAbCta()` |

## The model

- **`/main`** — everyone hitting `dreamplaypianos.com` lands here (the `/`
  redirect). What it serves is pinned by hand in the registry (`main.route`,
  `main.cta`). Its traffic is **never** variant-tagged, so it never appears on
  the score sheet — even when its layout matches a variation.
- **`/ab`** — the funnel entry. First visit assigns a variation
  (weighted CSPRNG among active ones) and stamps `dp_ab=<key>` (30d,
  httpOnly:false so analytics can read it). Every later `/` or `/ab` visit
  serves that same variation ("continuously shown that variant"). A main-funnel
  visitor who clicks any `/ab` link joins the funnel from then on.
- **Variation keys** are `<group><letter>`: `1a, 1b, 2a…`. The number is a
  layout family, the letter a variation of it. `<n>a` is the base version of
  each layout.
- **Rendering** is by middleware rewrite to the variation's `route` — the URL
  stays `/ab` (or `/main`), so the analytics `path` column cleanly separates
  funnels while the layout pages themselves stay untouched.
- **CTA swapping**: each variation carries a `cta` (e.g. `/customize` vs
  `/shop`). CTA components call `useAbCta(defaultHref)` (or use apps/web's
  `<AbCtaLink>`), so swapping a CTA is a one-line registry change.

## Operating the funnel (registry: `apps/web/src/config/ab.ts`)

1. **Change what /main serves**: edit `main.route` / `main.cta`. Deploy.
2. **Add a variation**: add `{ key: "2b", route: "/some-layout", cta: "/customize", active: true }`
   to group 2. The route must be a real page (add one under
   `apps/web/src/app/(website-pages)/…`, noindexed, CTAs via `<AbCtaLink>`).
3. **Deactivate a variation**: `active: false` on it. **Deactivate a whole
   group**: `active: false` on the group. Cookied visitors of a deactivated
   variation are reassigned on their next `/` or `/ab` hit; history stays on
   the score sheet.
4. **Preview / share**: `/ab/<key>` forces that variation (works for inactive
   ones too) and stamps the cookie. `/ab?v=<key>` is equivalent.
5. **Tune scoring**: point values live in `AB_SCORING` next to the registry.
6. **Read results**: `/admin/ab-tests` — per-variation points per rule, total,
   avg per session, and group roll-ups. Purchases are attributed via the
   `ab_variant:<key> | dp_session:<id>` markers the checkout handoffs plant in
   the Shopify order note (parsed back by the orders webhook).
7. **Retire for good**: delete the variation from the registry — its data
   still shows under "Retired variants" on the score sheet. Never reuse a
   retired key.

## Invariants (do not break)

- CSPRNG only (`crypto.getRandomValues`) — `Math.random` can repeat across
  reused edge isolates; `no-math-random.test.ts` enforces this.
- The analytics metadata key is literally `ab_variant` (D5) — dashboards and
  the events index depend on it.
- `dp_ab` stays `httpOnly: false` — client JS must read it to tag events.
- `/main` traffic stays untagged. If you ever tag it, the "main is not part of
  the test" guarantee dies.
- No `next/*` imports in this package — middleware imports it in the edge
  runtime, and it must keep typechecking standalone.
