# Phase 7 — Cutover & deprecation

**Goal:** Production traffic (web, analytics ingestion, email tracking hosts, Shopify webhooks) moves to the monorepo; legacy deployments deprecated. Old systems stay recoverable (paused, not deleted) for a 2-week rollback window.
**Depends on:** all prior phases green.

Most steps here are **[HUMAN]** or need human approval — batch them into one working session with Lionel.

## Pre-cutover checklist

- [ ] All phase 0–6 acceptance criteria verified green on the preview deployment.
- [ ] Delta data re-sync executed (phase-6 task 8) same-day.
- [ ] Full env parity audit: every var in `.env.example` set in Vercel prod.
- [ ] Rollback notes written: exactly which DNS records / webhooks / domains to flip back.

## Cutover sequence (ordered)

- [ ] 1. **Shopify webhooks:** register orders/create + orders/paid against the monorepo prod URL (`scripts/shopify-register-order-webhook.mjs` port). Run BOTH old + new in parallel for a day (both upsert buyers idempotently in their own DBs), verify new receives orders, then delete the legacy webhook subscriptions. **[HUMAN approves]**
- [ ] 2. **Primary domain:** point dreamplaypianos.com (+ www, + shop subdomain) at the new Vercel project. **[HUMAN: Vercel domain move + DNS]**
- [ ] 3. **Analytics host:** point data.dreamplaypianos.com at the new app (its /api/track accepts the legacy tracker.js payload or serves the new snippet). Update legacy non-Next sites' snippet tags (Shopify theme, blog, ultimatepianist.com, musicalbasics.com) to the new /tracker.js. **[HUMAN: theme/site edits]**
- [ ] 4a. **Legacy tracking-path compatibility:** before DNS flip, capture the exact URL shapes dp-email-2 emitted (open pixel, click redirect, /unsubscribe?s=&c=&w=) from a recent sent email's HTML, and add next.config rewrites mapping those legacy paths → the new /api/email/* handlers so links in already-sent emails keep working. Verify with a real legacy email link.
- [ ] 4. **Email tracking hosts:** point email.dreamplaypianos.com, link.musicalbasics.com, link.ultimatepianist.com at the new app. Old emails' open/click/unsubscribe links must keep working — verify legacy URL formats (sid/cid params) are handled by the new routes before flipping. **[HUMAN: DNS]**
- [ ] 5. **Resend webhook:** switch to prod URL if it was pointing at preview.
- [ ] 6. Smoke-test production: real page browse → events row; test order (or dev-store order) → webhook → buyers row + purchase event; open/click a legacy email link → recorded; unsubscribe → suppression.
- [ ] 7. **Deprecate (pause, don't delete):** pause Vercel deployments for dreamplay-website-2 / dreamplay-email-3 / dreamplay-email-2 / dreamplay-analytics projects (or point them at a redirect); archive the GitHub repos (read-only). Old Supabase projects: pause after 2 weeks of stable operation; delete only after Lionel signs off. **[HUMAN]**
- [ ] 8. Update STATE.md + README with new production topology.

## Acceptance criteria

- All production hostnames serve from the monorepo; a real Shopify order creates a buyer + purchase event in the new DB only.
- Legacy email links (from campaigns sent pre-cutover) still track and unsubscribe correctly.
- Rollback plan documented and old systems paused-but-recoverable for 14 days.
