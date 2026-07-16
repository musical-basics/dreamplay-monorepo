-- ============================================================================
-- 20260716000100_commerce.sql
-- Phase 1, task 3 — commerce/buyers domain + shared plumbing.
--
-- Replaces (legacy dreamplay-website-2, project tqhfpcdqxylrknwbrqqi):
--   buyer_emails            -> buyers
--   reservation_decisions   -> reservation_decisions (same shape, cleaned)
--   "Customer"              -> customers (snake_case, citext email)
--   "Waitlist"              -> waitlist
--   admin_variables         -> admin_variables
-- New: settings (admin/bot IP lists — previously hardcoded in the analytics
-- RPC AND in src/lib/adminIPs.ts; single source of truth from day one).
-- ============================================================================

-- --- extensions -------------------------------------------------------------

-- citext: case-insensitive text for all email columns (legacy lowercased in
-- app code; citext makes the uniqueness constraint case-insensitive at the
-- database level so 'Foo@Bar.com' and 'foo@bar.com' cannot both exist).
create extension if not exists citext with schema extensions;

-- --- shared trigger function ------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Row trigger: keeps updated_at current on UPDATE. Attach to any table with an updated_at column.';

-- --- settings ---------------------------------------------------------------

-- Operational configuration read by SQL functions and app code.
-- Admin/bot IP lists live HERE, not hardcoded (legacy had them duplicated in
-- get_analytics_summary.sql and src/lib/adminIPs.ts).
create table if not exists public.settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_at  timestamptz not null default now()
);

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

insert into public.settings (key, value, description) values
  ('admin_ips', '["71.38.79.10", "71.38.82.163"]'::jsonb,
   'IPs of team members; excluded from analytics when exclude_admin is on. Seeded from legacy get_analytics_summary.'),
  ('bot_ips', '["::1", "127.0.0.1"]'::jsonb,
   'Known bot/localhost IPs; excluded from analytics when exclude_bots is on. Seeded from legacy get_analytics_summary.')
on conflict (key) do nothing;

-- --- buyers (replaces buyer_emails) ------------------------------------------

-- Allowlist of people who bought a DreamPlay reservation. Gates /my-reservation.
-- Populated by the Shopify orders/create + orders/paid webhook, the backfill
-- script, or manual inserts.
create table if not exists public.buyers (
  id                   uuid primary key default gen_random_uuid(),
  email                citext not null unique,
  notes                text,
  source               text not null default 'manual'
                         check (source in ('shopify_webhook', 'backfill', 'manual')),
  shopify_order_number text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger buyers_set_updated_at
  before update on public.buyers
  for each row execute function public.set_updated_at();

-- --- reservation_decisions ----------------------------------------------------

-- A buyer's choice for their reservation: refund / keep / upgrade to Pro.
-- Same shape as legacy. user_id is auth.users.id; intentionally NO foreign key
-- to auth.users so Phase 6 can import legacy decision rows before/independently
-- of migrating auth users (legacy auth.users live in the old project).
create table if not exists public.reservation_decisions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null,
  email          citext not null,
  decision       text not null
                   check (decision in ('refund_requested', 'keep_reservation', 'upgrade_to_pro')),
  selected_at    timestamptz not null default now(),
  order_metadata jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists reservation_decisions_user_id_idx
  on public.reservation_decisions (user_id);
create index if not exists reservation_decisions_email_idx
  on public.reservation_decisions (email);

create trigger reservation_decisions_set_updated_at
  before update on public.reservation_decisions
  for each row execute function public.set_updated_at();

-- --- customers (replaces "Customer") -----------------------------------------

-- Newsletter signups from the website (/api/subscribe). Legacy used camelCase
-- ("createdAt") and app-generated uuids; cleaned to snake_case + db defaults.
create table if not exists public.customers (
  id         uuid primary key default gen_random_uuid(),
  email      citext not null unique,
  name       text not null default '',
  tags       text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_tags_idx on public.customers using gin (tags);

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- --- waitlist (replaces "Waitlist") ------------------------------------------

create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null,
  email      citext not null,
  created_at timestamptz not null default now()
);

create index if not exists waitlist_email_idx on public.waitlist (email);

-- --- admin_variables ----------------------------------------------------------

-- Admin-editable site config key/value store (countdown_end_date,
-- show_discount_popup, ...). Values are plain text in legacy; kept as text.
create table if not exists public.admin_variables (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

create trigger admin_variables_set_updated_at
  before update on public.admin_variables
  for each row execute function public.set_updated_at();
