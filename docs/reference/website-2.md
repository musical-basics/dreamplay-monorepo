# Legacy inventory: dreamplay-website-2 (2026-07-16)

Repo: `/Users/lionelyu/Documents/DreamPlay Repos/dreamplay-website-2` · GitHub `musical-basics/dreamplay-website-2` · Vercel project `dreamplay-pianos` → dreamplaypianos.com

## Stack
Next.js 16.0.10 (App Router), React 19.2.1, TS, pnpm, Tailwind 3.4 + Radix/shadcn (`src/components/ui`), Resend, Vercel AI SDK chatbot (Anthropic + Google), recharts, R2 via S3 SDK. Dev port 3002. Package still named `temp_next_app`. No vercel.json, no GitHub Actions, no .env.example, **no migrations system** — schema implicit in code + two scripts in `scripts/*.sql`.

## Supabase (project `tqhfpcdqxylrknwbrqqi`)
Clients: `src/lib/supabase/{server,client,middleware}.ts`; several routes create raw service-role clients directly.

Tables:
- **`buyer_emails`** — THE buyers allowlist to port. Columns seen: `email` (unique, lowercased/trimmed; `onConflict: "email"`), `notes` (e.g. "Name — auto-added from Shopify order #1234"), plus presumably id/created_at. Populated by (a) Shopify order webhook, (b) `scripts/buyer-emails-backfill-and-grants.sql` (includes `GRANT INSERT, UPDATE ... TO service_role` — must reproduce grants/RLS in new project). Gating: `isBuyer(email)` in `src/actions/reservation-actions.ts`; non-buyers redirected /my-reservation → /vip.
- **`reservation_decisions`** — `id, user_id, email, decision ('refund_requested'|'keep_reservation'|'upgrade_to_pro'), selected_at, order_metadata (jsonb), created_at, updated_at`. Saving fires Resend emails (team + buyer confirmation).
- `Customer` (newsletter, `api/subscribe`), `Waitlist` (`api/waitlist`), `analytics_logs` (local event log, `src/lib/analytics.ts`, uses ip-api.com geo), `chat_sessions`/`chat_messages`, `admin_variables` (admin-editable config), `ab_tests`/`ab_variants`/`ab_events` (website's own A/B framework, `src/actions/ab-actions.ts` + `api/track-ab` + `api/popup-ab`, own `ab_session_id` cookie).

**Auth:** buyers log in with Supabase auth (login/register/forgot/reset/activate pages). ⚠️ auth.users live in the old project — porting buyers requires migrating auth users (password hashes) or forcing password resets. See phase-6.

## Shopify
Store `dreamplay-pianos.myshopify.com`, storefront at shop.dreamplaypianos.com (middleware rewrite → internal `/shop`).
- **Storefront API** (`src/app/api/shopify/cart/route.ts`): `cartCreate` mutation, fallback `/cart/{variant}:{qty}` permalink. Version default 2025-01.
- **Admin API** (`src/lib/shopify/admin.ts`): custom app "DreamPlay Website Admin", client-credentials grant → cached short-lived token, GraphQL, needs `read_all_orders` (orders >60d). Version default 2025-10. Powers live order lookup on /my-reservation.
- **Webhook** `src/app/api/webhooks/shopify/orders/route.ts`: orders/create + orders/paid, HMAC via `src/lib/shopify/verify-webhook.ts`, upserts into `buyer_emails`.
- Scripts: `scripts/shopify-register-order-webhook.mjs`, `shopify-token-scopes.mjs`, `shopify-edit-order-variant.mjs`, `update-variant-map.mjs`. Docs: `scripts/READ-ALL-ORDERS-SETUP.md`, `scripts/AUTO-ALLOWLIST-SETUP.md`.
- Variant mapping: `src/config/shop.ts` + `src/app/(website-pages)/customize/variant-map.ts` (DS5.5/6.0/6.5 × finishes × One/Pro).
- Recent safety work (git log): refunds/cancellations gated behind human approval; order edits verified against currentQuantity.

## Key routes
`/my-reservation` (auth+buyer gated portal, `ReservationDecisionModule.tsx`), `/vip`, `/login|register|forgot-password|reset-password|activate`, `/checkout`, `/buy-product{,2,3}` → `/checkout-pages/...`, `/shop`, `/customize`, `/accessories`, `/dreamplay-pro`, marketing pages (`/intro-offer`, `/extended-offer`, `/premium-offer`, `/buyers-guide`, `/how-it-works`, `/faq`, `/our-story`, `/production-timeline`, …). API: auth/callback, shopify/cart, webhooks/shopify/orders, subscribe, waitlist, contact, chat*, track-ab, popup-ab.

## Cross-repo integration (to be replaced)
- `AnalyticsTracker.tsx` → POST `NEXT_PUBLIC_ANALYTICS_TRACK_URL` (data.dreamplaypianos.com/api/track).
- `EmailTracker.tsx` → email.dreamplaypianos.com/api/track + `/api/resolve-subscriber?sid&cid`; `dp_sid`/`dp_cid` cookies set by `src/middleware.ts` from URL params.
- Middleware also runs an A/B "Journey Engine" (`src/config/journeys.ts`).

## Env var names
NEXT_PUBLIC_POSTHOG_KEY/HOST, POSTHOG_PROJECT_ID, POSTHOG_PERSONAL_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, NEXT_PUBLIC_EMAIL_TRACK_URL, NEXT_PUBLIC_ANALYTICS_TRACK_URL, GOOGLE_GENERATIVE_AI_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, INTERNAL_API_SECRET, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_DOMAIN, SHOPIFY_WEBHOOK_SECRET, SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID/SECRET, SHOPIFY_ADMIN_CLIENT_ID/SECRET, SHOPIFY_API_VERSION. Referenced in code but absent from .env.local: SHOPIFY_STOREFRONT_API_VERSION, SHOPIFY_STOREFRONT_ACCESS_TOKEN (+ NEXT_PUBLIC_ variants), NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN.

## Watch-outs
- Reproduce `buyer_emails` service-role grants or webhook inserts fail with "permission denied".
- Hardcoded fallbacks: shop domain, API versions.
- PII committed at repo root (subscribers CSV) — do not carry over.
