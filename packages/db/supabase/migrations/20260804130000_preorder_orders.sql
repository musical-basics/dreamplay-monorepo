-- preorder_orders: historical Shopify-CSV preorder/reservation import ledger,
-- rescued from the legacy website project (tqhfpcdqxylrknwbrqqi) ahead of its
-- decommission. Website-domain data; no live app writes it today (the legacy
-- crowdfunding app was confirmed not to reference it). Service-role only.

create table if not exists public.preorder_orders (
  id uuid primary key default gen_random_uuid(),
  order_name text not null,
  raw_shopify_id text,
  import_batch_id text not null,
  source text not null default 'shopify-csv',
  email text not null,
  customer_name text,
  created_at timestamptz not null,
  financial_status text,
  fulfillment_status text,
  total_paid_usd numeric,
  payment_type text not null,
  is_reservation boolean not null default false,
  lineitem_name text,
  product_line text,
  size_variant text,
  finish text,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_name, import_batch_id)
);

alter table public.preorder_orders enable row level security;
revoke all on public.preorder_orders from anon, authenticated;
grant all on public.preorder_orders to service_role;
