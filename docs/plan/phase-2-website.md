# Phase 2 — Website port

**Goal:** `apps/web` serves everything dreamplaypianos.com does today, backed by the new Supabase project and the same Shopify store, verified on a Vercel preview URL.
**Depends on:** Phase 1. Can run in parallel with Phase 3.
**Reference:** docs/reference/website-2.md. Source: `/Users/lionelyu/Documents/DreamPlay Repos/dreamplay-website-2` (read-only).

## Porting strategy

Copy-and-adapt, not rewrite: the website code works; the problems were around it (no migrations, cross-repo coupling). Port route groups incrementally, swapping `src/lib/supabase/*` imports for `@dreamplay/db` and deleting the cross-repo trackers (replaced in Phase 3).

## Tasks

- [ ] 1. Port shared UI foundation: `src/components/ui` (shadcn/Radix), Tailwind config, fonts, theme, layout. Note legacy is Tailwind 3; if apps/web scaffolded with Tailwind 4, reconcile deliberately (either pin 3 or adapt config) — record in DECISIONS.md.
- [ ] 2. Port marketing/content pages under `(website-pages)`: home, /intro-offer, /extended-offer, /premium-offer, /buyers-guide, /how-it-works, /learn, /faq, /our-story, /product-information, /production-timeline, /accessories, /dreamplay-pro, etc. Plus next.config redirects (/shipping, /special-offer) and rewrites (/buy-product{,2,3}).
- [ ] 3. Port commerce: /shop (+ shop. subdomain middleware rewrite), /customize + variant-map, /checkout + checkout-pages, `api/shopify/cart` (Storefront API cartCreate + permalink fallback), `src/config/shop.ts`.
- [ ] 4. Port Shopify Admin integration: `src/lib/shopify/admin.ts` (client-credentials token flow), verify-webhook.ts, and the ops scripts (`scripts/shopify-*.mjs`) into monorepo `scripts/`. Keep the human-approval gating on refunds/cancellations (recent safety work — preserve it).
- [ ] 5. Port auth: /login, /register, /forgot-password, /reset-password, /activate, `api/auth/callback`, session middleware — against the NEW Supabase project via `@dreamplay/db`.
- [ ] 6. Port buyer portal: /my-reservation (live Shopify order fetch + ReservationDecisionModule), /vip, `reservation-actions.ts` (`isBuyer` against new `buyers` table; decisions into new `reservation_decisions`; Resend notifications).
- [ ] 7. Port supporting API routes: subscribe (→ `customers`), waitlist, contact, chat + chat-session + chat-suggestions (chatbot, tables from Phase 1). SKIP: track-ab, popup-ab, AnalyticsTracker, EmailTracker, journey engine — superseded by Phases 3/4.
- [ ] 8. Shopify webhook receiver `api/webhooks/shopify/orders` (orders/create + orders/paid → upsert `buyers`). Implement + unit-test HMAC now; actual webhook registration against the store happens in Phase 7 (old site keeps receiving until cutover). A second registration in parallel is fine (webhooks fan out) — if desired earlier for testing, mark **[HUMAN]** to approve.
- [ ] 9. Env: all Shopify + Resend + AI + R2 vars into `.env.example` and Vercel project settings **[HUMAN for secret values]**. Fix legacy gap: define the four Storefront vars that were code-referenced but missing from .env.local.
- [ ] 10. Verify end-to-end on preview: browse all pages, add-to-cart reaches Shopify checkout, register/login works, a test buyer row in `buyers` grants /my-reservation access showing a real order (needs read_all_orders creds), decision save writes DB + sends emails.

## Acceptance criteria

- Route-by-route parity checklist against the legacy site passes on the Vercel preview.
- No code references to data.dreamplaypianos.com or email.dreamplaypianos.com remain in apps/web.
- Zero reads/writes to the old Supabase project.

## Notes

- Legacy repo-root junk (repomix xml, .MOV, subscriber CSVs) must not be copied.
- The chatbot has three AI provider keys (Anthropic, Google, OpenAI) — port as-is; consolidation is out of scope.
