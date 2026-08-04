-- ============================================================================
-- 20260804120100_crowdfunding.sql
-- Legacy-DB decommission — crowdfunding domain (consumer: crowdfunding-page,
-- reserve./crowdfund.dreamplaypianos.com).
--
-- Replaces (legacy website DB, project tqhfpcdqxylrknwbrqqi):
--   cf_creator  -> cf_creator   (same shape)
--   cf_campaign -> cf_campaign  (same shape)
--   cf_reward   -> cf_reward    (same shape)
--   cf_faq      -> cf_faq       (same shape)
--   cf_update   -> cf_update    (same shape)
--   cf_comment  -> cf_comment   (same shape)
--   cf_pledge   -> cf_pledge    (customer_id: text -> uuid; legacy FK pointed
--                  at "Customer"(id) whose uuid-shaped ids were preserved in
--                  public.customers, so the FK now references customers(id).
--                  The FK is required — the app uses PostgREST embedded
--                  selects like `customers(email)` on cf_pledge.)
--
-- NOT recreated: preorder_orders (grep of the crowdfunding-page repo shows it
-- is never referenced there; it belongs to the website/my-reservation domain).
--
-- RLS: deny-by-default, NO anon policies — every crowdfunding-page DB call
-- (including its public GET /api/campaign and postComment) goes through the
-- service-role client, which bypasses RLS. Legacy anon-exposure is not
-- reproduced.
--
-- Types note: packages/db/src/types.ts intentionally NOT extended — these
-- tables are consumed by the external crowdfunding-page app, not by monorepo
-- app code.
-- ============================================================================

-- --- cf_creator --------------------------------------------------------------

create table if not exists public.cf_creator (
  id               text primary key,
  name             text not null,
  avatar_url       text,
  bio              text,
  location         text,
  projects_created integer default 0,
  projects_backed  integer default 0,
  created_at       timestamptz not null default now(),
  page_content     text default ''::text
);

-- --- cf_campaign -------------------------------------------------------------

create table if not exists public.cf_campaign (
  id                   text primary key,
  creator_id           text references public.cf_creator(id),
  title                text not null,
  subtitle             text,
  story                text,
  risks                text,
  hero_image           text,
  gallery_images       text[],
  goal_amount          numeric not null,
  total_pledged        numeric default 0,
  total_backers        integer default 0,
  ends_at              timestamptz,
  created_at           timestamptz not null default now(),
  key_features         jsonb default '[]'::jsonb,
  tech_specs           jsonb default '[]'::jsonb,
  shipping             text default ''::text,
  technical_details    text default ''::text,
  faq_page_content     text,
  media_gallery        jsonb default '[]'::jsonb,
  manufacturer_details text,
  loves_count          integer default 0,
  total_supply         integer default 100,
  is_variant_a         boolean default true,
  show_announcement    boolean not null default false,
  show_reserved_amount boolean not null default true,
  show_sold_out_percent boolean not null default true,
  hidden_sections      jsonb default '[]'::jsonb
);

-- --- cf_reward ---------------------------------------------------------------

create table if not exists public.cf_reward (
  id                 text primary key,
  campaign_id        text references public.cf_campaign(id) on delete cascade,
  title              text not null,
  price              numeric not null,
  original_price     numeric,
  description        text,
  items_included     text[],
  estimated_delivery text,
  ships_to           text[],
  limit_quantity     integer,
  backers_count      integer default 0,
  is_sold_out        boolean default false,
  created_at         timestamptz not null default now(),
  image_url          text,
  is_featured        boolean default false,
  checkout_url       text,
  shopify_variant_id text,
  is_visible         boolean default true,
  sort_order         integer default 0,
  badge_type         text default 'none',
  reward_type        text default 'bundle'
);

-- --- cf_faq ------------------------------------------------------------------

create table if not exists public.cf_faq (
  id          text primary key,
  campaign_id text references public.cf_campaign(id) on delete cascade,
  category    text,
  question    text not null,
  answer      text not null,
  "order"     integer default 0
);

-- --- cf_update / cf_comment --------------------------------------------------

create table if not exists public.cf_update (
  id          uuid primary key default gen_random_uuid(),
  campaign_id text not null default 'dreamplay-one',
  title       text not null,
  content     text not null,
  image       text,
  created_at  timestamptz default now()
);

create table if not exists public.cf_comment (
  id         uuid primary key default gen_random_uuid(),
  update_id  uuid references public.cf_update(id) on delete cascade,
  email      text not null,
  name       text not null,
  content    text not null,
  created_at timestamptz default now()
);

-- --- cf_pledge ---------------------------------------------------------------

create table if not exists public.cf_pledge (
  id                uuid primary key default gen_random_uuid(),
  campaign_id       text references public.cf_campaign(id),
  reward_id         text references public.cf_reward(id),
  customer_id       uuid references public.customers(id),
  amount            numeric not null,
  status            text default 'succeeded',
  created_at        timestamptz not null default now(),
  shipping_address  text,
  shipping_location text
);

create index if not exists cf_pledge_campaign_id_idx on public.cf_pledge (campaign_id);
create index if not exists cf_pledge_customer_id_idx on public.cf_pledge (customer_id);

-- --- RLS ---------------------------------------------------------------------

alter table public.cf_creator  enable row level security;
alter table public.cf_campaign enable row level security;
alter table public.cf_reward   enable row level security;
alter table public.cf_faq      enable row level security;
alter table public.cf_update   enable row level security;
alter table public.cf_comment  enable row level security;
alter table public.cf_pledge   enable row level security;
