import { createAdminSupabase } from "../../../lib/supabase";

export async function POST(request: Request) {
  const input = await request.json() as { code?: string; currency?: string; subtotal?: number };
  const code = input.code?.trim().toUpperCase();
  const subtotal = Number(input.subtotal);
  if (!code || !["USD", "GBP"].includes(input.currency || "") || !Number.isFinite(subtotal)) return Response.json({ error: "Enter a valid discount code" }, { status: 400 });
  const { data } = await createAdminSupabase().from("discount_codes").select("code,kind,value,currency,minimum_order,max_uses,uses,starts_at,ends_at").eq("code", code).eq("active", true).maybeSingle();
  const now = new Date().toISOString();
  if (!data || (data.currency && data.currency !== input.currency) || subtotal < Number(data.minimum_order) || (data.max_uses && data.uses >= data.max_uses) || (data.starts_at && data.starts_at > now) || (data.ends_at && data.ends_at < now)) {
    return Response.json({ error: "This code is not available for your order" }, { status: 404 });
  }
  const amount = data.kind === "percent" ? subtotal * Math.min(Number(data.value), 100) / 100 : Math.min(Number(data.value), subtotal);
  return Response.json({ code, amount: Math.round(amount * 100) / 100 });
}
