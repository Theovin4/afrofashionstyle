-- Administrator-created, single-order payment links for social selling.
-- Only the service role can read or write these records; public access goes through
-- rate-limited server routes that resolve a SHA-256 token hash.
create table if not exists public.payment_links (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'active' check (status in ('active','paid','expired','revoked')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  constraint payment_links_future_expiry check (expires_at > created_at)
);

create index if not exists payment_links_status_expiry_idx
  on public.payment_links(status, expires_at);

alter table public.payment_links enable row level security;
create policy "Deny public payment link access" on public.payment_links
  for all to anon, authenticated using (false) with check (false);
grant all on public.payment_links to service_role;
