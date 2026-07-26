import { createHash } from "node:crypto";

const pixelId = "4611600329085591";
const hash = (value: string) => createHash("sha256").update(value.trim().toLowerCase()).digest("hex");

export async function sendVerifiedPurchase(input: {
  eventId: string; orderNumber: string; email: string; value: number; currency: string; gateway: string;
}) {
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!token) return;
  const response = await fetch(`https://graph.facebook.com/${process.env.META_GRAPH_API_VERSION || "v22.0"}/${pixelId}/events?access_token=${encodeURIComponent(token)}`, {
    method: "POST", headers: { "content-type": "application/json" }, cache: "no-store",
    body: JSON.stringify({ data: [{
      event_name: "Purchase", event_time: Math.floor(Date.now() / 1000), event_id: input.eventId,
      event_source_url: "https://afro-fashionstyle.vercel.app/payment/success", action_source: "website",
      user_data: { em: hash(input.email) },
      custom_data: { value: input.value, currency: input.currency, content_type: "product", content_ids: [input.orderNumber], payment_method: input.gateway },
    }] }),
  });
  if (!response.ok) console.error("Meta rejected a verified purchase", { status: response.status });
}
