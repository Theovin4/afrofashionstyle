import { createAdminSupabase } from "./supabase";

export async function sendOrderConfirmation(orderId: string) {
  const supabase = createAdminSupabase();
  const { data: order } = await supabase.from("orders")
    .select("id,order_number,customer_email,customer_name,currency,total,order_items(product_name,quantity,selected_size)")
    .eq("id", orderId).single();
  if (!order) return;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM;
  if (!apiKey || !from) {
    await supabase.from("customer_notifications").insert({ order_id: order.id, recipient: order.customer_email, notification_type: "order_confirmation", status: "skipped", error: "Email provider is not configured" });
    return;
  }
  const items = order.order_items.map((item) => `<li>${item.product_name} × ${item.quantity}${item.selected_size ? ` — ${item.selected_size}` : ""}</li>`).join("");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from, to: [order.customer_email], subject: `Your Afro.Fashionstyle order ${order.order_number} is confirmed`,
      html: `<div style="font-family:Arial,sans-serif;color:#33140c;max-width:620px;margin:auto"><h1>Your story is on its way.</h1><p>Hi ${order.customer_name}, your payment is confirmed.</p><ul>${items}</ul><p><b>Total: ${order.currency} ${Number(order.total).toFixed(2)}</b></p><p>We will email tracking details when your order ships.</p></div>`,
    }),
  });
  const result = await response.json() as { id?: string; message?: string };
  await supabase.from("customer_notifications").insert({
    order_id: order.id, recipient: order.customer_email, notification_type: "order_confirmation", provider: "resend",
    provider_message_id: result.id || null, status: response.ok ? "sent" : "failed", error: response.ok ? null : result.message || "Email provider error",
    sent_at: response.ok ? new Date().toISOString() : null,
  });
}

export async function sendShippingConfirmation(orderId: string) {
  const supabase = createAdminSupabase();
  const { data: order } = await supabase.from("orders").select("id,order_number,customer_email,customer_name,tracking_number,tracking_url,carrier").eq("id", orderId).single();
  if (!order) return;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM;
  if (!apiKey || !from) {
    await supabase.from("customer_notifications").insert({ order_id: order.id, recipient: order.customer_email, notification_type: "shipping_confirmation", status: "skipped", error: "Email provider is not configured" });
    return;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: [order.customer_email], subject: `Your order ${order.order_number} has shipped`,
      html: `<div style="font-family:Arial,sans-serif;color:#33140c;max-width:620px;margin:auto"><h1>Your order is on its way.</h1><p>Hi ${order.customer_name}, ${order.carrier || "our delivery partner"} now has your parcel.</p><p>Tracking: <b>${order.tracking_number || "Available through the link below"}</b></p>${order.tracking_url ? `<p><a href="${order.tracking_url}">Track your order</a></p>` : ""}</div>` }),
  });
  const result = await response.json() as { id?: string; message?: string };
  await supabase.from("customer_notifications").insert({ order_id: order.id, recipient: order.customer_email, notification_type: "shipping_confirmation", provider: "resend", provider_message_id: result.id || null, status: response.ok ? "sent" : "failed", error: response.ok ? null : result.message || "Email provider error", sent_at: response.ok ? new Date().toISOString() : null });
}
