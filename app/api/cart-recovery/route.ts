import { createAdminSupabase } from "../../lib/supabase";
import { enforceRateLimit, payloadError, readLimitedJson } from "../../lib/security";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "cart-recovery", 10, 60 * 60);
  if (limited) return limited;
  let input: { email?: string; name?: string; currency?: string; items?: string[]; subtotal?: number; consent?: boolean };
  try { input = await readLimitedJson(request, 16_384); } catch (error) { return payloadError(error); }
  if (!input.consent || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email || "") || !["USD", "GBP"].includes(input.currency || "") || !Array.isArray(input.items) || !input.items.length) {
    return Response.json({ skipped: true });
  }
  const recoverAfter = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error } = await createAdminSupabase().from("abandoned_carts").insert({
    email: input.email!.trim().toLowerCase(), customer_name: input.name?.trim() || null, currency: input.currency,
    items: input.items.slice(0, 20), subtotal: Number(input.subtotal || 0), consent: true, recover_after: recoverAfter,
  });
  if (error) return Response.json({ error: "Recovery preference could not be saved" }, { status: 500 });
  return Response.json({ saved: true });
}

export async function DELETE(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) return Response.json({ error: "Invalid unsubscribe link" }, { status: 400 });
  await createAdminSupabase().from("abandoned_carts").update({ status: "unsubscribed", updated_at: new Date().toISOString() }).eq("recovery_token", token);
  return Response.json({ success: true });
}
