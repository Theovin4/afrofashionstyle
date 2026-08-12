import { verifyAndCompleteFlutterwave } from "../../../lib/flutterwave";
import { enforceRateLimit, payloadError, readLimitedJson } from "../../../lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "flutterwave-verify", 15, 15 * 60);
  if (limited) return limited;
  let body: { transactionId?: string };
  try { body = await readLimitedJson(request, 8_192); } catch (error) { return payloadError(error); }
  if (!body.transactionId || !/^[A-Za-z0-9_-]{1,80}$/.test(body.transactionId)) {
    return Response.json({ error: "Invalid transaction reference" }, { status: 400 });
  }
  try {
    const verified = await verifyAndCompleteFlutterwave(body.transactionId);
    return Response.json({
      verified: true,
      orderNumber: verified.orderNumber,
      currency: verified.currency,
      total: verified.total,
      metaPurchase: verified.metaPurchase.browserEvent,
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Payment verification failed" }, { status: 409 });
  }
}
