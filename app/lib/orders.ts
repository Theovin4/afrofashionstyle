import { randomUUID } from "node:crypto";
import { createAdminSupabase } from "./supabase";

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
};

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
    .select("id,name,price_usd,price_gbp,stock,status")
    .in("id", [...quantities.keys()])
    .eq("status", "active");
  if (error || !products || products.length !== quantities.size) throw new Error("One or more products are unavailable");

  const items = products.map((product) => {
    const quantity = quantities.get(product.id) || 0;
    if (quantity < 1 || product.stock < quantity) throw new Error(`${product.name} does not have enough stock`);
    return {
      product_id: product.id,
      product_name: product.name,
      quantity,
      unit_price: Number(input.currency === "GBP" ? product.price_gbp : product.price_usd),
    };
  });
  const total = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
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
    subtotal: total,
    total,
    payment_gateway: gateway,
  }).select("id,order_number,currency,total,tracking_token").single();
  if (orderError || !order) throw new Error("Unable to create order");
  const { error: itemError } = await supabase.from("order_items").insert(items.map((item) => ({ ...item, order_id: order.id })));
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
  return data;
}
