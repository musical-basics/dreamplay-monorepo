-- ============================================================================
-- 20260810090000_buyer_research.sql
-- Buyer research A/B test (2026-08): learn WHY buyers purchased, and which
-- collection method works better.
--
--   Variant A (survey):  /buyer-survey — a short questionnaire, $5 off the
--                        order on completion.
--   Variant B (call):    /founder-call — request a 15-minute call with
--                        Lionel, $10 off after the call happens.
--
-- Assignment is DETERMINISTIC: sha256("buyer-research:" + buyer_id) first
-- byte, even = survey, odd = call (apps/web/src/lib/buyer-research.ts). No
-- assignment table needed; any code recomputes the same split.
--
-- One row per buyer in each table (unique buyer_id): resubmitting the survey
-- updates the same row; the call request tracks status through
-- requested -> scheduled -> completed (completed = the $10 reward is owed).
-- ============================================================================

create table if not exists public.buyer_survey_responses (
  id         uuid primary key default gen_random_uuid(),
  buyer_id   uuid not null unique references public.buyers (id) on delete cascade,
  answers    jsonb not null default '{}'::jsonb,
  reward_usd numeric not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger buyer_survey_responses_set_updated_at
  before update on public.buyer_survey_responses
  for each row execute function public.set_updated_at();

alter table public.buyer_survey_responses enable row level security;
revoke all on public.buyer_survey_responses from anon, authenticated;
grant all on public.buyer_survey_responses to service_role;

create table if not exists public.buyer_call_requests (
  id              uuid primary key default gen_random_uuid(),
  buyer_id        uuid not null unique references public.buyers (id) on delete cascade,
  contact_method  text not null check (contact_method in ('zoom', 'phone', 'whatsapp')),
  contact_value   text,
  preferred_times text[] not null default '{}',
  timezone        text,
  notes           text,
  status          text not null default 'requested'
                    check (status in ('requested', 'scheduled', 'completed', 'cancelled')),
  reward_usd      numeric not null default 10,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger buyer_call_requests_set_updated_at
  before update on public.buyer_call_requests
  for each row execute function public.set_updated_at();

alter table public.buyer_call_requests enable row level security;
revoke all on public.buyer_call_requests from anon, authenticated;
grant all on public.buyer_call_requests to service_role;
