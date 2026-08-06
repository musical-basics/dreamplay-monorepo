-- ============================================================================
-- 20260806190000_buyers_unit_count.sql
-- buyers.unit_count: how many keyboards a buyer has reserved.
--
-- History: added while investigating order #1104 (rebecca.koebbe), which the
-- Admin API's ORIGINAL fields (totalPriceSet / lineItems.quantity) reported
-- as two keyboards. The order had in fact been EDITED after purchase (DS5.5
-- line removed, current total $549 / one DS6.0) — the backfill now reads
-- currentTotalPriceSet / currentQuantity, and as of 2026-08-06 every buyer
-- has unit_count = 1.
--
-- The column and its handling stay as guards for future multi-unit orders:
--   * unit_count > 1 rows are routed to support on /order-preferences (the
--     one-config form is suppressed; saveBuyerPreferences rejects writes)
--   * Pro-upgrade pricing for multi-unit buyers is $200 PER KEYBOARD
--     (Lionel, 2026-08-06)
-- ============================================================================

alter table public.buyers
  add column if not exists unit_count integer not null default 1
    check (unit_count >= 1);
