import { completeOrder } from "./orders";
import { createAdminSupabase } from "./supabase";
import { sendVerifiedPurchaseForOrder } from "./meta-purchase";

type VerifiedTransaction = {
  id: number | string;
  tx_ref: string;
  status: string;
  amount: number;
  currency: string;
  customer?: { email?: string };
};

async function getVerifiedTransaction(transactionId: string | number) {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY?.trim();
  if (!secretKey) throw new Error("Flutterwave is not configured");
  const response = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(String(transactionId))}/verify`, {
    headers: { authorization: `Bearer ${secretKey}`, accept: "application/json" }, cache: "no-store",
  });
  const result = await response.json() as { status?: string; data?: VerifiedTransaction };
  if (!response.ok || result.status !== "success" || !result.data) throw new Error("Flutterwave verification failed");
  if (result.data.status !== "successful") throw new Error("Flutterwave payment is not successful");
  return result.data;
}

export async function verifyAndCompleteFlutterwave(transactionId: string | number) {
  const transaction = await getVerifiedTransaction(transactionId);
  const supabase = createAdminSupabase();
  const { data: order } = await supabase.from("orders")
    .select("id,order_number,currency,total,payment_status,customer_email")
    .eq("order_number", transaction.tx_ref)
    .eq("payment_gateway", "flutterwave")
    .single();
  if (!order) throw new Error("Matching order was not found");
  if (order.currency !== transaction.currency || Number(transaction.amount) + 0.001 < Number(order.total)) {
    throw new Error("Flutterwave amount or currency did not match");
  }
  if (order.payment_status !== "paid") {
    await completeOrder(order.id, String(transaction.id));
  }
  const metaPurchase = await sendVerifiedPurchaseForOrder(order.id, "Flutterwave");
  return { orderNumber: order.order_number, currency: order.currency, total: Number(order.total), orderId: order.id, transaction, metaPurchase };
}

export async function verifyAndCompleteFlutterwavePaymentLink(transactionId: string | number, orderNumber: string, trackingToken: string) {
  const transaction = await getVerifiedTransaction(transactionId);
  const supabase = createAdminSupabase();
  const { data: order } = await supabase.from("orders").select("id,order_number,currency,total,payment_status,customer_email,provider_order_id").eq("order_number", orderNumber).eq("tracking_token", trackingToken).eq("payment_gateway", "flutterwave").maybeSingle();
  if (!order || order.provider_order_id !== `payment-link:${orderNumber}`) throw new Error("Matching backup-link order was not found");
  const verifiedEmail = transaction.customer?.email?.trim().toLowerCase();
  if (!verifiedEmail || verifiedEmail !== String(order.customer_email).trim().toLowerCase()) throw new Error("Flutterwave customer email did not match this order");
  if (order.currency !== transaction.currency || Number(transaction.amount) + 0.001 < Number(order.total)) throw new Error("Flutterwave amount or currency did not match this order");
  if (order.payment_status !== "paid") await completeOrder(order.id, String(transaction.id));
  const metaPurchase = await sendVerifiedPurchaseForOrder(order.id, "Flutterwave");
  return { orderNumber: order.order_number, currency: order.currency, total: Number(order.total), orderId: order.id, transaction, metaPurchase };
}
