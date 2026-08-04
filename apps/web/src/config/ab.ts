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
 * Groups 1–4 are the four homepage generations from the legacy repos'
 * git history (see docs/reference/ab-testing.md + D11):
 *   1 = original Dec-2025 homepage, 2 = Special Offer sticky-parallax,
 *   3 = Premium Offer family (current + the pre-swap extended layout),
 *   4 = direct-response PDP (landing-page-1).
 */

import { defineAbFunnel, type ScoringRule } from "@dreamplay/ab";

export const abFunnel = defineAbFunnel({
  // The manually-pinned page every dreamplaypianos.com visitor lands on.
  // NOT part of the A/B test: its traffic is never variant-tagged, even when
  // its layout matches a variation.
  main: { route: "/premium-offer", cta: "/customize" },

  groups: [
    {
      group: "1",
      name: "Original homepage (Dec 2025)",
      active: true,
      variations: [
        { key: "1a", label: "Original homepage", route: "/legacy-home", cta: "/customize", active: true },
      ],
    },
    {
      group: "2",
      name: "Special Offer (sticky parallax)",
      active: true,
      variations: [
        { key: "2a", label: "Special offer", route: "/special-offer", cta: "/customize", active: true },
      ],
    },
    {
      group: "3",
      name: "Premium Offer family",
      active: true,
      variations: [
        { key: "3a", label: "Premium offer (current layout, same as /main)", route: "/premium-offer", cta: "/customize", active: true },
        { key: "3b", label: "Extended offer (pre-swap premium layout)", route: "/extended-offer", cta: "/customize", active: true },
      ],
    },
    {
      group: "4",
      name: "Direct-response PDP",
      active: true,
      variations: [
        { key: "4a", label: "landing-page-1 PDP", route: "/landing-page-1", cta: "/customize", active: true },
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
