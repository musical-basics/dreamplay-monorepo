# Legacy inventory: dreamplay-email-3 (2026-07-16)

Repo: `/Users/lionelyu/Documents/DreamPlay Repos/dreamplay-email-3` · Vercel, dev port 3002. Agent-driven bulk/campaign sender for MusicalBasics / DreamPlay / Belgium-concert. **Open/click/unsubscribe tracking lives in a separate deployed repo `dreamplay-email-2` at email.dreamplaypianos.com** (not in the working set).

## Stack
Next.js 16.0.10, React 19, TS. **Resend** (single account, throttled to 5 req/s — a 429 killed ~26% of a 400-send on 2026-05-09). **Inngest** (`app/api/inngest/route.ts`, `src/inngest/client.ts`). Supabase project `quyqwdjygzalqqmrgkfk` (`src/lib/supabase.ts`, service role). Anthropic + Gemini copilot (`src/ai/copilot.ts`). sharp, zod.

## Send pipeline
Flow: gitignored `_work/schedule-*.ts` scripts or send-wave SDK → `POST /api/agent/{workspace}/campaigns/{id}/send` → Inngest event → Inngest fn → `POST /api/send-stream` → Resend + `sent_history` insert per recipient.

- Agent API: `src/agent/handler.ts` (campaigns/subscribers/tags/chains/rotations/merge-tags/triggers/copilot), route `app/api/agent/[workspace]/[...path]/route.ts`, schemas `src/agent/schemas.ts`, auth `AGENT_API_KEY` (`src/lib/http.ts`). Blocks empty-audience sends (UNSAFE_SEND_BLOCKED), requires `confirmTargetTag` for broad tag sends.
- Core loop: `app/api/send-stream/route.ts` (maxDuration 300) — render template, preheader + unsubscribe footer injection, image proxy/optimize, merge tags, link rewrite with sid/cid, open pixel, Resend send, `sent_history` write. 200ms/recipient throttle.
- Inngest fns (`src/inngest/functions/`): agent-send, agent-scheduled-send (sleep-until + cancellation recheck), agent-rotation-send, agent-rotation-scheduled-send. All four share concurrency lock `{key: "'global-send-lock'", limit: 1, scope: "account"}`.
- Rotation round-robin A/B: `app/api/send-rotation/route.ts` (child campaigns from cursor).
- Send-wave SDK: `src/lib/send-wave/` (scheduler, chunker, ensure-pool, idempotency, guards, api-client, env) — clones parent template, patches, verifies round-trip, schedules waves.

**Idempotency layers (post-incident):** (1) send-stream pre-queries `sent_history` and skips already-sent; (2) unique constraint `(campaign_id, subscriber_id)` — `docs/migrations/2026-05-12-sent-history-unique.sql`; (3) rotation `sendKey` reuses child campaigns on retry; (4) `done-*` tags on subscribers.

## DB tables
`campaigns` (templates + child sends: is_template, parent_template_id, rotation_id, variable_values JSON with subscriber_ids/target_tag/from_*/merge_defaults/send_key, status, scheduled_status, totals, resend_email_id), `subscribers` (status active/unsubscribed/bounced/inactive/deleted, tags[], smart_tags, geo, workspace), `sent_history` (idempotency ledger), `subscriber_events` (opens/clicks — populated by dp-email-2), `send_logs`, `rotations`, `tag_definitions`, `merge_tags`, `email_chains` + `chain_processes`, `email_triggers`, `app_settings`. **No suppressions table** — suppression via subscribers.status + tags only. Migrations applied manually via SQL editor (`docs/migrations/*.sql`; presence ≠ applied).

## Templates & deliverability
Raw HTML strings in `campaigns.html_content` (editor at `app/editor/page.tsx`); no React Email/MJML. Rendering `src/lib/render-template.ts` ({{var}}, {{#if tag_X}}), merge tags `src/lib/merge-tags.ts`, preheader, image proxy.
Sending domains → tracking hosts: musicalbasics.com→link.musicalbasics.com; ultimatepianist.com→link.ultimatepianist.com; dreamplaypianos.com→email.dreamplaypianos.com. Default From: `DreamPlay <hello@email.dreamplaypianos.com>`. List-Unsubscribe + One-Click headers; unsubscribe handler lives in dp-email-2. Click `redirect` mode collapses Gmail opens — default `append`. No warmup engine; manual staggered waves.

## Known failures / pain points (why it "hasn't been working")
1. **Double-send incident** `docs/INCIDENT-2026-05-12-gmail-double-send.md` — Inngest retry hit non-idempotent loop; 250 Gmail users got duplicates. Fixes now appear in main but the incident doc says "not yet merged" — deployment state was uncertain.
2. **Agent API intermittent 500s** — `src/lib/send-wave/api-client.ts` has NO retry-on-5xx; a single 500 aborts a whole send (OPQ send died at wave 11; `docs/SESSION-HANDOFF-2026-06-04.md`).
3. **Done-marker race** (`docs/planned_changes.md`) — recipients tagged `done-*` after scheduling but before send fires; failed sends wrongly excluded from retries. Fix planned, never implemented.
4. **No bounce/complaint webhook** despite RESEND_WEBHOOK_SECRET existing; suppression manual.
5. **Zero email-attributed conversions** across ~8,449 concert recipients — `ticket_orders` table referenced by `src/lib/db/tickets.ts` doesn't exist; funnel breaks at Shopify checkout.
6. Hand-run gitignored `_work/*.ts` scripts operate everything; mandatory manual `send-safety-auditor` review before any ≥50-recipient send.
7. Copy-paste drift from dp-email-2 (comments referencing nonexistent files); PII CSVs committed at repo root.

## Env var names
NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY (fallback SUPABASE_SERVICE_ROLE_KEY), AGENT_API_KEY, INTERNAL_API_SECRET, RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_WEBHOOK_SECRET, INNGEST_EVENT_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, TRACKING_BASE_URL, DREAMPLAY_EMAIL_BASE_URL, SHOPIFY_* (peripheral), NEXT_PUBLIC_KNOWLEDGE_API_URL.
