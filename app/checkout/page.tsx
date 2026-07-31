"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { attributionData, hasMarketingConsent, trackMetaWithUser } from "../components/meta-pixel";
import { BrandLogo } from "../components/brand-logo";

type Product = { id: string; name: string; category: string; price_usd: number; price_gbp: number; stock: number };
type Customer = { email: string; phone: string; firstName: string; lastName: string; address: string; city: string; zip: string; country: "US" | "GB" };

function CheckoutContent() {
  const params = useSearchParams();
  const [gateway, setGateway] = useState<"PayPal" | "Flutterwave">(params.get("gateway") === "paypal" ? "PayPal" : "Flutterwave");
  const currency = params.get("currency") === "GBP" ? "GBP" : "USD";
  const itemIds = useMemo(() => (params.get("items") || "").split(",").filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 20), [params]);
  const sizes = useMemo(() => (params.get("sizes") || "").split(",").map(decodeURIComponent).slice(0, itemIds.length), [params, itemIds.length]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [step, setStep] = useState(1);
  const [paymentError, setPaymentError] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountTotal, setDiscountTotal] = useState(0);
  const [shippingRules, setShippingRules] = useState<Array<{ country: string; currency: string; rate: number; free_over: number | null; second_item_rate: number | null; additional_item_rate: number | null }>>([]);
  const [usdToGbp, setUsdToGbp] = useState(.751);

  useEffect(() => {
    void fetch("/api/products").then((response) => response.json()).then((result: { products?: Product[] }) => {
      setProducts(result.products?.filter((product) => itemIds.includes(product.id)) || []);
    }).catch(() => setPaymentError("Your order could not be loaded."));
  }, [itemIds]);

  useEffect(() => {
    void fetch("/api/commerce-config").then((response) => response.json()).then((result: { shipping?: typeof shippingRules; settings?: { currency?: { usd_to_gbp?: number } } }) => { setShippingRules(result.shipping || []); setUsdToGbp(Number(result.settings?.currency?.usd_to_gbp || .751)); }).catch(() => undefined);
  }, []);

  const total = itemIds.reduce((sum, id) => {
    const product = products.find((item) => item.id === id);
    return sum + Number(currency === "GBP" ? product?.price_gbp || 0 : product?.price_usd || 0);
  }, 0);
  const ankaraPrices = itemIds.map((id) => products.find((item) => item.id === id)).filter((product) => product?.category.toLowerCase().includes("ankara")).map((product) => Number(currency === "GBP" ? product?.price_gbp || 0 : product?.price_usd || 0)).sort((a, b) => b - a);
  const bundleTarget = currency === "GBP" ? 260 * usdToGbp : 260;
  const bundleDiscount = ankaraPrices.reduce((sum, price, index) => index % 2 === 0 && ankaraPrices[index + 1] !== undefined ? sum + Math.max(0, price + ankaraPrices[index + 1] - bundleTarget) : sum, 0);
  const shippingRule = shippingRules.find((rule) => rule.country === customer?.country && rule.currency === currency);
  const tieredShipping = shippingRule ? Number(shippingRule.rate) + (itemIds.length >= 2 ? Number(shippingRule.second_item_rate || 0) : 0) + Math.max(0, itemIds.length - 2) * Number(shippingRule.additional_item_rate || 0) : 0;
  const shippingTotal = shippingRule && (shippingRule.free_over === null || total < Number(shippingRule.free_over)) ? tieredShipping : 0;
  const taxableTotal = Math.max(0, total - discountTotal - bundleDiscount);
  const taxTotal = Math.round(taxableTotal * .05 * 100) / 100;
  const grandTotal = taxableTotal + taxTotal + shippingTotal;

  async function startPayment() {
    if (!customer || !itemIds.length) return;
    setIsPaying(true);
    setPaymentError("");
    try {
      const endpoint = gateway === "PayPal" ? "/api/paypal/orders" : "/api/flutterwave/checkout";
      const response = await fetch(endpoint, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: itemIds, sizes, currency, customer, discountCode: discountCode || undefined,
          meta: { consent: hasMarketingConsent(), ...attributionData() },
        }),
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
    <header className="commerce-header"><BrandLogo variant="commerce"/><span>Secure checkout · Step {step} of 2</span></header>
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
          if (fields.get("cartReminder") === "yes") void fetch("/api/cart-recovery", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: details.email, name: `${details.firstName} ${details.lastName}`, currency, items: itemIds, subtotal: total, consent: true }) });
          trackMetaWithUser("AddPaymentInfo", {
            value: grandTotal, currency, payment_method: gateway, content_ids: itemIds,
            content_type: "product",
            contents: itemIds.map((id) => {
              const product = products.find((item) => item.id === id);
              return { id, quantity: 1, item_price: Number(currency === "GBP" ? product?.price_gbp || 0 : product?.price_usd || 0) };
            }),
          }, { ...details, zip: details.zip });
          setStep(2);
        }}>
          <h2>Delivery details</h2>
          <div className="form-split"><label>First name<input name="firstName" autoComplete="given-name" required/></label><label>Last name<input name="lastName" autoComplete="family-name" required/></label></div>
          <label>Email<input name="email" type="email" autoComplete="email" required/></label>
          <label>Phone<input name="phone" type="tel" autoComplete="tel" required/></label>
          <label>Address<input name="address" autoComplete="street-address" required/></label>
          <div className="form-split"><label>City<input name="city" autoComplete="address-level2" required/></label><label>ZIP / Postcode<input name="zip" autoComplete="postal-code" required/></label></div>
          <label>Country<select name="country" autoComplete="country"><option value="US">United States</option><option value="GB">United Kingdom</option></select></label>
          <label className="consent-check"><input name="cartReminder" type="checkbox" value="yes"/> Email me one reminder after 24 hours if I leave without completing this order. I can ignore the message and will not receive repeated cart emails.</label>
          <button className="checkout-submit">Continue to payment →</button>
        </form> : <div className="payment-choice">
          <h2>Choose your secure payment</h2>
          <div className="gateway-selector"><button className={gateway === "Flutterwave" ? "active" : ""} onClick={() => setGateway("Flutterwave")}><b>Flutterwave</b><span>Cards and local payment options</span></button><button className={gateway === "PayPal" ? "active" : ""} onClick={() => setGateway("PayPal")}><b>PayPal</b><span>PayPal balance or linked card</span></button></div>
          <p>You’ll continue to {gateway} to authorize your payment. Your order is confirmed only after server verification.</p>
          <div className="secure-box"><b>{gateway}</b><span>Encrypted · Buyer protected · Verified confirmation</span></div>
          <button className="checkout-submit" onClick={startPayment} disabled={isPaying}>{isPaying ? `Opening ${gateway}…` : `Pay ${currency} ${grandTotal.toFixed(2)} with ${gateway} →`}</button>
          {paymentError && <p className="payment-error" role="alert">{paymentError}</p>}
          <button className="change-payment" onClick={() => setStep(1)}>← Edit delivery details</button>
        </div>}
      </section>
      <aside className="order-summary"><span className="eyebrow">Order summary</span>
        {itemIds.map((id, index) => { const product = products.find((item) => item.id === id); return <div className="summary-product" key={`${id}-${index}`}><i>A</i><div><b>{product?.name || "Loading selection…"}</b><small>Limited edition · Made with intention</small></div><strong>{currency} {Number(currency === "GBP" ? product?.price_gbp || 0 : product?.price_usd || 0).toFixed(2)}</strong></div>; })}
        <form className="discount-form" onSubmit={async (event) => { event.preventDefault(); setPaymentError(""); const response = await fetch("/api/discounts/validate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: discountCode, currency, subtotal: total }) }); const result = await response.json() as { amount?: number; error?: string }; if (!response.ok) { setDiscountTotal(0); setPaymentError(result.error || "Discount code is unavailable."); return; } setDiscountTotal(Number(result.amount || 0)); }}><input value={discountCode} onChange={(event) => setDiscountCode(event.target.value.toUpperCase())} placeholder="Discount code"/><button>Apply</button></form>
        <div className="summary-line"><span>Tracked Fly Logistics delivery (tax-free)</span><span>{shippingTotal ? `${currency} ${shippingTotal.toFixed(2)}` : "Complimentary"}</span></div>{bundleDiscount > 0 && <div className="summary-line discount"><span>2 Ankara dresses for {currency === "GBP" ? "£195.26" : "$260"}</span><span>−{currency} {bundleDiscount.toFixed(2)}</span></div>}{discountTotal > 0 && <div className="summary-line discount"><span>Discount</span><span>−{currency} {discountTotal.toFixed(2)}</span></div>}<div className="summary-line"><span>Tax (5% on products only)</span><span>{currency} {taxTotal.toFixed(2)}</span></div><div className="summary-line"><span>Duties</span><span>Included where shown</span></div>
        <div className="summary-total"><span>Total</span><strong>{currency} {grandTotal.toFixed(2)}</strong></div><p>✓ Secure checkout · ✓ Made on request · ✓ Fly Logistics tracking</p>
      </aside>
    </div>
  </main>;
}

export default function Checkout() {
  return <Suspense><CheckoutContent/></Suspense>;
}
