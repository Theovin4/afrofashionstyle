import { isAdmin } from "../../../lib/admin-auth";
import { createManualPaymentLink } from "../../../lib/payment-links";
import { createAdminSupabase } from "../../../lib/supabase";
import { payloadError, readLimitedJson } from "../../../lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await createAdminSupabase().from("payment_links")
    .select("id,status,expires_at,created_at,used_at,orders(order_number,customer_name,currency,total,payment_status)")
    .order("created_at", { ascending: false }).limit(100);
  if (error) return Response.json({ error: "Payment links could not be loaded." }, { status: 500 });
  return Response.json({ links: data || [] });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const input = await readLimitedJson<Record<string, unknown>>(request, 24_576);
    return Response.json({ link: await createManualPaymentLink(input, new URL(request.url).origin) }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE")) return payloadError(error);
    return Response.json({ error: error instanceof Error ? error.message : "Payment link could not be generated." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const input = await readLimitedJson<{ id?: string; status?: string }>(request, 4_096);
    if (!input.id || !/^[0-9a-f-]{36}$/i.test(input.id) || input.status !== "revoked") return Response.json({ error: "Invalid request." }, { status: 400 });
    const { error } = await createAdminSupabase().from("payment_links").update({ status: "revoked" }).eq("id", input.id).eq("status", "active");
    if (error) throw error;
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Payment link could not be revoked." }, { status: 400 });
  }
}
