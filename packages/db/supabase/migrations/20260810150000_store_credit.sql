-- ============================================================================
-- 20260810150000_store_credit.sql
-- Store credit ledger. Research rewards are now STORE CREDIT, not cash:
-- $5 for a completed survey (credit arms only), $10 for a completed founder
-- call (credit arms only). Manual grants/adjustments use source='manual'.
--
--   * Append-only ledger; a buyer's balance is sum(amount_usd).
--   * One automatic grant per reward type per buyer: unique (buyer_id,
--     source) for non-manual sources makes double-granting impossible even
--     under retries.
--   * Redemption: negative manual rows when credit is applied to an order.
-- ============================================================================

create table if not exists public.store_credits (
  id         uuid primary key default gen_random_uuid(),
  buyer_id   uuid not null references public.buyers (id) on delete cascade,
  amount_usd numeric not null,
  reason     text not null,
  source     text not null default 'manual',
  created_at timestamptz not null default now()
);

create index if not exists store_credits_buyer_id_idx
  on public.store_credits (buyer_id, created_at);

-- Automatic reward sources are one-shot per buyer; 'manual' may repeat.
create unique index if not exists store_credits_one_auto_grant
  on public.store_credits (buyer_id, source)
  where source <> 'manual';

alter table public.store_credits enable row level security;
revoke all on public.store_credits from anon, authenticated;
grant all on public.store_credits to service_role;
