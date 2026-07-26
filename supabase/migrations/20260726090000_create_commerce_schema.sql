-- Applied to the Afro.Fashionstyle production project through Supabase.
-- Products and product images are publicly readable only while the product is active.
-- Orders and all writes remain server-only.
create extension if not exists pgcrypto;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '',
  category text not null default 'Collection',
  price_usd numeric(10,2) not null check (price_usd >= 0),
  price_gbp numeric(10,2) not null check (price_gbp >= 0),
  stock integer not null default 0 check (stock >= 0),
  status text not null default 'draft' check (status in ('draft','active','archived')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  cloudinary_asset_id text not null unique,
  cloudinary_public_id text not null unique,
  secure_url text not null check (secure_url like 'https://%'),
  alt_text text not null default '',
  width integer check (width > 0),
  height integer check (height > 0),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_email text not null,
  customer_name text not null,
  phone text,
  shipping_address jsonb not null default '{}'::jsonb,
  currency text not null check (currency in ('USD','GBP')),
  subtotal numeric(10,2) not null check (subtotal >= 0),
  total numeric(10,2) not null check (total >= 0),
  payment_gateway text not null check (payment_gateway in ('paypal','flutterwave')),
  payment_reference text unique,
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  fulfillment_status text not null default 'unfulfilled' check (fulfillment_status in ('unfulfilled','processing','shipped','delivered','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create index products_status_created_idx on public.products(status, created_at desc);
create index product_images_product_position_idx on public.product_images(product_id, position);
create index orders_created_idx on public.orders(created_at desc);
create index orders_email_idx on public.orders(lower(customer_email));
create index order_items_order_idx on public.order_items(order_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); return new; end; $$;

create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "Public can read active products" on public.products for select to anon, authenticated using (status = 'active');
create policy "Public can read images for active products" on public.product_images for select to anon, authenticated
using (exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));
