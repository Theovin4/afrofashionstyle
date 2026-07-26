import { NextResponse } from "next/server";
import { adminCookieName } from "../../../lib/admin-auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/admin-login", request.url), 303);
  response.cookies.set(adminCookieName, "", { path: "/", expires: new Date(0) });
  return response;
}
