import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

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

export async function isAdmin() {
  const value = (await cookies()).get(adminCookieName)?.value || "";
  const expected = sessionToken();
  return !!value && !!expected && value.length === expected.length && timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}

export const adminSessionToken = sessionToken;
