import { createHash } from "node:crypto";
import { createAdminSupabase } from "./supabase";

const pixelId = "4611600329085591";
const hash = (value?: string) => {
  const normalized = value?.trim().toLowerCase();
  return normalized ? createHash("sha256").update(normalized).digest("hex") : undefined;
};
const compact = (value: Record<string, unknown>) => Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== ""));

type OrderItem = { product_id?: string | null; product_name: string; quantity: number; unit_price: number };
type MetaAttribution = {
  consent?: boolean; fbp?: string; fbc?: string; external_id?: string;
  client_ip_address?: string; client_user_agent?: string; event_source_url?: string;
};

export type MetaPurchaseBrowserEvent = {
  eventId: string;
  customData: Record<string, unknown>;
};

export async function sendVerifiedPurchaseForOrder(orderId: string, gateway: "Flutterwave" | "PayPal") {
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!token) return { browserEvent: null, serverSent: false };
  const supabase = createAdminSupabase();
  const { data: order, error } = await supabase.from("orders").select(
    "id,order_number,customer_email,customer_name,phone,shipping_address,currency,total,payment_status,meta_attribution,order_items(product_id,product_name,quantity,unit_price)",
  ).eq("id", orderId).eq("payment_status", "paid").single();
  if (error || !order) return { browserEvent: null, serverSent: false };

  const attribution = (order.meta_attribution || {}) as MetaAttribution;
  if (attribution.consent !== true) return { browserEvent: null, serverSent: false };
  const items = (order.order_items || []) as OrderItem[];
  const contentIds = items.map((item) => item.product_id).filter((id): id is string => Boolean(id));
  const contents = items.map((item) => ({
    id: item.product_id || item.product_name,
    quantity: Number(item.quantity),
    item_price: Number(item.unit_price),
  }));
  const eventId = `purchase:${order.id}`;
  const customData = {
    content_ids: contentIds,
    contents,
    content_type: "product",
    value: Number(order.total),
    currency: order.currency,
    order_id: order.order_number,
    payment_method: gateway,
  };
  const browserEvent: MetaPurchaseBrowserEvent = { eventId, customData };

  const { error: claimError } = await supabase.from("customer_notifications").insert({
    order_id: order.id,
    recipient: "meta",
    notification_type: "meta_purchase",
    provider: "meta",
    provider_message_id: eventId,
    status: "pending",
  });
  if (claimError?.code === "23505") {
    const { data: existing } = await supabase.from("customer_notifications").select("status")
      .eq("order_id", order.id).eq("notification_type", "meta_purchase").maybeSingle();
    if (existing?.status !== "failed") return { browserEvent, serverSent: false };
    const { error: retryError } = await supabase.from("customer_notifications").update({ status: "pending", error: null })
      .eq("order_id", order.id).eq("notification_type", "meta_purchase").eq("status", "failed");
    if (retryError) return { browserEvent, serverSent: false };
  } else if (claimError) {
    console.error("Meta Purchase claim failed", { orderId: order.id });
    return { browserEvent: null, serverSent: false };
  }

  const [firstName = "", ...lastParts] = String(order.customer_name || "").trim().split(/\s+/);
  const shipping = (order.shipping_address || {}) as { city?: string; state?: string; postal_code?: string; country?: string };
  const userData = compact({
    em: hash(order.customer_email),
    ph: hash(String(order.phone || "").replace(/\D/g, "")),
    fn: hash(firstName),
    ln: hash(lastParts.join(" ")),
    ct: hash(shipping.city),
    st: hash(shipping.state),
    zp: hash(shipping.postal_code),
    country: hash(shipping.country),
    external_id: hash(attribution.external_id),
    client_ip_address: attribution.client_ip_address,
    client_user_agent: attribution.client_user_agent,
    fbp: attribution.fbp,
    fbc: attribution.fbc,
  });
  const payload: Record<string, unknown> = {
    data: [{
      event_name: "Purchase",
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      event_source_url: "https://afro-fashionstyle.vercel.app/payment/success",
      action_source: "website",
      user_data: userData,
      custom_data: customData,
    }],
  };
  if (process.env.META_CAPI_TEST_EVENT_CODE) payload.test_event_code = process.env.META_CAPI_TEST_EVENT_CODE;
  const response = await fetch(
    `https://graph.facebook.com/${process.env.META_GRAPH_API_VERSION || "v22.0"}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload), cache: "no-store" },
  );
  await supabase.from("customer_notifications").update({
    status: response.ok ? "sent" : "failed",
    sent_at: response.ok ? new Date().toISOString() : null,
    error: response.ok ? null : `HTTP ${response.status}`,
  }).eq("order_id", order.id).eq("notification_type", "meta_purchase");
  if (!response.ok) {
    console.error("Meta rejected verified Purchase", { status: response.status, eventId });
    return { browserEvent, serverSent: false };
  }
  if (process.env.NODE_ENV === "development") console.debug("[Meta CAPI]", { eventName: "Purchase", eventId });
  return { browserEvent, serverSent: true };
}
