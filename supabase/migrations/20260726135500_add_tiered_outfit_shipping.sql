alter table public.shipping_rules add column if not exists second_item_rate numeric(10,2)
  check (second_item_rate is null or second_item_rate >= 0);
alter table public.shipping_rules add column if not exists additional_item_rate numeric(10,2)
  check (additional_item_rate is null or additional_item_rate >= 0);
update public.shipping_rules
set rate=50,free_over=null,second_item_rate=39.50,additional_item_rate=29.50,
    name='Fly Logistics USA tiered doorstep delivery'
where country='US' and currency='USD';
