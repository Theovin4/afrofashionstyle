"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { BrandStatusLogo } from "../../../components/brand-status-logo";

type LinkOrder = { orderNumber: string; currency: string; total: number; paymentStatus: string; paymentLink: string };

function PaymentLinkHandoff() {
  const params = useSearchParams();
  const order = params.get("order") || "";
  const token = params.get("token") || "";
  const [details, setDetails] = useState<LinkOrder | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/flutterwave/payment-link?order=${encodeURIComponent(order)}&token=${encodeURIComponent(token)}`, { signal: controller.signal }).then(async (response) => {
      const result = await response.json() as LinkOrder & { error?: string };
      if (!response.ok) throw new Error(result.error || "Payment-link order could not be loaded.");
      setDetails(result);
    }).catch((error) => { if (error instanceof Error && error.name !== "AbortError") setMessage(error.message); });
    return () => controller.abort();
  }, [order, token]);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setChecking(true); setMessage("");
    const response = await fetch("/api/flutterwave/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ transactionId: transactionId.trim(), orderNumber: order, trackingToken: token }) });
    const result = await response.json() as { verified?: boolean; orderNumber?: string; currency?: string; total?: number; error?: string };
    if (response.ok && result.verified) window.location.assign(`/payment/success?gateway=Flutterwave&verified=1&order=${encodeURIComponent(result.orderNumber || order)}&total=${result.total || details?.total || ""}&currency=${result.currency || details?.currency || "USD"}`);
    else { setMessage(result.error || "Payment could not be verified."); setChecking(false); }
  }

  return <main className="status-page payment-link-page"><div className="status-card payment-link-card"><BrandStatusLogo/><span className="eyebrow">Flutterwave backup checkout</span><h1>Pay securely, then confirm.</h1>
    {details ? <><div className="receipt"><span><b>Order</b><strong>{details.orderNumber}</strong></span><span><b>Exact amount</b><strong>{details.currency} {details.total.toFixed(2)}</strong></span></div>
      <ol className="payment-link-steps"><li>Open Flutterwave and use the same email entered at checkout.</li><li>Pay exactly <b>{details.currency} {details.total.toFixed(2)}</b>. Do not change the currency.</li><li>Return here and enter the Flutterwave transaction ID from your receipt.</li></ol>
      <a className="button primary" href={details.paymentLink} target="_blank" rel="noopener noreferrer">Open secure Flutterwave payment ↗</a>
      <form onSubmit={verify}><label>Flutterwave transaction ID<input value={transactionId} onChange={(event) => setTransactionId(event.target.value.replace(/[^A-Za-z0-9_-]/g, ""))} placeholder="Transaction ID from your Flutterwave receipt" required/></label><button className="checkout-submit" disabled={checking}>{checking ? "Verifying payment…" : "Verify and confirm order"}</button></form>
    </> : !message && <p>Preparing your secure payment link…</p>}
    {message && <p className="payment-error" role="alert">{message}</p>}<Link className="back-link" href="/checkout">← Return to checkout</Link>
  </div></main>;
}

export default function FlutterwavePaymentLinkPage() { return <Suspense><PaymentLinkHandoff/></Suspense>; }
