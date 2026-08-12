import Link from "next/link";
import { Turnstile } from "../components/turnstile";
import { BrandLogo } from "../components/brand-logo";

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string; updated?: string }> }) {
  const { error, updated } = await searchParams;
  const usesSupabaseAuth = !!process.env.ADMIN_EMAIL;
  const errorMessage = {
    security: "The security check did not complete. Refresh the page and try again.",
    rate: "Too many sign-in attempts. Please wait 15 minutes before trying again.",
    service: "Administrator sign-in is temporarily unavailable. Please try again shortly.",
    credentials: "The email or password is incorrect.",
  }[error || ""] || (error ? "Sign-in could not be completed. Please try again." : "");
  return <main className="status-page">
    <form className="status-card admin-login-card" action="/api/admin/login" method="post">
      <BrandLogo variant="status" priority/>
      <span className="eyebrow">Commerce studio</span>
      <h1>Administrator access</h1>
      <p>Sign in to manage products, imagery, inventory and orders.</p>
      {usesSupabaseAuth && <label>Email<input name="email" type="email" autoComplete="username" defaultValue={process.env.ADMIN_EMAIL} readOnly aria-readonly="true" required/></label>}
      <label>Password<input name="password" type="password" autoComplete="current-password" required autoFocus/></label>
      <Turnstile action="admin_login"/>
      {updated === "1" && <p className="admin-auth-success" role="status">Password updated. Sign in with your new password, then enter your authenticator code.</p>}
      {errorMessage && <p className="payment-error" role="alert">{errorMessage}</p>}
      <button className="checkout-submit">Sign in securely</button>
      {usesSupabaseAuth && <Link className="text-link admin-recovery-link" href="/admin-reset-request">Forgot your password?</Link>}
      <Link className="text-link" href="/">← Return to store</Link>
    </form>
  </main>;
}
