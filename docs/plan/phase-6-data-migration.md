# Phase 6 — Data migration

**Goal:** Buyers (the user's explicit requirement) and supporting data ported from the legacy Supabase projects into the new one, verified by counts and spot checks.
**Depends on:** Phases 1, 2, 5.

## Sources

- Website Supabase `tqhfpcdqxylrknwbrqqi`: `buyer_emails`, `reservation_decisions`, `Customer`, `Waitlist`, `admin_variables`, **auth.users**.
- Email Supabase `quyqwdjygzalqqmrgkfk`: `subscribers`, `campaigns` (templates), `sent_history`, `merge_tags`, `tag_definitions`, `rotations` (scope decision below).
- Analytics Supabase: `analytics_logs` history (scope decision below).

## Tasks

- [ ] 1. Write idempotent migration scripts in `scripts/migrate/` (TS, using service-role clients for old + new projects; re-runnable via upserts; dry-run mode printing counts first). Secrets for the OLD projects provided at runtime, never committed. **[HUMAN: provide old-project service keys]**
- [ ] 2. **Buyers (required):** `buyer_emails` → `buyers` (normalize email lowercase/trim, keep notes, source='backfill', preserve created_at). `reservation_decisions` → new table as-is.
- [ ] 3. **Auth users (required for buyer portal continuity):** migrate auth.users from the website project so existing buyers keep their passwords. Use Supabase Auth Admin API: export users (`GET /admin/users` via service key or `auth.users` SQL dump) and re-create with preserved `password_hash` (bcrypt hashes are importable via admin createUser). Preserve user IDs if possible (reservation_decisions.user_id references them); if IDs can't be preserved, remap user_id in reservation_decisions during import. Fallback for any user that fails hash import: mark for forced password-reset email.
- [ ] 4. **Customers + Waitlist:** straight port with column renames.
- [ ] 5. **Subscribers (needed for email to function):** port `subscribers` (statuses, tags, workspace) and seed `suppressions` from status IN (unsubscribed, bounced) — this preserves opt-out compliance. Port `tag_definitions`, `merge_tags`, campaign TEMPLATES (is_template=true). **Scope decision [HUMAN]:** historical child campaigns + `sent_history` + `subscriber_events` — recommend porting `sent_history` (it feeds "already contacted" logic) and skipping old `subscriber_events` unless attribution history matters.
- [ ] 6. **Analytics history [HUMAN scope decision]:** recommend NOT porting `analytics_logs` (fresh start; old dashboard stays readable until its project is deleted). If ported later, it's an append into `events` with a mapping script.
- [ ] 7. Verification: for each ported table — row counts old vs new, sample-based field comparison, uniqueness checks. For auth: test-login as a real buyer account **[HUMAN: Lionel logs in with his own credentials]** and confirm /my-reservation works with their live Shopify order.
- [ ] 8. Freshness plan for cutover: record migration timestamp; scripts support delta re-run (upsert by email/id) so Phase 7 can re-sync rows created between first migration and DNS cutover.

## Acceptance criteria

- 100% of `buyer_emails` rows present in `buyers`; counts documented in STATE.md log.
- A pre-existing buyer can log in on the preview deployment with their old password and sees their reservation.
- All unsubscribed/bounced legacy subscribers exist in `suppressions` BEFORE any real campaign is sent from the new system (compliance gate).
