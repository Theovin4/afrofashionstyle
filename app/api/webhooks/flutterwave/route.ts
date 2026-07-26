import { createHmac, timingSafeEqual } from "node:crypto";
import { verifyAndCompleteFlutterwave } from "../../../lib/flutterwave";
import { createAdminSupabase } from "../../../lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
  if (!secretHash) return Response.json({ error: "Flutterwave webhook is not configured" }, { status: 503 });
  const rawBody = await request.text();
  const signature = request.headers.get("flutterwave-signature") || "";
  const expected = createHmac("sha256", secretHash).update(rawBody).digest("base64");
  if (!signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return Response.json({ error: "Invalid Flutterwave signature" }, { status: 401 });
  }
  let event: { id?: string; type?: string; data?: { id?: string | number; status?: string } };
  try { event = JSON.parse(rawBody) as typeof event; } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!event.id) return Response.json({ error: "Missing event ID" }, { status: 400 });
  const supabase = createAdminSupabase();
  const { data: existing } = await supabase.from("payment_events").select("id").eq("gateway", "flutterwave").eq("external_event_id", event.id).maybeSingle();
  if (existing) return Response.json({ received: true, duplicate: true });
  try {
    let orderId: string | null = null;
    if (event.type === "charge.completed" && event.data?.id && ["successful", "succeeded"].includes(String(event.data.status))) {
      const verified = await verifyAndCompleteFlutterwave(event.data.id);
      orderId = verified.orderId;
    }
    await supabase.from("payment_events").insert({
      gateway: "flutterwave", external_event_id: event.id, event_type: event.type || "unknown", order_id: orderId, payload: event,
    });
    return Response.json({ received: true });
  } catch (error) {
    console.error("Flutterwave webhook failed", error);
    return Response.json({ error: "Webhook processing failed" }, { status: 502 });
  }
}
