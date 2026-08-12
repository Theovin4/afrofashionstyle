import Link from "next/link";
import { BrandLogo } from "../components/brand-logo";
import { Turnstile } from "../components/turnstile";

export const metadata = { title: "Recover administrator access", robots: { index: false, follow: false } };

export default async function AdminResetRequest({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const { error, sent } = await searchParams;
  return <main className="status-page"><form className="status-card admin-login-card" action="/api/admin/password-reset" method="post">
    <BrandLogo variant="status" priority/>
    <span className="eyebrow">Secure account recovery</span>
    <h1>Reset your password</h1>
    <p>We will send a secure, single-use recovery link to the configured Commerce Studio administrator.</p>
    <Turnstile action="admin_password_reset"/>
    {sent === "1" && <p className="admin-auth-success" role="status">Recovery email sent. Check the administrator inbox and spam folder.</p>}
    {error === "security" && <p className="payment-error" role="alert">The security check did not complete. Refresh and try again.</p>}
    {error === "rate" && <p className="payment-error" role="alert">Too many recovery requests. Please wait one hour before trying again.</p>}
    {error === "service" && <p className="payment-error" role="alert">Recovery is temporarily unavailable. Please try again shortly.</p>}
    {!sent && <button className="checkout-submit">Send recovery email</button>}
    <Link className="text-link" href="/admin-login">Return to sign in</Link>
  </form></main>;
}
