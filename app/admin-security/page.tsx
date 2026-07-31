import { redirect } from "next/navigation";
import { isAdminBase } from "../lib/admin-auth";
import { AdminMfa } from "./admin-mfa";
import { BrandLogo } from "../components/brand-logo";

export const metadata = { title: "Admin security", robots: { index: false, follow: false } };

export default async function AdminSecurityPage() {
  if (!(await isAdminBase())) redirect("/admin-login");
  return <main className="status-page">
    <section className="status-card admin-login-card">
      <BrandLogo variant="status" priority/>
      <span className="eyebrow">Account security</span>
      <h1>Two-step verification</h1>
      <p>Use an authenticator app to protect Commerce Studio.</p>
      <AdminMfa/>
    </section>
  </main>;
}
