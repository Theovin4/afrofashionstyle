import { enforceRateLimit } from "../../../lib/security";
import { resolvePaymentLink } from "../../../lib/payment-links";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const limited = await enforceRateLimit(request, "payment-link-view", 60, 15 * 60);
  if (limited) return limited;
  const { token } = await params;
  const link = await resolvePaymentLink(token);
  const order = Array.isArray(link?.orders) ? link.orders[0] : link?.orders;
  if (!link || !order) return Response.json({ error: "Payment link not found." }, { status: 404 });
  return Response.json({
    status: order.payment_status === "paid" ? "paid" : link.status,
    expiresAt: link.expires_at,
    order: {
      orderNumber: order.order_number, customerName: order.customer_name, currency: order.currency,
      subtotal: Number(order.subtotal), delivery: Number(order.shipping_total), tax: Number(order.tax_total), total: Number(order.total),
      items: order.order_items || [],
    },
  });
}
