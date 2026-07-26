"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

type TrackedOrder = {
  order_number: string; payment_status: string; fulfillment_status: string;
  currency: string; total: number; created_at: string;
};

function Tracker() {
  const params = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(params.get("order") || "");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function findOrder(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true); setError("");
    const response = await fetch("/api/orders/track", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderNumber, email }),
    });
    const result = await response.json() as { order?: TrackedOrder; error?: string };
    setLoading(false);
    if (!response.ok || !result.order) { setError(result.error || "Order not found"); return; }
    setOrder(result.order);
  }

  const stages = ["processing", "shipped", "delivered"];
  const activeStage = order ? Math.max(0, stages.indexOf(order.fulfillment_status)) : 0;
  return <main className="status-page"><div className="tracking-card">
    <Link href="/"><Image src="/afro-fashionstyle-logo.png" width={150} height={70} alt="Afro.Fashionstyle"/></Link>
    <span className="eyebrow">Order care</span><h1>Track your order.</h1>
    {!order ? <form onSubmit={findOrder}>
      <label>Order number<input value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} required placeholder="AF-2026-AB12CD34"/></label>
      <label>Email address<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required placeholder="you@example.com"/></label>
      {error && <p className="payment-error" role="alert">{error}</p>}
      <button className="checkout-submit" disabled={loading}>{loading ? "Finding order…" : "Find my order →"}</button>
    </form> : <div className="tracking-result">
      <div><b>{order.order_number}</b><span>{order.currency} {Number(order.total).toFixed(2)} · {order.payment_status}</span></div>
      <ol>
        <li className="done"><b>Order confirmed</b><small>Payment received</small></li>
        <li className={activeStage >= 0 ? "done" : ""}><b>Being prepared</b><small>Quality check in progress</small></li>
        <li className={activeStage >= 1 ? "done" : ""}><b>Shipped</b><small>Tracking will appear here</small></li>
        <li className={activeStage >= 2 ? "done" : ""}><b>Delivered</b></li>
      </ol>
      <button className="change-payment" onClick={() => setOrder(null)}>Track another order</button>
    </div>}
  </div></main>;
}

export default function Track() {
  return <Suspense><Tracker/></Suspense>;
}
