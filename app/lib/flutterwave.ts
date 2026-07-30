import { completeOrder } from "./orders";
import { createAdminSupabase } from "./supabase";
import { sendVerifiedPurchaseForOrder } from "./meta-purchase";

type VerifiedTransaction = {
  id: number | string;
  tx_ref: string;
  status: string;
  amount: number;
  currency: string;
};

export async function verifyAndCompleteFlutterwave(transactionId: string | number) {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) throw new Error("Flutterwave is not configured");
  const response = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(String(transactionId))}/verify`, {
    headers: { authorization: `Bearer ${secretKey}` },
    cache: "no-store",
  });
  const result = await response.json() as { status?: string; data?: VerifiedTransaction };
  if (!response.ok || result.status !== "success" || !result.data) throw new Error("Flutterwave verification failed");
  const transaction = result.data;
  if (transaction.status !== "successful") throw new Error("Flutterwave payment is not successful");
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
