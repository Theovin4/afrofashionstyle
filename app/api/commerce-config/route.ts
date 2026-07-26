import { createAdminSupabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminSupabase();
  const [{ data: shipping }, { data: settings }] = await Promise.all([
    supabase.from("shipping_rules").select("country,currency,name,rate,free_over,second_item_rate,additional_item_rate,delivery_min_days,delivery_max_days").eq("active", true),
    supabase.from("site_settings").select("key,value").in("key", ["contact", "socials", "business"]),
  ]);
  return Response.json({ shipping: shipping || [], settings: Object.fromEntries((settings || []).map((row) => [row.key, row.value])) });
}
