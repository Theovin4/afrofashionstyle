import { NextResponse } from "next/server";
import { adminCookieName, adminSessionToken, validAdminPassword } from "../../../lib/admin-auth";
import { enforceRateLimit, verifyTurnstile } from "../../../lib/security";
import { createAuthSupabase, isAuthorizedAdminUser } from "../../../lib/supabase-auth";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "admin-login", 5, 15 * 60);
  if (limited) return limited;
  if (Number(request.headers.get("content-length") || 0) > 8_192) {
    return Response.json({ error: "Request is too large." }, { status: 413 });
  }
  const form = await request.formData();
  if (!(await verifyTurnstile(request, String(form.get("cf-turnstile-response") || "")))) {
    return NextResponse.redirect(new URL("/admin-login?error=security", request.url), 303);
  }
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  if (email) {
    const supabase = await createAuthSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user || !isAuthorizedAdminUser(data.user)) {
      if (data.session) await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/admin-login?error=1", request.url), 303);
    }
    return NextResponse.redirect(new URL(process.env.ADMIN_REQUIRE_MFA === "true" ? "/admin-security" : "/admin", request.url), 303);
  }
  if (process.env.ALLOW_LEGACY_ADMIN_AUTH === "false" || !validAdminPassword(password)) {
    return NextResponse.redirect(new URL("/admin-login?error=1", request.url), 303);
  }
  const response = NextResponse.redirect(new URL("/admin", request.url), 303);
  response.cookies.set(adminCookieName, adminSessionToken(), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 8,
  });
  return response;
}
