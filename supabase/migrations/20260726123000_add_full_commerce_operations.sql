-- Production-safe commerce operations extension.
-- Applied to project mwytgddqtpnpucsspvzo.
alter table public.order_items add column if not exists selected_size text;
alter table public.orders add column if not exists discount_code text;
alter table public.orders add column if not exists discount_total numeric(10,2) not null default 0 check (discount_total >= 0);
alter table public.orders add column if not exists shipping_total numeric(10,2) not null default 0 check (shipping_total >= 0);
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists tracking_url text;
alter table public.orders add column if not exists carrier text;

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
  size text not null, color text not null default 'As shown', sku text not null unique,
  stock integer not null default 0 check (stock >= 0), active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(product_id,size,color)
);
create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(), code text not null unique check (code = upper(code)),
  kind text not null check (kind in ('percent','fixed')), value numeric(10,2) not null check (value > 0),
  currency text check (currency in ('USD','GBP')), minimum_order numeric(10,2) not null default 0,
  max_uses integer check (max_uses is null or max_uses > 0), uses integer not null default 0,
  starts_at timestamptz, ends_at timestamptz, active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.shipping_rules (
  id uuid primary key default gen_random_uuid(), country text not null check (country in ('US','GB')),
  currency text not null check (currency in ('USD','GBP')), name text not null,
  rate numeric(10,2) not null default 0 check (rate >= 0), free_over numeric(10,2) check (free_over is null or free_over >= 0),
  delivery_min_days integer not null default 3 check (delivery_min_days > 0),
  delivery_max_days integer not null default 7 check (delivery_max_days >= delivery_min_days),
  active boolean not null default true, unique(country,name)
);
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
  customer_name text not null, customer_email text not null, rating integer not null check (rating between 1 and 5),
  title text not null default '', body text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  verified_purchase boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists public.customer_notifications (
  id uuid primary key default gen_random_uuid(), order_id uuid references public.orders(id) on delete cascade,
  recipient text not null, notification_type text not null, provider text, provider_message_id text,
  status text not null default 'pending' check (status in ('pending','sent','failed','skipped')),
  error text, created_at timestamptz not null default now(), sent_at timestamptz
);
create table if not exists public.site_settings (
  key text primary key, value jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now()
);

create index if not exists product_variants_product_active_idx on public.product_variants(product_id,active);
create index if not exists reviews_product_status_created_idx on public.product_reviews(product_id,status,created_at desc);
create index if not exists notifications_order_created_idx on public.customer_notifications(order_id,created_at desc);
create index if not exists discounts_active_code_idx on public.discount_codes(code) where active;

alter table public.product_variants enable row level security;
alter table public.discount_codes enable row level security;
alter table public.shipping_rules enable row level security;
alter table public.product_reviews enable row level security;
alter table public.customer_notifications enable row level security;
alter table public.site_settings enable row level security;
create policy "Public can read active variants" on public.product_variants for select to anon,authenticated
using (active and exists(select 1 from public.products p where p.id=product_id and p.status='active'));
create policy "Public can read shipping rules" on public.shipping_rules for select to anon,authenticated using (active);
create policy "Public can read approved reviews" on public.product_reviews for select to anon,authenticated using (status='approved');
grant select on public.product_variants,public.shipping_rules,public.product_reviews to anon,authenticated;
grant all on public.product_variants,public.discount_codes,public.shipping_rules,public.product_reviews,public.customer_notifications,public.site_settings to service_role;
