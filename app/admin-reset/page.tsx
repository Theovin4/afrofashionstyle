import { redirect } from "next/navigation";
import { BrandLogo } from "../components/brand-logo";
import { createAuthSupabase, isAuthorizedAdminUser } from "../lib/supabase-auth";
import { AdminPasswordForm } from "./password-form";

export const metadata = { title: "Choose a new administrator password", robots: { index: false, follow: false } };

export default async function AdminResetPage() {
  const supabase = await createAuthSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAuthorizedAdminUser(user)) redirect("/admin-login?error=service");
  return <main className="status-page"><section className="status-card admin-login-card">
    <BrandLogo variant="status" priority/>
    <span className="eyebrow">Secure account recovery</span>
    <h1>Choose a new password</h1>
    <p>Use at least 12 characters with upper and lowercase letters, a number and a symbol.</p>
    <AdminPasswordForm/>
  </section></main>;
}
