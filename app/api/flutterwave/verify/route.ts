import { verifyAndCompleteFlutterwave, verifyAndCompleteFlutterwavePaymentLink } from "../../../lib/flutterwave";
import { enforceRateLimit, payloadError, readLimitedJson } from "../../../lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "flutterwave-verify", 15, 15 * 60);
  if (limited) return limited;
  let body: { transactionId?: string; orderNumber?: string; trackingToken?: string };
  try { body = await readLimitedJson(request, 8_192); } catch (error) { return payloadError(error); }
  if (!body.transactionId || !/^[A-Za-z0-9_-]{1,80}$/.test(body.transactionId)) {
    return Response.json({ error: "Invalid transaction reference" }, { status: 400 });
  }
  try {
    const paymentLinkVerification = Boolean(body.orderNumber || body.trackingToken);
    if (paymentLinkVerification && (!body.orderNumber || !/^AF-\d{4}-[A-F0-9]{8}$/.test(body.orderNumber) || !body.trackingToken || !/^[0-9a-f-]{36}$/i.test(body.trackingToken))) {
      return Response.json({ error: "Invalid backup payment order." }, { status: 400 });
    }
    const verified = paymentLinkVerification
      ? await verifyAndCompleteFlutterwavePaymentLink(body.transactionId, body.orderNumber!, body.trackingToken!)
      : await verifyAndCompleteFlutterwave(body.transactionId);
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
