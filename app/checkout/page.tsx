"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { trackMetaWithUser } from "../components/meta-pixel";

type Product = { id: string; name: string; price_usd: number; price_gbp: number; stock: number };
type Customer = { email: string; phone: string; firstName: string; lastName: string; address: string; city: string; zip: string; country: "US" | "GB" };

function CheckoutContent() {
  const params = useSearchParams();
  const [gateway, setGateway] = useState<"PayPal" | "Flutterwave">(params.get("gateway") === "paypal" ? "PayPal" : "Flutterwave");
  const currency = params.get("currency") === "GBP" ? "GBP" : "USD";
  const itemIds = useMemo(() => (params.get("items") || "").split(",").filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 20), [params]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [step, setStep] = useState(1);
  const [paymentError, setPaymentError] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    void fetch("/api/products").then((response) => response.json()).then((result: { products?: Product[] }) => {
      setProducts(result.products?.filter((product) => itemIds.includes(product.id)) || []);
    }).catch(() => setPaymentError("Your order could not be loaded."));
  }, [itemIds]);

  const total = itemIds.reduce((sum, id) => {
    const product = products.find((item) => item.id === id);
    return sum + Number(currency === "GBP" ? product?.price_gbp || 0 : product?.price_usd || 0);
  }, 0);

  async function startPayment() {
    if (!customer || !itemIds.length) return;
    setIsPaying(true);
    setPaymentError("");
    try {
      const endpoint = gateway === "PayPal" ? "/api/paypal/orders" : "/api/flutterwave/checkout";
      const response = await fetch(endpoint, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: itemIds, currency, customer }),
      });
      const result = await response.json() as { approveUrl?: string; checkoutUrl?: string; error?: string };
      const destination = result.approveUrl || result.checkoutUrl;
      if (!response.ok || !destination) throw new Error(result.error || `Unable to start ${gateway}.`);
      window.location.assign(destination);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : `${gateway} is temporarily unavailable.`);
      setIsPaying(false);
    }
  }

  if (!itemIds.length) return <main className="status-page"><div className="status-card"><h1>Your bag is empty.</h1><Link className="button primary" href="/#shop">Shop the collection</Link></div></main>;

  return <main className="commerce-page">
    <header className="commerce-header"><Link href="/"><Image src="/afro-fashionstyle-logo.png" width={145} height={68} alt="Afro.Fashionstyle"/></Link><span>Secure checkout · Step {step} of 2</span></header>
    <div className="checkout-layout">
      <section className="checkout-form">
        <Link href="/" className="back-link">← Continue shopping</Link><span className="eyebrow">Express checkout</span><h1>Complete your order.</h1>
        {step === 1 ? <form onSubmit={(event) => {
          event.preventDefault();
          const fields = new FormData(event.currentTarget);
          const details: Customer = {
            email: String(fields.get("email") || ""), phone: String(fields.get("phone") || ""),
            firstName: String(fields.get("firstName") || ""), lastName: String(fields.get("lastName") || ""),
            address: String(fields.get("address") || ""), city: String(fields.get("city") || ""),
            zip: String(fields.get("zip") || ""), country: fields.get("country") === "GB" ? "GB" : "US",
          };
          setCustomer(details);
          trackMetaWithUser("AddPaymentInfo", { value: total, currency, payment_method: gateway, content_ids: itemIds }, details);
          setStep(2);
        }}>
          <h2>Delivery details</h2>
          <div className="form-split"><label>First name<input name="firstName" autoComplete="given-name" required/></label><label>Last name<input name="lastName" autoComplete="family-name" required/></label></div>
          <label>Email<input name="email" type="email" autoComplete="email" required/></label>
          <label>Phone<input name="phone" type="tel" autoComplete="tel" required/></label>
          <label>Address<input name="address" autoComplete="street-address" required/></label>
          <div className="form-split"><label>City<input name="city" autoComplete="address-level2" required/></label><label>ZIP / Postcode<input name="zip" autoComplete="postal-code" required/></label></div>
          <label>Country<select name="country" autoComplete="country"><option value="US">United States</option><option value="GB">United Kingdom</option></select></label>
          <button className="checkout-submit">Continue to payment →</button>
        </form> : <div className="payment-choice">
          <h2>Choose your secure payment</h2>
          <div className="gateway-selector"><button className={gateway === "Flutterwave" ? "active" : ""} onClick={() => setGateway("Flutterwave")}><b>Flutterwave</b><span>Cards and local payment options</span></button><button className={gateway === "PayPal" ? "active" : ""} onClick={() => setGateway("PayPal")}><b>PayPal</b><span>PayPal balance or linked card</span></button></div>
          <p>You’ll continue to {gateway} to authorize your payment. Your order is confirmed only after server verification.</p>
          <div className="secure-box"><b>{gateway}</b><span>Encrypted · Buyer protected · Verified confirmation</span></div>
          <button className="checkout-submit" onClick={startPayment} disabled={isPaying}>{isPaying ? `Opening ${gateway}…` : `Pay ${currency} ${total.toFixed(2)} with ${gateway} →`}</button>
          {paymentError && <p className="payment-error" role="alert">{paymentError}</p>}
          <button className="change-payment" onClick={() => setStep(1)}>← Edit delivery details</button>
        </div>}
      </section>
      <aside className="order-summary"><span className="eyebrow">Order summary</span>
        {itemIds.map((id, index) => { const product = products.find((item) => item.id === id); return <div className="summary-product" key={`${id}-${index}`}><i>A</i><div><b>{product?.name || "Loading selection…"}</b><small>Limited edition · Made with intention</small></div><strong>{currency} {Number(currency === "GBP" ? product?.price_gbp || 0 : product?.price_usd || 0).toFixed(2)}</strong></div>; })}
        <div className="summary-line"><span>Tracked delivery</span><span>Complimentary</span></div><div className="summary-line"><span>Duties</span><span>Included where shown</span></div>
        <div className="summary-total"><span>Total</span><strong>{currency} {total.toFixed(2)}</strong></div><p>✓ Secure checkout · ✓ Easy returns · ✓ Global tracking</p>
      </aside>
    </div>
  </main>;
}

export default function Checkout() {
  return <Suspense><CheckoutContent/></Suspense>;
}
