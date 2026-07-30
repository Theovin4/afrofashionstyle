import Link from "next/link";
import Image from "next/image";
import { Turnstile } from "../components/turnstile";

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const usesSupabaseAuth = !!process.env.ADMIN_EMAIL;
  return <main className="status-page">
    <form className="status-card admin-login-card" action="/api/admin/login" method="post">
      <Image src="/afro-fashionstyle-logo.png" alt="Afro.Fashionstyle" width={260} height={130} priority/>
      <span className="eyebrow">Commerce studio</span>
      <h1>Administrator access</h1>
      <p>Sign in to manage products, imagery, inventory and orders.</p>
      {usesSupabaseAuth && <label>Email<input name="email" type="email" autoComplete="username" defaultValue={process.env.ADMIN_EMAIL} required/></label>}
      <label>Password<input name="password" type="password" autoComplete="current-password" required autoFocus/></label>
      <Turnstile action="admin_login"/>
      {error && <p className="payment-error" role="alert">That password was not accepted.</p>}
      <button className="checkout-submit">Sign in securely</button>
      <Link className="text-link" href="/">← Return to store</Link>
    </form>
  </main>;
}
