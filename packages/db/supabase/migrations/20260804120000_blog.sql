-- ============================================================================
-- 20260804120000_blog.sql
-- Legacy-DB decommission — blog domain (consumer: dreamplay-blog,
-- blog.dreamplaypianos.com).
--
-- Replaces (legacy email DB, project quyqwdjygzalqqmrgkfk):
--   posts                  -> posts                  (same shape)
--   post_versions          -> post_versions          (same shape)
--   blog_themes            -> blog_themes            (same shape)
--   research_knowledgebase -> research_knowledgebase (same shape)
--   media_assets           -> media_assets           (category FK dropped —
--                             asset_categories was never used: 0/135 rows had
--                             a category_id; column kept for data fidelity)
--   asset_tags             -> asset_tags             (same shape)
--   asset_tag_links        -> asset_tag_links        (same shape)
--
-- NOT recreated here: app_settings (already exists in huv from the email
-- migration; the blog shares it with the email app — data rows copied in the
-- data-copy step), subscribers (blog never touches it directly; newsletter
-- signups go through email.dreamplaypianos.com webhooks).
--
-- RLS: deny-by-default like the rest of the schema. Exception — the blog app
-- accesses posts / post_versions / research_knowledgebase through the ANON
-- key (SSR server client + the browser client in /editor), mirroring the
-- legacy project where RLS was off (posts/post_versions) or anon-CRUD
-- (research_knowledgebase). Those three tables get anon+authenticated CRUD
-- policies to keep the live app working. Tightening the blog editor behind
-- auth is a known follow-up. media_assets / asset_tags / asset_tag_links /
-- blog_themes are service-role-only (blog code uses SUPABASE_SERVICE_KEY for
-- them).
--
-- Types note: packages/db/src/types.ts intentionally NOT extended — these
-- tables are consumed by the external dreamplay-blog app, not by monorepo
-- app code.
-- ============================================================================

-- --- posts -------------------------------------------------------------------

create table if not exists public.posts (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text not null unique,
  excerpt         text,
  category        text default 'tutorials',
  featured_image  text,
  html_content    text,
  variable_values jsonb default '{}'::jsonb,
  status          text default 'draft'
                    check (status in ('draft', 'published')),
  published_at    timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- --- post_versions -----------------------------------------------------------

create table if not exists public.post_versions (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid references public.posts(id) on delete cascade,
  html_content text not null,
  prompt       text,
  created_at   timestamptz default now()
);

create index if not exists post_versions_post_id_idx
  on public.post_versions (post_id);

-- --- blog_themes -------------------------------------------------------------

create table if not exists public.blog_themes (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  html_template text not null,
  created_at    timestamptz default now()
);

-- --- research_knowledgebase --------------------------------------------------

create table if not exists public.research_knowledgebase (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  author          text,
  year            text,
  url             text,
  content         text not null,
  is_active       boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  r2_key          text unique,
  source          text,
  description     text,
  file_size_kb    integer,
  batch           text,
  download_status text,
  abstract        text,
  citation_count  integer default 0
);

create index if not exists idx_research_kb_active
  on public.research_knowledgebase (is_active);
create index if not exists idx_research_kb_citation_count
  on public.research_knowledgebase (citation_count desc);

create trigger research_knowledgebase_set_updated_at
  before update on public.research_knowledgebase
  for each row execute function public.set_updated_at();

-- --- media_assets ------------------------------------------------------------

create table if not exists public.media_assets (
  id           uuid primary key default gen_random_uuid(),
  filename     text not null,
  folder_path  text default ''::text,
  storage_hash text not null,
  public_url   text not null,
  size         integer,
  is_deleted   boolean default false,
  created_at   timestamptz default now(),
  description  text default ''::text,
  is_starred   boolean default false,
  asset_type   text default 'image'
                 check (asset_type in ('image', 'video', 'document')),
  role         text default 'master'
                 check (role in ('master', 'derivative')),
  parent_id    uuid references public.media_assets(id),
  usage_score  integer default 0,
  -- legacy FK to asset_categories dropped (table unused; 0 rows referenced it)
  category_id  uuid
);

create index if not exists idx_media_assets_hash
  on public.media_assets (storage_hash);
create index if not exists idx_media_assets_folder
  on public.media_assets (folder_path) where (is_deleted = false);
create index if not exists idx_media_assets_type
  on public.media_assets (asset_type) where (is_deleted = false);
create index if not exists idx_media_assets_usage
  on public.media_assets (usage_score desc)
  where ((is_deleted = false) and (role = 'master'));
create index if not exists idx_media_assets_parent
  on public.media_assets (parent_id) where (parent_id is not null);

-- --- asset_tags / asset_tag_links --------------------------------------------

create table if not exists public.asset_tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  color      text not null default '#6b7280',
  created_at timestamptz default now()
);

create table if not exists public.asset_tag_links (
  asset_id uuid not null references public.media_assets(id) on delete cascade,
  tag_id   uuid not null references public.asset_tags(id) on delete cascade,
  primary key (asset_id, tag_id)
);

create index if not exists idx_asset_tag_links_tag
  on public.asset_tag_links (tag_id);
create index if not exists idx_asset_tag_links_asset
  on public.asset_tag_links (asset_id);

-- --- RLS ---------------------------------------------------------------------

alter table public.posts                  enable row level security;
alter table public.post_versions          enable row level security;
alter table public.blog_themes            enable row level security;
alter table public.research_knowledgebase enable row level security;
alter table public.media_assets           enable row level security;
alter table public.asset_tags             enable row level security;
alter table public.asset_tag_links        enable row level security;

-- Blog app anon-key access (see header). Table privileges were revoked by
-- default-privileges in 20260716000400_rls.sql, so grant + policy both needed.
grant select, insert, update, delete on public.posts                  to anon, authenticated;
grant select, insert, update, delete on public.post_versions          to anon, authenticated;
grant select, insert, update, delete on public.research_knowledgebase to anon, authenticated;

create policy "posts_anon_all" on public.posts
  for all to anon, authenticated using (true) with check (true);
create policy "post_versions_anon_all" on public.post_versions
  for all to anon, authenticated using (true) with check (true);
create policy "research_knowledgebase_anon_all" on public.research_knowledgebase
  for all to anon, authenticated using (true) with check (true);
