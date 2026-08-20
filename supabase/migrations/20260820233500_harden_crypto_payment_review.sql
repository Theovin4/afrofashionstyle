alter table public.crypto_payments
  add constraint crypto_payments_network_reference_unique unique (network, transaction_reference);

create index crypto_payments_reviewed_by_idx on public.crypto_payments(reviewed_by) where reviewed_by is not null;

create policy "Deny public crypto payment access"
  on public.crypto_payments for all to anon, authenticated
  using (false) with check (false);

