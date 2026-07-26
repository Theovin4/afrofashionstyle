import Link from "next/link";
import Image from "next/image";

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="status-page">
    <form className="status-card admin-login-card" action="/api/admin/login" method="post">
      <Image src="/afro-fashionstyle-logo.png" alt="Afro.Fashionstyle" width={260} height={130} priority/>
      <span className="eyebrow">Commerce studio</span>
      <h1>Administrator access</h1>
      <p>Enter the private dashboard password to manage products, imagery and inventory.</p>
      <label>Password<input name="password" type="password" autoComplete="current-password" required autoFocus/></label>
      {error && <p className="payment-error" role="alert">That password was not accepted.</p>}
      <button className="checkout-submit">Sign in securely</button>
      <Link className="text-link" href="/">← Return to store</Link>
    </form>
  </main>;
}
