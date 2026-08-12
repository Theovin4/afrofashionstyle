import { NextResponse } from "next/server";
import { createAuthSupabase } from "../../lib/supabase-auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") === "/admin-reset" ? "/admin-reset" : "/admin-login";
  if (!code) return NextResponse.redirect(new URL("/admin-login?error=service", url.origin));
  const supabase = await createAuthSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.warn("[admin-auth] recovery callback rejected", { authCode: error.code || "unknown" });
    return NextResponse.redirect(new URL("/admin-login?error=service", url.origin));
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
