import { createAdminSupabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json() as { orderNumber?: string; email?: string };
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
