import { isAdmin } from "../../../lib/admin-auth";
import { createAdminSupabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createAdminSupabase();
  const [{ data: discounts }, { data: shipping }, { data: reviews }, { data: settings }] = await Promise.all([
    supabase.from("discount_codes").select("*").order("created_at", { ascending: false }),
    supabase.from("shipping_rules").select("*").order("country"),
    supabase.from("product_reviews").select("id,customer_name,rating,title,body,status,created_at,products(name)").order("created_at", { ascending: false }).limit(50),
    supabase.from("site_settings").select("key,value"),
  ]);
  return Response.json({ discounts: discounts || [], shipping: shipping || [], reviews: reviews || [], settings: Object.fromEntries((settings || []).map((row) => [row.key, row.value])) });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const input = await request.json() as Record<string, unknown>;
  const supabase = createAdminSupabase();
  if (input.action === "create_discount") {
    const code = String(input.code || "").trim().toUpperCase();
    const value = Number(input.value);
    if (!/^[A-Z0-9_-]{3,30}$/.test(code) || !Number.isFinite(value) || value <= 0) return Response.json({ error: "Invalid discount" }, { status: 400 });
    const { error } = await supabase.from("discount_codes").insert({ code, kind: input.kind === "fixed" ? "fixed" : "percent", value, currency: input.currency === "USD" || input.currency === "GBP" ? input.currency : null, minimum_order: Number(input.minimumOrder || 0), active: true });
    if (error) return Response.json({ error: error.code === "23505" ? "That code already exists" : "Discount could not be created" }, { status: 400 });
  } else if (input.action === "moderate_review") {
    if (!["approved", "rejected"].includes(String(input.status))) return Response.json({ error: "Invalid review status" }, { status: 400 });
    await supabase.from("product_reviews").update({ status: input.status }).eq("id", input.id);
  } else if (input.action === "update_shipping") {
    await supabase.from("shipping_rules").update({ rate: Number(input.rate), free_over: input.freeOver === "" ? null : Number(input.freeOver), delivery_min_days: Number(input.minDays), delivery_max_days: Number(input.maxDays) }).eq("id", input.id);
  } else if (input.action === "update_settings") {
    const allowed = ["contact", "socials", "business"];
    if (!allowed.includes(String(input.key)) || typeof input.value !== "object" || !input.value) return Response.json({ error: "Invalid settings" }, { status: 400 });
    await supabase.from("site_settings").upsert({ key: input.key, value: input.value, updated_at: new Date().toISOString() });
  } else return Response.json({ error: "Unknown operation" }, { status: 400 });
  return Response.json({ success: true });
}
