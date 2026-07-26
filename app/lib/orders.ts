import { randomUUID } from "node:crypto";
import { createAdminSupabase } from "./supabase";
import { sendOrderConfirmation } from "./notifications";

export type CheckoutCustomer = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  zip: string;
  country: "US" | "GB";
};

export type CheckoutRequest = {
  items: string[];
  currency: "USD" | "GBP";
  customer: CheckoutCustomer;
  sizes?: string[];
  discountCode?: string;
};
const taxRate = 0.05;

function validCustomer(customer: CheckoutCustomer) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) &&
    customer.firstName.trim().length > 0 &&
    customer.lastName.trim().length > 0 &&
    customer.address.trim().length > 4 &&
    customer.city.trim().length > 1 &&
    customer.zip.trim().length > 1 &&
    (customer.country === "US" || customer.country === "GB");
}

export async function createPendingOrder(input: CheckoutRequest, gateway: "paypal" | "flutterwave") {
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 20 || !["USD", "GBP"].includes(input.currency) || !validCustomer(input.customer)) {
    throw new Error("Invalid checkout details");
  }
  const quantities = new Map<string, number>();
  for (const id of input.items) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid product");
    quantities.set(id, (quantities.get(id) || 0) + 1);
  }
  const supabase = createAdminSupabase();
  const { data: products, error } = await supabase.from("products")
    .select("id,name,category,price_usd,price_gbp,stock,status")
    .in("id", [...quantities.keys()])
    .eq("status", "active");
  if (error || !products || products.length !== quantities.size) throw new Error("One or more products are unavailable");

  const items = products.map((product) => {
    const quantity = quantities.get(product.id) || 0;
    if (quantity < 1 || product.stock < quantity) throw new Error(`${product.name} does not have enough stock`);
    return {
      product_id: product.id,
      product_name: product.name,
      category: product.category,
      quantity,
      unit_price: Number(input.currency === "GBP" ? product.price_gbp : product.price_usd),
    };
  });
  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const { data: shippingRule } = await supabase.from("shipping_rules").select("rate,free_over,second_item_rate,additional_item_rate").eq("country", input.customer.country).eq("currency", input.currency).eq("active", true).limit(1).maybeSingle();
  const itemCount = input.items.length;
  const tieredShipping = shippingRule ? Number(shippingRule.rate) + (itemCount >= 2 ? Number(shippingRule.second_item_rate || 0) : 0) + Math.max(0, itemCount - 2) * Number(shippingRule.additional_item_rate || 0) : 0;
  const shippingTotal = shippingRule && (shippingRule.free_over === null || subtotal < Number(shippingRule.free_over)) ? tieredShipping : 0;
  let discountTotal = 0;
  let discountCode: string | null = null;
  {
    const { data: currencySetting } = await supabase.from("site_settings").select("value").eq("key", "currency").maybeSingle();
    const usdToGbp = Number((currencySetting?.value as { usd_to_gbp?: number } | null)?.usd_to_gbp || .751);
    const bundleTarget = input.currency === "GBP" ? 260 * usdToGbp : 260;
    const ankaraUnits = items.flatMap((item) => item.category.toLowerCase().includes("ankara") ? Array(item.quantity).fill(item.unit_price) as number[] : []).sort((a, b) => b - a);
    for (let index = 0; index + 1 < ankaraUnits.length; index += 2) discountTotal += Math.max(0, ankaraUnits[index] + ankaraUnits[index + 1] - bundleTarget);
    if (discountTotal > 0) discountCode = "ANKARA2FOR260";
  }
  if (input.discountCode?.trim()) {
    const code = input.discountCode.trim().toUpperCase();
    const now = new Date().toISOString();
    const { data: discount } = await supabase.from("discount_codes").select("code,kind,value,currency,minimum_order,max_uses,uses,starts_at,ends_at")
      .eq("code", code).eq("active", true).maybeSingle();
    if (!discount || (discount.currency && discount.currency !== input.currency) || subtotal < Number(discount.minimum_order) || (discount.max_uses && discount.uses >= discount.max_uses) || (discount.starts_at && discount.starts_at > now) || (discount.ends_at && discount.ends_at < now)) throw new Error("Discount code is not valid for this order");
    const codeDiscount = discount.kind === "percent" ? subtotal * Math.min(Number(discount.value), 100) / 100 : Math.min(Number(discount.value), subtotal);
    discountTotal += codeDiscount;
    discountCode = discountCode ? `${discountCode}+${code}` : code;
  }
  discountTotal = Math.round(Math.min(discountTotal, subtotal) * 100) / 100;
  const taxableTotal = Math.max(0, subtotal - discountTotal);
  const taxTotal = Math.round(taxableTotal * taxRate * 100) / 100;
  const total = taxableTotal + taxTotal + shippingTotal;
  const orderNumber = `AF-${new Date().getUTCFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const { data: order, error: orderError } = await supabase.from("orders").insert({
    order_number: orderNumber,
    customer_email: input.customer.email.trim().toLowerCase(),
    customer_name: `${input.customer.firstName.trim()} ${input.customer.lastName.trim()}`,
    phone: input.customer.phone.trim(),
    shipping_address: {
      line1: input.customer.address.trim(),
      city: input.customer.city.trim(),
      postal_code: input.customer.zip.trim(),
      country: input.customer.country,
    },
    currency: input.currency,
    subtotal,
    discount_code: discountCode,
    discount_total: discountTotal,
    shipping_total: shippingTotal,
    tax_total: taxTotal,
    total,
    payment_gateway: gateway,
  }).select("id,order_number,currency,total,tracking_token").single();
  if (orderError || !order) throw new Error("Unable to create order");
  await supabase.from("abandoned_carts").update({ status: "converted", updated_at: new Date().toISOString() }).eq("email", input.customer.email.trim().toLowerCase()).eq("status", "pending");
  const { error: itemError } = await supabase.from("order_items").insert(items.map((item) => ({
    product_id: item.product_id, product_name: item.product_name, quantity: item.quantity, unit_price: item.unit_price,
    order_id: order.id, selected_size: input.sizes?.[input.items.indexOf(item.product_id)] || null,
  })));
  if (itemError) {
    await supabase.from("orders").delete().eq("id", order.id);
    throw new Error("Unable to save order items");
  }
  return { order, items };
}

export async function completeOrder(orderId: string, paymentReference: string) {
  const { data, error } = await createAdminSupabase().rpc("complete_paid_order", {
    p_order_id: orderId,
    p_payment_reference: paymentReference,
  });
  if (error) throw error;
  await sendOrderConfirmation(orderId).catch((notificationError) => console.error("Order confirmation email failed", notificationError));
  return data;
}
