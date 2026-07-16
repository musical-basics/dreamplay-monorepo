-- ============================================================================
-- 20260716000200_email.sql
-- Phase 1, task 4 — email domain.
--
-- Design informed by dreamplay-email-3 (project quyqwdjygzalqqmrgkfk) with the
-- known gaps fixed from day one:
--   * sent_history UNIQUE (campaign_id, subscriber_id)   (2026-05-12 incident)
--   * subscribers.status includes 'complained'
--   * suppressions table (legacy had none; bounces were handled manually)
--   * email_events replaces subscriber_events and adds bounce/complaint/
--     unsubscribe/delivery types (legacy only had open/click)
-- Depends on: 20260716000100_commerce.sql (citext, set_updated_at).
-- ============================================================================

-- --- subscribers ---------------------------------------------------------------

create table if not exists public.subscribers (
  id                  uuid primary key default gen_random_uuid(),
  email               citext not null unique,
  first_name          text not null default '',
  last_name           text not null default '',
  status              text not null default 'active'
                        check (status in ('active', 'unsubscribed', 'bounced', 'complained', 'inactive', 'deleted')),
  tags                text[] not null default '{}',
  smart_tags          jsonb not null default '{}'::jsonb,
  -- geo / contact fields (populated from Shopify / Klaviyo imports)
  country             text,
  country_code        text,
  phone_code          text,
  phone_number        text,
  shipping_address1   text,
  shipping_address2   text,
  shipping_city       text,
  shipping_zip        text,
  shipping_province   text,
  shopify_customer_id text,
  klaviyo_profile_id  text,
  workspace           text not null default 'dreamplay',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists subscribers_workspace_status_idx
  on public.subscribers (workspace, status);
create index if not exists subscribers_tags_idx
  on public.subscribers using gin (tags);

create trigger subscribers_set_updated_at
  before update on public.subscribers
  for each row execute function public.set_updated_at();

-- --- rotations -----------------------------------------------------------------

-- Round-robin A/B send pools. campaign_ids is an ordered uuid[] of template
-- campaigns (no array FK in Postgres; app-enforced). Created before campaigns
-- because campaigns.rotation_id references it.
create table if not exists public.rotations (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  campaign_ids    uuid[] not null default '{}',
  cursor_position integer not null default 0,
  workspace       text not null default 'dreamplay',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger rotations_set_updated_at
  before update on public.rotations
  for each row execute function public.set_updated_at();

-- --- campaigns -----------------------------------------------------------------

-- Template/child model kept from legacy: is_template rows are reusable
-- templates; sends clone them into child campaigns (parent_template_id).
-- variable_values carries subscriber_ids/target_tag/from_*/merge_defaults.
-- send_key is the send-wave idempotency key: retries reuse the child campaign
-- instead of creating (and sending) a second one.
create table if not exists public.campaigns (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  subject_line        text,
  html_content        text,
  variable_values     jsonb not null default '{}'::jsonb,
  status              text not null default 'draft'
                        check (status in ('draft', 'scheduled', 'sending', 'completed', 'deleted')),
  email_type          text not null default 'campaign'
                        check (email_type in ('campaign', 'automated')),
  is_template         boolean not null default false,
  is_ready            boolean not null default false,
  is_starred_template boolean not null default false,
  parent_template_id  uuid references public.campaigns (id) on delete set null,
  rotation_id         uuid references public.rotations (id) on delete set null,
  template_folder_id  uuid,
  category            text,
  send_key            text,
  sent_from_email     text,
  resend_email_id     text,
  scheduled_at        timestamptz,
  scheduled_status    text
                        check (scheduled_status is null
                               or scheduled_status in ('pending', 'scheduled', 'sent', 'cancelled')),
  total_recipients    integer not null default 0,
  total_opens         integer not null default 0,
  total_clicks        integer not null default 0,
  workspace           text not null default 'dreamplay',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists campaigns_workspace_status_idx
  on public.campaigns (workspace, status);
create index if not exists campaigns_parent_template_id_idx
  on public.campaigns (parent_template_id);
create index if not exists campaigns_rotation_id_idx
  on public.campaigns (rotation_id);
-- Idempotency: one child campaign per send key (NULLs exempt).
create unique index if not exists campaigns_send_key_key
  on public.campaigns (send_key) where send_key is not null;

create trigger campaigns_set_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

-- --- sent_history ----------------------------------------------------------------

-- Per-recipient send ledger and the LAST line of defense against double-sends.
-- The UNIQUE (campaign_id, subscriber_id) constraint exists from day one
-- (legacy added it only after the 2026-05-12 Gmail double-send incident).
create table if not exists public.sent_history (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid not null references public.campaigns (id) on delete cascade,
  subscriber_id   uuid not null references public.subscribers (id) on delete cascade,
  resend_email_id text,
  sent_at         timestamptz not null default now(),
  constraint sent_history_campaign_subscriber_unique unique (campaign_id, subscriber_id)
);

create index if not exists sent_history_subscriber_id_idx
  on public.sent_history (subscriber_id);

-- --- email_events (replaces subscriber_events) ------------------------------------

-- Opens/clicks written by the tracking host, plus bounce/complaint/unsubscribe/
-- delivery written by the Resend webhook (legacy never wired that up).
-- ip_address/user_agent kept as text for scanner-UA filtering parity.
create table if not exists public.email_events (
  id            bigint generated always as identity primary key,
  subscriber_id uuid references public.subscribers (id) on delete cascade,
  campaign_id   uuid references public.campaigns (id) on delete set null,
  type          text not null
                  check (type in ('open', 'click', 'bounce', 'complaint', 'unsubscribe', 'delivery')),
  url           text,
  ip            text,
  user_agent    text,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists email_events_subscriber_created_idx
  on public.email_events (subscriber_id, created_at);
create index if not exists email_events_campaign_type_idx
  on public.email_events (campaign_id, type);
create index if not exists email_events_type_created_idx
  on public.email_events (type, created_at);

-- --- suppressions (NEW — legacy had none) -------------------------------------------

-- Do-not-send list. The send pipeline MUST check this table before every send,
-- independently of subscribers.status (an address can be suppressed even if it
-- is re-imported later as a fresh subscriber row).
create table if not exists public.suppressions (
  id         uuid primary key default gen_random_uuid(),
  email      citext not null unique,
  reason     text not null
               check (reason in ('bounce', 'complaint', 'unsubscribe', 'manual')),
  source     text,
  created_at timestamptz not null default now()
);

-- --- send_logs -----------------------------------------------------------------------

-- One row per send-stream invocation; failures land in durable storage instead
-- of only Vercel function logs.
create table if not exists public.send_logs (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid references public.campaigns (id) on delete set null,
  triggered_by  text,
  status        text not null default 'pending'
                  check (status in ('pending', 'success', 'error')),
  error_message text,
  logs          jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists send_logs_campaign_id_idx
  on public.send_logs (campaign_id);

create trigger send_logs_set_updated_at
  before update on public.send_logs
  for each row execute function public.set_updated_at();

-- --- tag_definitions -------------------------------------------------------------------

create table if not exists public.tag_definitions (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  color      text not null default '#6b7280',
  workspace  text not null default 'dreamplay',
  created_at timestamptz not null default now(),
  constraint tag_definitions_workspace_name_unique unique (workspace, name)
);

-- --- merge_tags ------------------------------------------------------------------------

-- Reusable {{merge_tag}} values injected at render time.
create table if not exists public.merge_tags (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  default_value text not null default '',
  description   text,
  workspace     text not null default 'dreamplay',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint merge_tags_workspace_name_unique unique (workspace, name)
);

create trigger merge_tags_set_updated_at
  before update on public.merge_tags
  for each row execute function public.set_updated_at();

-- --- email_chains + chain_processes ------------------------------------------------------

-- Multi-step automation definitions (steps/branches as jsonb, matching the
-- legacy editor's document model). is_snapshot rows are per-subscriber frozen
-- copies of a chain taken when the subscriber entered it.
create table if not exists public.email_chains (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  status        text not null default 'draft',
  steps         jsonb not null default '[]'::jsonb,
  branches      jsonb not null default '[]'::jsonb,
  subscriber_id uuid references public.subscribers (id) on delete cascade,
  is_snapshot   boolean not null default false,
  workspace     text not null default 'dreamplay',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger email_chains_set_updated_at
  before update on public.email_chains
  for each row execute function public.set_updated_at();

-- A subscriber's progress through a chain.
create table if not exists public.chain_processes (
  id            uuid primary key default gen_random_uuid(),
  chain_id      uuid not null references public.email_chains (id) on delete cascade,
  subscriber_id uuid not null references public.subscribers (id) on delete cascade,
  status        text not null default 'active'
                  check (status in ('active', 'paused', 'completed', 'cancelled', 'error')),
  current_step  integer not null default 0,
  state         jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists chain_processes_chain_id_idx
  on public.chain_processes (chain_id);
create index if not exists chain_processes_subscriber_id_idx
  on public.chain_processes (subscriber_id);

create trigger chain_processes_set_updated_at
  before update on public.chain_processes
  for each row execute function public.set_updated_at();

-- --- email_triggers -----------------------------------------------------------------------

-- Event -> chain/campaign wiring (e.g. subscriber gets tag X => start chain Y).
create table if not exists public.email_triggers (
  id            uuid primary key default gen_random_uuid(),
  name          text,
  trigger_type  text not null default 'subscriber_tag',
  trigger_value text not null,
  chain_id      uuid references public.email_chains (id) on delete set null,
  campaign_id   uuid references public.campaigns (id) on delete set null,
  is_active     boolean not null default true,
  metadata      jsonb not null default '{}'::jsonb,
  workspace     text not null default 'dreamplay',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists email_triggers_type_value_idx
  on public.email_triggers (trigger_type, trigger_value);

create trigger email_triggers_set_updated_at
  before update on public.email_triggers
  for each row execute function public.set_updated_at();

-- --- app_settings ---------------------------------------------------------------------------

-- Email-app key/value config (kept separate from public.settings, which is the
-- cross-domain operational store; this mirrors the legacy email repo's table).
create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb,
  updated_at timestamptz not null default now()
);

create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();
