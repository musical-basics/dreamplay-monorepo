# Shopify ops scripts

Ported from `dreamplay-website-2/scripts/` (Phase 2, Package F). All scripts run
with plain `node` from the monorepo root and read Shopify credentials from the
monorepo-root `.env.local` (falling back to `process.env`). Required vars are
listed in [`.env.example`](../../.env.example).

## Scripts

| Script | Purpose |
| --- | --- |
| `shopify-register-order-webhook.mjs` | Register `orders/create` + `orders/paid` webhooks pointing at `/api/webhooks/shopify/orders`. **Live-store registration happens at Phase 7 cutover only** (human-approved) — see [AUTO-ALLOWLIST-SETUP.md](./AUTO-ALLOWLIST-SETUP.md) and [docs/plan/phase-7-cutover.md](../../docs/plan/phase-7-cutover.md). |
| `shopify-token-scopes.mjs` | Print the Admin app token's current scopes and probe order visibility (confirms `read_all_orders` landed). |
| `shopify-edit-order-variant.mjs` | Swap a size variant on a customer's order via the Order Editing API. **Dry-run by default; writes only with `--commit`; customer notification only with `--notify`.** Verifies against `currentQuantity` / `currentTotalPriceSet` (the raw `quantity`/total are immutable originals and look doubled after an edit). See [READ-ALL-ORDERS-SETUP.md](./READ-ALL-ORDERS-SETUP.md). |
| `auto-capture-backup.mjs` | Backup payment capture (decision D15), run hourly by `.github/workflows/payment-capture-backup.yml`: captures on day 5 any clean authorization the primary Inngest sweep (D14) missed, hands flagged orders to a human, sends the 24h expiry warning, alerts on a stale primary heartbeat. **Dry-run by default; acts only with `--execute`.** Rules in `auto-capture-backup-rules.mjs`, parity-tested against the primary. |
| `update-variant-map.mjs` | Regenerate `apps/web/src/config/variant-map.ts` (tier × size × color → Shopify variant id) from a JSON blob; merges with existing values. |

## Safety / human-approval gating

- **Refunds and cancellations are never performed by these scripts.** The
  legacy repo additionally gates any Shopify refund/cancellation-looking command
  (`refundCreate`, `orderCancel`, `orderClose`, `refundLineItem`, REST
  `refunds.json` / `orders/<id>/cancel`, `shopify-refund*`/`shopify-cancel*`
  scripts) behind a Claude Code PreToolUse hook that forces a human approval
  prompt (`dreamplay-website-2/.claude/hooks/shopify-irreversible-guard.sh`).
  If such tooling is ever added here, port that hook first — do not weaken this.
- **Order edits** (`shopify-edit-order-variant.mjs`) keep the staged semantics:
  dry-run plan first, explicit `--commit` to write, `--notify` off by default.

## Legacy SQL scripts — NOT ported

`buyer-emails-backfill-and-grants.sql` and `remove-refunded-buyer-medlin.sql`
were intentionally not ported. Schema, grants, and the `buyers` table (renamed
from `buyer_emails`) are managed exclusively by migrations in
[`packages/db/supabase/migrations/`](../../packages/db/supabase/migrations/);
data backfill happens in the Phase 6 data migration. Keep the legacy repo as
the historical reference.
