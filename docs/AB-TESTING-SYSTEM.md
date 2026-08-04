# The DreamPlay A/B Funnel System — portable blueprint

> **Audience:** AI agents (and humans) who want to understand, operate, or
> **replicate this system in another codebase**. It is self-contained: you can
> rebuild the whole system from this document alone. The reference
> implementation lives in this repo (file map in §9); the original product
> spec it implements is in Appendix A. Recorded as Decision D11 in
> `docs/plan/DECISIONS.md`.

Stack assumed by the reference implementation: Next.js App Router +
edge middleware, a Postgres `events` table (Supabase), Shopify checkout.
§10 explains what to swap for other stacks.

---

## 1. The model in one paragraph

There is exactly **one funnel test** at a time, not N concurrent experiments.
Visitors are either in the **main funnel** (they clicked the normal site link;
they see the manually-chosen `/main` page and are tracked but **never scored**)
or in the **A/B funnel** (they clicked an `/ab` link once; they were randomly
assigned a **variation** and will see it on every future visit). Variations are
keyed `<group><letter>` — `1a, 1b, 2a…` — where the **number is a whole layout
family** and the **letter is a tweak within that layout**. Every action a
funnel member takes earns **points** (a click is worth less than an email
capture, which is worth less than a purchase); the score sheet ranks variations
by **average points per session**.

## 2. Routing spec

One cookie: **`dp_ab`**, value = a variation key (e.g. `"2b"`), 30 days,
`SameSite=Lax; Secure; Path=/`, **`httpOnly: false`** (client JS must read it
to tag analytics events — this is deliberate and load-bearing).

| Request | Behavior |
|---|---|
| `/` | 307 redirect → `/ab` if the `dp_ab` cookie holds a **known** variation (active or not), else → `/main`. Query string preserved. |
| `/main` | Middleware **rewrite** (URL unchanged) to the manually-pinned layout route (`main.route`). No cookie is set, no variant tag ever. |
| `/ab` | Resolve variation, then rewrite (URL unchanged) to its route: ① cookie valid **and still active** → serve it (sticky, no restamp); ② cookie missing/inactive/deactivated → CSPRNG-pick a new one from the **active** pool (weighted), stamp cookie; ③ zero active variations → serve the main layout, untagged. |
| `/ab/<key>` or `/ab?v=<key>` | **Forced preview/share link**: serve exactly that variation (works for inactive ones too) and stamp the cookie. Unknown key → redirect to `/ab` (normal assignment). |
| anything else | Untouched. |

Why **rewrite instead of redirect** for `/main` and `/ab`: the browser URL
stays `/main` or `/ab`, so (a) client-side analytics records `path=/main` vs
`path=/ab` — the two funnels separate cleanly in one events table, and (b) the
layout pages themselves stay normal, publicly-routable pages.

Consequences that fall out of this design for free (do not break them):

- **/main exclusion is structural, not filtered.** Main-funnel visitors have
  no cookie → their events carry no variant tag → they cannot appear on the
  score sheet, even when /main's layout is byte-identical to a variation.
- **Mid-session funnel entry works.** A main-funnel visitor who clicks any
  `/ab` link gets assigned and is in the A/B funnel from then on ("continuously
  shown that variant going forward") — the cookie wins on all future `/` hits.
- **Deactivation reassigns lazily.** Deactivating `3b` (or all of group 3)
  means visitors holding `3b` are re-bucketed on their *next* `/` or `/ab`
  visit. Their historical `3b` events remain on the score sheet.

## 3. Registry spec (source of truth = code, not DB)

One typed config object, edge-safe (pure data, no runtime deps), validated at
build time so a bad registry breaks the build instead of mis-routing traffic:

```ts
{
  // The manually-set page. Changing what dreamplaypianos.com shows = edit this line.
  main: { route: "/premium-offer", cta: "/customize" },

  groups: [
    {
      group: "1",                    // digits only
      name: "Original homepage",     // layout family label
      active: true,                  // false = deactivate ALL variations in the group
      variations: [
        {
          key: "1a",                 // must be `${group}${letter}` — validated
          label: "Original homepage",
          route: "/legacy-home",     // real internal page that renders this layout
          cta: "/customize",         // where this variation's CTAs point
          active: true,              // false = deactivate just this variation
          weight: 1,                 // optional; assignment weight among active
        },
      ],
    },
    // groups 2..n …
  ],
}
```

Validation rules (throw on violation): group ids are digits; variation keys
match `/^(\d+)([a-z])$/` and the digits equal the parent group id; keys unique
across all groups; weights positive; routes are internal paths and **never**
`/`, `/ab`, or `/main` (rewrite-loop guard); CTAs are internal paths.

Conventions: `<n>a` is the base version of each layout family. Never reuse a
retired key (its historical data would pollute the new test).

## 4. Assignment rules

- **CSPRNG only** — `crypto.getRandomValues`, one `Uint32` draw scaled onto the
  cumulative weight line. **Never `Math.random`**: in reused edge isolates it
  can repeat across invocations and pin every visitor to one variant (this
  bug shipped once; a test now greps the package source for call sites).
- Assignment happens **in middleware before the page renders**, and the
  resolved cookie is stamped onto the *request* cookies too, so the SSR of
  that same request already sees it — no "control flash" on first visit.
- Resolution priority on `/ab`: forced key (path/query) → valid active cookie
  → weighted random from active pool → main-layout fallback if pool is empty.

## 5. Event tagging (how scoring gets its data)

All analytics events flow into one `events` table (columns used here:
`event_name, path, session_id, duration_seconds, metadata jsonb,
created_at`). The client analytics SDK accepts a `getAbAssignments` hook that
is called **fresh on every event**; ours reads the `dp_ab` cookie (validated
against the registry) and returns `{ funnel: "2b" }`, which the SDK writes
into every event as:

```json
"metadata": { "ab_variant": "2b", "ab_experiments": { "funnel": "2b" } }
```

The literal key **`ab_variant`** is the join point for all reporting (and has
a Postgres expression index). No cookie → no keys → row invisible to scoring.
Rows flagged `metadata.is_bot` / `is_admin` (stamped by the ingest endpoint)
are excluded by the score engine.

### The webhook-purchase attribution trick (important)

Payment-provider webhooks (Shopify `orders/create|paid`) carry **no cookies**,
so `purchase` events were previously un-attributable. Fix: every checkout
handoff appends markers to the order note it already sends —

```
checkout_source:customize | ab_variant:2b | dp_session:<session-uuid>
```

— and the orders webhook parses them back out
(`/ab_variant:(\d+[a-z])/`, `/dp_session:([A-Za-z0-9_-]{8,64})/`), writing
`session_id` and the two metadata keys onto the purchase event. Purchases then
join per-session scoring like any client-side event. Replicate this pattern
with whatever side-channel your checkout offers (order note, cart attributes,
payment metadata, success-URL params).

## 6. Scoring spec

Points model an action's depth in the purchase funnel. Rules are data, next to
the registry (`AB_SCORING`), each one of four kinds:

| kind | semantics | example |
|---|---|---|
| `once` | award `points` at most once per session if ≥1 matching event | purchase = 100 |
| `count` | `points` × occurrences, capped by `maxPoints` | — |
| `duration` | sum `duration_seconds` of matching events; `points` per `unitSeconds`, capped | time on page |
| `clicks` | sum `metadata.click_count`; `points` per `unitClicks`, capped | engagement |

Rules may also filter by path prefix (e.g. "pageview at /checkout").

The shipped default values:

| rule | event | kind | value |
|---|---|---|---|
| Time on page | `page_leave` | duration | 1 pt / 30 s, cap 5 |
| Engagement clicks | `page_leave` | clicks | 1 pt / 5 clicks, cap 5 |
| CTA click | `cta_click` | once | 5 |
| Added to cart | `add_to_cart` | once | 10 |
| Email captured | `email_signup` | once | 15 |
| Checkout reached | `begin_checkout` | once | 20 |
| Product configured | `checkout_info_entered` | once | 25 |
| Purchase | `purchase` | once | 100 |

Aggregation algorithm (pure function — `computeVariationScores`):

1. Bucket tagged, non-bot rows by `ab_variant`, then by `session_id` (rows
   without a session — e.g. a webhook purchase where only the variant
   survived — each count as their own session so conversions are never dropped).
2. Per session per rule, accumulate the raw magnitude, convert to points per
   the rule kind, apply the per-session cap. Caps are per-session **by
   design**: one hyperactive visitor cannot buy a variation the leaderboard.
3. Sum sessions → per-variation `{sessions, totalPoints, avgPoints,
   per-rule breakdown}`; rank by **avg points per session** (then volume).
4. Roll variations up to groups (`1a+1b+1c → group 1`) the same way.

The score sheet (`/admin/ab-tests`) renders: group leaderboard, per-variation
table (every registry variation, active or not, zeros included; inactive
flagged "off"), per-rule points + raw magnitudes, and a "retired variants"
section for keys that have data but no registry entry anymore.

### Instrumentation checklist (events the rules need)

- `pageview` / `page_leave` (+`duration_seconds`) — automatic beacon.
- `click_count` on `page_leave` — the analytics client attaches a lazy
  capture-phase document click listener; counter resets each pageview.
- `cta_click` — fired by the shared CTA component (see §7).
- `add_to_cart` — fired where items enter the cart.
- `checkout_info_entered` — first real configurator/option interaction per
  session (size/color/tier pickers). Provider-hosted checkout form steps are
  invisible to you; instrument the nearest on-site proxy.
- `begin_checkout` — fired at the checkout handoff (this is also where the
  order-note markers from §5 get planted).
- `email_signup`, `purchase` — existing capture forms / webhook.

## 7. Modularity: swapping layouts and CTAs

A variation is just `{route, cta}` — a **site config**, not a fork of a page:

- **Layouts** are ordinary pages (e.g. `/premium-offer`, `/our-story`, a
  ported historical homepage). Pointing `2b` at a new landing page = build the
  page (noindexed), then one registry line. Existing pages are never modified.
- **CTAs** swap client-side. Pages keep their hardcoded default hrefs; CTA
  components resolve through `useAbCta(defaultHref)`:
  - visitor has a variation → swap the href's base path to `variation.cta`
    (query/hash preserved: `/customize?product=pro` + cta `/shop` →
    `/shop?product=pro`);
  - visitor is on `/main` → swap to `main.cta`;
  - otherwise → the page's own default.
  A shared `<AbCtaLink cta="label" href="/customize">` wraps this + fires
  `cta_click`. The hook reads the cookie **after hydration** (SSR renders the
  default; an href swap post-hydration is invisible — hrefs matter at click
  time), so server and client markup always match.
- Variant-only pages get `robots: { index: false }` metadata AND a robots.txt
  disallow (also disallow `/ab` and `/main` themselves).

## 8. React/provider wiring

Root layout mounts (client-side):

```
<AnalyticsProvider config={{ getAbAssignments: createGetAbAssignments(abFunnel) }}>
  <AbFunnelProvider config={abFunnel} pathname={usePathname()}>
    {children}
    <AnalyticsBeacon />   ← pageview per route change, page_leave on hide/close
  </AbFunnelProvider>
</AnalyticsProvider>
```

`AbFunnelProvider` re-reads the cookie on every navigation (a visitor can
enter the funnel mid-session) and exposes `useAbVariation()` / `useAbCta()`.

## 9. File map (reference implementation, this repo)

| Concern | Path |
|---|---|
| Funnel core: types, `defineAbFunnel`, `resolveFunnel`, CSPRNG, `applyCtaBase` | `packages/ab/src/funnel.ts` |
| Cookie readers + analytics bridge | `packages/ab/src/cookies.ts` |
| Score engine (`computeVariationScores`, `rollUpGroups`) | `packages/ab/src/scoring.ts` |
| React bindings (`AbFunnelProvider`, `useAbVariation`, `useAbCta`) | `packages/ab/src/react.tsx` |
| Tests incl. the `Math.random` grep-guard | `packages/ab/src/__tests__/` |
| **The registry + point values (the file you edit to operate the test)** | `apps/web/src/config/ab.ts` |
| Middleware router (redirects, rewrites, cookie stamping) | `apps/web/src/middleware.ts` |
| Root `/` fallback redirect | `apps/web/src/app/page.tsx` |
| Provider wiring | `apps/web/src/components/AppProviders.tsx` |
| Shared CTA component | `apps/web/src/components/ab/AbCtaLink.tsx` |
| Order-note markers helper | `apps/web/src/lib/ab-checkout.ts` |
| Webhook purchase attribution | `apps/web/src/app/api/webhooks/shopify/orders/route.ts` |
| Score sheet | `apps/web/src/app/admin/ab-tests/page.tsx` |
| Tagged-events fetch (paginated) | `packages/analytics/src/queries.ts` (`fetchAbTaggedEvents`) |
| Click counting | `packages/analytics/src/client.ts` (`trackClicks`) |
| Operator runbook | `packages/ab/README.md` |

## 10. Porting to another stack

Keep the **model** (§1–§7) and swap the mechanics:

- **No edge middleware?** Any server-side hook that runs before render works
  (Express middleware, Rails rack, nginx+njs). You need: read cookie → pick
  variation → internally serve another route → set cookie. If you can only
  redirect (not rewrite), you lose the clean `path=/ab` analytics split —
  compensate by tagging exposure events with the variant (you already do) and
  accept variant-visible URLs.
- **No events table?** Any sink works (GA4, PostHog, Segment) as long as every
  event can carry `ab_variant` and you can query per-session event lists to
  feed the scoring function. The score engine is pure — port it verbatim.
- **No Shopify?** §5's attribution trick generalizes: smuggle
  `ab_variant` + session id through whatever field survives into your payment
  webhook (Stripe `metadata`, order notes, success-URL params).
- **Non-React frontend?** `useAbCta` is just "read cookie → look up registry →
  rewrite href base"; implement it in whatever renders your CTAs.

Invariants that must survive any port: CSPRNG assignment; cookie readable by
client JS; `/main` structurally untagged; sticky-until-deactivated; per-session
point caps; registry-in-code with build-time validation; never reuse a retired
variation key.

---

## Appendix A — the original product spec (verbatim user prompt, 2026-08-04)

> ok so the first thing is we need to create an a/b testing state which is like
> this. there is one "main" version - let's call it /main and every person that
> clicks dreamplaypianos.com link goes here. this page is manually set by the
> user and its views and analytics are NOT compared in the a/b testing section.
> next we have the /ab page. so when people click dreamplaypianos.com/ab then
> they enter the ab testing funnel. the ab testing funnel works like this.
> suffixes are labeled 1a, 1b, 1c, 2a, 2b, 2c, etc. so 1a, 1b, 1c are all
> variations of "1". let's say 1a is the same as /main, but 1b and 1c are
> variations of that. 2a, 2b and 2c are variations of a different layout. this
> way of testing allows us to various layouts as well as variations in between
> the layout. next we want to create 1a, 2a, 3a, 4a (a version is always the
> first version of each number), based on the previous layouts we have in our
> git commit. when a version is no longer being tested, either that particular
> variation can be deactivated (3b, 4c) or the entire group can be deactivated
> (all variations in 3 - 3a, 3b, 3c). data should be tracked for a/b testing
> via a series of analytics - time spent on page, number of clicks (showing
> engagement), email capture, add to cart, CTA click, checkout page visited,
> info entered, and finally purchase conversion, with each having a points
> score assigned based on that actions value. the a/b testing page (score
> sheet) shows the various versions stakced up against each other. the /main
> page continues unaffected by the ab testing process, and its page visits and
> conversions are not impacting the ab testing (so even if /main matches 3a for
> example, any conversions happening on /main do not help out 3a conversions).
> if a new user enters the site via the main link (aka no /ab suffix) then they
> enter the main non-ab testing funnel, which means they are still tracked for
> their engagement, but those metrics are not tested for the a/b test. however
> if that user clicks on an /ab link, then that user is automatically funneled
> to one of the ab variants and is continuously shown that variant going
> forward. this should replace our legacy ab testing system. this new ab
> testing system basically holds different site configs (for example, the
> default landing page is /premium-offer, or /our-story, or /sales-page
> something like that). the CTA is either /customize or /shop . basically this
> ab testing system needs to be modular enough so we can swap out new CTAs or
> new landing pages, without affecting the existing pages. (in general code
> especially unused code can be cleaned up as well)
