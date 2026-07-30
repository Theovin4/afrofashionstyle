import { randomUUID } from "node:crypto";
import { createPendingOrder, type CheckoutRequest } from "../../../lib/orders";
import { getPayPalAccessToken, paypalBaseUrl } from "../../../lib/paypal";
import { createAdminSupabase } from "../../../lib/supabase";
import { enforceRateLimit, payloadError, readLimitedJson } from "../../../lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "paypal-checkout", 10, 15 * 60);
  if (limited) return limited;
  try {
    const input = await readLimitedJson<CheckoutRequest>(request, 32_768);
    const { order } = await createPendingOrder(input, "paypal", {
      clientIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") || undefined,
      sourceUrl: `${new URL(request.url).origin}/checkout`,
    });
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
          reference_id: order.id,
          custom_id: order.id,
          invoice_id: order.order_number,
          description: `Afro.Fashionstyle ${order.order_number}`,
          amount: { currency_code: order.currency, value: Number(order.total).toFixed(2) },
        }],
        payment_source: { paypal: { experience_context: {
          brand_name: "Afro.Fashionstyle",
          user_action: "PAY_NOW",
          shipping_preference: "GET_FROM_FILE",
          return_url: `${origin}/payment/paypal/return`,
          cancel_url: `${origin}/payment/cancel?order=${encodeURIComponent(order.order_number)}`,
        } } },
      }),
      cache: "no-store",
    });
    const result = await response.json() as { id?: string; status?: string; links?: Array<{ rel?: string; href?: string }>; details?: unknown };
    if (!response.ok || !result.id) {
      await createAdminSupabase().from("orders").update({ payment_status: "failed" }).eq("id", order.id);
      console.error("PayPal order creation failed", { status: response.status, details: result.details });
      return Response.json({ error: "Unable to create PayPal order" }, { status: 502 });
    }
    const approveUrl = result.links?.find((link) => link.rel === "payer-action" || link.rel === "approve")?.href;
    if (!approveUrl) return Response.json({ error: "PayPal approval URL was missing" }, { status: 502 });
    await createAdminSupabase().from("orders").update({ provider_order_id: result.id }).eq("id", order.id);
    return Response.json({ orderId: result.id, orderNumber: order.order_number, status: result.status, approveUrl });
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE")) return payloadError(error);
    console.error("PayPal create-order processing failed", { message: error instanceof Error ? error.message : "Unknown error" });
    return Response.json({ error: error instanceof Error ? error.message : "PayPal order service is unavailable" }, { status: 400 });
  }
}
