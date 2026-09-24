import { createHash, randomUUID } from "node:crypto";
import { createAdminSupabase } from "./supabase";

export const paymentLinkTokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

export function validPaymentLinkToken(token: string) {
  return /^[0-9a-f-]{36}$/i.test(token);
}

export async function resolvePaymentLink(token: string, includePrivate = false) {
  if (!validPaymentLinkToken(token)) return null;
  const supabase = createAdminSupabase();
  const selection = includePrivate
    ? "id,status,expires_at,order_id,orders(id,order_number,customer_name,customer_email,phone,shipping_address,currency,subtotal,shipping_total,tax_total,total,payment_status,payment_gateway,tracking_token,order_items(product_name,quantity,unit_price,selected_size))"
    : "id,status,expires_at,order_id,orders(id,order_number,customer_name,currency,subtotal,shipping_total,tax_total,total,payment_status,order_items(product_name,quantity,unit_price,selected_size))";
  const { data } = await supabase.from("payment_links").select(selection)
    .eq("token_hash", paymentLinkTokenHash(token)).maybeSingle();
  if (!data) return null;
  if (data.status === "active" && new Date(data.expires_at).getTime() <= Date.now()) {
    await supabase.from("payment_links").update({ status: "expired" }).eq("id", data.id).eq("status", "active");
    return { ...data, status: "expired" };
  }
  return data;
}

export async function preparePaymentLinkOrder(token: string, gateway: "paypal" | "flutterwave" | "crypto") {
  const link = await resolvePaymentLink(token, true);
  const order = Array.isArray(link?.orders) ? link.orders[0] : link?.orders;
  if (!link || !order || link.status !== "active" || order.payment_status === "paid") {
    throw new Error(order?.payment_status === "paid" ? "This payment link has already been paid." : "This payment link is no longer available.");
  }
  const { data, error } = await createAdminSupabase().from("orders")
    .update({ payment_gateway: gateway, payment_status: "pending" })
    .eq("id", order.id).neq("payment_status", "paid")
    .select("id,order_number,customer_name,customer_email,phone,currency,total,tracking_token").single();
  if (error || !data) throw new Error("The order could not be prepared for payment.");
  return { link, order: data };
}

export async function createManualPaymentLink(input: Record<string, unknown>, origin: string) {
  const customerName = String(input.customerName || "").trim();
  const customerEmail = String(input.customerEmail || "").trim().toLowerCase();
  const phone = String(input.phone || "").trim();
  const itemName = String(input.itemName || "").trim();
  const selectedSize = String(input.selectedSize || "").trim();
  const address = String(input.address || "").trim();
  const city = String(input.city || "").trim();
  const state = String(input.state || "").trim();
  const postalCode = String(input.postalCode || "").trim();
  const country = input.country === "GB" ? "GB" : "US";
  const currency = input.currency === "GBP" ? "GBP" : "USD";
  const quantity = Math.floor(Number(input.quantity));
  const subtotal = Math.round(Number(input.amount) * 100) / 100;
  const shipping = Math.round(Number(input.delivery) * 100) / 100;
  const tax = Math.round(Number(input.tax || 0) * 100) / 100;
  const expiryDays = Math.floor(Number(input.expiryDays || 7));
  if (customerName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) || itemName.length < 2 || address.length < 5 || city.length < 2 || state.length < 2 || postalCode.length < 2 || !Number.isInteger(quantity) || quantity < 1 || quantity > 100 || !Number.isFinite(subtotal) || subtotal <= 0 || !Number.isFinite(shipping) || shipping < 0 || !Number.isFinite(tax) || tax < 0 || expiryDays < 1 || expiryDays > 30) {
    throw new Error("Complete all customer, order, delivery and amount fields correctly.");
  }
  if ((country === "US" && currency !== "USD") || (country === "GB" && currency !== "GBP")) throw new Error("USA links must use USD and UK links must use GBP.");
  const supabase = createAdminSupabase();
  const token = randomUUID();
  const orderNumber = `AF-${new Date().getUTCFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;
  const { data: order, error: orderError } = await supabase.from("orders").insert({
    order_number: orderNumber, customer_name: customerName, customer_email: customerEmail, phone,
    shipping_address: { line1: address, city, state, postal_code: postalCode, country },
    currency, subtotal, shipping_total: shipping, tax_total: tax, total,
    payment_gateway: "paypal", payment_status: "pending", fulfillment_status: "unfulfilled",
  }).select("id,order_number").single();
  if (orderError || !order) throw new Error("The manual order could not be created.");
  const unitPrice = Math.round(subtotal / quantity * 100) / 100;
  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: order.id, product_name: itemName, quantity, unit_price: unitPrice, selected_size: selectedSize || null,
  });
  const expiresAt = new Date(Date.now() + expiryDays * 86_400_000).toISOString();
  const { data: link, error: linkError } = await supabase.from("payment_links").insert({
    order_id: order.id, token_hash: paymentLinkTokenHash(token), expires_at: expiresAt,
  }).select("id,status,expires_at,created_at").single();
  if (itemError || linkError || !link) {
    await supabase.from("orders").delete().eq("id", order.id);
    throw new Error("The secure payment link could not be generated.");
  }
  return { ...link, order_id: order.id, order_number: order.order_number, customer_name: customerName, currency, total, payment_url: `${origin}/pay/${token}` };
}
