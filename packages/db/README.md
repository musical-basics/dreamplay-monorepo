# @dreamplay/db

Single source of truth for the DreamPlay Supabase schema (migrations), the
generated-shape `Database` TypeScript types, and the typed Supabase client
factories used by every app in the monorepo.

## Layout

```
packages/db/
  supabase/migrations/   SQL migrations (sortable timestamp prefixes; applied in order)
    20260716000100_commerce.sql             buyers, reservation_decisions, customers,
                                            waitlist, admin_variables, settings, citext
    20260716000200_email.sql                subscribers, campaigns, rotations, sent_history,
                                            email_events, suppressions, send_logs, tag_definitions,
                                            merge_tags, email_chains, chain_processes,
                                            email_triggers, app_settings
    20260716000300_analytics.sql            events, experiments, ip_email_map,
                                            chat_sessions, chat_messages
    20260716000400_rls.sql                  RLS deny-by-default + grants + policies
    20260716000500_analytics_functions.sql  get_analytics_summary, get_setting_text_array
  src/
    types.ts             Hand-authored Database interface (supabase gen types shape)
    client.ts            createBrowserClient()  — anon key, browser/client components
    server.ts            createServerClient(cookies) — anon key + auth cookies (SSR)
    admin.ts             createAdminClient()    — service role, bypasses RLS, server only
```

## Env vars

| Variable | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | Project URL (`https://<ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | Public anon key; safe to expose, gated by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Secret; bypasses RLS. Never `NEXT_PUBLIC_` |

All three are listed in the root `.env.example`; copy real values into
`apps/web/.env.local` and the Vercel project env.

## Applying migrations

Schema changes happen ONLY via files in `supabase/migrations/` (see root
CLAUDE.md). Two ways to apply them:

### A. Supabase CLI (preferred, once installed)

```sh
cd packages/db
supabase init                 # first time only; creates supabase/config.toml
supabase link --project-ref <ref>   # needs SUPABASE_ACCESS_TOKEN
supabase db push              # applies pending files from supabase/migrations/
supabase migration list       # verify local files == remote history
```

New migration: `supabase migration new <name>` (keeps the timestamp-prefix
convention), then write SQL into the generated file.

### B. SQL editor (fallback, no CLI)

Open the Supabase dashboard > SQL editor and run each file's contents **in
filename order** (000100 → 000200 → 000300 → 000400 → 000500). Every file is
idempotent-ish (`create table if not exists`, `create or replace function`),
but policies/constraints will error if re-run — run each file once. Record
what you ran; when CLI access exists, `supabase migration repair` can align
the remote history with these files.

## Regenerating types

`src/types.ts` is currently hand-authored to match the migrations. Once CLI
access exists, replace it with generated output:

```sh
cd packages/db
supabase gen types typescript --linked > src/types.ts    # remote
supabase gen types typescript --local  > src/types.ts    # local stack
```

Then re-add the convenience aliases at the bottom of the file
(`Tables<...>`, `TablesInsert<...>`, `TablesUpdate<...>`, and the
CHECK-constraint unions) or move them to a separate file, and run
`pnpm typecheck && pnpm test` — the test suite cross-checks table names
between the migrations and `types.ts`.

## Local dev (once Docker + CLI exist)

```sh
cd packages/db
supabase start        # local Postgres + Studio + auth via Docker
supabase db reset     # drops + re-applies every migration from scratch (the
                      # Phase 1 acceptance check)
supabase status       # prints local URL + anon/service keys for .env.local
supabase stop
```

Point `apps/web/.env.local` at the local URLs/keys from `supabase status`
while developing.

## Using the clients

```ts
import { createAdminClient, createBrowserClient, createServerClient } from "@dreamplay/db";

// Server-only (webhooks, cron, scripts) — bypasses RLS:
const admin = createAdminClient();
await admin.from("buyers").upsert({ email: "x@y.com", source: "shopify_webhook" });

// Client components:
const supabase = createBrowserClient();

// Server components / route handlers (Next.js App Router) — this package does
// not import next/headers; pass a cookie adapter:
import { cookies } from "next/headers";
const cookieStore = await cookies();
const supa = createServerClient({
  getAll: () => cookieStore.getAll(),
  setAll: (cookiesToSet) => {
    try {
      cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
    } catch {
      // cookies().set throws inside server components; session refresh is
      // middleware's job there.
    }
  },
});
```

Factories throw a descriptive error naming the missing env var if config is
absent.

## Security model (from `20260716000400_rls.sql`)

- RLS enabled on every table; anon/authenticated table privileges revoked, so
  access is deny-by-default even if a permissive policy sneaks in elsewhere.
- The service role has full access (all server code uses `createAdminClient`).
- Exception: `authenticated` may `select` their own `reservation_decisions`
  rows (`user_id = auth.uid()`).
- `buyers` is only readable through the service role.
- `get_analytics_summary` is executable by the service role only; admin/bot IP
  exclusion lists live in the `settings` table (`admin_ips`, `bot_ips`).
