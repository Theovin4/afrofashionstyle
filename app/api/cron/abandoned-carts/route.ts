import { createAdminSupabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.CRON_SECRET && request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM;
  if (!apiKey || !from) return Response.json({ skipped: true, reason: "Email provider is not configured" });
  const supabase = createAdminSupabase();
  const { data: carts } = await supabase.from("abandoned_carts").select("id,email,customer_name,currency,subtotal,recovery_token").eq("status", "pending").eq("consent", true).lte("recover_after", new Date().toISOString()).limit(50);
  let sent = 0;
  for (const cart of carts || []) {
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" }, body: JSON.stringify({
      from, to: [cart.email], subject: "Your Afro.Fashionstyle selection is still waiting",
      html: `<div style="font-family:Arial,sans-serif;color:#33140c;max-width:620px;margin:auto"><h1>Your story is still waiting.</h1><p>Hi ${cart.customer_name || "there"}, the pieces you selected are still in your bag.</p><p><b>Bag value: ${cart.currency} ${Number(cart.subtotal).toFixed(2)}</b></p><p><a href="https://afro-fashionstyle.vercel.app/shop">Return to your selection</a></p><p style="font-size:11px">You received this one-time reminder because you requested a saved-cart reminder during checkout.</p></div>`,
    }) });
    await supabase.from("abandoned_carts").update({ status: response.ok ? "sent" : "failed", updated_at: new Date().toISOString() }).eq("id", cart.id);
    if (response.ok) sent++;
  }
  return Response.json({ processed: carts?.length || 0, sent });
}
