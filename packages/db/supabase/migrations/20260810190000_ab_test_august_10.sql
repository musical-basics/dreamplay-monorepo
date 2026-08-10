-- ============================================================================
-- 20260810190000_ab_test_august_10.sql
-- "AB Test August 10" refinements (the buyer research 2x2 test).
--
-- The founder-call form no longer asks for time windows; it is a "yes I can
-- call" submission with preferred DAYS (Monday..Sunday), part of day
-- (morning/afternoon/evening) and an auto-detected timezone.
-- preferred_times stays for backwards compatibility but is no longer
-- written.
--
-- Arm overrides (Lionel drag-and-drops buyers between the 4 groups on
-- /admin/ab-test-august-10) live in app_settings under key
-- 'ab-test-august-10:arm-overrides' — no schema needed.
-- ============================================================================

alter table public.buyer_call_requests
  add column if not exists preferred_days text[] not null default '{}',
  add column if not exists day_parts      text[] not null default '{}';
