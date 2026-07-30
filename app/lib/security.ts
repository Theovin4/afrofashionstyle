import { createHash, randomUUID } from "node:crypto";
import { createAdminSupabase } from "./supabase";

const MAX_JSON_BYTES = 32_768;

function clientIp(request: Request) {
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function fingerprint(request: Request) {
  return createHash("sha256")
    .update(`${clientIp(request)}|${request.headers.get("user-agent") || "unknown"}`)
    .digest("hex");
}

export async function enforceRateLimit(
  request: Request,
  scope: string,
  maximumRequests: number,
  windowSeconds: number,
) {
  const bucket = `${scope}:${fingerprint(request)}`;
  const { data, error } = await createAdminSupabase().rpc("consume_security_rate_limit", {
    bucket_key: bucket,
    maximum_requests: maximumRequests,
    window_seconds: windowSeconds,
  });
  if (error) {
    console.error("Security rate limit unavailable", { scope });
    return null;
  }
  const result = Array.isArray(data) ? data[0] : data;
  if (result?.allowed !== false) return null;
  return Response.json(
    { error: "Too many requests. Please wait and try again." },
    {
      status: 429,
      headers: { "retry-after": String(Math.max(1, Number(result.retry_after) || windowSeconds)) },
    },
  );
}

export async function readLimitedJson<T>(request: Request, maximumBytes = MAX_JSON_BYTES): Promise<T> {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > maximumBytes) throw new Error("PAYLOAD_TOO_LARGE");
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > maximumBytes) throw new Error("PAYLOAD_TOO_LARGE");
  return JSON.parse(raw) as T;
}

export function payloadError(error: unknown) {
  const tooLarge = error instanceof Error && error.message === "PAYLOAD_TOO_LARGE";
  return Response.json(
    { error: tooLarge ? "Request is too large." : "Invalid request." },
    { status: tooLarge ? 413 : 400 },
  );
}

export async function verifyTurnstile(request: Request, token?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!token || token.length > 2048) return false;
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        secret,
        response: token,
        remoteip: clientIp(request),
        idempotency_key: randomUUID(),
      }),
      cache: "no-store",
    });
    if (!response.ok) return false;
    const result = await response.json() as { success?: boolean; hostname?: string };
    if (!result.success) return false;
    const configuredHost = process.env.TURNSTILE_EXPECTED_HOSTNAME;
    return !configuredHost || result.hostname === configuredHost;
  } catch {
    return false;
  }
}
