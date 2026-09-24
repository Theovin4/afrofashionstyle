"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { BrandLogo } from "../../components/brand-logo";
import { showActionToast } from "../../components/action-toast";

type LinkDetails = {
  status: string; expiresAt: string;
  order: { orderNumber: string; customerName: string; currency: string; subtotal: number; delivery: number; tax: number; total: number; items: Array<{ product_name: string; quantity: number; unit_price: number; selected_size?: string }> };
};
const cryptoAddresses = {
  usdt_trc20: ["USDT · TRON (TRC20)", "TScypKhj7VmE9CrXAFn2EAKLcBG9qjwYoL"],
  usdt_bep20: ["USDT · BNB Smart Chain (BEP20)", "0xebc426c64ee3434d5e824e926b627039a21b48a1"],
  usdt_sol: ["USDT · Solana", "3jgQ5Grn9awRoq1tux6zamrKaw91jQCgSRH6puE1Fokj"],
  btc: ["Bitcoin (BTC)", "17Z41xvrwHRJtNNtFv1apomwHn6yAjKFnQ"],
} as const;

const paymentMethods = [
  { name: "PayPal", mark: "P", description: "PayPal balance or linked card" },
  { name: "Flutterwave", mark: "F", description: "Secure card and local checkout" },
  { name: "Crypto", mark: "₿", description: "USDT or Bitcoin · proof reviewed" },
] as const;

function formatMoney(currency: string, value: number) {
  return new Intl.NumberFormat(currency === "GBP" ? "en-GB" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function PaymentLinkCheckout({ token }: { token: string }) {
  const [details, setDetails] = useState<LinkDetails | null>(null);
  const [error, setError] = useState("");
  const [gateway, setGateway] = useState<"PayPal" | "Flutterwave" | "Crypto">("PayPal");
  const [busy, setBusy] = useState(false);
  const [network, setNetwork] = useState<keyof typeof cryptoAddresses>("usdt_trc20");
  useEffect(() => {
    fetch(`/api/payment-links/${encodeURIComponent(token)}`, { cache: "no-store" }).then(async (response) => {
      const result = await response.json() as LinkDetails & { error?: string };
      if (!response.ok) throw new Error(result.error || "This payment link is unavailable.");
      setDetails(result);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "This payment link is unavailable."));
  }, [token]);

  async function pay() {
    setBusy(true); setError("");
    try {
      const endpoint = gateway === "PayPal" ? "/api/paypal/orders" : "/api/flutterwave/checkout";
      const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ paymentLinkToken: token }) });
      const result = await response.json() as { approveUrl?: string; checkoutUrl?: string; error?: string };
      const destination = result.approveUrl || result.checkoutUrl;
      if (!response.ok || !destination) throw new Error(result.error || `${gateway} could not be opened.`);
      window.location.assign(destination);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Payment could not be started."); setBusy(false); }
  }

  async function submitCrypto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const form = new FormData(event.currentTarget); form.set("paymentLinkToken", token); form.set("network", network);
      const response = await fetch("/api/crypto/checkout", { method: "POST", body: form });
      const result = await response.json() as { orderNumber?: string; whatsappUrl?: string; error?: string };
      if (!response.ok || !result.whatsappUrl) throw new Error(result.error || "Payment proof could not be submitted.");
      showActionToast(`Proof submitted for ${result.orderNumber}. Opening WhatsApp.`, "success");
      window.location.assign(result.whatsappUrl);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Payment proof could not be submitted."); setBusy(false); }
  }

  if (error && !details) return <main className="status-page"><section className="status-card"><BrandLogo variant="commerce"/><span className="eyebrow">Secure payment</span><h1>Link unavailable.</h1><p>{error}</p><Link className="button primary" href="/contact">Contact support</Link></section></main>;
  if (!details) return <main className="status-page"><section className="status-card"><BrandLogo variant="commerce"/><p>Preparing your secure order…</p></section></main>;
  if (details.status !== "active") return <main className="status-page"><section className="status-card"><BrandLogo variant="commerce"/><span className="eyebrow">Order {details.order.orderNumber}</span><h1>{details.status === "paid" ? "Payment received." : "Link unavailable."}</h1><p>{details.status === "paid" ? "This order has already been paid. Thank you." : "This secure payment link has expired or was withdrawn."}</p><Link className="button primary" href="/contact">Contact support</Link></section></main>;
  return <main className="social-payment-page"><header className="commerce-header social-payment-header"><BrandLogo variant="commerce"/><span><i aria-hidden="true">✓</i> Private secure payment</span></header><div className="social-payment-layout">
    <section className="social-payment-form"><span className="eyebrow">Prepared for {details.order.customerName}</span><h1>Review and pay.</h1><p>Choose your preferred secure payment method. Your total is locked to this private order link.</p>
      <div className="payment-link-total"><span>Amount due</span><strong>{formatMoney(details.order.currency, details.order.total)}</strong></div>
      <div className="gateway-selector payment-link-methods" role="group" aria-label="Select payment method">{paymentMethods.map((method) => <button type="button" key={method.name} className={gateway === method.name ? "active" : ""} aria-pressed={gateway === method.name} onClick={() => setGateway(method.name)}><i className={`payment-method-mark payment-method-${method.name.toLowerCase()}`} aria-hidden="true">{method.mark}</i><span className="payment-method-copy"><b>{method.name}</b><span>{method.description}</span></span><i className="payment-method-check" aria-hidden="true">✓</i></button>)}</div>
      {gateway !== "Crypto" ? <button className="checkout-submit social-pay-button" type="button" disabled={busy} onClick={() => void pay()}>{busy ? `Opening ${gateway}…` : <>Pay {formatMoney(details.order.currency, details.order.total)} with {gateway}<span aria-hidden="true">→</span></>}</button> : <form className="payment-link-crypto" onSubmit={(event) => void submitCrypto(event)}>
        <label>Network<select value={network} onChange={(event) => setNetwork(event.target.value as keyof typeof cryptoAddresses)}>{Object.entries(cryptoAddresses).map(([key, [label]]) => <option value={key} key={key}>{label}</option>)}</select></label>
        <div className="crypto-address"><small>Send to this exact address</small><code>{cryptoAddresses[network][1]}</code></div>
        <label>Amount and asset sent<input name="amountSent" required placeholder="e.g. 250 USDT"/></label><label>Transaction hash or reference<input name="transactionReference" required minLength={6}/></label><label>Proof of payment<input name="proof" type="file" accept="image/jpeg,image/png,image/webp" required/></label>
        <button className="checkout-submit" disabled={busy}>{busy ? "Submitting proof…" : "Submit proof and confirm on WhatsApp →"}</button>
      </form>}
      {error && <p className="payment-error" role="alert">{error}</p>}<div className="secure-box"><b>Protected checkout</b><span>Amounts are verified server-side. Card details are never stored by Afro.Fashionstyle.</span></div>
    </section>
    <aside className="social-payment-summary"><span className="eyebrow">Order {details.order.orderNumber}</span><h2>Order summary</h2>{details.order.items.map((item, index) => <div className="social-payment-item" key={`${item.product_name}-${index}`}><span><b>{item.product_name}</b><small>{item.selected_size || "Custom order"} · Qty {item.quantity}</small></span><strong>{formatMoney(details.order.currency, Number(item.unit_price) * item.quantity)}</strong></div>)}<dl><div><dt>Order amount</dt><dd>{formatMoney(details.order.currency, details.order.subtotal)}</dd></div><div><dt>Delivery</dt><dd>{formatMoney(details.order.currency, details.order.delivery)}</dd></div>{details.order.tax > 0 && <div><dt>Tax</dt><dd>{formatMoney(details.order.currency, details.order.tax)}</dd></div>}<div className="social-payment-total"><dt>Total</dt><dd>{formatMoney(details.order.currency, details.order.total)}</dd></div></dl><small className="payment-link-expiry">Secure link expires {new Date(details.expiresAt).toLocaleDateString()}.</small></aside>
  </div></main>;
}
