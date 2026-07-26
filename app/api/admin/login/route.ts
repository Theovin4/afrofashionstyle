import { NextResponse } from "next/server";
import { adminCookieName, adminSessionToken, validAdminPassword } from "../../../lib/admin-auth";

export async function POST(request: Request) {
  const form = await request.formData();
  if (!validAdminPassword(String(form.get("password") || ""))) {
    return NextResponse.redirect(new URL("/admin-login?error=1", request.url), 303);
  }
  const response = NextResponse.redirect(new URL("/admin", request.url), 303);
  response.cookies.set(adminCookieName, adminSessionToken(), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 8,
  });
  return response;
}
