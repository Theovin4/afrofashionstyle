import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createAuthSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (values) => {
          try {
            values.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Components cannot write refreshed cookies; route handlers can.
          }
        },
      },
    },
  );
}

export function isAuthorizedAdminUser(user: { email?: string }) {
  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return !!configuredEmail && user.email?.toLowerCase() === configuredEmail;
}
