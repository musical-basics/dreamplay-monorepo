<!-- Mirror of db-backups/local-replica/README.md. Scripts in docs/plan/legacy-replica/.
     Rebuilding needs the backup tarballs, which are LOCAL ONLY. -->

# Local Postgres replicas of the retired Supabase DBs

Turns the frozen `.jsonl` backups back into **real, queryable Postgres databases** running
in Docker on this laptop. Use this when you need SQL (joins, aggregates, lookups) over the
old data — after the Supabase projects are deleted, this is the only way to query it.

Built and verified 2026-08-11: **every table matches the backup row counts exactly**
(tqhf 73,666 rows / 41 tables · quyq 158,904 rows / 41 tables).

## Start it

```bash
cd ~/Documents/DreamPlay\ Repos/db-backups/local-replica
open -a Docker            # if the daemon isn't running
docker compose up -d      # starts two postgres:16 containers
./load.sh                 # creates schema + loads all data (idempotent, ~1 min)
./verify.sh               # confirms every table matches the backup manifests
```

## Connect

| Database | Was | Connection |
|---|---|---|
| `tqhf` | old website + analytics | `postgresql://postgres:localonly@localhost:55432/tqhf` |
| `quyq` | old email (+ blog, vaulted.so, research) | `postgresql://postgres:localonly@localhost:55433/quyq` |

```bash
docker exec -it legacy-tqhf psql -U postgres -d tqhf     # shell into it
psql postgresql://postgres:localonly@localhost:55432/tqhf  # or from the host (needs psql)
```
Any GUI works too (TablePlus, DBeaver, Postico) — host `localhost`, the port above,
user `postgres`, password `localonly`.

## What you get

Real SQL over the full history, e.g.:
```sql
-- tqhf: crowdfunding pledges joined to customers and rewards
select c.email, r.title, p.amount, p.status
from cf_pledge p
join "Customer" c on c.id = p.customer_id
join cf_reward r on r.id = p.reward_id
order by p.amount desc;

-- quyq: a subscriber's full email history
select s.email,
       count(distinct h.campaign_id) as campaigns_received,
       count(e.id) filter (where e.type = 'open') as opens
from subscribers s
left join sent_history h on h.subscriber_id = s.id
left join subscriber_events e on e.subscriber_id = s.id
group by s.email order by opens desc;
```
Non-public schemas are preserved on tqhf: `ads`, `asset_indexer`, `concert_analytics`,
`concerts` (e.g. `select * from concert_analytics.analytics_logs limit 10;`).

## What is faithful, and what isn't

Preserved: all tables/columns/data, primary keys, unique constraints, indexes, enum types
(`workspace_type`, `chain_process_status`, `subscriber_events_type_enum`), jsonb, arrays,
and the non-public schemas.

Deliberately **not** reproduced:
- **Foreign keys** — this is an archival copy; some legacy rows reference parents that were
  already deleted, and FKs would block the load. Joins still work; referential integrity is
  simply not enforced.
- **RLS / policies / roles / grants** — you connect as superuser, so everything is visible.
  (Meaningless locally, and it would only get in the way.)
- **auth schema** — `auth.users.jsonl` / `auth.identities.jsonl` (71 accounts with bcrypt
  password hashes on tqhf) are in the backups but not loaded here. Load them manually if
  ever needed; they were already migrated to huv with passwords intact.
- **Storage objects** — files (images, email assets, thumbnails) were copied to the new
  Supabase projects during migration; they are not in these SQL replicas.
- Supabase extras (PostgREST API, dashboard, realtime). This is plain Postgres.

## Files

| File | Purpose |
|---|---|
| `docker-compose.yml` | the two Postgres containers + named volumes |
| `build-sql.mjs` | regenerates `out/` from the backup snapshots |
| `load.sh` | creates schema, truncates, loads, reports row totals |
| `verify.sh` | per-table comparison against the backup manifests |
| `out/<label>/01-schema.sql` | generated DDL |
| `out/<label>/02-data/*.tsv` | generated COPY data (140M total — regenerable, do not commit) |
| `out/<label>/03-load.sql` | `\copy` commands |

Regenerate from scratch (e.g. after a fresh snapshot):
```bash
node build-sql.mjs ../tqhfpcdqxylrknwbrqqi/2026-08-04-full tqhf
node build-sql.mjs ../quyqwdjygzalqqmrgkfk/2026-08-04 quyq
./load.sh && ./verify.sh
```

## Rebuilding this on another machine

The scripts are mirrored in git at `dreamplay-monorepo/docs/plan/legacy-replica/`, but they
need the **backup tarballs**, which live only on this laptop. To rebuild elsewhere: copy
the two authoritative archives (`tqhfpcdqxylrknwbrqqi-2026-08-04-full.tar.gz`,
`quyqwdjygzalqqmrgkfk-2026-08-04.tar.gz`, ~22MB), extract them next to the scripts, then run
`build-sql.mjs` → `docker compose up -d` → `./load.sh`.

## Gotchas found while building this (they will bite a naive restore)

These are fixed in `build-sql.mjs`; noted here because anyone hand-restoring the JSONL will
hit them:

1. **`"Customer"` is case-sensitive.** Legacy Supabase created a few tables with capitals.
   Unquoted SQL (`select * from Customer`) fails — always `select * from "Customer"`.
2. **Enum values appear late in the data.** Sampling the first N rows misses rare ones
   (`complaint` first appears at row ~6,247 of `subscriber_events`). Scan the whole column
   before creating the type, or the COPY dies mid-load.
3. **jsonb columns can hold JSON arrays.** `merch_generations.ref_image_paths`,
   `cf_campaign.key_features/media_gallery`, `chain_processes.history`,
   `mailchimp_templates.assets`, `send_logs.image_logs` are jsonb — they must be written as
   JSON, not as Postgres `{…}` array literals. Key the serializer on the declared column
   type, not the value's shape.
4. **quyq needs `uuid-ossp`** (some defaults call `uuid_generate_v4()`); tqhf only needs
   `pgcrypto`.
5. **`information_schema` hides ARRAY element types and enum names** — both must be
   inferred from the data / the column default.

## Housekeeping

- Data persists in Docker volumes (`tqhf-data`, `quyq-data`) across restarts.
- `docker compose down` stops them; `docker compose down -v` also **deletes the volumes**
  (harmless — `./load.sh` rebuilds from the backups).
- Same PII rules as the parent folder: real customer emails and subscriber data. Local only.
- These containers idle at near-zero CPU; stop them with `docker compose stop` if you like.
