-- ============================================================================
-- 20260716000400_rls.sql
-- Phase 1 — Row Level Security: deny-by-default everywhere.
--
-- Model:
--   * RLS ENABLED on every table; no policy => no access for anon/authenticated.
--   * All server-side reads/writes go through the service-role client
--     (createAdminClient), which bypasses RLS. Explicit GRANTs to service_role
--     are reproduced anyway (the legacy buyer_emails backfill failed with
--     "permission denied" when they were missing).
--   * Table-level privileges for anon/authenticated are REVOKED so that a
--     future accidentally-permissive policy still can't expose tables that
--     were never granted.
--   * Single exception: authenticated users may SELECT their own
--     reservation_decisions rows (user_id = auth.uid()) for /my-reservation.
--   * buyers is intentionally NOT readable by anon/authenticated — the
--     isBuyer() gate runs server-side via the service role only.
-- ============================================================================

-- --- enable RLS on every table -----------------------------------------------

alter table public.settings              enable row level security;
alter table public.buyers                enable row level security;
alter table public.reservation_decisions enable row level security;
alter table public.customers             enable row level security;
alter table public.waitlist              enable row level security;
alter table public.admin_variables       enable row level security;

alter table public.subscribers           enable row level security;
alter table public.rotations             enable row level security;
alter table public.campaigns             enable row level security;
alter table public.sent_history          enable row level security;
alter table public.email_events          enable row level security;
alter table public.suppressions          enable row level security;
alter table public.send_logs             enable row level security;
alter table public.tag_definitions       enable row level security;
alter table public.merge_tags            enable row level security;
alter table public.email_chains          enable row level security;
alter table public.chain_processes       enable row level security;
alter table public.email_triggers        enable row level security;
alter table public.app_settings          enable row level security;

alter table public.events                enable row level security;
alter table public.experiments           enable row level security;
alter table public.ip_email_map          enable row level security;
alter table public.chat_sessions         enable row level security;
alter table public.chat_messages         enable row level security;

-- --- table-level privileges ----------------------------------------------------

-- Supabase grants broad table privileges to anon/authenticated by default;
-- pull them back so RLS policies are the ONLY way in.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Service role: full access (reproduces the legacy backfill grants).
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;

-- Keep future objects consistent with the model above.
alter default privileges in schema public
  revoke all on tables from anon, authenticated;
alter default privileges in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant all on sequences to service_role;
alter default privileges in schema public
  grant all on routines to service_role;

-- --- reservation_decisions: buyers can read their own decision ------------------

grant select on public.reservation_decisions to authenticated;

create policy "reservation_decisions_select_own"
  on public.reservation_decisions
  for select
  to authenticated
  using (user_id = (select auth.uid()));
