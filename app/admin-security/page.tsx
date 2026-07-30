import { redirect } from "next/navigation";
import Image from "next/image";
import { isAdminBase } from "../lib/admin-auth";
import { AdminMfa } from "./admin-mfa";

export const metadata = { title: "Admin security", robots: { index: false, follow: false } };

export default async function AdminSecurityPage() {
  if (!(await isAdminBase())) redirect("/admin-login");
  return <main className="status-page">
    <section className="status-card admin-login-card">
      <Image src="/afro-fashionstyle-logo.png" alt="Afro.Fashionstyle" width={260} height={130} priority/>
      <span className="eyebrow">Account security</span>
      <h1>Two-step verification</h1>
      <p>Use an authenticator app to protect Commerce Studio.</p>
      <AdminMfa/>
    </section>
  </main>;
}
