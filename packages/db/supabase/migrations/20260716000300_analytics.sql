-- ============================================================================
-- 20260716000300_analytics.sql
-- Phase 1, task 5 — analytics domain.
--
-- Replaces (legacy dreamplay-analytics `analytics_logs` + belgium
-- `dp_analytics_events` + website-2 `analytics_logs`/chat tables):
--   analytics_logs / dp_analytics_events -> events
--   (new) experiments registry — makes A/B experiments first-class instead of
--         one hardcoded letter-set (porting rule #5 in docs/reference/ab-testing.md)
--   ip_email_map, chat_sessions, chat_messages -> same names, cleaned shapes
--
-- Metadata contract: the A/B variant is ALWAYS tagged as metadata->>'ab_variant'
-- (porting rule #3 — the dashboard reads exactly that key). UTM fields,
-- referrer, checkout_source etc. also live in metadata, matching legacy.
-- Depends on: 20260716000100 (citext), 20260716000200 (subscribers FK).
-- ============================================================================

-- --- events ---------------------------------------------------------------------

create table if not exists public.events (
  id               bigint generated always as identity primary key,
  created_at       timestamptz not null default now(),
  event_name       text not null,
  path             text,
  session_id       text,
  visitor_id       text,
  ip_address       inet,
  user_agent       text,
  country          text,
  city             text,
  region           text,
  email            citext,
  subscriber_id    uuid references public.subscribers (id) on delete set null,
  duration_seconds numeric,
  metadata         jsonb not null default '{}'::jsonb
);

create index if not exists events_created_at_idx
  on public.events (created_at);
create index if not exists events_event_name_created_at_idx
  on public.events (event_name, created_at);
create index if not exists events_session_id_idx
  on public.events (session_id);
create index if not exists events_visitor_id_idx
  on public.events (visitor_id);
create index if not exists events_subscriber_id_idx
  on public.events (subscriber_id);
create index if not exists events_metadata_gin_idx
  on public.events using gin (metadata);
-- Keep metadata->>'ab_variant' cheaply queryable for A/B reporting.
create index if not exists events_ab_variant_idx
  on public.events ((metadata ->> 'ab_variant'));

comment on table public.events is
  'Unified first-party analytics event stream (pageview, page_leave, purchase, experiment_view, conversion, cta_click, ...). Monthly partitioning deferred until volume demands it.';

-- --- experiments -------------------------------------------------------------------

-- First-class A/B experiment registry (multiple concurrent experiments).
-- variants: jsonb array like
--   [{"key":"a","label":"Control","weight":0.5},{"key":"b","label":"New hero","weight":0.5}]
create table if not exists public.experiments (
  id           uuid primary key default gen_random_uuid(),
  key          text not null unique,
  name         text not null,
  status       text not null default 'draft'
                 check (status in ('draft', 'running', 'paused', 'concluded')),
  variants     jsonb not null default '[]'::jsonb,
  winner       text,
  started_at   timestamptz,
  concluded_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger experiments_set_updated_at
  before update on public.experiments
  for each row execute function public.set_updated_at();

-- --- ip_email_map -----------------------------------------------------------------

-- Manual IP -> email identity overrides used by the visitor-journey views.
create table if not exists public.ip_email_map (
  id         uuid primary key default gen_random_uuid(),
  ip_address inet not null unique,
  email      citext not null,
  notes      text,
  created_at timestamptz not null default now()
);

-- --- chat_sessions / chat_messages ---------------------------------------------------

create table if not exists public.chat_sessions (
  id                uuid primary key default gen_random_uuid(),
  visitor_id        text,
  status            text not null default 'active'
                      check (status in ('active', 'closed', 'admin_takeover')),
  message_count     integer not null default 0,
  admin_takeover_at timestamptz,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger chat_sessions_set_updated_at
  before update on public.chat_sessions
  for each row execute function public.set_updated_at();

create table if not exists public.chat_messages (
  id         bigint generated always as identity primary key,
  session_id uuid not null references public.chat_sessions (id) on delete cascade,
  role       text not null check (role in ('user', 'assistant', 'admin', 'system')),
  content    text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_session_created_idx
  on public.chat_messages (session_id, created_at);
