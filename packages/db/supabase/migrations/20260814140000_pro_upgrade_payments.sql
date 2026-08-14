-- Pro upgrade payments.
--
-- The $200 upgrade is a SECOND Shopify order against an email that already
-- exists in `buyers`. The orders webhook upserts with ignoreDuplicates, so
-- that second order never touched the buyer row: product_line still said
-- "DreamPlay Piano Bundle" and price_paid_usd still showed the original
-- amount. The only in-app trace was pro_upgrade_requested, which records
-- INTENT, not payment, so six buyers who had paid on 2026-08-06 were
-- indistinguishable from someone who ticked the box and walked away.
--
-- This table is the record of payment. One row per paid upgrade order,
-- keyed on the Shopify order id so webhook retries and orders/create plus
-- orders/paid double-fires cannot double-insert.

create table if not exists public.pro_upgrade_payments (
    id uuid primary key default gen_random_uuid(),
    buyer_id uuid references public.buyers (id) on delete set null,
    -- Kept independently of buyer_id: an upgrade can arrive before the buyer
    -- row is reconciled, and email is what the webhook actually has.
    email citext not null,
    -- Shopify's numeric order id. UNIQUE = the idempotency guarantee.
    shopify_order_id text not null unique,
    -- Human-facing order number, e.g. "#1129".
    shopify_order_name text,
    amount_usd numeric(10, 2) not null,
    currency text not null default 'USD',
    -- "paid", "pending", "refunded" — mirrors Shopify's financial status so a
    -- refund can be reflected without deleting the row.
    financial_status text not null default 'paid',
    paid_at timestamptz not null default now(),
    -- Where it came from: 'webhook' for live orders, 'backfill' for the
    -- 2026-08-06 orders reconciled by hand after the fact.
    source text not null default 'webhook',
    raw jsonb,
    created_at timestamptz not null default now()
);

comment on table public.pro_upgrade_payments is
    'Paid $200 Pro upgrades. buyers.pro_upgrade_requested is intent; this is money received.';

create index if not exists pro_upgrade_payments_buyer_idx
    on public.pro_upgrade_payments (buyer_id);
create index if not exists pro_upgrade_payments_email_idx
    on public.pro_upgrade_payments (email);

-- Denormalised flag on buyers so every existing read path (admin lists, the
-- buyer portal, manufacturing counts) can tell a paid Pro from a requested
-- one without a join.
alter table public.buyers
    add column if not exists pro_upgrade_paid_at timestamptz;

comment on column public.buyers.pro_upgrade_paid_at is
    'When the $200 upgrade was paid. NULL = not paid. See pro_upgrade_payments.';
