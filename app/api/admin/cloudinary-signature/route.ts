import { v2 as cloudinary } from "cloudinary";
import { isAdmin } from "../../../lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  if (!(await isAdmin())) return Response.json({ error: "Your administrator session has expired. Sign in again." }, { status: 401 });
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return Response.json({ error: "Product image storage is not configured." }, { status: 503 });

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "afro-fashionstyle/products";
  const tags = "afro-fashionstyle,product";
  const signature = cloudinary.utils.api_sign_request({ folder, tags, timestamp }, apiSecret);
  return Response.json({ cloudName, apiKey, timestamp, folder, tags, signature }, { headers: { "cache-control": "no-store" } });
}
