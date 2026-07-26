grant usage on schema public to anon, authenticated, service_role;
grant select on public.products, public.product_images to anon, authenticated;
grant all on public.products, public.product_images, public.orders, public.order_items, public.payment_events to service_role;
revoke all on public.orders, public.order_items, public.payment_events from anon, authenticated;
