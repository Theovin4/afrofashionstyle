create table if not exists public.abandoned_carts (
  id uuid primary key default gen_random_uuid(), email text not null, customer_name text,
  currency text not null check (currency in ('USD','GBP')), items jsonb not null default '[]'::jsonb,
  subtotal numeric(10,2) not null default 0 check (subtotal >= 0), consent boolean not null default false,
  status text not null default 'pending' check (status in ('pending','sent','converted','unsubscribed','failed')),
  recover_after timestamptz not null, recovery_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists abandoned_carts_due_idx on public.abandoned_carts(status,recover_after) where status='pending' and consent;
alter table public.abandoned_carts enable row level security;
create policy "Deny public abandoned cart access" on public.abandoned_carts as restrictive
for all to anon,authenticated using(false) with check(false);
grant all on public.abandoned_carts to service_role;
