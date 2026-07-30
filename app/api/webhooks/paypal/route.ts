import { getPayPalAccessToken, paypalBaseUrl } from "../../../lib/paypal";
import { completeOrder } from "../../../lib/orders";
import { createAdminSupabase } from "../../../lib/supabase";
import { sendVerifiedPurchaseForOrder } from "../../../lib/meta-purchase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PayPalEvent = {
  id?: string;
  event_type?: string;
  create_time?: string;
  resource?: {
    id?: string;
    status?: string;
    amount?: { value?: string; currency_code?: string };
    payer?: {
      email_address?: string;
      name?: { given_name?: string; surname?: string };
    };
    supplementary_data?: { related_ids?: { order_id?: string } };
  };
};

async function verifyPayPalWebhook(
  request: Request,
  event: PayPalEvent,
  accessToken: string,
  webhookId: string,
) {
  const response = await fetch(`${paypalBaseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: request.headers.get("paypal-auth-algo"),
      cert_url: request.headers.get("paypal-cert-url"),
      transmission_id: request.headers.get("paypal-transmission-id"),
      transmission_sig: request.headers.get("paypal-transmission-sig"),
      transmission_time: request.headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: event,
    }),
    cache: "no-store",
  });
  if (!response.ok) return false;
  const result = (await response.json()) as { verification_status?: string };
  return result.verification_status === "SUCCESS";
}

export async function POST(request: Request) {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!clientId || !clientSecret || !webhookId) {
    return Response.json({ error: "PayPal webhook is not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  let event: PayPalEvent;
  try {
    event = JSON.parse(rawBody) as PayPalEvent;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const accessToken = await getPayPalAccessToken();
    const verified = await verifyPayPalWebhook(request, event, accessToken, webhookId);
    if (!verified) {
      return Response.json({ error: "Invalid PayPal signature" }, { status: 401 });
    }

    if (
      event.event_type === "PAYMENT.CAPTURE.COMPLETED" &&
      event.resource?.status === "COMPLETED"
    ) {
      if (!event.id) return Response.json({ error: "Missing event ID" }, { status: 400 });
      const supabase = createAdminSupabase();
      const { data: existing } = await supabase.from("payment_events").select("id").eq("gateway", "paypal").eq("external_event_id", event.id).maybeSingle();
      if (existing) return Response.json({ received: true, duplicate: true });
      const providerOrderId = event.resource.supplementary_data?.related_ids?.order_id;
      const { data: order } = await supabase.from("orders").select("id,currency,total").eq("provider_order_id", providerOrderId || "").maybeSingle();
      if (!order || event.resource.amount?.currency_code !== order.currency || Math.abs(Number(event.resource.amount?.value) - Number(order.total)) > 0.001) {
        return Response.json({ error: "Payment did not match an order" }, { status: 409 });
      }
      await completeOrder(order.id, event.resource.id || event.id);
      await supabase.from("payment_events").insert({
        gateway: "paypal", external_event_id: event.id, event_type: event.event_type, order_id: order.id, payload: event,
      });
      await sendVerifiedPurchaseForOrder(order.id, "PayPal");
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("PayPal webhook processing failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return Response.json({ error: "Webhook processing failed" }, { status: 502 });
  }
}
