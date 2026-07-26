import { createHash } from "node:crypto";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PIXEL_ID = "4611600329085591";
const ALLOWED_EVENTS = new Set([
  "PageView",
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
  "AddPaymentInfo",
  "Lead",
  "Purchase",
]);

type MetaEventRequest = {
  eventName?: string;
  eventId?: string;
  sourceUrl?: string;
  customData?: Record<string, unknown>;
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    fbp?: string;
    fbc?: string;
  };
};

function hash(value?: string) {
  const normalized = value?.trim().toLowerCase();
  return normalized ? createHash("sha256").update(normalized).digest("hex") : undefined;
}

function compact<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== ""));
}

export async function POST(request: NextRequest) {
  const requestOrigin = request.headers.get("origin");
  if (requestOrigin && requestOrigin !== request.nextUrl.origin) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }

  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!token) {
    return Response.json({ error: "Conversions API is not configured" }, { status: 503 });
  }

  const body = (await request.json()) as MetaEventRequest;
  if (!body.eventName || !ALLOWED_EVENTS.has(body.eventName) || !body.eventId) {
    return Response.json({ error: "Invalid event" }, { status: 400 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim();
  const user = body.userData ?? {};
  let sourceFbclid: string | undefined;
  try {
    const candidate = new URL(body.sourceUrl || request.nextUrl.origin).searchParams.get("fbclid")?.trim();
    if (candidate && /^[A-Za-z0-9_.-]{8,500}$/.test(candidate)) sourceFbclid = candidate;
  } catch {
    sourceFbclid = undefined;
  }
  const derivedFbc = sourceFbclid ? `fb.1.${Date.now()}.${sourceFbclid}` : undefined;
  const userData = compact({
    em: hash(user.email),
    ph: hash(user.phone?.replace(/[^\d+]/g, "")),
    fn: hash(user.firstName),
    ln: hash(user.lastName),
    ct: hash(user.city),
    st: hash(user.state),
    zp: hash(user.zip),
    country: hash(user.country),
    client_ip_address: clientIp,
    client_user_agent: request.headers.get("user-agent") ?? undefined,
    fbp: user.fbp,
    fbc: user.fbc || derivedFbc,
  });

  const payload: Record<string, unknown> = {
    data: [{
      event_name: body.eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: body.eventId,
      event_source_url: body.sourceUrl || request.nextUrl.origin,
      action_source: "website",
      user_data: userData,
      custom_data: body.customData ?? {},
    }],
  };

  if (process.env.META_CAPI_TEST_EVENT_CODE) {
    payload.test_event_code = process.env.META_CAPI_TEST_EVENT_CODE;
  }

  const apiVersion = process.env.META_GRAPH_API_VERSION || "v22.0";
  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const result = await response.json();

  if (!response.ok) {
    console.error("Meta CAPI rejected an event", { status: response.status, result });
    return Response.json({ error: "Meta rejected the event" }, { status: 502 });
  }

  return Response.json({ accepted: true, eventsReceived: result.events_received ?? 1 });
}
