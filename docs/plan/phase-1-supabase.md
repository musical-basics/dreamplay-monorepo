# Phase 1 — Supabase: new project + unified schema

**Goal:** One fresh Supabase project with the complete schema as migration files, generated types, and seeded local dev.
**Depends on:** Phase 0.
**Reference:** docs/reference/website-2.md (buyer tables), email-3.md (email tables), analytics.md (events).

## Tasks

- [ ] 1. **[HUMAN]** Create new Supabase project (suggested name `dreamplay-monorepo`, region us-west or nearest to majority traffic). Capture URL + anon key + service-role key + access token for CLI into `apps/web/.env.local` and Vercel envs. (CLI alternative: `supabase projects create` if `SUPABASE_ACCESS_TOKEN` is available.)
- [ ] 2. Init supabase CLI in `packages/db` (`supabase init`), link to project. Local dev via `supabase start` (Docker).
- [x] 3. Write migrations for the **commerce/buyers domain**:
  - `buyers` (replaces `buyer_emails`): id, email unique (lowercase, citext or checked), notes, source ('shopify_webhook'|'backfill'|'manual'), shopify_order_number, created_at, updated_at.
  - `reservation_decisions`: same shape as legacy (user_id, email, decision enum 'refund_requested'|'keep_reservation'|'upgrade_to_pro', selected_at, order_metadata jsonb, timestamps).
  - `customers` (replaces `Customer`), `waitlist` (replaces `Waitlist`), `admin_variables`.
  - RLS: deny-all by default; service-role writes; authenticated buyer can read own reservation_decisions. Reproduce the service-role GRANTs the legacy backfill script needed.
- [x] 4. Write migrations for the **email domain** (design informed by email-3 but fixing known gaps):
  - `subscribers`: email unique, status enum (active|unsubscribed|bounced|complained|inactive|deleted), tags text[], geo fields, workspace, timestamps.
  - `campaigns`: template/child model kept (is_template, parent_template_id, rotation_id, subject, html_content, variable_values jsonb, status, scheduled_at, send_key, totals).
  - `sent_history` with **UNIQUE (campaign_id, subscriber_id)** from day one.
  - `email_events` (replaces subscriber_events, plus bounce/complaint types): subscriber_id, campaign_id, type enum (open|click|bounce|complaint|unsubscribe|delivery), url, ip, user_agent, metadata jsonb, created_at.
  - **`suppressions`** (NEW — legacy had none): email unique, reason enum (bounce|complaint|unsubscribe|manual), source, created_at. Send pipeline must check it.
  - `send_logs`, `rotations`, `tag_definitions`, `merge_tags`, `email_chains`, `chain_processes`, `email_triggers`, `app_settings`.
- [x] 5. Write migrations for the **analytics domain**:
  - `events` (replaces analytics_logs + dp_analytics_events): id bigint identity, created_at, event_name, path, session_id, visitor_id, ip_address inet, user_agent, country, city, region, email, subscriber_id nullable FK, experiment/variant columns or metadata jsonb (keep `metadata->>'ab_variant'` queryable — index it), utm fields or in metadata, duration_seconds. Indexes: (created_at), (event_name, created_at), (session_id), GIN on metadata. Consider monthly partitioning only if volume demands (defer).
  - `experiments`: key unique, name, status (draft|running|paused|concluded), variants jsonb (weights, labels), started_at, concluded_at, winner.
  - `ip_email_map`, `chat_sessions`, `chat_messages`.
  - Aggregation as SQL functions/views (port get_analytics_summary's intent) — **admin/bot IPs come from a `settings` table, not hardcoded**.
- [x] 6. Generate TS types (`supabase gen types typescript`) into `packages/db/src/types.ts`; export typed clients: `createBrowserClient`, `createServerClient` (SSR cookies), `createAdminClient` (service role). One implementation, used by everything.
- [ ] 7. `supabase db push` to the remote project; verify with `supabase migration list`.
- [x] 8. Add all Supabase env var names to `.env.example`; document local-dev workflow in `packages/db/README.md`.

## Acceptance criteria

- `supabase db reset` locally applies all migrations cleanly from scratch.
- Remote project matches migrations (no drift).
- Typed clients compile and a smoke test (insert+read a `buyers` row with admin client, RLS blocks anon) passes against local Supabase.

## Notes

- Auth config: enable email/password auth to match legacy buyer login. SMTP for auth emails can stay on Supabase defaults until Phase 5, then switch to Resend SMTP if desired.
- Do NOT migrate data in this phase — schema only. Data lands in Phase 6.
