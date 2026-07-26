import { isAdmin } from "../../../lib/admin-auth";
import { createAdminSupabase } from "../../../lib/supabase";
import { sendShippingConfirmation } from "../../../lib/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await createAdminSupabase().from("orders")
    .select("id,order_number,customer_name,customer_email,currency,total,payment_status,fulfillment_status,tracking_number,tracking_url,carrier,created_at,order_items(product_name,quantity,selected_size)")
    .order("created_at", { ascending: false }).limit(100);
  if (error) return Response.json({ error: "Orders could not be loaded" }, { status: 500 });
  return Response.json({ orders: data });
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const input = await request.json() as { id?: string; fulfillmentStatus?: string; trackingNumber?: string; trackingUrl?: string; carrier?: string };
  const statuses = ["unfulfilled", "processing", "shipped", "delivered", "cancelled"];
  if (!input.id || !statuses.includes(input.fulfillmentStatus || "")) return Response.json({ error: "Invalid order update" }, { status: 400 });
  const patch = {
    fulfillment_status: input.fulfillmentStatus,
    tracking_number: input.trackingNumber?.trim() || null,
    tracking_url: input.trackingUrl?.trim() || null,
    carrier: input.carrier?.trim() || null,
  };
  const { data, error } = await createAdminSupabase().from("orders").update(patch).eq("id", input.id)
    .select("id,order_number,fulfillment_status,tracking_number,tracking_url,carrier").single();
  if (error) return Response.json({ error: "Order could not be updated" }, { status: 500 });
  if (input.fulfillmentStatus === "shipped") await sendShippingConfirmation(input.id).catch((notificationError) => console.error("Shipping email failed", notificationError));
  return Response.json({ order: data });
}
