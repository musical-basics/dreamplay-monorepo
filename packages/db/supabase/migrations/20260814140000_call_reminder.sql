-- ============================================================================
-- 20260814140000_call_reminder.sql
-- One-hour-before reminder emails for confirmed founder calls.
--
-- reminder_sent_at is the idempotency stamp for
-- scripts/email/send-call-reminders.mjs: the script only picks up confirmed,
-- scheduled calls whose reminder has not been sent, so running it on a cron
-- every few minutes can never remind the same buyer twice.
-- ============================================================================

alter table public.buyer_call_requests
  add column if not exists reminder_sent_at timestamptz;
