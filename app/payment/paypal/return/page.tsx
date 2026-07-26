"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function PayPalReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("token");
  const validOrderId = !!orderId && /^[A-Z0-9]{1,36}$/.test(orderId);
  const [error, setError] = useState(validOrderId ? "" : "PayPal did not return a valid order reference.");

  useEffect(() => {
    if (!validOrderId) return;
    const controller = new AbortController();
    void fetch(`/api/paypal/orders/${orderId}/capture`, {
      method: "POST",
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = await response.json() as {
          completed?: boolean;
          value?: string;
          currency?: string;
          error?: string;
        };
        if (!response.ok || !result.completed) throw new Error(result.error || "Payment could not be captured.");
        router.replace(`/payment/success?gateway=PayPal&verified=1&order=${encodeURIComponent(orderId)}&total=${encodeURIComponent(result.value || "")}&currency=${encodeURIComponent(result.currency || "USD")}`);
      })
      .catch((reason) => {
        if (reason instanceof Error && reason.name !== "AbortError") setError(reason.message);
      });
    return () => controller.abort();
  }, [orderId, router, validOrderId]);

  return <main className="status-page"><div className="status-card">{error ? <><div className="cancel-mark">×</div><span className="eyebrow">Payment needs attention</span><h1>We couldn’t confirm the payment.</h1><p>{error} No order will be fulfilled until payment is verified.</p><div className="status-actions"><Link className="button primary" href="/#bag">Return to checkout</Link><Link className="text-link" href="/">Continue shopping →</Link></div></> : <><div className="success-mark loading-mark">↻</div><span className="eyebrow">Secure PayPal confirmation</span><h1>Confirming your payment…</h1><p>Please keep this page open while PayPal completes your order.</p></>}</div></main>;
}

export default function PayPalReturn() {
  return <Suspense><PayPalReturnContent /></Suspense>;
}
