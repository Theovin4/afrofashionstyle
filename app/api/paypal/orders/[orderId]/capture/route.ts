import { completeOrder } from "../../../../../lib/orders";
import { getPayPalAccessToken, paypalBaseUrl } from "../../../../../lib/paypal";
import { createAdminSupabase } from "../../../../../lib/supabase";
import { sendVerifiedPurchaseForOrder } from "../../../../../lib/meta-purchase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  if (!/^[A-Z0-9]{1,36}$/.test(orderId)) return Response.json({ error: "Invalid PayPal order ID" }, { status: 400 });
  try {
    const supabase = createAdminSupabase();
    const { data: pending } = await supabase.from("orders").select("id,order_number,currency,total,payment_status").eq("provider_order_id", orderId).single();
    if (!pending) return Response.json({ error: "Order was not found" }, { status: 404 });
    if (pending.payment_status === "paid") {
      const metaPurchase = await sendVerifiedPurchaseForOrder(pending.id, "PayPal");
      return Response.json({ completed: true, orderNumber: pending.order_number, value: pending.total, currency: pending.currency, metaPurchase: metaPurchase.browserEvent });
    }
    const accessToken = await getPayPalAccessToken();
    const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json", "paypal-request-id": `capture-${orderId}` },
      body: "{}", cache: "no-store",
    });
    const result = await response.json() as {
      id?: string; status?: string;
      purchase_units?: Array<{ payments?: { captures?: Array<{ id?: string; status?: string; amount?: { value?: string; currency_code?: string } }> } }>;
      details?: unknown;
    };
    const capture = result.purchase_units?.[0]?.payments?.captures?.[0];
    if (!response.ok || result.status !== "COMPLETED" || capture?.status !== "COMPLETED") {
      return Response.json({ error: "PayPal payment was not completed" }, { status: 409 });
    }
    const value = Number(capture.amount?.value);
    if (capture.amount?.currency_code !== pending.currency || Math.abs(value - Number(pending.total)) > 0.001) {
      return Response.json({ error: "PayPal payment amount did not match the order" }, { status: 409 });
    }
    await completeOrder(pending.id, capture.id || result.id || orderId);
    const metaPurchase = await sendVerifiedPurchaseForOrder(pending.id, "PayPal");
    return Response.json({ completed: true, orderNumber: pending.order_number, value: value.toFixed(2), currency: pending.currency, metaPurchase: metaPurchase.browserEvent });
  } catch (error) {
    console.error("PayPal capture processing failed", { message: error instanceof Error ? error.message : "Unknown error" });
    return Response.json({ error: "PayPal capture service is unavailable" }, { status: 502 });
  }
}
