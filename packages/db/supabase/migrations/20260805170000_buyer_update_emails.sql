-- ============================================================================
-- 20260805170000_buyer_update_emails.sql
-- Curated log of production-update emails sent to DreamPlay BUYERS, so we can
-- see at a glance which updates went out, when, and who they reached.
--
-- Why a separate table: the campaigns table holds 1,500+ rows (marketing,
-- tests, per-recipient children) and there is no way to tell "buyer update"
-- from anything else. This table has exactly one row per update wave, curated
-- by hand. campaign_ids links each wave back to its campaigns rows
-- (uuid[]; app-enforced, same convention as rotations.campaign_ids).
--
-- The buyer_update_email_coverage view fans each SENT update out across the
-- buyers table (matched via subscribers by email) so gaps in communication
-- are a single query away.
-- ============================================================================

create table if not exists public.buyer_update_emails (
  id              uuid primary key default gen_random_uuid(),
  update_key      text not null unique,          -- e.g. 'june-2026-progress-update'
  title           text not null,                 -- human label for dashboards
  status          text not null default 'sent'
                    check (status in ('draft', 'scheduled', 'sent')),
  subject_lines   text[] not null default '{}',  -- all subject variants used
  campaign_ids    uuid[] not null default '{}',  -- campaigns rows for this wave
  sent_first_at   timestamptz,
  sent_last_at    timestamptz,
  recipient_count integer not null default 0,    -- unique buyers reached
  audience        text not null default 'buyers',
  website_url     text,                          -- companion page on the site
  video_url       text,                          -- companion video, if any
  summary         text,                          -- what the update said
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger buyer_update_emails_set_updated_at
  before update on public.buyer_update_emails
  for each row execute function public.set_updated_at();

alter table public.buyer_update_emails enable row level security;
revoke all on public.buyer_update_emails from anon, authenticated;
grant all on public.buyer_update_emails to service_role;

-- --- coverage view ------------------------------------------------------------

-- One row per (sent update x buyer): did this buyer receive it, and when.
-- security_invoker so the view never widens access beyond the caller's own
-- rights on the underlying tables (service-role only, like everything else).
create or replace view public.buyer_update_email_coverage
  with (security_invoker = true) as
select
  bue.update_key,
  bue.title,
  bue.sent_first_at,
  b.id     as buyer_id,
  b.email  as buyer_email,
  (sh.first_sent_at is not null) as received,
  sh.first_sent_at
from public.buyer_update_emails bue
cross join public.buyers b
left join lateral (
  select min(sh.sent_at) as first_sent_at
  from public.sent_history sh
  join public.subscribers s on s.id = sh.subscriber_id
  where s.email = b.email
    and sh.campaign_id = any (bue.campaign_ids)
) sh on true
where bue.status = 'sent';

revoke all on public.buyer_update_email_coverage from anon, authenticated;
grant select on public.buyer_update_email_coverage to service_role;
