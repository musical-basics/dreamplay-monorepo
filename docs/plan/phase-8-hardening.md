# Phase 8 — Post-cutover hardening

**Goal:** Two weeks after cutover, the system is observably healthy, the legacy projects are retired, and deferred quality work is done.
**Depends on:** Phase 7.

## Tasks

- [ ] 1. Monitoring week: check daily for the first week — Vercel error rates, Inngest failed runs, Resend bounce/complaint rates, events ingestion volume vs pre-cutover baseline, Shopify webhook delivery logs. Log observations in STATE.md.
- [ ] 2. Fix anything the monitoring surfaces (expect small breakage: missed legacy URL formats, CORS from a forgotten site, a bot-filter gap).
- [ ] 3. Attribution validation: confirm at least one real email → click → purchase chain is visible end-to-end (the metric the old system never produced).
- [ ] 4. Deferred items sweep: AI copilot port (if skipped in phase 5), statistical significance on /admin/experiments, analytics history import (if wanted), event-table partitioning (only if volume warrants).
- [ ] 5. Final retirement **[HUMAN sign-off]:** delete/pause old Supabase projects, remove old Vercel projects, revoke unused Shopify app credentials and Resend webhooks, close out old repos (already archived in Phase 7).
- [ ] 6. Docs: update root README with architecture, runbooks (how to send a campaign, how to launch an experiment, how to add a page), and move this plan to docs/plan/ARCHIVE note in STATE.md.

## Acceptance criteria

- 14 consecutive days of stable operation; no legacy system receiving production traffic.
- Runbooks exist for the three routine operations (campaign send, experiment launch, content page).
- STATE.md marked: migration complete.
