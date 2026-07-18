# Phase 6 — data migration scripts

Idempotent, re-runnable scripts that port data from the two legacy Supabase
projects into the new monorepo project. Plain Node 22 (`node <script>`), no
dependencies — everything talks PostgREST/GoTrue over `fetch`.

## Credentials

Loaded automatically from three `.env.local` files (never committed, never
printed):

| Project | Path | Vars |
| --- | --- | --- |
| NEW (target) | monorepo root `.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| OLD website | `../dreamplay-website-2/.env.local` | same |
| OLD email | `../dreamplay-email-3/.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (or `..._ROLE_KEY`) |

Old projects are treated as **read-only**. Writes to the new project are
**additive upserts only** — nothing here deletes or truncates.

## Running

Every script defaults to **dry-run** (prints source counts and what would
happen). Pass `--execute` to write.

```bash
cd scripts/migrate
node run-all.mjs             # dry-run everything, in dependency order
node run-all.mjs --execute   # actually migrate
node verify.mjs              # full verification report (read-only)
```

Order (enforced by `run-all.mjs`):

1. `01-auth-users.mjs` — old website auth.users → new project (GoTrue admin
   API); builds `output/user-id-map.json` (old id → new id).
2. `02-buyers.mjs` — `buyer_emails` → `buyers` (source='backfill', order
   number parsed from "auto-added from Shopify order #N" notes).
3. `03-reservation-decisions.mjs` — 1:1 port, `user_id` remapped via the map
   from step 1 (target column is NOT NULL; a decision whose old auth user is
   gone gets a fresh auth user created from the decision's email).
4. `04-website-tables.mjs` — `Customer`→`customers`, `Waitlist`→`waitlist`,
   `admin_variables`→`admin_variables`.
5. `05-subscribers.mjs` — subscribers port + **suppressions compliance gate**
   (every legacy unsubscribed/bounced email lands in `suppressions`,
   reason=`unsubscribe`/`bounce`, source=`legacy-migration`). Legacy allowed
   one row per (email, workspace); the new schema has a global unique email,
   so cross-workspace duplicates are merged (most-restrictive status wins,
   tags unioned, dreamplay workspaces preferred).
6. `06-email-content.mjs` — `tag_definitions`, `merge_tags`, `rotations`,
   `campaigns` (templates **plus** the historical children referenced by
   `sent_history`, since `sent_history.campaign_id` is a NOT NULL FK), and
   `sent_history` (subscriber ids remapped by email to the merged rows).

ID decision: the legacy email project already uses uuid PKs, so legacy ids are
inserted directly (no id maps needed) — which also keeps
`rotations.campaign_ids` valid. Only auth users get an id map, because GoTrue
assigns fresh ids on create.

## Delta re-sync before cutover (phase-6 task 8)

The legacy apps stay live until DNS cutover, so rows keep arriving in the old
projects. Because every step upserts on a stable key (email / uuid id / key),
**re-running `node run-all.mjs --execute` at cutover time re-syncs the delta**
— new rows are inserted, changed rows are updated, nothing is deleted.
Run `node verify.mjs` afterwards; the migration timestamps of every run are
appended to `output/migration-log.json` (`last_run_at` = most recent).

Caveat: rows *deleted* in the old projects after a run are not deleted in the
new one (by design — this pipeline never deletes).

## Auth passwords — IMPORTANT caveat

The GoTrue admin API **cannot export password hashes**, so `01-auth-users.mjs`
creates users **without a password** (`email_confirm: true`, user_metadata
preserved). Two paths to restore login:

1. **Forgot-password reset** — works immediately: users are email-confirmed,
   so "Forgot password" on the new site just works.
2. **Import the bcrypt hashes before cutover** — `import-password-hashes.mjs`
   is ready; it copies `auth.users.encrypted_password` old → new (remapping
   ids via `output/user-id-map.json`), only for users who haven't already set
   a new password. It needs direct Postgres access:

   ```bash
   OLD_DB_URL='postgresql://...' NEW_DB_URL='postgresql://...' \
     node import-password-hashes.mjs            # dry-run
   OLD_DB_URL='...' NEW_DB_URL='...' node import-password-hashes.mjs --execute
   ```

   Both connection strings come from the Supabase dashboard → Project
   Settings → Database → Connection string (Lionel provides the old
   project's; hashes are never printed or written to disk).

## Outputs (`output/`, gitignored)

- `user-id-map.json` — old→new auth user ids (needed by steps 3 and hash import)
- `user-migration-status.json` — per-user create/skip/fail status
- `*-summary.json` — per-step counts, skips, merges
- `migration-log.json` — timestamped log of every executed step
- `verification-report.json` — full old-vs-new counts + spot checks + the
  compliance assertion result

## Intentionally not migrated

- `analytics_logs` history (per phase-6 task 6 recommendation: fresh start;
  the old dashboard stays readable until the old project is deleted).
- `subscriber_events` (opens/clicks history; superseded by `email_events`).
- Legacy campaigns that are neither templates nor referenced by
  `sent_history` (~250 rows: deleted/expired drafts with no send history).
- Legacy subscriber columns with no target: `location_city`,
  `location_country`, `ip_address`, `gdpr_consent`, `consent_timestamp`;
  `Customer.shopifyCustomerId`; `sent_history.round_id/variant_sent/
  merge_tag_log`; `tag_definitions.is_starred`. All still queryable in the old
  projects until deletion.
