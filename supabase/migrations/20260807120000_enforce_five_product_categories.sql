alter table public.products drop constraint if exists products_category_allowed;

update public.products
set category = case
  when lower(name) like '%set%' or lower(name) like '%two piece%' then 'Two piece'
  when lower(name) like '%lace%' then 'Lace Outfit'
  when lower(name) like '%bag%' or lower(name) like '%accessor%' then 'Accessories'
  else 'Dresses'
end
where category not in ('Dresses', 'Two piece', 'Lace Outfit', 'Other Luxury Designs', 'Accessories');

update public.products
set description = case name
  when 'Amara Adire Gown' then 'A made-to-order Adire gown produced in Lagos for weddings and occasion dressing. Production takes 5–7 working days, with tracked USA and UK delivery. Send your bust, waist, hip and height measurements before ordering if you are unsure of your size.'
  when 'Ife Aso-Oke Set' then 'A made-to-order Aso-Oke two-piece produced in Lagos for celebrations and occasion dressing. Production takes 5–7 working days, with tracked USA and UK delivery. Send your bust, waist, hip and height measurements before ordering if you are unsure of your size.'
  when 'Zuri Sculpted Midi' then 'A made-to-order Ankara midi dress produced in Lagos for celebrations and occasion dressing. Production takes 5–7 working days, with tracked USA and UK delivery. Send your bust, waist, hip and height measurements before ordering if you are unsure of your size.'
  else description
end
where name in ('Amara Adire Gown', 'Ife Aso-Oke Set', 'Zuri Sculpted Midi');

alter table public.products
  add constraint products_category_allowed
  check (category in ('Dresses', 'Two piece', 'Lace Outfit', 'Other Luxury Designs', 'Accessories'));
