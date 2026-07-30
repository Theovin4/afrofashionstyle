import { createAdminSupabase } from "../../lib/supabase";
import { enforceRateLimit, payloadError, readLimitedJson, verifyTurnstile } from "../../lib/security";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "newsletter", 5, 60 * 60);
  if (limited) return limited;
  let input: { email?: string; turnstileToken?: string };
  try { input = await readLimitedJson(request, 8_192); } catch (error) { return payloadError(error); }
  if (!(await verifyTurnstile(request, input.turnstileToken))) {
    return Response.json({ error: "Please complete the security check." }, { status: 403 });
  }
  const email = input.email?.trim().toLowerCase() || "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Enter a valid email address" }, { status: 400 });
  const { error } = await createAdminSupabase().from("newsletter_subscribers").upsert({ email, status: "subscribed", source: "website", updated_at: new Date().toISOString() }, { onConflict: "email" });
  if (error) return Response.json({ error: "Subscription could not be saved" }, { status: 500 });
  return Response.json({ success: true, message: "Welcome to the circle." });
}
