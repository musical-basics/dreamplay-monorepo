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
| crowdfunding-page | reserve./crowdfund.dreamplaypianos.com | tqhf (NEXT_PUBLIC_SUPABASE_URL) | DreamPlay-brand; likely waitlist/customer/auth writes — repoint to huvi (schema exists) or absorb into monorepo |
| belgium-concert-landing-page | belgium.musicalbasics.com | tqhf (ANALYTICS_SUPABASE_URL) + quyq (EMAIL_SUPABASE_URL) | MusicalBasics-brand; repoint analytics to MB monorepo /api/track + subscriber resolution to MB app |
| dreamplay-blog | blog.dreamplaypianos.com | quyq (NEXT_PUBLIC_SUPABASE_URL) | Newsletter/resolve-subscriber usage — repoint to dreamplay monorepo endpoints |
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
