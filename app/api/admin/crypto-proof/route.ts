import { v2 as cloudinary } from "cloudinary";
import { isAdmin } from "../../../lib/admin-auth";
import { createAdminSupabase } from "../../../lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "Invalid payment proof." }, { status: 400 });
  const { data } = await createAdminSupabase().from("crypto_payments").select("proof_public_id").eq("id", id).maybeSingle();
  if (!data?.proof_public_id) return Response.json({ error: "Payment proof was not found." }, { status: 404 });
  cloudinary.config({ cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
  const signedUrl = cloudinary.url(data.proof_public_id, { type: "authenticated", sign_url: true, secure: true, transformation: [{ quality: "auto", fetch_format: "auto" }] });
  return Response.redirect(signedUrl, 302);
}
