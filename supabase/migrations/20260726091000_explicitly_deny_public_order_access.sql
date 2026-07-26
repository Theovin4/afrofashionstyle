create policy "Deny public order access"
on public.orders for all
to anon, authenticated
using (false)
with check (false);

create policy "Deny public order item access"
on public.order_items for all
to anon, authenticated
using (false)
with check (false);
