<!-- Mirror of db-backups/README.md (local backup folder). Kept in git so the catalog
     survives if the laptop copy is lost; the archives themselves are LOCAL ONLY (PII). -->

# Legacy Supabase backups — READ BEFORE RESTORING

Local-only archives of the two decommissioned Supabase projects. **Contains PII**
(customer/subscriber emails) and **auth password hashes** — never commit, never upload
anywhere public.

## Which file to trust

| Project | AUTHORITATIVE backup | Why |
|---|---|---|
| `tqhfpcdqxylrknwbrqqi` (old website/analytics) | **`tqhfpcdqxylrknwbrqqi-2026-08-04-full.tar.gz`** | Only snapshot with BOTH complete public data AND complete hidden schemas |
| `quyqwdjygzalqqmrgkfk` (old email) | **`quyqwdjygzalqqmrgkfk-2026-08-04.tar.gz`** (17M) | The only one with actual row data |

## What each snapshot is

**tqhf:**
- `2026-08-04` (morning, 3.1M) — public schema only (23 tables). No hidden schemas. Superseded.
- `2026-08-04-full` (14:12, 5.5M) — **AUTHORITATIVE.** 41 tables: all public + `ads`,
  `asset_indexer`, `concert_analytics`, `concerts`. 73,666 rows.
- `2026-08-04-final` (16:38, 4.5M) — pre-decommission re-run. Public tables identical to
  `-full`, BUT `concert_analytics.analytics_logs` captured only **4,500 of 10,389 rows**
  (backup-script pagination limit on the non-public read path, not data loss in the DB).
  Verified 2026-08-11: those 4,500 ids are a strict subset of `-full`'s 10,389 — `-full`
  loses nothing by comparison. Despite the name, **`-final` is NOT the most complete.**

**quyq:**
- `2026-08-04` (09:19, 17M) — **AUTHORITATIVE.** Full row data for all 47 public tables
  (subscribers 15,529 · campaigns 1,807 · sent_history 61,806 · subscriber_events 75,974 …).
- `2026-08-04-full` (14:12, 11K) — schema/metadata only. Its data re-read returned empty
  because quyq's service key died mid-day (see FINAL-STATE-NOTE.txt). Use only for the
  all-schema DDL/catalog; take the DATA from the 17M archive above.
- No `-final`: by then the service key was dead. Counts were verified unchanged via the
  Management API instead, and again on 2026-08-11 (see below).

## How to restore a table

Each `.jsonl` is one JSON object per line — no SQL dump needed:

```bash
tar xzf tqhfpcdqxylrknwbrqqi-2026-08-04-full.tar.gz     # extract
head -1 tqhfpcdqxylrknwbrqqi/2026-08-04-full/public.buyer_emails.jsonl   # peek at a row
```
Load into Postgres via a staging table:
```sql
create temp table staging (doc jsonb);
\copy staging (doc) from 'public.buyer_emails.jsonl'   -- psql, one JSON per line
insert into buyers (email, notes)
select doc->>'email', doc->>'notes' from staging;
```
Or with the same `json_populate_recordset` pattern the migrations used (see
`dreamplay-monorepo/scripts/migrate/` and `musicalbasics-monorepo/scripts/migrate/`
for working, re-runnable examples).

Column names in these files are the **legacy** names. Several were renamed on the way into
the new databases (`Customer`→`customers`, `buyer_emails`→`buyers`, `Waitlist`→`waitlist`,
`subscriber_events.type`→`email_events.type`/`occurred_at`, etc.) — the catalog below notes
each destination.

## Table catalog — what is inside each backup

### tqhfpcdqxylrknwbrqqi — old WEBSITE + ANALYTICS database

Read from `tqhfpcdqxylrknwbrqqi-2026-08-04-full.tar.gz` (41 tables across 6 schemas). Also contains `auth.users.jsonl` / `auth.identities.jsonl` — **71 login accounts with bcrypt password hashes** (migrated to huv; passwords preserved).

| Table | Rows | Columns | What it holds → where it went |
|---|---:|---|---|
| `public.analytics_logs` | 58,499 | `id`, `created_at`, `event_name`, `path`, `ip_address`, `user_agent`, `user_id`, `metadata`, `country`, `city` _+1 more_ | Website pageview/event log (pre-cutover). → **huv `public.events`** tagged `metadata.legacy_source=tqhf-analytics-logs` (all 58,499 imported 08-04). |
| `concert_analytics.analytics_logs` | 10,389 | `id`, `created_at`, `event_name`, `path`, `session_id`, `anonymous_id`, `tracker_version`, `metadata`, `ip_address`, `user_agent` _+3 more_ | Belgium concert-site analytics (the schema the first backup missed). → **szl `concert_analytics.analytics_logs`**. |
| `concert_analytics.email_attributed_pageviews` | 1,599 | `id`, `created_at`, `event_name`, `path`, `session_id`, `anonymous_id`, `tracker_version`, `metadata`, `ip_address`, `user_agent` _+3 more_ | Belgium pageviews resolved to a subscriber via sid. → **szl**. |
| `asset_indexer.assets` | 967 | `id`, `filePath`, `fileName`, `fileSize`, `mimeType`, `mediaType`, `width`, `height`, `durationSeconds`, `fps` _+22 more_ | Media library index (video/image metadata, dimensions, codecs, tags). → **huv schema `asset_indexer`**. |
| `ads.belgium_agent_log` | 846 | `id`, `ran_at`, `action`, `details`, `success` | Google-Ads sync agent run log (every ~2h). → **szl schema `ads`**. |
| `public.chat_sessions` | 300 | `id`, `created_at`, `updated_at`, `email`, `status`, `admin_takeover_at`, `page_url`, `ip_address`, `message_count` | Website AI-chatbot sessions. → **huv `public.chat_sessions`** (schema exists; historical rows NOT ported — in backup only). |
| `public.cf_pledge` | 278 | `id`, `campaign_id`, `reward_id`, `customer_id`, `amount`, `status`, `created_at`, `shipping_address`, `shipping_location` | Crowdfunding pledges (278). → **huv `public.cf_pledge`**, customer_id now a real FK to `customers`. |
| `asset_indexer.merch_generations` | 208 | `id`, `file_path`, `file_name`, `prompt`, `enhanced_prompt`, `model_id`, `model_name`, `format_label`, `aspect_ratio`, `ref_image_paths` _+7 more_ | AI merch-image generation records (prompts, models, curation). → **huv `asset_indexer`**. |
| `asset_indexer.product_image_catalog` | 136 | `id`, `storage_path`, `public_url`, `folder`, `name`, `type`, `size_bytes`, `indexed_at` | Product image catalog w/ storage paths. → **huv `asset_indexer`**. |
| `public.Customer` | 81 | `id`, `email`, `name`, `shopifyCustomerId`, `createdAt`, `tags` | Newsletter/shop customers. → **huv `public.customers`** (renamed, ids preserved). |
| `public.buyer_emails` | 77 | `email`, `added_at`, `notes` | Buyer allowlist gating /my-reservation. → **huv `public.buyers`** (+ reconciled against Shopify: 101 rows now). |
| `public.chat_messages` | 71 | `id`, `session_id`, `created_at`, `role`, `content` | Chatbot message transcripts. → same as chat_sessions (backup only). |
| `public.preorder_orders` | 57 | `id`, `order_name`, `raw_shopify_id`, `import_batch_id`, `source`, `email`, `customer_name`, `created_at`, `financial_status`, `fulfillment_status` _+9 more_ | Historical Shopify-CSV preorder/reservation import ledger. → **huv `public.preorder_orders`** (57). |
| `public.Waitlist` | 34 | `id`, `full_name`, `email`, `created_at` | Waitlist signups. → **huv `public.waitlist`** (32 of 34; 2 had invalid emails). |
| `public.ip_email_map` | 30 | `ip_address`, `email`, `created_at` | Manual IP→email attribution overrides. → not ported (backup only). |
| `public.reservation_decisions` | 22 | `id`, `user_id`, `email`, `decision`, `selected_at`, `order_metadata`, `created_at`, `updated_at` | Buyer keep/refund/upgrade choices. → **huv `public.reservation_decisions`** (user_ids remapped to new auth users). |
| `public.admin_variables` | 15 | `key`, `value`, `created_at`, `updated_at` | Admin-editable site config (countdowns, toggles). → **huv `public.admin_variables`**. |
| `concerts.concert_requests` | 11 | `id`, `name`, `email`, `city`, `country`, `requester_type`, `audience_size`, `target_date`, `notes`, `ip_address` _+5 more_ | "Bring a concert to my city" form submissions. → **szl**. |
| `ads.belgium_daily_performance` | 10 | `date`, `campaign_id`, `ad_group_id`, `impressions`, `views`, `clicks`, `cost_cents`, `conversions`, `conversion_value_cents` | Per-day ad spend/impressions/conversions. → **szl `ads`**. |
| `ads.belgium_ticket_sales` | 9 | `shopify_order_id`, `order_name`, `customer_email`, `ticket_tier`, `amount_cents`, `currency`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` _+5 more_ | Ticket orders attributed to ads (UTM + Shopify order). → **szl `ads`**. |
| `public.cf_reward` | 9 | `id`, `campaign_id`, `title`, `price`, `original_price`, `description`, `items_included`, `estimated_delivery`, `ships_to`, `limit_quantity` _+11 more_ | Pledge reward tiers. → **huv**. |
| `public.cf_faq` | 8 | `id`, `campaign_id`, `category`, `question`, `answer`, `order` | Campaign FAQ entries. → **huv**. |
| `ads.belgium_campaign_state` | 3 | `id`, `campaign_id`, `resource_name`, `ad_group_subscribers_id`, `ad_group_lookalike_id`, `status`, `daily_budget_cents`, `total_budget_cents`, `spend_to_date_cents`, `conversions_to_date` _+5 more_ | Google Ads campaign budget/state machine. → **szl `ads`**. |
| `asset_indexer.drafts` | 3 | `id`, `name`, `createdAt`, `updatedAt`, `data` | Saved indexer UI drafts. → **huv `asset_indexer`**. |
| `public.cf_campaign` | 1 | `id`, `creator_id`, `title`, `subtitle`, `story`, `risks`, `hero_image`, `gallery_images`, `goal_amount`, `total_pledged` _+17 more_ | Crowdfunding campaign definition. → **huv `public.cf_campaign`**. |
| `public.cf_comment` | 1 | `id`, `update_id`, `email`, `name`, `content`, `created_at` | Comments on campaign updates. → **huv**. |
| `public.cf_creator` | 1 | `id`, `name`, `avatar_url`, `bio`, `location`, `projects_created`, `projects_backed`, `created_at`, `page_content` | Campaign creator profile. → **huv**. |
| `public.cf_update` | 1 | `id`, `campaign_id`, `title`, `content`, `image`, `created_at` | Campaign update posts. → **huv**. |

**Empty tables (0 rows, captured for schema completeness):** `concert_analytics.ip_email_map`, `dreamplay_analytics.analytics_logs`, `dreamplay_analytics.email_attributed_pageviews`, `dreamplay_analytics.ip_email_map`, `musicalbasics_analytics.analytics_logs`, `musicalbasics_analytics.email_attributed_pageviews`, `musicalbasics_analytics.ip_email_map`, `public.ab_events`, `public.ab_tests`, `public.ab_variants`, `public.checkout_ab_counter`, `public.contact_submissions`, `public.homepage_ab_counter`

### quyqwdjygzalqqmrgkfk — old EMAIL database

Read from `quyqwdjygzalqqmrgkfk-2026-08-04.tar.gz` (47 public tables). `auth` was empty (0 users). Note: this project was the "shared services DB" — it also held the blog, vaulted.so, research library and an old media-indexer generation.

| Table | Rows | Columns | What it holds → where it went |
|---|---:|---|---|
| `subscriber_events` | 75,974 | `id`, `subscriber_id`, `campaign_id`, `type`, `url`, `metadata`, `ip_address`, `created_at`, `user_agent` | Email opens/clicks (75,974). → belgium-attributable subset (25,816) to **szl**; DreamPlay history NOT ported (new `email_events` starts fresh) — backup only. |
| `sent_history` | 61,806 | `id`, `campaign_id`, `round_id`, `subscriber_id`, `variant_sent`, `sent_at`, `merge_tag_log` | One row per email actually sent — the idempotency ledger. → **huv** (61,806, all) and belgium subset (37,685) → **szl**. |
| `subscribers` | 15,529 | `id`, `email`, `first_name`, `last_name`, `tags`, `status`, `created_at`, `location_city`, `location_country`, `ip_address` _+13 more_ | All email contacts w/ status, tags, geo, workspace. → **huv** (9,459 after dedupe), MusicalBasics workspaces (9,146) → **oiy**, belgium/concert (9,134) → **szl**. |
| `campaigns` | 1,807 | `id`, `name`, `status`, `total_audience_size`, `created_at`, `html_content`, `variable_values`, `subject_line`, `updated_at`, `total_recipients` _+17 more_ | Email campaigns + templates incl. full HTML. → **huv** (1,555), **oiy** (600), **szl** (503) by workspace/brand. |
| `trigger_logs` | 1,196 | `id`, `level`, `event`, `details`, `created_at` | Automation trigger debug log. → not ported (backup only). |
| `send_logs` | 616 | `id`, `campaign_id`, `triggered_by`, `status`, `summary`, `image_logs`, `raw_log`, `created_at` | Per-send run logs (status, image processing, raw output). → not ported (backup only). |
| `chain_steps` | 483 | `id`, `chain_id`, `position`, `label`, `template_key`, `wait_after`, `created_at` | Steps within a chain. → not ported (backup only). |
| `campaign_backups` | 360 | `id`, `campaign_id`, `html_content`, `variable_values`, `subject_line`, `saved_at` | Prior HTML/subject versions of campaigns. → not ported (backup only). |
| `chain_processes` | 191 | `id`, `chain_id`, `subscriber_id`, `status`, `current_step_index`, `next_step_at`, `history`, `created_at`, `updated_at`, `chain_rotation_id` _+1 more_ | Per-subscriber progress through a chain. → not ported (backup only). |
| `email_chains` | 184 | `id`, `slug`, `name`, `description`, `trigger_label`, `trigger_event`, `created_at`, `updated_at`, `subscriber_id`, `is_snapshot` _+1 more_ | Multi-step drip/sequence definitions. → not ported — the new system has `email_chains` but chains were not migrated (backup only). |
| `research_knowledgebase` | 173 | `id`, `title`, `author`, `year`, `url`, `content`, `is_active`, `created_at`, `updated_at`, `r2_key` _+7 more_ | Research/citation library backing blog + AI content. → **huv `public.research_knowledgebase`** (173). |
| `asset_tag_links` | 149 | `asset_id`, `tag_id` | media_assets ↔ asset_tags join. → **huv** (149). |
| `media_assets` | 135 | `id`, `filename`, `folder_path`, `storage_hash`, `public_url`, `size`, `is_deleted`, `created_at`, `description`, `is_starred` _+5 more_ | OLD media-indexer generation asset table. → **huv** (135, copied with the blog set). Superseded by `asset_indexer.*`. |
| `tag_definitions` | 111 | `id`, `name`, `color`, `created_at`, `updated_at`, `is_starred`, `workspace` | Tag registry (name/color/workspace). → **huv** (111) + **oiy** (69). |
| `post_versions` | 57 | `id`, `post_id`, `html_content`, `prompt`, `created_at` | Blog post revision history. → **huv `public.post_versions`** (57). |
| `posts` | 29 | `id`, `title`, `slug`, `excerpt`, `category`, `featured_image`, `html_content`, `variable_values`, `status`, `published_at` _+2 more_ | Blog posts (title, slug, HTML, status). → **huv `public.posts`** (29). |
| `merge_tags` | 16 | `id`, `tag`, `field_label`, `subscriber_field`, `default_value`, `created_at`, `category` | Merge-field definitions for templates. → **huv** + **oiy** (16). |
| `chain_branches` | 12 | `id`, `chain_id`, `description`, `position`, `label`, `condition`, `action`, `created_at` | Conditional branching in chains. → not ported (backup only). |
| `asset_tags` | 11 | `id`, `name`, `color`, `created_at` | Tags for media_assets. → **huv** (11). |
| `audience_saved_views` | 11 | `id`, `name`, `search_query`, `selected_tags`, `excluded_tags`, `status_filter`, `show_test_only`, `last_emailed_sort`, `created_at`, `updated_at` _+1 more_ | Saved audience filters in the email UI. → not ported (backup only). |
| `app_settings` | 9 | `key`, `value`, `updated_at` | Key/value app config (also read by the blog). → **huv `public.app_settings`** (9 rows). |
| `discount_presets` | 7 | `id`, `name`, `type`, `value`, `duration_days`, `code_prefix`, `target_url_key`, `usage_limit`, `is_active`, `created_at` _+6 more_ | Discount-code generation presets. → not ported (backup only). |
| `mailchimp_templates` | 6 | `id`, `name`, `source_html`, `generated_html`, `assets`, `status`, `created_at`, `updated_at` | Imported Mailchimp HTML being converted. → not ported (backup only). |
| `rotations` | 6 | `id`, `name`, `campaign_ids`, `cursor_position`, `created_at`, `updated_at`, `scheduled_at`, `scheduled_status`, `scheduled_subscriber_ids`, `workspace` | Round-robin A/B campaign rotations. → **huv** + **oiy** + **szl** (6 each). |
| `asset_categories` | 5 | `id`, `name`, `slug`, `created_at` | Categories for media_assets. → not ported (0 referenced; backup only). |
| `email_triggers` | 5 | `id`, `name`, `trigger_type`, `trigger_value`, `action_type`, `campaign_id`, `generate_discount`, `discount_config`, `is_active`, `created_at` _+2 more_ | Event→campaign automation rules. → not ported (backup only). |
| `projects` | 5 | `id`, `created_at`, `title`, `status`, `description`, `folder_path` | vaulted.so content projects. → **vxz `public.projects`** (5). |
| `assets` | 4 | `id`, `project_id`, `filename`, `file_type`, `wasabi_url`, `size_bytes`, `created_at` | vaulted.so project file assets. → **vxz `public.assets`** (4) + storage bucket. |
| `blog_themes` | 3 | `id`, `name`, `html_template`, `created_at` | Blog HTML theme templates. → **huv `public.blog_themes`** (3). |
| `chain_rotations` | 2 | `id`, `name`, `chain_ids`, `cursor_position`, `created_at`, `updated_at` | A/B rotation across chains. → not ported (backup only). |
| `research_tags_directory` | 1 | `id`, `name`, `description`, `created_at` | Tag directory for the research library. → **huv** (1). |
| `template_folders` | 1 | `id`, `name`, `sort_order`, `created_at`, `updated_at` | Template organization folders. → not ported (backup only). |

**Empty tables (0 rows, captured for schema completeness):** `ai_knowledge_chunks`, `ai_missions`, `ai_personas`, `ai_platform_rules`, `asset_usage_logs`, `campaign_rounds`, `campaign_versions`, `citation_logs`, `research_tag_links`

## Format

JSON Lines, one row per line, one file per table (`<schema>.<table>.jsonl`), plus
`schema.json` (columns/constraints/indexes/functions) and `manifest.json` (row counts).
`auth.users.jsonl` / `auth.identities.jsonl` include bcrypt password hashes (71 users for
tqhf; quyq had none). Restorable into any Postgres.

## Status

2026-08-11 audit: both projects still existed, **zero writes** since migration. Every
consumer was migrated off on 2026-08-04 (see
`dreamplay-monorepo/docs/plan/legacy-db-decommission.md`). Projects were never paused
(Supabase only pauses free-tier); deletion still pending — the main PAT has since died, so
it needs a fresh PAT for org `qfrrgndpbwqxkollnysl` or dashboard access.

⚠ These are single-copy on this laptop. Copy the two authoritative `.tar.gz` files
(~22MB) to external/offsite storage before deleting the Supabase projects.

`backup-project.mjs` re-runs a snapshot: `node backup-project.mjs <ref> <url> <serviceKey> <pat> <dateLabel>`
