alter table public.orders add column provider_order_id text unique;
alter table public.orders add column tracking_token uuid not null default gen_random_uuid() unique;

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  gateway text not null check (gateway in ('paypal','flutterwave')),
  external_event_id text not null,
  event_type text not null,
  order_id uuid references public.orders(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now(),
  unique (gateway, external_event_id)
);
alter table public.payment_events enable row level security;
create policy "Deny public payment event access" on public.payment_events for all to anon, authenticated using (false) with check (false);

create or replace function public.complete_paid_order(p_order_id uuid, p_payment_reference text)
returns public.orders language plpgsql security definer set search_path = ''
as $$
declare current_order public.orders; item record;
begin
  select * into current_order from public.orders where id = p_order_id for update;
  if current_order.id is null then raise exception 'Order not found'; end if;
  if current_order.payment_status = 'paid' then return current_order; end if;
  if current_order.payment_status <> 'pending' then raise exception 'Order is not pending'; end if;
  for item in select product_id, quantity from public.order_items where order_id = p_order_id and product_id is not null loop
    update public.products set stock = stock - item.quantity where id = item.product_id and stock >= item.quantity;
    if not found then raise exception 'Insufficient inventory'; end if;
  end loop;
  update public.orders set payment_status = 'paid', payment_reference = p_payment_reference, fulfillment_status = 'processing'
  where id = p_order_id returning * into current_order;
  return current_order;
end;
$$;
revoke all on function public.complete_paid_order(uuid, text) from public, anon, authenticated;
grant execute on function public.complete_paid_order(uuid, text) to service_role;
create index payment_events_order_idx on public.payment_events(order_id, processed_at desc);
