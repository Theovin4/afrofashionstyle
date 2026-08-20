import { createPendingOrder, type CheckoutRequest } from "../../../lib/orders";
import { createAdminSupabase } from "../../../lib/supabase";
import { enforceRateLimit, payloadError, readLimitedJson } from "../../../lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "flutterwave-checkout", 10, 15 * 60);
  if (limited) return limited;
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY?.trim();
  if (!secretKey) return Response.json({ error: "Flutterwave API checkout is not configured" }, { status: 503 });
  let orderId: string | undefined;
  try {
    let input: CheckoutRequest;
    try {
      input = await readLimitedJson<CheckoutRequest>(request, 32_768);
    } catch (error) {
      return payloadError(error);
    }
    const { order } = await createPendingOrder(input, "flutterwave", {
      clientIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") || undefined,
      sourceUrl: `${new URL(request.url).origin}/checkout`,
    });
    orderId = order.id;
    const origin = new URL(request.url).origin;
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: { authorization: `Bearer ${secretKey}`, accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({
        tx_ref: order.order_number,
        amount: Number(Number(order.total).toFixed(2)),
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
        payment_options: "card,account",
        meta: { order_id: order.id },
      }),
      cache: "no-store",
    });
    const responseBody = await response.text();
    let result: { status?: string; data?: { link?: string }; message?: string } = {};
    try {
      result = responseBody ? JSON.parse(responseBody) as typeof result : {};
    } catch {
      console.error("Flutterwave checkout returned a non-JSON response", { status: response.status, contentType: response.headers.get("content-type") });
    }
    if (!response.ok || result.status !== "success" || !result.data?.link) {
      await createAdminSupabase().from("orders").update({ payment_status: "failed" }).eq("id", order.id);
      console.error("Flutterwave checkout rejected", { status: response.status, providerMessage: result.message?.slice(0, 160) });
      const error = response.status === 401 || response.status === 403
        ? "Flutterwave could not authorize this payment. Please use PayPal while we restore the card option."
        : result.message || "Flutterwave did not return a valid payment link. Please try again or use PayPal.";
      return Response.json({ error }, { status: 502 });
    }
    await createAdminSupabase().from("orders").update({ provider_order_id: order.order_number }).eq("id", order.id);
    return Response.json({ checkoutUrl: result.data.link, orderNumber: order.order_number });
  } catch (error) {
    if (orderId) await createAdminSupabase().from("orders").update({ payment_status: "failed" }).eq("id", orderId);
    console.error("Flutterwave checkout failed", { message: error instanceof Error ? error.message : "Unknown provider error" });
    return Response.json({ error: "Flutterwave is temporarily unavailable. Please try again or use PayPal." }, { status: 502 });
  }
}
