alter table public.orders add column if not exists tax_total numeric(10,2) not null default 0 check (tax_total >= 0);
