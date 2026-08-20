alter table public.orders drop constraint if exists orders_payment_gateway_check;
alter table public.orders add constraint orders_payment_gateway_check
  check (payment_gateway in ('paypal', 'flutterwave', 'crypto'));

create table public.crypto_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  network text not null check (network in ('usdt_trc20', 'usdt_bep20', 'usdt_sol', 'btc')),
  deposit_address text not null check (char_length(deposit_address) between 25 and 100),
  amount_sent text not null check (char_length(amount_sent) between 1 and 60),
  transaction_reference text not null check (char_length(transaction_reference) between 6 and 180),
  proof_url text not null check (proof_url like 'https://%'),
  proof_public_id text not null unique,
  review_status text not null default 'submitted' check (review_status in ('submitted', 'approved', 'rejected')),
  review_note text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);

create index crypto_payments_review_submitted_idx on public.crypto_payments(review_status, submitted_at desc);
alter table public.crypto_payments enable row level security;
revoke all on table public.crypto_payments from public, anon, authenticated;
grant select, insert, update, delete on table public.crypto_payments to service_role;

