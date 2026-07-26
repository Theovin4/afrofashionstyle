update public.product_variants set stock=500, updated_at=now();
update public.products p set stock=(select coalesce(sum(v.stock),0) from public.product_variants v where v.product_id=p.id and v.active), updated_at=now();
update public.shipping_rules set delivery_min_days=5,delivery_max_days=7,
  name=case country when 'US' then 'Fly Logistics USA doorstep delivery' else 'Fly Logistics UK doorstep delivery' end;
update public.site_settings set value='{"support_email":"","whatsapp":"","support_hours":"24/7"}'::jsonb,updated_at=now() where key='contact';
update public.site_settings set
  value=jsonb_set(jsonb_set(value,'{return_policy}','"No returns or refunds. All outfits are made on request. Please forward your measurements if unsure of your size."'::jsonb),'{carrier}','{"name":"Fly Logistics","url":"https://www.flylogistics.com.ng","service":"Tracked doorstep delivery"}'::jsonb),
  updated_at=now() where key='business';
