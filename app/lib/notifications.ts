import { createAdminSupabase } from "./supabase";

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

export function brandedEmail(content: string, preheader: string) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://afro-fashionstyle.vercel.app").replace(/\/$/, "");
  return `<!doctype html><html><body style="margin:0;background:#f3ece6;color:#35160f"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3ece6;padding:24px 10px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fffaf6;border:1px solid #dbc8ba"><tr><td align="center" style="padding:24px;border-bottom:4px solid #e99424;background:#1b100d"><a href="${siteUrl}" style="text-decoration:none"><img src="${siteUrl}/afro-fashionstyle-logo.png" width="180" alt="Afro.Fashionstyle" style="display:block;max-width:180px;height:auto;border-radius:10px"></a></td></tr><tr><td style="padding:34px 32px;font-family:Arial,sans-serif;font-size:15px;line-height:1.7">${content}</td></tr><tr><td style="padding:22px 32px;background:#35160f;color:#f8e9dc;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;text-align:center">Made on request in Lagos · Delivered to the USA and UK<br><a href="${siteUrl}/contact" style="color:#f4ae3e">Contact support</a> · <a href="https://wa.me/2347049841931" style="color:#f4ae3e">WhatsApp</a><br><span style="color:#cdb7aa">Afro.Fashionstyle · Lekki, Lagos, Nigeria</span></td></tr></table></td></tr></table></body></html>`;
}

function safeTrackingUrl(value: unknown) {
  try {
    const url = new URL(String(value ?? ""));
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export async function sendCustomerEnquiry(input: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = (process.env.CONTACT_EMAIL_FROM || process.env.ORDER_EMAIL_FROM)?.trim();
  const to = (process.env.CONTACT_EMAIL_TO || "afrofashionclub@gmail.com").trim();
  if (!apiKey || !from) return { sent: false, reason: "Email provider is not configured" };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: input.email,
      subject: `New website enquiry: ${input.subject}`,
      html: brandedEmail(`<h1 style="font-family:Georgia,serif;font-size:34px;line-height:1.1;margin:0 0 20px">New customer enquiry</h1><p><b>From:</b> ${escapeHtml(input.name)}</p><p><b>Email:</b> ${escapeHtml(input.email)}</p><p><b>Phone:</b> ${escapeHtml(input.phone || "Not provided")}</p><p><b>Topic:</b> ${escapeHtml(input.subject)}</p><div style="white-space:pre-wrap;border-top:1px solid #decfc5;padding-top:16px">${escapeHtml(input.message)}</div>`, `New enquiry from ${input.name}`),
    }),
    cache: "no-store",
  });
  const result = await response.json().catch(() => ({})) as { id?: string; message?: string };
  if (response.ok) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from,
        to: [input.email],
        reply_to: to,
        subject: "We received your Afro.Fashionstyle enquiry",
        html: brandedEmail(`<h1 style="font-family:Georgia,serif;font-size:34px;line-height:1.1;margin:0 0 20px">Your enquiry is with us.</h1><p>Hi ${escapeHtml(input.name)}, thank you for contacting Afro.Fashionstyle about <b>${escapeHtml(input.subject)}</b>.</p><p>Our support team is available 24/7 and will reply to this email or contact you using the details you provided.</p><p>For measurements or urgent order support, you can also <a href="https://wa.me/2347049841931" style="color:#8a4b12;font-weight:bold">message us on WhatsApp</a>.</p>`, "Afro.Fashionstyle has received your enquiry"),
      }),
      cache: "no-store",
    }).catch(() => undefined);
  }
  return { sent: response.ok, id: result.id, reason: response.ok ? undefined : result.message || "Email provider error" };
}

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
  const items = order.order_items.map((item) => `<li>${escapeHtml(item.product_name)} × ${Number(item.quantity)}${item.selected_size ? ` — ${escapeHtml(item.selected_size)}` : ""}</li>`).join("");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from, to: [order.customer_email], subject: `Your Afro.Fashionstyle order ${order.order_number} is confirmed`,
      html: brandedEmail(`<h1 style="font-family:Georgia,serif;font-size:34px;line-height:1.1;margin:0 0 20px">Your order is confirmed.</h1><p>Hi ${escapeHtml(order.customer_name)}, we have received your payment for order <b>${escapeHtml(order.order_number)}</b>.</p><ul>${items}</ul><p style="font-size:18px"><b>Total: ${escapeHtml(order.currency)} ${Number(order.total).toFixed(2)}</b></p><p>Your made-to-order piece enters production next. Processing takes 5–7 working days, and we will email your Fly Logistics tracking details when it ships.</p>`, `Payment confirmed for ${order.order_number}`),
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
  const trackingUrl = safeTrackingUrl(order.tracking_url);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: [order.customer_email], subject: `Your order ${order.order_number} has shipped`,
      html: brandedEmail(`<h1 style="font-family:Georgia,serif;font-size:34px;line-height:1.1;margin:0 0 20px">Your order is on its way.</h1><p>Hi ${escapeHtml(order.customer_name)}, ${escapeHtml(order.carrier || "our delivery partner")} now has order <b>${escapeHtml(order.order_number)}</b>.</p><p>Tracking: <b>${escapeHtml(order.tracking_number || "Available through the link below")}</b></p>${trackingUrl ? `<p><a href="${escapeHtml(trackingUrl)}" style="display:inline-block;background:#e99424;color:#24100b;padding:12px 20px;text-decoration:none;font-weight:bold">Track your order</a></p>` : ""}`, `Tracking is available for ${order.order_number}`) }),
  });
  const result = await response.json() as { id?: string; message?: string };
  await supabase.from("customer_notifications").insert({ order_id: order.id, recipient: order.customer_email, notification_type: "shipping_confirmation", provider: "resend", provider_message_id: result.id || null, status: response.ok ? "sent" : "failed", error: response.ok ? null : result.message || "Email provider error", sent_at: response.ok ? new Date().toISOString() : null });
}

export async function sendCryptoReviewNotification(orderId: string, status: "submitted" | "rejected") {
  const supabase = createAdminSupabase();
  const { data: order } = await supabase.from("orders").select("id,order_number,customer_email,customer_name,currency,total").eq("id", orderId).single();
  if (!order) return;
  const notificationType = status === "submitted" ? "crypto_payment_submitted" : "crypto_payment_rejected";
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM;
  if (!apiKey || !from) {
    await supabase.from("customer_notifications").insert({ order_id: order.id, recipient: order.customer_email, notification_type: notificationType, status: "skipped", error: "Email provider is not configured" });
    return;
  }
  const submitted = status === "submitted";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from, to: [order.customer_email],
      subject: submitted ? `We are reviewing payment for ${order.order_number}` : `Payment needs attention for ${order.order_number}`,
      html: brandedEmail(`<h1 style="font-family:Georgia,serif;font-size:34px;line-height:1.1;margin:0 0 20px">${submitted ? "Your proof is under review." : "Your payment was not confirmed."}</h1><p>Hi ${escapeHtml(order.customer_name)}, ${submitted ? `we received the crypto payment proof for order <b>${escapeHtml(order.order_number)}</b>. Your order remains pending while we verify the blockchain transaction.` : `we could not verify the crypto payment for order <b>${escapeHtml(order.order_number)}</b>. The order has been cancelled and no inventory was allocated.`}</p><p><b>Order total: ${escapeHtml(order.currency)} ${Number(order.total).toFixed(2)}</b></p><p>${submitted ? "We will send a separate confirmation as soon as payment is approved. Please do not send a second payment." : "If you believe this is an error, contact us on WhatsApp with the transaction hash."}</p>`, submitted ? `Payment proof received for ${order.order_number}` : `Payment was not confirmed for ${order.order_number}`),
    }),
  });
  const result = await response.json().catch(() => ({})) as { id?: string; message?: string };
  await supabase.from("customer_notifications").insert({ order_id: order.id, recipient: order.customer_email, notification_type: notificationType, provider: "resend", provider_message_id: result.id || null, status: response.ok ? "sent" : "failed", error: response.ok ? null : result.message || "Email provider error", sent_at: response.ok ? new Date().toISOString() : null });
}
