with sizes as (
  select size, ordinality::int as position
  from unnest(array['US 2','US 4','US 6','US 8','US 10','US 12','US 14','US 16','US 18']) with ordinality as s(size,ordinality)
)
insert into public.product_variants(product_id,size,color,sku,stock)
select p.id,s.size,'As shown',upper(substr(p.slug,1,30)||'-'||replace(s.size,' ','')),
       floor(p.stock / 9.0)::int + case when s.position <= (p.stock % 9) then 1 else 0 end
from public.products p cross join sizes s
where not exists (
  select 1 from public.product_variants v
  where v.product_id=p.id and v.size=s.size and v.color='As shown'
)
on conflict do nothing;
