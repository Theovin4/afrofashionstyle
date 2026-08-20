import { enforceRateLimit } from "../../lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const countryNames = { US: "United States", GB: "United Kingdom" } as const;
const safeLocation = /^[\p{L}\p{M} .'-]{1,100}$/u;

async function countriesNow(path: string, body: Record<string, string>) {
  const response = await fetch(`https://countriesnow.space/api/v0.1/countries/${path}`, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error("Location directory unavailable");
  return response.json() as Promise<{ error?: boolean; data?: unknown }>;
}

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request, "checkout-locations", 60, 15 * 60);
  if (limited) return limited;
  const url = new URL(request.url);
  const country = url.searchParams.get("country") as keyof typeof countryNames | null;
  const state = url.searchParams.get("state")?.trim();
  const stateCode = url.searchParams.get("stateCode")?.trim();
  const city = url.searchParams.get("city")?.trim();
  if (!country || !countryNames[country]) return Response.json({ error: "Choose the United States or United Kingdom." }, { status: 400 });
  if ((state && !safeLocation.test(state)) || (city && !safeLocation.test(city)) || (stateCode && !/^[A-Za-z-]{1,10}$/.test(stateCode))) {
    return Response.json({ error: "Invalid location selection." }, { status: 400 });
  }
  try {
    if (!state) {
      const result = await countriesNow("states", { country: countryNames[country] });
      const data = result.data as { states?: Array<{ name?: string; state_code?: string }> } | undefined;
      const states = (data?.states || []).filter((item) => item.name).map((item) => ({ name: item.name!, code: item.state_code || "" })).slice(0, 100);
      return Response.json({ states }, { headers: { "cache-control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
    }
    if (!city) {
      const result = await countriesNow("state/cities", { country: countryNames[country], state });
      const cities = Array.isArray(result.data) ? [...new Set(result.data.filter((item): item is string => typeof item === "string" && safeLocation.test(item)))].sort().slice(0, 1000) : [];
      return Response.json({ cities }, { headers: { "cache-control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
    }
    const region = country === "US" ? stateCode || state : state;
    const response = await fetch(`https://api.zippopotam.us/${country}/${encodeURIComponent(region)}/${encodeURIComponent(city)}`, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
    if (!response.ok) return Response.json({ postalCodes: [] });
    const data = await response.json() as { places?: Array<{ "post code"?: string }> };
    const postalCodes = [...new Set((data.places || []).map((place) => place["post code"]).filter((code): code is string => Boolean(code)))].sort();
    return Response.json({ postalCodes: postalCodes.slice(0, 100) }, { headers: { "cache-control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch {
    return Response.json({ error: "The address directory is temporarily unavailable. Please try again." }, { status: 502 });
  }
}
