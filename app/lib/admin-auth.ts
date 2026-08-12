import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createAuthSupabase, isAuthorizedAdminUser } from "./supabase-auth";

export const adminCookieName = "afro_admin";
const configuredPassword = () => process.env.ADMIN_PASSWORD || "";
const sessionToken = () => {
  const secret = configuredPassword();
  return secret ? createHmac("sha256", secret).update("afro-fashionstyle-admin-v1").digest("hex") : "";
};

export function validAdminPassword(candidate: string) {
  const expected = Buffer.from(configuredPassword());
  const received = Buffer.from(candidate);
  return expected.length > 0 && expected.length === received.length && timingSafeEqual(expected, received);
}

async function validLegacySession() {
  const value = (await cookies()).get(adminCookieName)?.value || "";
  const expected = sessionToken();
  return !!value && !!expected && value.length === expected.length && timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}

export async function isAdminBase() {
  try {
    const supabase = await createAuthSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (user && isAuthorizedAdminUser(user)) return true;
  } catch {
    // Preserve the explicitly enabled transition fallback.
  }
  return process.env.ALLOW_LEGACY_ADMIN_AUTH === "true" && validLegacySession();
}

export async function isAdmin() {
  if (!(await isAdminBase())) return false;
  if (process.env.ADMIN_REQUIRE_MFA !== "true") return true;
  try {
    const supabase = await createAuthSupabase();
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    return !error && data.currentLevel === "aal2";
  } catch {
    return false;
  }
}

export const adminSessionToken = sessionToken;
