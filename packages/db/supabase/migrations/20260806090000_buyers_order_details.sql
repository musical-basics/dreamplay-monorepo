-- ============================================================================
-- 20260806090000_buyers_order_details.sql
-- Per-buyer order details + estimated ship date, so buyer-update emails can be
-- personalized (what they bought, what they paid, when it ships) and audited
-- on /admin/buyers before anything goes out.
--
--   * kind classifies the rows that live in buyers but are NOT real product
--     buyers (test/probe accounts, $0 founders, ~$1 waitlist reservations).
--     Only kind='buyer' should receive buyer product updates by default.
--   * est_ship_date policy (2026-08-06, Lionel): purchase_date + 12 months,
--     floored at 2027-01-31 (the January 2027 date promised to early backers).
--     Stored, not computed, so individual dates can be adjusted by hand.
--   * Backfilled from the Shopify Admin API by
--     scripts/migrate/09-backfill-buyer-order-details.mjs; order_details_source
--     records where each row's details came from.
-- ============================================================================

alter table public.buyers
  add column if not exists kind text not null default 'unknown'
    check (kind in ('buyer', 'waitlist', 'founder', 'test', 'unknown')),
  add column if not exists purchase_date        timestamptz,
  add column if not exists price_paid_usd       numeric,
  add column if not exists product_line         text,
  add column if not exists size_variant         text,
  add column if not exists finish               text,
  add column if not exists est_ship_date        date,
  add column if not exists order_details_source text;

create index if not exists buyers_kind_idx on public.buyers (kind);
