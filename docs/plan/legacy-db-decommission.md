# Legacy Supabase decommission plan (tqhf + quyq)

**Created 2026-08-04.** Goal: retire `tqhfpcdqxylrknwbrqqi` (old website/analytics DB) and `quyqwdjygzalqqmrgkfk` (old email DB), both replaced by `huviqtkjkdkcfneorrmo` (dreamplay-monorepo) and `oiytqgnvbmmquanfljrg` (musicalbasics-monorepo).

## Backups (done 2026-08-04)

Local-only (PII — never commit/upload): `~/Documents/DreamPlay Repos/db-backups/`
- `tqhfpcdqxylrknwbrqqi-2026-08-04.tar.gz` (3.1M packed / 25M raw) — all public tables + auth.users/identities (71 users incl. password hashes) + schema metadata (columns/constraints/indexes/functions).
- `quyqwdjygzalqqmrgkfk-2026-08-04.tar.gz` (17M packed / 137M raw) — same coverage; includes full campaigns HTML, 61,806 sent_history, 73k subscriber_events.
- `backup-project.mjs` is re-runnable for a fresh snapshot before final deletion (HTTPS-only; works despite blocked Postgres ports).
- Drift check same day: dreamplay delta re-sync brought new DB to 71/71 auth users (all with hashes), +2 customers, +1 suppression. Delta scripts remain re-runnable.

## Consumer map (Vercel env sweep + local grep, 2026-08-04)

### Still LIVE with real traffic — MUST be repointed before any cleanup
| App (Vercel) | Domain | Uses | Notes |
|---|---|---|---|
| ~~crowdfunding-page~~ | reserve./crowdfund.dreamplaypianos.com | ~~tqhf~~ → **huvi ✅ repointed 2026-08-04** | Migration `20260804120100_crowdfunding.sql`: cf_creator/campaign/reward/faq/update/comment/pledge recreated in huvi (service-role-only RLS); data copied live (pledges 278/278, rewards 9, faqs 8, +1 missing customer backfilled, id-preserving `Customer`→`customers` remap; `cf_pledge.customer_id` now uuid FK→customers). `campaign-assets` bucket (36 objects) copied, stored URLs rewritten tqhf→huvi. Code: `Customer`→`customers` + `Customer:customers(...)` embed aliases (commit b4486d1, auto-deployed READY). Verified: crowdfund.dreamplaypianos.com/dreamplay-one renders with 13 huvi storage refs / 0 tqhf refs; /api/campaign returns campaign JSON; anon denied on cf_pledge (401). App never used preorder_orders/Waitlist/auth — left alone. |
| ~~belgium-concert-landing-page~~ | belgium.musicalbasics.com | ~~tqhf + quyq~~ → **szl ✅ repointed 2026-08-04** | Consolidated onto its own concerts DB `szlagsmxgfsobizzxaog` (details in section below). Analytics writes now land in szl `concert_analytics.analytics_logs`; sid→email resolution + email-campaign dashboard read szl `public` tables. All belgium-attributable data rescued from both old DBs (10,389 analytics rows, 503 campaigns, 9,134 subscribers, 37,685 sends, 25,816 events, ads/concert-request tables). tqhf + quyq no longer referenced by this app. |
| ~~dreamplay-blog~~ | blog.dreamplaypianos.com | ~~quyq~~ → **huvi ✅ repointed 2026-08-04** | Migration `20260804120000_blog.sql`: posts/post_versions/blog_themes/research_knowledgebase/media_assets/asset_tags/asset_tag_links recreated in huvi; anon CRUD policies only on posts/post_versions/research_knowledgebase (mirrors legacy un-authed /editor — tightening is a follow-up). Data copied live (29/57/3/173/135/11/149 rows) + 9 quyq `app_settings` rows into huvi's existing (empty) app_settings — table shared with the email app. `email-assets` (172 objects) + `chat-assets` (188) buckets copied, URLs rewritten quyq→huvi. Code: settings.ts switched to service-role client (app_settings is service-role-only in huvi) — commit bf78b76, auto-deployed READY. Verified: blog.dreamplaypianos.com + /blog + a post page 200 with huvi storage refs / 0 quyq refs; anon key reads posts/post_versions/research_kb 200, denied on subscribers (401). Newsletter/resolve-subscriber still delegates to email.dreamplaypianos.com (unchanged, fine). |
| content-production-system | vaulted.so | quyq (NEXT_PUBLIC_SUPABASE_URL) | ⚠ Unrelated product storing its data in the email DB (the "shared services DB" anti-pattern). Needs OWN Supabase project + data extraction from quyq |
| dreamplay-saas-platform / dreamplay-saas-web | (no custom domain) | tqhf incl. **direct DATABASE_URL** | Own tables likely live inside tqhf — needs own project + extraction if the SaaS is still wanted |

### Domain-less rollback/retired deployments (safe to ignore; die with the old projects)
dreamplay-pianos, dreamplay-analytics, dreamplay-email, dreamplay-email-2, dreamplay-website-3, dreamplay-media-indexer (verify no agent/API usage first — see Hermes note).

### Local-only repos referencing old refs (stale env files; clean up opportunistically)
dreamplay-assets, dreamplay-knowledge, google-ads-app, stitch-app, dreamplay-saas, dreamplay-media-indexer-2, dreamplay-website (v1), dreamplay-blog-testing, dreamplay-email-testing, crowdfunding-page-test, dreamplay-website-test, Openclaw-Bots (.env-media.local).

### Off-machine ⚠
- **Hermes VPS bots** (`New Version/Hermes-Bots/` snapshot): references to both refs in session logs + asset-indexer API docs. A VPS may still hit the media-indexer/API or DBs directly. Verify the VPS's live env before deletion.
- **dreamplay-composer** (composer.dreamplay.studio) uses the NEW dreamplay DB — fine, but note the shared-DB pattern is reappearing; consider giving it its own project if it grows.

## Decommission sequence (nothing executed yet)

1. Repoint/migrate the 5 live consumers (table above) — each is a small self-contained job.
2. Verify Hermes VPS + media-indexer no longer reference old refs.
3. Re-run `backup-project.mjs` for a final snapshot of both projects.
4. **PAUSE** both Supabase projects (reversible) — watch 2 weeks for breakage.
5. Delete projects after Lionel's final sign-off. Rotate the shared DB password (`sorenkier23` is reused across projects) and revoke old service keys by deletion.

## ✅ vaulted.so (content-production-system) repointed off quyq — 2026-08-04

Migrated to its own dedicated Supabase project `vxzfdekumhrudpykrmfo`.

- **Table attribution (by code evidence)**: the app reads/writes ONLY `public.projects` and `public.assets` (`lib/actions.ts`, `hooks/useProjects.ts`, `hooks/useAssets.ts`, `app/projects/[id]/page.tsx`, `ingest_worker.py`), plus Storage bucket `project-assets`. No auth usage (quyq auth.users had 0 rows anyway). It does NOT reference posts/post_versions/blog_themes (those are dreamplay-blog's), nor media_assets/asset_tags/asset_tag_links/asset_categories/asset_usage_logs, research_*, citation_logs, or ai_* — all left untouched in quyq.
  - Note: dreamplay-media-indexer-2 uses its own `asset_indexer` schema (`src/lib/db.ts` sets `db.schema='asset_indexer'`) — quyq's `public.assets` was unambiguously vaulted.so's (columns project_id/filename/file_type/wasabi_url/size_bytes match its code). quyq's `public.media_assets`/`asset_*` tables belong to an older media-indexer generation; still unowned by any live repo checked — verify before deleting.
- **What moved**: 5 projects rows + 4 assets rows (live PostgREST copy, matched the 2026-08-04 snapshot) + 3 unique storage objects (~1.2 MB) from quyq bucket `project-assets` → same-path bucket in vxz. `assets.wasabi_url` values rewritten quyq→vxz host. quyq untouched (reads only); vxz was empty beforehand (no public tables) — additive only.
- **Schema in vxz**: projects/assets DDL from schema.json incl. PK, FK (assets.project_id → projects ON DELETE CASCADE), defaults; RLS ENABLED with anon/authenticated SELECT-only policies (app reads via anon client, writes only via service-role server actions — an improvement over quyq where RLS was off).
- **Env/deploy**: Vercel project `content-production-system` env vars NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_KEY replaced with vxz values in production+preview+development; local repo `.env.local` updated; no code changes needed. Redeployed via `vercel redeploy` (build dpl_FUH7F7y2NvLPNVLRVoqpXLrQS8Zc), aliased to www.vaulted.so.
- **Live verification**: vaulted.so → HTTP 200; served JS bundle contains only the vxz URL (zero quyq references); anon REST read returns the 5 projects; write path exercised live via the `updateProjectStatus` server action (no-op status re-assert) → `{"success":true}`.
- quyq's `projects`/`assets` rows + `project-assets` bucket can be dropped whenever quyq is decommissioned; vaulted.so no longer depends on them.

## ✅ belgium-concert-landing-page repointed off tqhf + quyq — 2026-08-04

Consolidated the live belgium.musicalbasics.com app entirely onto its dedicated concerts Supabase project `szlagsmxgfsobizzxaog` ("szl") — the same project that already held its `concert_tickets` schema (ticket_orders / ticket_order_events / reviews) and the `public` emailer schema this repo's own `supabase/001-002` migrations created (only 3 test subscribers + 2 tag_definitions existed; `vip_livestream` schema untouched).

- **Where belgium analytics actually lived (attribution finding)**: the app's `/api/track` uses `@dreamplay/analytics` track-server with `business: "concert"`, which writes to schema **`concert_analytics.analytics_logs`** (NOT `dp_analytics_events`, and NOT `public.analytics_logs`). tqhf's `concert_analytics.analytics_logs` held **10,389 rows** (all `metadata.business='concert'`, hosts = belgium.musicalbasics.com + preview/localhost). ⚠ The 2026-08-04 tqhf backup snapshot only covered `public` + `auth` — the `concert_analytics` schema was NOT in the backup; this copy is the only rescue of that data. tqhf `public.analytics_logs` (58,499 rows) additionally contained **123** belgium-attributable rows (`metadata.host ilike '%belgium%'` or `business='concert'`, pre-schema-split tracker) — copied to `legacy_analytics_logs`; the remaining ~58k public rows are the old website's own traffic, not belgium's, and were left alone.
- **quyq email attribution finding**: `concert_marketing` workspace only had 3 subscribers + 1 draft campaign. The actual belgium concert sends went out via the **`musicalbasics` workspace**: 462 campaigns named *belgium*, plus the 41 "Campaign 2 wave" A/B campaigns the app's `/analytics/email-campaigns` dashboard hardcodes by UUID (concert-funnel warm-up sends). Copy set = campaigns matching `name/subject ~ belgium` ∪ `workspace=concert_marketing` ∪ `name ~ 'campaign 2'` → **503 campaigns**, their **37,685 sent_history** rows, **25,816 subscriber_events**, and the **9,134 subscribers** referenced by those sends/events/workspace ∪ any sid seen in belgium analytics metadata (621/674 analytics sids exist in quyq; all 621 copied — the other 53 no longer existed in quyq either).
- **What was created/copied in szl (all additive, ON CONFLICT DO NOTHING, ids preserved)**:
  - `concert_analytics` schema (canonical `@dreamplay/analytics` 001 migration: analytics_logs + ip_email_map + email_attributed_pageviews view + indexes + service_role grants), added to PostgREST exposed schemas. Seeded with the 10,389 tqhf rows so dashboards keep history; live writes land here now.
  - Live `public` tables (so PostgREST reads keep working with the hardcoded UUIDs): `subscribers` +9,134 (now 9,137), `campaigns` +503 (FK-bearing rotation/template columns nulled in live copy, originals kept in legacy), `sent_history` +37,685, `subscriber_events` +25,816 (mapped type→event_type, created_at→occurred_at; url backfilled onto 1,177 click rows).
  - Provenance-labeled archives (exact source shapes + `provenance` column): `legacy_subscribers` 9,134, `legacy_campaigns` 503, `legacy_sent_history` 37,685 (incl. round_id), `legacy_subscriber_events` 25,816 (incl. url), `legacy_analytics_logs` 123, `legacy_ads_belgium_agent_log` 843, `legacy_ads_belgium_campaign_state` 3, `legacy_ads_belgium_daily_performance` 10, `legacy_ads_belgium_ticket_sales` 9, `legacy_concert_requests` 11 (tqhf `ads.belgium_*` + `concerts.concert_requests`).
  - All copies verified count-exact vs source; final tqhf delta check clean (no new tqhf rows after initial copy; newest tqhf row confirmed present in szl by id).
- **Code changes** (belgium repo commit `30fc3f0`): PostgREST column aliases `type:event_type` / `created_at:occurred_at` in `src/lib/db/email-campaigns.ts` + `src/lib/attribution/attribute-order.ts`; new `supabase/006_subscriber_events_package_compat.sql` (applied to szl) adding additive `type`/`url` columns + sync trigger on `subscriber_events` — this also FIXES a pre-existing silent failure where `@dreamplay/emailer` open/click tracking inserts (legacy column names) never landed in szl — and widens `campaigns_status_check` to allow imported `cancelled` campaigns.
- **Env/deploy**: Vercel `belgium-concert-landing-page` production vars ANALYTICS_SUPABASE_URL, ANALYTICS_SUPABASE_SERVICE_ROLE_KEY, EMAIL_SUPABASE_URL, EMAIL_SUPABASE_SERVICE_KEY all → szl (URL + its secret key; key names left as the code reads them). TICKETS_* and NEXT_PUBLIC_SUPABASE_URL already pointed at szl. Deployed via git push → auto-deploy (dpl `belgium-concert-landing-page-enigb6aka`, READY; previous prod deploy was 53d old).
- **Live verification**: belgium.musicalbasics.com → 200; POST `/api/track` → `{"success":true}` and the row landed in szl `concert_analytics.analytics_logs` (0 copies in tqhf); `/api/analytics/sid-lookup` resolves a quyq-copied subscriber id from szl → 200 with email; `/api/analytics/stats` 200 with historical szl data; `/api/analytics/ab-stats` 200.
- tqhf `concert_analytics.*`, `ads.belgium_*`, `concerts.concert_requests` and quyq's belgium campaigns/sends/subscribers are now fully mirrored in szl; this app no longer references either legacy project.
