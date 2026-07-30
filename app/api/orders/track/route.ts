import { createAdminSupabase } from "../../../lib/supabase";
import { enforceRateLimit, payloadError, readLimitedJson } from "../../../lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "order-track", 10, 15 * 60);
  if (limited) return limited;
  let body: { orderNumber?: string; email?: string };
  try { body = await readLimitedJson(request, 8_192); } catch (error) { return payloadError(error); }
  const orderNumber = String(body.orderNumber || "").trim().toUpperCase();
  const email = String(body.email || "").trim().toLowerCase();
  if (!/^AF-\d{4}-[A-Z0-9]{8}$/.test(orderNumber) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Enter a valid order number and email" }, { status: 400 });
  }
  const { data, error } = await createAdminSupabase().from("orders")
    .select("order_number,payment_status,fulfillment_status,currency,total,created_at")
    .eq("order_number", orderNumber)
    .eq("customer_email", email)
    .maybeSingle();
  if (error || !data) return Response.json({ error: "No matching order was found" }, { status: 404 });
  return Response.json({ order: data });
}
