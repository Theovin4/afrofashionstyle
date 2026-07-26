import { createHash } from "node:crypto";
import { getPayPalAccessToken, paypalBaseUrl } from "../../../lib/paypal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const META_PIXEL_ID = "4611600329085591";

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

function hash(value?: string) {
  const normalized = value?.trim().toLowerCase();
  return normalized ? createHash("sha256").update(normalized).digest("hex") : undefined;
}

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

async function sendMetaPurchase(event: PayPalEvent) {
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  const resource = event.resource;
  if (!token || !event.id || !resource?.amount?.value || !resource.amount.currency_code) return;

  const response = await fetch(
    `https://graph.facebook.com/${process.env.META_GRAPH_API_VERSION || "v22.0"}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        data: [{
          event_name: "Purchase",
          event_time: event.create_time
            ? Math.floor(new Date(event.create_time).getTime() / 1000)
            : Math.floor(Date.now() / 1000),
          event_id: `paypal:${event.id}`,
          event_source_url: "https://afro-fashionstyle.vercel.app/payment/success",
          action_source: "website",
          user_data: {
            em: hash(resource.payer?.email_address),
            fn: hash(resource.payer?.name?.given_name),
            ln: hash(resource.payer?.name?.surname),
          },
          custom_data: {
            value: Number(resource.amount.value),
            currency: resource.amount.currency_code,
            content_type: "product",
            content_ids: [
              resource.supplementary_data?.related_ids?.order_id ||
              resource.id ||
              event.id,
            ],
            payment_method: "PayPal",
          },
        }],
      }),
      cache: "no-store",
    },
  );
  if (!response.ok) {
    console.error("Meta rejected a verified PayPal purchase", { status: response.status });
  }
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
      await sendMetaPurchase(event);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("PayPal webhook processing failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return Response.json({ error: "Webhook processing failed" }, { status: 502 });
  }
}
