<!-- Mirror of db-backups/CLAUDE.md — how an agent should access live DBs vs the
     archived backups. The archives live only on Lionel's laptop. -->

# Working with these backups (AI instructions)

This folder holds **archival snapshots** of two retired Supabase projects. Read
`README.md` first — it catalogs every table, its columns, and where each one's data went.

## ⚠ Before you read any file

Several `.jsonl` files are huge and will blow your context if read whole:

| File | Size |
|---|---|
| `quyqwdjygzalqqmrgkfk/2026-08-04/public.sent_history.jsonl` | 49M |
| `quyqwdjygzalqqmrgkfk/2026-08-04/public.campaigns.jsonl` | 30M |
| `tqhfpcdqxylrknwbrqqi/*/public.analytics_logs.jsonl` | 25M each |
| `quyqwdjygzalqqmrgkfk/2026-08-04/public.subscriber_events.jsonl` | 22M |

**Never `Read` or `cat` a data file.** Use `grep`, `head`, `wc -l`, or streaming python —
pipe and filter. (`jq` is **not installed** on this machine; the examples below use
`python3`, which is. All of them are tested and work as written.)

## Are you sure you want the backup?

If the data you need is in a **live** database, query that instead — it is current, and
these snapshots are frozen at 2026-08-04:

| Need | Project | How |
|---|---|---|
| DreamPlay site/email/analytics, blog, crowdfunding, media-indexer | `huviqtkjkdkcfneorrmo` | keys in `dreamplay-monorepo/.env.local` |
| MusicalBasics email/analytics | `oiytqgnvbmmquanfljrg` | keys in `musicalbasics-monorepo/.env.local` |
| Belgium concert + ads + concert tickets | `szlagsmxgfsobizzxaog` | ask Lionel for the PAT/keys |
| vaulted.so | `vxzfdekumhrudpykrmfo` | ask Lionel for the PAT/keys |

Live access is **HTTPS only** — Postgres ports 5432/6543 are blocked on Lionel's networks.
- Data: `GET https://<ref>.supabase.co/rest/v1/<table>?select=*` with headers
  `apikey: <service key>` + `Authorization: Bearer <service key>`.
  Non-public schema: add `Accept-Profile: <schema>` (reads) / `Content-Profile:` (writes).
- Arbitrary SQL: `POST https://api.supabase.com/v1/projects/<ref>/database/query`
  with `Authorization: Bearer <PAT>` and `{"query": "..."}`.
- Use **node fetch**, not python urllib — Cloudflare 403s urllib on api.supabase.com.

## Reading the backups

No extraction needed if the folders are already unpacked (they are —
`tqhfpcdqxylrknwbrqqi/` and `quyqwdjygzalqqmrgkfk/`). The `.tar.gz` files are the
portable copies; extract one only if a folder is missing:

```bash
tar xzf tqhfpcdqxylrknwbrqqi-2026-08-04-full.tar.gz
```

Which snapshot to use (details in README.md):
- tqhf → `tqhfpcdqxylrknwbrqqi/2026-08-04-full/` (**not** `-final`, which truncated one table)
- quyq → `quyqwdjygzalqqmrgkfk/2026-08-04/` (its `-full` has schema only, no rows)

Format: one JSON object per line, one file per table, named `<schema>.<table>.jsonl`.
Plus `schema.json` (columns/constraints/indexes/functions) and `manifest.json` (row counts).

```bash
# what tables exist + row counts — START HERE, it's small
python3 -c "
import json
m = json.load(open('tqhfpcdqxylrknwbrqqi/2026-08-04-full/manifest.json'))['tables']
for k, v in sorted(m.items(), key=lambda x: -x[1] if isinstance(x[1], int) else 0):
    print(f'{v:>7}  {k}')"

# structure of one table (column names)
head -1 quyqwdjygzalqqmrgkfk/2026-08-04/public.subscribers.jsonl |
  python3 -c "import json,sys; print(', '.join(json.load(sys.stdin).keys()))"

# find specific records (grep is fine — one JSON object per line)
grep -i 'someone@example.com' quyqwdjygzalqqmrgkfk/2026-08-04/public.subscribers.jsonl

# aggregate without loading the file into context (streams line by line)
python3 -c "
import json, collections
c = collections.Counter()
for line in open('quyqwdjygzalqqmrgkfk/2026-08-04/public.subscribers.jsonl'):
    c[json.loads(line).get('status')] += 1
print(c.most_common())"
# -> [('active', 14021), ('unsubscribed', 928), ('bounced', 466), ('inactive', 108), ('deleted', 6)]
```

For relational work, load into scratch Postgres/DuckDB — see the "How to restore" section
of README.md, and the working `json_populate_recordset` examples in
`dreamplay-monorepo/scripts/migrate/` and `musicalbasics-monorepo/scripts/migrate/`.

Column names here are the **legacy** ones; several were renamed during migration
(`Customer`→`customers`, `buyer_emails`→`buyers`, `Waitlist`→`waitlist`, …). README.md's
catalog maps each table to its destination.

## Rules

- **Read-only.** Never modify or delete anything in this folder — these are the only copies
  of the pre-consolidation history, and they are single-copy on this laptop.
- **PII.** Contains customer/subscriber emails and bcrypt password hashes. Never commit,
  never upload, never paste contents into anything external.
- Keep `README.md` accurate if you add a snapshot (`backup-project.mjs` re-runs one).
