import { randomUUID } from "node:crypto";
import { getPayPalAccessToken, paypalBaseUrl } from "../../../lib/paypal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedCurrencies = new Set(["USD", "GBP"]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      value?: number;
      currency?: string;
      description?: string;
    };
    const value = Number(body.value);
    const currency = String(body.currency || "").toUpperCase();
    if (!Number.isFinite(value) || value <= 0 || value > 100000 || !allowedCurrencies.has(currency)) {
      return Response.json({ error: "Invalid order total or currency" }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();
    const origin = new URL(request.url).origin;
    const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
        "paypal-request-id": randomUUID(),
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: `AF-${Date.now()}`,
          description: body.description || "Afro.Fashionstyle order",
          amount: { currency_code: currency, value: value.toFixed(2) },
        }],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: "Afro.Fashionstyle",
              user_action: "PAY_NOW",
              shipping_preference: "GET_FROM_FILE",
              return_url: `${origin}/payment/paypal/return`,
              cancel_url: `${origin}/payment/cancel`,
            },
          },
        },
      }),
      cache: "no-store",
    });
    const result = await response.json() as {
      id?: string;
      status?: string;
      links?: Array<{ rel?: string; href?: string }>;
      details?: unknown;
    };
    if (!response.ok || !result.id) {
      console.error("PayPal order creation failed", { status: response.status, details: result.details });
      return Response.json({ error: "Unable to create PayPal order" }, { status: 502 });
    }
    const approveUrl = result.links?.find((link) => link.rel === "payer-action" || link.rel === "approve")?.href;
    if (!approveUrl) return Response.json({ error: "PayPal approval URL was missing" }, { status: 502 });
    return Response.json({ orderId: result.id, status: result.status, approveUrl });
  } catch (error) {
    console.error("PayPal create-order processing failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return Response.json({ error: "PayPal order service is unavailable" }, { status: 502 });
  }
}
