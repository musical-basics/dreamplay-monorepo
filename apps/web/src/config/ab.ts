/**
 * A/B funnel registry (Decision D11) — THE source of truth for the test.
 *
 * EDGE-SAFE: imported by middleware. Pure data only.
 *
 * How to operate the funnel:
 * - Change what /main serves (manual, never part of the test): edit `main`.
 * - Add a variation: add `{ key: "2b", route, cta, active: true }` to its
 *   group — the key's number MUST match the group id (validated at build).
 * - Deactivate one variation: `active: false` on the variation.
 * - Deactivate a whole layout group: `active: false` on the group.
 *   Visitors holding a deactivated variation are CSPRNG-reassigned among the
 *   remaining active variations on their next / or /ab visit; their history
 *   stays on the score sheet.
 * - Preview/share a specific variation: /ab/<key> (stamps the cookie).
 * - Point values for the score sheet live in AB_SCORING below.
 *
 * Group numbering: 1 = the CURRENT site's layout family (1a is always what
 * the site looks like today), 2–4 = the three significantly-different
 * historical homepages recovered from dreamplay-website git history,
 * 5 = new designs. Labels carry the layout's live-homepage date range so the
 * score sheet is self-explanatory.
 */

import { defineAbFunnel, type ScoringRule } from "@dreamplay/ab";

/**
 * settings-table key for the admin "testing" toggle (set from /admin/ab-tests,
 * read by middleware): { enabled: boolean }. When enabled, / and /main
 * redirect into /ab — ALL site traffic joins the test.
 */
export const AB_TESTING_SETTING_KEY = "ab_testing_mode";

export const abFunnel = defineAbFunnel({
  // The manually-pinned page every dreamplaypianos.com visitor lands on when
  // the testing toggle is OFF. NOT part of the A/B test: its traffic is never
  // variant-tagged, even when its layout matches a variation.
  main: { route: "/premium-offer", cta: "/customize" },

  groups: [
    {
      group: "1",
      name: "Current site (premium-offer family)",
      active: true,
      variations: [
        {
          key: "1a",
          since: "2026-08-04T07:25:00Z",
          label: "Current site — premium-offer (live homepage since Mar 10 2026; migrated Jul 18 2026)",
          route: "/premium-offer",
          cta: "/customize",
          active: true,
        },
        {
          key: "1b",
          since: "2026-08-04T07:25:00Z",
          label: "Extended offer — pre-swap premium layout (homepage Feb 16 – Mar 10 2026)",
          route: "/extended-offer",
          cta: "/customize",
          active: true,
        },
      ],
    },
    {
      group: "2",
      name: "Original homepage",
      active: true,
      variations: [
        {
          key: "2a",
          since: "2026-08-04T07:25:00Z",
          label: "Original site at launch (Dec 17 2025 – Jan 24 2026)",
          route: "/legacy-home",
          cta: "/customize",
          active: true,
        },
      ],
    },
    {
      group: "3",
      name: "Special Offer (sticky parallax)",
      active: true,
      variations: [
        {
          key: "3a",
          since: "2026-08-04T07:25:00Z",
          label: "Special Offer homepage (Jan 24 – Mar 10 2026)",
          route: "/special-offer",
          cta: "/customize",
          active: true,
        },
      ],
    },
    {
      // Retired 2026-08-12: lowest avg points (6.0) over 38 sessions, zero
      // email captures, and high time-on-page that never converted. Its
      // history stays on the score sheet; /landing-page-1 still previewable
      // at /4a. Reactivate by flipping active back to true.
      group: "4",
      name: "Direct-response PDP",
      active: false,
      variations: [
        {
          key: "4a",
          since: "2026-08-04T07:25:00Z",
          label: "landing-page-1 direct-response PDP (Mar 11 2026 homepage A/B) — retired Aug 12 2026",
          route: "/landing-page-1",
          cta: "/customize",
          active: true,
        },
      ],
    },
    {
      group: "5",
      name: "Simplified premium-offer",
      active: true,
      variations: [
        {
          key: "5a",
          since: "2026-08-04T07:25:00Z",
          label: "Simplified 1a (new Aug 4 2026) — 5 sections, single CTA path",
          route: "/simple-offer",
          cta: "/customize",
          active: true,
        },
      ],
    },
  ],
});

export type AppAbFunnel = typeof abFunnel;

/**
 * Point values per funnel action (per session, capped) — the score sheet at
 * /admin/ab-tests ranks variations by average points per session. Values
 * reflect how far down the purchase funnel each action sits.
 */
export const AB_SCORING: readonly ScoringRule[] = [
  { kind: "duration", key: "time_on_page", label: "Time on page", event: "page_leave", points: 1, unitSeconds: 30, maxPoints: 5 },
  { kind: "clicks", key: "engagement_clicks", label: "Engagement clicks", event: "page_leave", points: 1, unitClicks: 5, maxPoints: 5 },
  { kind: "once", key: "cta_click", label: "CTA click", event: "cta_click", points: 5 },
  { kind: "once", key: "add_to_cart", label: "Added to cart", event: "add_to_cart", points: 10 },
  { kind: "once", key: "email_capture", label: "Email captured", event: "email_signup", points: 15 },
  { kind: "once", key: "checkout_visit", label: "Checkout reached", event: "begin_checkout", points: 20 },
  { kind: "once", key: "info_entered", label: "Product configured", event: "checkout_info_entered", points: 25 },
  { kind: "once", key: "purchase", label: "Purchase", event: "purchase", points: 100 },
];
