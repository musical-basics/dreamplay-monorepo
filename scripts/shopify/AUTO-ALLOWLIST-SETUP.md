# Auto-allowlist: new Shopify orders → buyers

Goal: every new DreamPlay order automatically adds the buyer's email to the
`buyers` allowlist (legacy table name: `buyer_emails`), which gates the
`/my-reservation` buyer portal. No more manual CSV imports. In the monorepo the
same webhook ALSO logs a `purchase` analytics event into `events`.

## ⚠️ MONOREPO STATUS: webhook registration happens at Phase 7 cutover

The legacy setup is LIVE on `dreamplay-website-2` (activated 2026-06-17) and
keeps receiving production orders until cutover. **Do NOT register the
monorepo's webhook URL against the live store before Phase 7** — per
[docs/plan/phase-7-cutover.md](../../docs/plan/phase-7-cutover.md) (step 1,
HUMAN-approved): register orders/create + orders/paid against the monorepo prod
URL, run BOTH old + new in parallel for a day (both upsert buyers idempotently
in their own DBs), verify the new endpoint receives orders, then delete the
legacy webhook subscriptions.

## Legacy production record (2026-06-17, dreamplay-website-2)

- **App:** "DreamPlay Website Admin" (client id `7b6a1362…`) on
  `dreamplay-pianos.myshopify.com`, scopes include `read_orders` + `read_customers`.
  (NOT the "Email Engine" app `5b955b92…`, which only has price-rule scopes.)
- **Webhooks registered:** `ORDERS_CREATE` (`gid://shopify/WebhookSubscription/2008667488570`)
  and `ORDERS_PAID` (`…2008667521338`) → `https://www.dreamplaypianos.com/api/webhooks/shopify/orders`.
- **`SHOPIFY_WEBHOOK_SECRET`** set in Vercel (legacy project `dreamplay-pianos`) = the
  DreamPlay Website Admin app client secret, which signs app-registered webhooks.
- **DB:** backfill + `service_role` INSERT/UPDATE grant applied; `buyer_emails` = 76 rows.
- **Verified end-to-end:** a signed probe payload returned 200 and inserted the row.

## What's built (in this monorepo)

- **Webhook handler:** [`apps/web/src/app/api/webhooks/shopify/orders/route.ts`](../../apps/web/src/app/api/webhooks/shopify/orders/route.ts)
  HMAC-verifies the request, extracts the buyer email, idempotently upserts it
  into `buyers` (source `shopify_webhook` + `shopify_order_number`), and emits a
  deduped `purchase` event into `events` (checkout_source parsed from the order
  note). Handles `orders/create` and `orders/paid`.
- **HMAC verifier:** [`apps/web/src/lib/shopify/verify-webhook.ts`](../../apps/web/src/lib/shopify/verify-webhook.ts)
- **DB schema/grants:** managed by migrations in `packages/db/supabase/migrations/`
  (the legacy `buyer-emails-backfill-and-grants.sql` is superseded — see
  [README.md](./README.md)).
- **Webhook registration script:** [`shopify-register-order-webhook.mjs`](./shopify-register-order-webhook.mjs)

## Activation steps (Phase 7 — manual, require Shopify admin access + human approval)

1. **DB:** nothing to run by hand — `buyers` and its service-role access come
   from `packages/db/supabase/migrations/`; buyer data arrives via the Phase 6
   data migration/backfill.

2. **Confirm the app scopes.** The "DreamPlay Website Admin" app already has
   `read_orders` (+ `read_customers`). If setting up a NEW store/app: add
   `read_orders` on dev.shopify.com, then **uninstall and reinstall** the app on
   the store — managed-install tokens only carry the scopes consented at install
   time, so a version bump alone is not enough.

3. **Set env vars** on the monorepo's Vercel project (all listed in
   [`.env.example`](../../.env.example)):
   - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `SHOPIFY_WEBHOOK_SECRET` = the DreamPlay app client secret (`shpss_…`) if
     registering via the API/this script, OR the store webhook secret shown in
     Settings → Notifications if registering in the admin UI. It must match the
     registration method.

4. **Register the webhooks** (Phase 7 step 1, human-approved):
   ```
   SHOPIFY_STORE_DOMAIN=dreamplay-pianos.myshopify.com \
   SHOPIFY_CLIENT_ID=… SHOPIFY_CLIENT_SECRET=… \
   WEBHOOK_URL=https://www.dreamplaypianos.com/api/webhooks/shopify/orders \
   node scripts/shopify/shopify-register-order-webhook.mjs
   ```
   (Alternatively, register in Shopify admin → Settings → Notifications → Webhooks:
   "Order creation" + "Order payment", JSON, same URL — then set
   `SHOPIFY_WEBHOOK_SECRET` to the secret shown on that page.)

5. **Test:** place a test order (or use Shopify's "Send test notification"),
   confirm a 200 from the endpoint, a new row in `buyers`, and a `purchase` row
   in `events`. Then run old + new in parallel for a day before deleting the
   legacy subscriptions.

## Note on which store

DreamPlay orders are on `dreamplay-pianos.myshopify.com`. The separate
`musicalbasics.myshopify.com` store (used by the Belgium concert work) has its
own legacy app/token and does **not** contain DreamPlay products — don't reuse
that token here.
