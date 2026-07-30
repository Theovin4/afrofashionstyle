import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { enforceRateLimit, payloadError, readLimitedJson } from "../../../lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PIXEL_ID = "4611600329085591";
const ALLOWED_EVENTS = new Set([
  "PageView",
  "ViewContent",
  "Search",
  "AddToCart",
  "InitiateCheckout",
  "Contact",
  "AddPaymentInfo",
  "Lead",
  "Purchase",
]);

type MetaEventRequest = {
  consent?: boolean;
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
    externalId?: string;
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
  const limited = await enforceRateLimit(request, "meta-event", 120, 60);
  if (limited) return limited;
  const requestOrigin = request.headers.get("origin");
  if (requestOrigin && requestOrigin !== request.nextUrl.origin) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }

  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!token) {
    return Response.json({ error: "Conversions API is not configured" }, { status: 503 });
  }

  let body: MetaEventRequest;
  try { body = await readLimitedJson(request, 16_384); } catch (error) { return payloadError(error); }
  if (body.consent !== true || !body.eventName || !ALLOWED_EVENTS.has(body.eventName) || !body.eventId || !/^[A-Za-z0-9:_-]{8,160}$/.test(body.eventId)) {
    return Response.json({ error: "Invalid event" }, { status: 400 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim();
  const user = body.userData ?? {};
  let sourceFbclid: string | undefined;
  let eventSourceUrl = request.nextUrl.origin;
  try {
    const source = new URL(body.sourceUrl || request.nextUrl.origin);
    if (source.origin !== request.nextUrl.origin) return Response.json({ error: "Invalid source URL" }, { status: 400 });
    const candidate = source.searchParams.get("fbclid")?.trim();
    if (candidate && /^[A-Za-z0-9_.-]{8,500}$/.test(candidate)) sourceFbclid = candidate;
    eventSourceUrl = `${source.origin}${source.pathname}`;
  } catch {
    sourceFbclid = undefined;
  }
  const derivedFbc = sourceFbclid ? `fb.1.${Date.now()}.${sourceFbclid}` : undefined;
  const fbp = user.fbp && /^fb\.1\.\d{10,16}\.[A-Za-z0-9._-]{4,200}$/.test(user.fbp) ? user.fbp : undefined;
  const fbc = user.fbc && /^fb\.1\.\d{10,16}\.[A-Za-z0-9._-]{8,500}$/.test(user.fbc) ? user.fbc : derivedFbc;
  const userData = compact({
    em: hash(user.email),
    ph: hash(user.phone?.replace(/[^\d+]/g, "")),
    fn: hash(user.firstName),
    ln: hash(user.lastName),
    ct: hash(user.city),
    st: hash(user.state),
    zp: hash(user.zip),
    country: hash(user.country),
    external_id: hash(user.externalId),
    client_ip_address: clientIp,
    client_user_agent: request.headers.get("user-agent") ?? undefined,
    fbp,
    fbc,
  });

  const payload: Record<string, unknown> = {
    data: [{
      event_name: body.eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: body.eventId,
      event_source_url: eventSourceUrl,
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
  const result = await response.json() as { events_received?: number };

  if (!response.ok) {
    console.error("Meta CAPI rejected an event", { status: response.status, eventName: body.eventName, eventId: body.eventId });
    return Response.json({ error: "Meta rejected the event" }, { status: 502 });
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[Meta CAPI]", { eventName: body.eventName, eventId: body.eventId });
  }

  return Response.json({ accepted: true, eventsReceived: result.events_received ?? 1 });
}
