import { createPendingOrder, type CheckoutRequest } from "../../../lib/orders";
import { createAdminSupabase } from "../../../lib/supabase";
import { enforceRateLimit, payloadError, readLimitedJson } from "../../../lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function configuredLink(currency: "USD" | "GBP") {
  const raw = (currency === "GBP" ? process.env.NEXT_PUBLIC_FLUTTERWAVE_PAYMENT_LINK_GBP : process.env.NEXT_PUBLIC_FLUTTERWAVE_PAYMENT_LINK_USD)?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const allowed = url.protocol === "https:" && (url.hostname === "flutterwave.com" || url.hostname.endsWith(".flutterwave.com"));
    return allowed ? url.toString() : null;
  } catch { return null; }
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "flutterwave-payment-link", 5, 15 * 60);
  if (limited) return limited;
  let input: CheckoutRequest;
  try { input = await readLimitedJson<CheckoutRequest>(request, 32_768); } catch (error) { return payloadError(error); }
  const paymentLink = configuredLink(input.currency);
  if (!paymentLink) return Response.json({ error: `The ${input.currency} backup payment link is not configured correctly.` }, { status: 503 });
  try {
    const { order } = await createPendingOrder(input, "flutterwave", {
      clientIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") || undefined,
      sourceUrl: `${new URL(request.url).origin}/checkout`,
    });
    const { error } = await createAdminSupabase().from("orders").update({ provider_order_id: `payment-link:${order.order_number}` }).eq("id", order.id);
    if (error) {
      await createAdminSupabase().from("orders").delete().eq("id", order.id);
      throw error;
    }
    const params = new URLSearchParams({ order: order.order_number, token: order.tracking_token });
    return Response.json({ handoffUrl: `/payment/flutterwave/link?${params}`, orderNumber: order.order_number });
  } catch {
    return Response.json({ error: "The backup Flutterwave payment could not be prepared." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request, "flutterwave-payment-link-view", 30, 15 * 60);
  if (limited) return limited;
  const url = new URL(request.url);
  if (url.searchParams.get("status") === "1") {
    return Response.json({ available: { USD: Boolean(configuredLink("USD")), GBP: Boolean(configuredLink("GBP")) } }, { headers: { "cache-control": "no-store" } });
  }
  const orderNumber = url.searchParams.get("order") || "";
  const token = url.searchParams.get("token") || "";
  if (!/^AF-\d{4}-[A-F0-9]{8}$/.test(orderNumber) || !/^[0-9a-f-]{36}$/i.test(token)) return Response.json({ error: "Invalid payment-link order." }, { status: 400 });
  const { data: order } = await createAdminSupabase().from("orders").select("order_number,currency,total,payment_status,provider_order_id,tracking_token").eq("order_number", orderNumber).eq("tracking_token", token).eq("payment_gateway", "flutterwave").maybeSingle();
  if (!order || order.provider_order_id !== `payment-link:${orderNumber}`) return Response.json({ error: "Payment-link order was not found." }, { status: 404 });
  const paymentLink = configuredLink(order.currency as "USD" | "GBP");
  if (!paymentLink) return Response.json({ error: "This payment link is unavailable." }, { status: 503 });
  return Response.json({ orderNumber, currency: order.currency, total: Number(order.total), paymentStatus: order.payment_status, paymentLink }, { headers: { "cache-control": "no-store" } });
}
