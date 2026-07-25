"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function CheckoutContent() {
  const params = useSearchParams();
  const gateway = params.get("gateway") === "paypal" ? "PayPal" : "Flutterwave";
  const total = params.get("total") || "189";
  const currency = params.get("currency") || "USD";
  const [step, setStep] = useState(1);
  const paymentUrl = gateway === "PayPal" ? process.env.NEXT_PUBLIC_PAYPAL_PAYMENT_LINK : process.env.NEXT_PUBLIC_FLUTTERWAVE_PAYMENT_LINK;
  return <main className="commerce-page"><header className="commerce-header"><Link href="/"><img src="/afro-fashionstyle-logo.png" alt="Afro Fashionstyle"/></Link><span>Secure checkout · Step {step} of 2</span></header><div className="checkout-layout"><section className="checkout-form"><Link href="/" className="back-link">← Continue shopping</Link><span className="eyebrow">Express checkout</span><h1>Complete your order.</h1>{step === 1 ? <form onSubmit={(e)=>{e.preventDefault();setStep(2)}}><h2>Delivery details</h2><div className="form-split"><label>First name<input required/></label><label>Last name<input required/></label></div><label>Email<input type="email" required/></label><label>Address<input required/></label><div className="form-split"><label>City<input required/></label><label>ZIP / Postcode<input required/></label></div><label>Country<select><option>United States</option><option>United Kingdom</option></select></label><button className="checkout-submit">Continue to payment →</button></form> : <div className="payment-choice"><h2>Pay securely with {gateway}</h2><p>You’ll continue to {gateway} to authorize your payment. Your order is confirmed only after successful payment.</p><div className="secure-box"><b>{gateway}</b><span>Encrypted · Buyer protected · Instant confirmation</span></div>{paymentUrl ? <a className="checkout-submit" href={paymentUrl}>Pay {currency} {total} with {gateway} →</a> : <Link className="checkout-submit" href={`/payment/success?gateway=${gateway}&total=${total}&currency=${currency}`}>Preview payment confirmation →</Link>}<button className="change-payment" onClick={()=>setStep(1)}>← Edit delivery details</button></div>}</section><aside className="order-summary"><span className="eyebrow">Order summary</span><div className="summary-product"><i>A</i><div><b>Afro.Fashionstyle selection</b><small>Limited edition · Made with intention</small></div><strong>{currency} {total}</strong></div><div className="summary-line"><span>Tracked delivery</span><span>Complimentary</span></div><div className="summary-line"><span>Duties</span><span>Included where shown</span></div><div className="summary-total"><span>Total</span><strong>{currency} {total}</strong></div><p>✓ Secure checkout&nbsp;&nbsp; ✓ Easy returns&nbsp;&nbsp; ✓ Global tracking</p></aside></div></main>
}
export default function Checkout(){return <Suspense><CheckoutContent/></Suspense>}
