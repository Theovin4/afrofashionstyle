import { v2 as cloudinary } from "cloudinary";
import { createPendingOrder, type CheckoutRequest } from "../../../lib/orders";
import { createAdminSupabase } from "../../../lib/supabase";
import { enforceRateLimit } from "../../../lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const addresses = {
  usdt_trc20: "TScypKhj7VmE9CrXAFn2EAKLcBG9qjwYoL",
  usdt_bep20: "0xebc426c64ee3434d5e824e926b627039a21b48a1",
  usdt_sol: "3jgQ5Grn9awRoq1tux6zamrKaw91jQCgSRH6puE1Fokj",
  btc: "17Z41xvrwHRJtNNtFv1apomwHn6yAjKFnQ",
} as const;
const allowedProofTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxProofBytes = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "crypto-checkout", 5, 15 * 60);
  if (limited) return limited;
  let orderId: string | undefined;
  let uploadedPublicId: string | undefined;
  try {
    const form = await request.formData();
    const rawCheckout = String(form.get("checkout") || "");
    if (rawCheckout.length > 32_768) return Response.json({ error: "Checkout details are too large." }, { status: 413 });
    const input = JSON.parse(rawCheckout) as CheckoutRequest;
    const network = String(form.get("network") || "") as keyof typeof addresses;
    const amountSent = String(form.get("amountSent") || "").trim();
    const transactionReference = String(form.get("transactionReference") || "").trim();
    const proof = form.get("proof");
    if (!addresses[network]) return Response.json({ error: "Choose a supported cryptocurrency network." }, { status: 400 });
    if (!/^[0-9., ]{1,40}\s*[A-Za-z]{2,10}$/.test(amountSent)) return Response.json({ error: "Enter the amount and asset sent, for example 100 USDT." }, { status: 400 });
    if (!/^[A-Za-z0-9:_-]{6,180}$/.test(transactionReference)) return Response.json({ error: "Enter a valid transaction hash or reference." }, { status: 400 });
    if (!(proof instanceof File) || !allowedProofTypes.has(proof.type) || proof.size < 1 || proof.size > maxProofBytes) {
      return Response.json({ error: "Upload a JPG, PNG or WebP payment proof under 5MB." }, { status: 400 });
    }
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
    if (!cloudName || !apiKey || !apiSecret) return Response.json({ error: "Payment proof storage is unavailable." }, { status: 503 });
    const { order } = await createPendingOrder(input, "crypto", {
      clientIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") || undefined,
      sourceUrl: `${new URL(request.url).origin}/checkout`,
    });
    orderId = order.id;
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
    const bytes = Buffer.from(await proof.arrayBuffer());
    const uploaded = await new Promise<{ public_id: string; secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({
        folder: "afro-fashionstyle/payment-proofs",
        resource_type: "image",
        type: "authenticated",
        tags: ["afro-fashionstyle", "crypto-proof"],
        context: { order_number: order.order_number },
      }, (error, result) => {
        if (error || !result?.public_id || !result.secure_url) reject(error || new Error("Incomplete proof upload"));
        else resolve({ public_id: result.public_id, secure_url: result.secure_url });
      });
      stream.end(bytes);
    });
    uploadedPublicId = uploaded.public_id;
    const { error } = await createAdminSupabase().from("crypto_payments").insert({
      order_id: order.id,
      network,
      deposit_address: addresses[network],
      amount_sent: amountSent,
      transaction_reference: transactionReference,
      proof_url: uploaded.secure_url,
      proof_public_id: uploaded.public_id,
    });
    if (error) throw error;
    const message = `Hello Afro.Fashionstyle, I submitted crypto payment proof for order ${order.order_number}. Network: ${network.replaceAll("_", " ").toUpperCase()}. Amount sent: ${amountSent}. Please confirm my payment.`;
    return Response.json({ orderNumber: order.order_number, whatsappUrl: `https://wa.me/2347049841931?text=${encodeURIComponent(message)}` });
  } catch (error) {
    const supabase = createAdminSupabase();
    if (orderId) await supabase.from("orders").delete().eq("id", orderId);
    if (uploadedPublicId) {
      cloudinary.config({ cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
      await cloudinary.uploader.destroy(uploadedPublicId, { type: "authenticated", invalidate: true }).catch(() => undefined);
    }
    console.error("Crypto checkout submission failed", { message: error instanceof Error ? error.message : "Unknown error" });
    return Response.json({ error: error instanceof SyntaxError ? "Invalid checkout details." : "Payment proof could not be submitted. Please try again." }, { status: error instanceof SyntaxError ? 400 : 500 });
  }
}
