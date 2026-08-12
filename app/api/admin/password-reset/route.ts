import { NextResponse } from "next/server";
import { enforceRateLimit, verifyTurnstile } from "../../../lib/security";
import { createAuthSupabase } from "../../../lib/supabase-auth";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "admin-password-reset", 3, 60 * 60);
  if (limited) {
    console.warn("[admin-auth] recovery rejected", { reason: "rate_limited" });
    return NextResponse.redirect(new URL("/admin-reset-request?error=rate", request.url), 303);
  }
  if (Number(request.headers.get("content-length") || 0) > 8_192) {
    return NextResponse.redirect(new URL("/admin-reset-request?error=service", request.url), 303);
  }
  const form = await request.formData();
  if (!(await verifyTurnstile(request, String(form.get("cf-turnstile-response") || "")))) {
    console.warn("[admin-auth] recovery rejected", { reason: "security_check" });
    return NextResponse.redirect(new URL("/admin-reset-request?error=security", request.url), 303);
  }
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) {
    console.error("[admin-auth] recovery unavailable", { reason: "missing_admin_email" });
    return NextResponse.redirect(new URL("/admin-reset-request?error=service", request.url), 303);
  }
  const supabase = await createAuthSupabase();
  const callback = new URL("/auth/callback", request.url);
  callback.searchParams.set("next", "/admin-reset");
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: callback.toString() });
  if (error) {
    console.error("[admin-auth] recovery failed", { authCode: error.code || "unknown" });
    return NextResponse.redirect(new URL("/admin-reset-request?error=service", request.url), 303);
  }
  console.info("[admin-auth] recovery email requested");
  return NextResponse.redirect(new URL("/admin-reset-request?sent=1", request.url), 303);
}
