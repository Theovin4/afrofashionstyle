-- One or two outfits share the base fee. The existing second_item_rate
-- column is retained for compatibility and now stores the third-item tier.
update public.shipping_rules
set rate = 50.00,
    second_item_rate = 35.50,
    additional_item_rate = 29.50,
    free_over = null,
    delivery_min_days = 5,
    delivery_max_days = 7,
    name = 'Fly Logistics USA tiered doorstep delivery'
where country = 'US' and currency = 'USD';

update public.shipping_rules
set rate = round(50.00 * 0.751, 2),
    second_item_rate = round(35.50 * 0.751, 2),
    additional_item_rate = round(29.50 * 0.751, 2),
    free_over = null,
    delivery_min_days = 3,
    delivery_max_days = 7,
    name = 'Fly Logistics UK tiered doorstep delivery'
where country = 'GB' and currency = 'GBP';
