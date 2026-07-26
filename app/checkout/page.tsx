"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { trackMetaWithUser } from "../components/meta-pixel";

function CheckoutContent() {
  const params = useSearchParams();
  const gateway = params.get("gateway") === "paypal" ? "PayPal" : "Flutterwave";
  const total = params.get("total") || "189";
  const currency = params.get("currency") || "USD";
  const [step, setStep] = useState(1);
  const [paymentError, setPaymentError] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const flutterwaveUrl = process.env.NEXT_PUBLIC_FLUTTERWAVE_PAYMENT_LINK;

  async function startPayPalOrder() {
    setIsPaying(true);
    setPaymentError("");
    try {
      const response = await fetch("/api/paypal/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          value: Number(total),
          currency,
          description: "Afro.Fashionstyle order",
        }),
      });
      const result = await response.json() as { approveUrl?: string; error?: string };
      if (!response.ok || !result.approveUrl) throw new Error(result.error || "Unable to start PayPal.");
      window.location.assign(result.approveUrl);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "PayPal is temporarily unavailable.");
      setIsPaying(false);
    }
  }

  return <main className="commerce-page">
    <header className="commerce-header">
      <Link href="/"><img src="/afro-fashionstyle-logo.png" alt="Afro Fashionstyle"/></Link>
      <span>Secure checkout · Step {step} of 2</span>
    </header>
    <div className="checkout-layout">
      <section className="checkout-form">
        <Link href="/" className="back-link">← Continue shopping</Link>
        <span className="eyebrow">Express checkout</span>
        <h1>Complete your order.</h1>
        {step === 1 ? <form onSubmit={(event) => {
          event.preventDefault();
          const fields = new FormData(event.currentTarget);
          trackMetaWithUser("AddPaymentInfo", {
            value: Number(total), currency, payment_method: gateway,
          }, {
            email: String(fields.get("email") || ""),
            phone: String(fields.get("phone") || ""),
            firstName: String(fields.get("firstName") || ""),
            lastName: String(fields.get("lastName") || ""),
            city: String(fields.get("city") || ""),
            zip: String(fields.get("zip") || ""),
            country: String(fields.get("country") || ""),
          });
          setStep(2);
        }}>
          <h2>Delivery details</h2>
          <div className="form-split">
            <label>First name<input name="firstName" autoComplete="given-name" required/></label>
            <label>Last name<input name="lastName" autoComplete="family-name" required/></label>
          </div>
          <label>Email<input name="email" type="email" autoComplete="email" required/></label>
          <label>Phone<input name="phone" type="tel" autoComplete="tel" required/></label>
          <label>Address<input name="address" autoComplete="street-address" required/></label>
          <div className="form-split">
            <label>City<input name="city" autoComplete="address-level2" required/></label>
            <label>ZIP / Postcode<input name="zip" autoComplete="postal-code" required/></label>
          </div>
          <label>Country<select name="country" autoComplete="country-name"><option value="us">United States</option><option value="gb">United Kingdom</option></select></label>
          <button className="checkout-submit">Continue to payment →</button>
        </form> : <div className="payment-choice">
          <h2>Pay securely with {gateway}</h2>
          <p>You’ll continue to {gateway} to authorize your payment. Your order is confirmed only after successful payment.</p>
          <div className="secure-box"><b>{gateway}</b><span>Encrypted · Buyer protected · Instant confirmation</span></div>
          {gateway === "PayPal"
            ? <button className="checkout-submit" onClick={startPayPalOrder} disabled={isPaying}>{isPaying ? "Opening PayPal…" : `Pay ${currency} ${total} with PayPal →`}</button>
            : flutterwaveUrl
              ? <a className="checkout-submit" href={flutterwaveUrl}>Pay {currency} {total} with Flutterwave →</a>
              : <p className="payment-error">Flutterwave checkout is awaiting its payment link.</p>}
          {paymentError && <p className="payment-error" role="alert">{paymentError}</p>}
          <button className="change-payment" onClick={() => setStep(1)}>← Edit delivery details</button>
        </div>}
      </section>
      <aside className="order-summary">
        <span className="eyebrow">Order summary</span>
        <div className="summary-product"><i>A</i><div><b>Afro.Fashionstyle selection</b><small>Limited edition · Made with intention</small></div><strong>{currency} {total}</strong></div>
        <div className="summary-line"><span>Tracked delivery</span><span>Complimentary</span></div>
        <div className="summary-line"><span>Duties</span><span>Included where shown</span></div>
        <div className="summary-total"><span>Total</span><strong>{currency} {total}</strong></div>
        <p>✓ Secure checkout&nbsp;&nbsp; ✓ Easy returns&nbsp;&nbsp; ✓ Global tracking</p>
      </aside>
    </div>
  </main>;
}

export default function Checkout() {
  return <Suspense><CheckoutContent/></Suspense>;
}
