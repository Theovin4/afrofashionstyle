import { createAdminSupabase } from "../../lib/supabase";

export async function POST(request: Request) {
  const input = await request.json() as { email?: string; name?: string; currency?: string; items?: string[]; subtotal?: number; consent?: boolean };
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
