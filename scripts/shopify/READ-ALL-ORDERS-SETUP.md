# Accessing orders older than 60 days (`read_all_orders`)

Goal: let the DreamPlay Website Admin app **read and edit orders older than 60
days** via the Admin API, so support fixes like "change my reservation from
DS6.0 to DS5.5" can be done by script instead of only in the Shopify UI.

## Why this is needed

By default the Admin API can only see orders from the **last ~60 days**. Anything
older returns empty — even when the customer record shows the order exists.

Verified 2026-06-28 against `dreamplay-pianos.myshopify.com`:

- Token scopes today: `read_customers, write_orders, write_products, write_publications`.
  `read_all_orders` (added 2026-06-28) lets the API *see* old orders.
- Oldest order the API can see: **#1107 (2026-04-30)**; only **11** orders visible total.
- Customer **Junko Takei** (`junklavier257@gmail.com`, `gid://shopify/Customer/9751922344250`)
  shows `numberOfOrders: 1`, but the order is **invisible** to every query (by
  email, `customer_id`, and the customer's `orders` connection) because it
  predates the 60-day window.

So the blocker is **not** credentials or `write_orders` — it is the missing
`read_all_orders` protected scope.

## App being modified

- **App:** "DreamPlay Website Admin" (client id `7b6a1362…`) on
  `dreamplay-pianos.myshopify.com`. Managed via dev.shopify.com / Partner Dashboard.
  (NOT the "Email Engine" app `5b955b92…`, which only has price-rule scopes.)
- Env vars live in the **monorepo-root `.env.local`** (see
  [`.env.example`](../../.env.example)): `SHOPIFY_ADMIN_CLIENT_ID` /
  `SHOPIFY_ADMIN_CLIENT_SECRET`, `SHOPIFY_STORE_DOMAIN=dreamplay-pianos.myshopify.com`,
  `SHOPIFY_API_VERSION=2025-10`.

## Steps to enable `read_all_orders`

`read_all_orders` is a **protected scope** — Shopify must approve the request
before it can be added. It also depends on the app's **Protected Customer Data
Access** being approved (orders carry PII).

1. **Protected Customer Data Access (prerequisite).**
   Partner Dashboard → the app → **API access** → **Protected customer data
   access** → request/confirm access. Orders include customer PII, so this must
   be granted before (or alongside) `read_all_orders`. Provide the data-handling
   justification (customer support / order management for a single owned store).

2. **Request `read_all_orders`.**
   Same **API access** page → find **`read_all_orders`** under the orders
   permissions → **Request access** and submit the justification ("correct
   reservation line items / customer-support order edits on orders older than 60
   days, single owned store"). Custom single-store requests are usually approved
   quickly.

3. **Add the scope to the app config.**
   Once approved, add `read_all_orders` to the app's requested scopes alongside
   the existing ones (in `shopify.app.toml` `scopes`, or the dashboard
   configuration).

   ⚠️ **Also add `write_order_edits`** if you want to *edit* line items by script
   (e.g. swap DS5.5 → DS6.0 via `shopify-edit-order-variant.mjs`). `write_orders`
   alone is NOT enough — the Order Editing API (`orderEditBegin`) requires the
   separate `write_order_edits` scope. Unlike `read_all_orders`, it is a
   **standard scope** (no Shopify approval needed) — just add it and reinstall.

4. **Reinstall / re-consent on the store.**
   Managed-install tokens only carry the scopes consented **at install time**, so
   a version/config bump alone is not enough. **Uninstall and reinstall** the
   "DreamPlay Website Admin" app on `dreamplay-pianos.myshopify.com` (or run the
   managed-install/re-auth flow) so the token picks up the new scopes.

   Note: in practice (verified on the 2026-06-28 `read_all_orders` reinstall) the
   app **client secret did NOT change**, so `.env.local` / `SHOPIFY_WEBHOOK_SECRET`
   needed no update. If a reinstall ever does rotate the secret, update
   `SHOPIFY_WEBHOOK_SECRET` in Vercel and re-register the order webhooks — see
   [`AUTO-ALLOWLIST-SETUP.md`](./AUTO-ALLOWLIST-SETUP.md).

5. **Verify the scope landed.**
   ```
   node scripts/shopify/shopify-token-scopes.mjs
   ```
   Expect `read_all_orders` in the printed scope list, and the order count probe
   to return more than the ~11 recent orders.

## After the scope is granted: order edits by script

Run the staged edit script (it looks up the order, swaps the FROM line item for
the matching TO variant, and commits). It prints a **dry-run plan first** and
only writes when run with `--commit`:

```
# 1. Dry run — shows current line items + planned swap, writes nothing:
node scripts/shopify/shopify-edit-order-variant.mjs \
  --email junklavier257@gmail.com --from DS6.0 --to DS5.5

# 2. Apply once the plan looks right:
node scripts/shopify/shopify-edit-order-variant.mjs \
  --email junklavier257@gmail.com --from DS6.0 --to DS5.5 --commit
```

The script uses the Order Editing API (`orderEditBegin` → `orderEditSetQuantity`
to zero the old line → `orderEditAddVariant` for DS5.5 → `orderEditCommit`).
Reservation DS5.5 and DS6.0 are the same price, so no balance change is expected
— the dry run will surface any price delta before you commit.
