insert into public.site_settings(key,value)
values ('currency','{"usd_to_gbp":0.751,"source":"Bank of England reference","updated_at":"2026-07-26"}'::jsonb)
on conflict(key) do update set value=excluded.value,updated_at=now();
update public.products set price_gbp=round(price_usd*0.751,2),updated_at=now();
update public.shipping_rules
set rate=round(50*0.751,2),second_item_rate=round(39.50*0.751,2),
    additional_item_rate=round(29.50*0.751,2),free_over=null,
    name='Fly Logistics UK tiered doorstep delivery'
where country='GB' and currency='GBP';
