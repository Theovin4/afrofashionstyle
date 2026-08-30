export type TieredShippingRule = {
  rate: number | string;
  second_item_rate?: number | string | null;
  additional_item_rate?: number | string | null;
};

/** One or two items share the base fee; the third and later items use their own tiers. */
export function calculateTieredShipping(rule: TieredShippingRule | null | undefined, itemCount: number) {
  if (!rule || itemCount < 1) return 0;
  const base = Number(rule.rate || 0);
  const thirdItem = itemCount >= 3 ? Number(rule.second_item_rate || 0) : 0;
  const laterItems = Math.max(0, itemCount - 3) * Number(rule.additional_item_rate || 0);
  return Math.round((base + thirdItem + laterItems) * 100) / 100;
}
