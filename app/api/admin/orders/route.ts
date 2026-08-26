import { isAdmin } from "../../../lib/admin-auth";
import { createAdminSupabase } from "../../../lib/supabase";
import { sendCryptoReviewNotification, sendShippingConfirmation } from "../../../lib/notifications";
import { completeOrder } from "../../../lib/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await createAdminSupabase().from("orders")
    .select("id,order_number,customer_name,customer_email,currency,total,payment_gateway,payment_status,fulfillment_status,tracking_number,tracking_url,carrier,created_at,order_items(product_name,quantity,selected_size),crypto_payments(id,network,amount_sent,transaction_reference,review_status,review_note,submitted_at)")
    .order("created_at", { ascending: false }).limit(100);
  if (error) return Response.json({ error: "Orders could not be loaded" }, { status: 500 });
  return Response.json({ orders: data });
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const input = await request.json() as { id?: string; fulfillmentStatus?: string; trackingNumber?: string; trackingUrl?: string; carrier?: string; cryptoDecision?: "approved" | "rejected"; reviewNote?: string };
  if (input.id && input.cryptoDecision) {
    const supabase = createAdminSupabase();
    const { data: crypto } = await supabase.from("crypto_payments").select("id,order_id,review_status,orders(payment_status,payment_gateway)").eq("order_id", input.id).maybeSingle();
    if (!crypto || crypto.review_status !== "submitted") return Response.json({ error: "This crypto payment is no longer awaiting review." }, { status: 409 });
    const linkedOrder = Array.isArray(crypto.orders) ? crypto.orders[0] : crypto.orders;
    if (!linkedOrder || linkedOrder.payment_gateway !== "crypto" || linkedOrder.payment_status !== "pending") return Response.json({ error: "Only pending crypto orders can be reviewed." }, { status: 409 });
    if (input.cryptoDecision === "approved") {
      try {
        await completeOrder(input.id, `crypto:${crypto.id}`);
      } catch {
        return Response.json({ error: "Payment could not be approved. Check inventory and order status." }, { status: 409 });
      }
    } else {
      const { error: orderError } = await supabase.from("orders").update({ payment_status: "failed", fulfillment_status: "cancelled" }).eq("id", input.id).eq("payment_status", "pending");
      if (orderError) return Response.json({ error: "Payment rejection could not be saved." }, { status: 500 });
    }
    const { error } = await supabase.from("crypto_payments").update({ review_status: input.cryptoDecision, review_note: input.reviewNote?.trim().slice(0, 500) || null, reviewed_at: new Date().toISOString() }).eq("id", crypto.id).eq("review_status", "submitted");
    if (error) return Response.json({ error: "Payment review could not be completed." }, { status: 500 });
    if (input.cryptoDecision === "rejected") await sendCryptoReviewNotification(input.id, "rejected").catch((notificationError) => console.error("Crypto rejection email failed", { message: notificationError instanceof Error ? notificationError.message : "Unknown error" }));
    return Response.json({ order: { id: input.id, payment_status: input.cryptoDecision === "approved" ? "paid" : "failed", fulfillment_status: input.cryptoDecision === "approved" ? "processing" : "cancelled" }, cryptoDecision: input.cryptoDecision });
  }
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
