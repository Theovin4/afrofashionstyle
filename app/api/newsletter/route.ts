import { createAdminSupabase } from "../../lib/supabase";

export async function POST(request: Request) {
  const input = await request.json() as { email?: string };
  const email = input.email?.trim().toLowerCase() || "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Enter a valid email address" }, { status: 400 });
  const { error } = await createAdminSupabase().from("newsletter_subscribers").upsert({ email, status: "subscribed", source: "website", updated_at: new Date().toISOString() }, { onConflict: "email" });
  if (error) return Response.json({ error: "Subscription could not be saved" }, { status: 500 });
  return Response.json({ success: true, message: "Welcome to the circle." });
}
