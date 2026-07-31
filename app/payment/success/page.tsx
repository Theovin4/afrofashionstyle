import Link from "next/link";
import { BrandStatusLogo } from "../../components/brand-status-logo";

export default async function PaymentSuccess({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const query = await searchParams;
  const verified = query.verified === "1";
  const order = query.order || "PAYMENT-PREVIEW";
  const gateway = query.gateway || "Secure payment";
  const currency = query.currency || "USD";
  const total = query.total || "—";
  const whatsappMessage = `Hello Afro.Fashionstyle, my payment is confirmed. Order: ${order}. Payment: ${gateway}. Total: ${currency} ${total}. Please help me with the next steps.`;
  return <main className="status-page"><div className="status-card">
    <BrandStatusLogo/>
    <div className="success-mark">✓</div><span className="eyebrow">{verified ? "Payment confirmed" : "Payment confirmation preview"}</span>
    <h1>Your story is on its way.</h1>
    <p>{verified ? `${gateway} has confirmed your payment. Your order is now being prepared.` : "A real order is confirmed only after the payment provider verifies it securely."}</p>
    <div className="receipt"><span>Reference <b>{order}</b></span><span>Payment option <b>{gateway}</b></span><span>{verified ? "Total" : "Preview total"} <b>{currency} {total}</b></span></div>
    <div className="status-actions"><Link className="button primary" href={`/orders/track?order=${encodeURIComponent(order)}`}>{verified ? "Track your order" : "Preview tracking"}</Link>{verified && <a className="button whatsapp-success" href={`https://wa.me/2347049841931?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noreferrer" data-meta-contact="whatsapp">Send order on WhatsApp</a>}<Link className="text-link" href="/">Continue shopping →</Link></div>
  </div></main>;
}
