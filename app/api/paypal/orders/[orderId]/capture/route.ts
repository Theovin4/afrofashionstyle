import { getPayPalAccessToken, paypalBaseUrl } from "../../../../../lib/paypal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  if (!/^[A-Z0-9]{1,36}$/.test(orderId)) {
    return Response.json({ error: "Invalid PayPal order ID" }, { status: 400 });
  }
  try {
    const accessToken = await getPayPalAccessToken();
    const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
        "paypal-request-id": `capture-${orderId}`,
      },
      body: "{}",
      cache: "no-store",
    });
    const result = await response.json() as {
      id?: string;
      status?: string;
      purchase_units?: Array<{
        payments?: { captures?: Array<{ amount?: { value?: string; currency_code?: string } }> };
      }>;
      details?: unknown;
    };
    if (!response.ok || result.status !== "COMPLETED") {
      console.error("PayPal order capture failed", { status: response.status, details: result.details });
      return Response.json({ error: "PayPal payment was not completed" }, { status: 409 });
    }
    const amount = result.purchase_units?.[0]?.payments?.captures?.[0]?.amount;
    return Response.json({
      completed: true,
      orderId: result.id || orderId,
      value: amount?.value,
      currency: amount?.currency_code,
    });
  } catch (error) {
    console.error("PayPal capture processing failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return Response.json({ error: "PayPal capture service is unavailable" }, { status: 502 });
  }
}
