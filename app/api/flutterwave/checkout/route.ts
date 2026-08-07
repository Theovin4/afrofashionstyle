import { createPendingOrder, type CheckoutRequest } from "../../../lib/orders";
import { createAdminSupabase } from "../../../lib/supabase";
import { enforceRateLimit, payloadError, readLimitedJson } from "../../../lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "flutterwave-checkout", 10, 15 * 60);
  if (limited) return limited;
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) return Response.json({ error: "Flutterwave API checkout is not configured" }, { status: 503 });
  try {
    const input = await readLimitedJson<CheckoutRequest>(request, 32_768);
    const { order } = await createPendingOrder(input, "flutterwave", {
      clientIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") || undefined,
      sourceUrl: `${new URL(request.url).origin}/checkout`,
    });
    const origin = new URL(request.url).origin;
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: { authorization: `Bearer ${secretKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        tx_ref: order.order_number,
        amount: Number(order.total).toFixed(2),
        currency: order.currency,
        redirect_url: `${origin}/payment/flutterwave/return`,
        customer: {
          email: input.customer.email,
          name: `${input.customer.firstName} ${input.customer.lastName}`,
          phonenumber: input.customer.phone,
        },
        customizations: {
          title: "Afro.Fashionstyle",
          description: `Order ${order.order_number}`,
          logo: `${origin}/afro-fashionstyle-monogram.png`,
        },
        meta: { order_id: order.id },
      }),
      cache: "no-store",
    });
    const result = await response.json() as { status?: string; data?: { link?: string }; message?: string };
    if (!response.ok || result.status !== "success" || !result.data?.link) {
      await createAdminSupabase().from("orders").update({ payment_status: "failed" }).eq("id", order.id);
      return Response.json({ error: result.message || "Unable to start Flutterwave payment" }, { status: 502 });
    }
    await createAdminSupabase().from("orders").update({ provider_order_id: order.order_number }).eq("id", order.id);
    return Response.json({ checkoutUrl: result.data.link, orderNumber: order.order_number });
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE")) return payloadError(error);
    return Response.json({ error: error instanceof Error ? error.message : "Flutterwave checkout failed" }, { status: 400 });
  }
}
