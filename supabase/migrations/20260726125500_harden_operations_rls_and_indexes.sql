create index if not exists order_items_product_idx on public.order_items(product_id);
create policy "Deny public discount access" on public.discount_codes as restrictive
for all to anon,authenticated using (false) with check (false);
create policy "Deny public notification access" on public.customer_notifications as restrictive
for all to anon,authenticated using (false) with check (false);
create policy "Deny public settings access" on public.site_settings as restrictive
for all to anon,authenticated using (false) with check (false);
