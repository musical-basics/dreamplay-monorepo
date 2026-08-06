-- ============================================================================
-- 20260806150000_buyer_preferences.sql
-- Self-service configuration for buyers: each buyer gets a signed link
-- (/order-preferences?t=...) where they confirm or switch their size/finish,
-- and, if eligible, request the $200 upgrade to DreamPlay One Pro.
--
-- Upgrade eligibility (Lionel, 2026-08-06): ONLY buyers who purchased on or
-- before 2026-04-30 and did not already buy a Pro product. Enforced in the
-- server action, recorded here.
--
--   * buyers.size_variant / finish are updated in place (they represent the
--     configuration currently on file).
--   * buyer_preference_changes is the append-only audit trail of every
--     self-service change, with the prior values snapshotted.
--   * buyers.pro_upgrade_requested surfaces upgrade requests on /admin/buyers
--     (payment of the $200 is collected separately via a follow-up link).
-- ============================================================================

alter table public.buyers
  add column if not exists pro_upgrade_requested boolean not null default false;

create table if not exists public.buyer_preference_changes (
  id             uuid primary key default gen_random_uuid(),
  buyer_id       uuid not null references public.buyers (id) on delete cascade,
  size_variant   text,
  finish         text,
  upgrade_to_pro boolean not null default false,
  previous       jsonb not null default '{}'::jsonb,  -- {size_variant, finish, pro_upgrade_requested} before this change
  source         text not null default 'self-service',
  created_at     timestamptz not null default now()
);

create index if not exists buyer_preference_changes_buyer_id_idx
  on public.buyer_preference_changes (buyer_id, created_at);

alter table public.buyer_preference_changes enable row level security;
revoke all on public.buyer_preference_changes from anon, authenticated;
grant all on public.buyer_preference_changes to service_role;
