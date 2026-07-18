# Phase 5 — Email system

**Goal:** `packages/email` + apps/web routes replace dreamplay-email-3 AND the deployed dreamplay-email-2 tracking endpoints, with the legacy pipeline's four known failure classes fixed by construction.
**Depends on:** Phases 1 & 3.
**Reference:** docs/reference/email-3.md. Source: `/Users/lionelyu/Documents/DreamPlay Repos/dreamplay-email-3` (read-only).

## Non-negotiable fixes (each maps to a documented legacy incident)

1. **Idempotency by construction:** unique `(campaign_id, subscriber_id)` exists from Phase 1; send loop skips already-sent (pre-query `sent_history`) and treats unique-violation as skip, not error. Inngest steps structured so retries never re-send (per-recipient or per-chunk `step.run` with deterministic IDs).
2. **Retries on transient failures:** all internal API/Resend calls retry with backoff on 429/5xx (the legacy send-wave client aborted entire sends on one 500).
3. **Done-markers only after confirmed send:** completion state derives from `sent_history` rows, never from "scheduled" (legacy done-marker race).
4. **Bounce/complaint/unsubscribe loop closed:** Resend webhook (`svix` signature verify) → `email_events` + `suppressions`; send pipeline checks `suppressions` + subscriber status before every recipient. One-click unsubscribe handled in-app.

## Tasks

- [x] 1. Port/rewrite send core into `packages/email`: template rendering ({{var}}, {{#if tag_X}} conditionals — port `render-template.ts` but clean the dead regex experiments), merge tags (DB-backed), preheader injection, unsubscribe footer + List-Unsubscribe/One-Click headers, image proxy/optimization, link rewriting with sid/cid, open pixel.
- [x] 2. Inngest setup in apps/web (`api/inngest`): send, scheduled-send (sleep-until + cancellation re-check), rotation sends. Keep the global send concurrency lock and per-recipient throttle (Resend 5 req/s account limit — make the rate env-configurable).
- [x] 3. Agent API (port `src/agent/handler.ts` surface): campaigns/subscribers/tags/rotations/merge-tags CRUD + send actions, `AGENT_API_KEY` auth, keep safety gates (UNSAFE_SEND_BLOCKED, confirmTargetTag) and add: suppression check, audience-size echo requiring confirmation for ≥50 recipients (formalizing the manual send-safety-audit rule).
- [x] 4. Send-wave scheduler as a first-class package module (not gitignored `_work/` scripts): staggered waves, sendKey idempotency, invalid-email pre-filter (legacy had this only in ad-hoc scripts), resumability. CLI entrypoint checked into the repo.
- [x] 5. **Tracking endpoints (absorbing dp-email-2, Decision D7):** open pixel route, click redirect route, `/unsubscribe` page + POST (one-click), `/api/resolve-subscriber` — all writing `email_events`/`suppressions` in the same DB. Multi-domain aware (link.musicalbasics.com, link.ultimatepianist.com, email.dreamplaypianos.com hosts all resolve to this app after Phase 7).
- [x] 6. Resend webhook route (bounces, complaints, deliveries) → `email_events` + `suppressions`. **[HUMAN: create webhook in Resend dashboard pointing at preview/prod URL]**
- [x] 7. Email admin UI at /admin/email: campaign list/editor (port the HTML editor), subscriber browsing/tagging, send status, suppression list. Keep the AI copilot (Anthropic/Gemini) if cheap to port; otherwise defer to Phase 8.
- [ ] 8. *(per-campaign conversion report: queries exist in @dreamplay/analytics (getVariantResults pattern); dedicated campaign attribution view deferred to Phase 8)* Conversion attribution: sid/cid link params → analytics `events` → purchase webhook join; per-campaign conversion report (the metric the legacy system could never produce).
- [x] 9. Tests: idempotent re-run of a send (zero duplicates), suppression enforcement, retry-on-5xx, unsubscribe one-click, webhook signature rejection. Run the `send-safety-auditor`-style checklist against the new pipeline before first real send.
- [ ] 10. **[HUMAN-gated]** *(needs: Inngest app keys, Resend webhook created in dashboard → RESEND_WEBHOOK_SECRET in Vercel; then run the ≤20-recipient verification send)* Verification send: small real campaign (≤20 internal/test addresses) through the full pipeline on preview infra: delivery, opens/clicks recorded, unsubscribe works, bounce (use a known-bad address) lands in suppressions.

## Acceptance criteria

- Deliberately re-triggering a completed send produces ZERO duplicate emails (the 2026-05-12 incident scenario, now a test).
- A 5xx injected mid-send resumes and completes without duplicates or dropped recipients.
- Bounce/complaint/unsubscribe each result in the address being skipped by the next send.
- Verification send (task 10) fully green.

## Notes

- Subscribers data migration happens in Phase 6; this phase can develop against seeded test subscribers.
- Sending domains stay verified in the same Resend account — no DNS changes needed for From-domains; only tracking-host DNS moves at Phase 7.
