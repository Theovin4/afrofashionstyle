import { createAdminSupabase } from "../../../lib/supabase";
import { brandedEmail } from "../../../lib/notifications";

export const dynamic = "force-dynamic";

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM;
  if (!apiKey || !from) return Response.json({ skipped: true, reason: "Email provider is not configured" });
  const supabase = createAdminSupabase();
  const { data: carts } = await supabase.from("abandoned_carts").select("id,email,customer_name,currency,subtotal,recovery_token").eq("status", "pending").eq("consent", true).lte("recover_after", new Date().toISOString()).limit(50);
  let sent = 0;
  for (const cart of carts || []) {
    const customerName = escapeHtml(cart.customer_name || "there");
    const currency = escapeHtml(cart.currency);
    const subtotal = Number(cart.subtotal);
    const formattedSubtotal = Number.isFinite(subtotal) ? subtotal.toFixed(2) : "0.00";
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" }, body: JSON.stringify({
      from, to: [cart.email], subject: "Your Afro.Fashionstyle selection is still waiting",
      html: brandedEmail(`<h1 style="font-family:Georgia,serif;font-size:34px;line-height:1.1;margin:0 0 20px">Your selection is still waiting.</h1><p>Hi ${customerName}, the pieces you selected are still in your bag.</p><p style="font-size:18px"><b>Bag value: ${currency} ${formattedSubtotal}</b></p><p><a href="https://afro-fashionstyle.vercel.app/shop" style="display:inline-block;background:#e99424;color:#24100b;padding:12px 20px;text-decoration:none;font-weight:bold">Return to your selection</a></p><p style="font-size:11px">You received this one-time reminder because you requested a saved-cart reminder during checkout.</p>`, "Your Afro.Fashionstyle selection is still waiting"),
    }) });
    await supabase.from("abandoned_carts").update({ status: response.ok ? "sent" : "failed", updated_at: new Date().toISOString() }).eq("id", cart.id);
    if (response.ok) sent++;
  }
  return Response.json({ processed: carts?.length || 0, sent });
}
