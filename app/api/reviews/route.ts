import { createAdminSupabase } from "../../lib/supabase";

export async function POST(request: Request) {
  const input = await request.json() as { productId?: string; name?: string; email?: string; rating?: number; title?: string; body?: string };
  if (!input.productId || !/^[0-9a-f-]{36}$/i.test(input.productId) || !input.name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email || "") || !Number.isInteger(input.rating) || Number(input.rating) < 1 || Number(input.rating) > 5 || (input.body?.trim().length || 0) < 10) {
    return Response.json({ error: "Please complete every review field" }, { status: 400 });
  }
  const supabase = createAdminSupabase();
  const { data: purchase } = await supabase.from("orders").select("id,order_items!inner(product_id)")
    .eq("customer_email", input.email!.trim().toLowerCase()).eq("payment_status", "paid").eq("order_items.product_id", input.productId).limit(1).maybeSingle();
  const { error } = await supabase.from("product_reviews").insert({
    product_id: input.productId, customer_name: input.name.trim(), customer_email: input.email!.trim().toLowerCase(),
    rating: input.rating, title: input.title?.trim() || "", body: input.body!.trim(), verified_purchase: !!purchase,
  });
  if (error) return Response.json({ error: "Review could not be submitted" }, { status: 500 });
  return Response.json({ success: true, message: "Thank you. Your review will appear after approval." }, { status: 201 });
}
