"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { BrandStatusLogo } from "../../../components/brand-status-logo";

function FlutterwaveReturnContent() {
  const params = useSearchParams();
  const router = useRouter();
  const transactionId = params.get("transaction_id");
  const status = params.get("status");
  const [error, setError] = useState(status === "successful" && transactionId ? "" : "Flutterwave did not return a successful payment.");

  useEffect(() => {
    if (status !== "successful" || !transactionId) return;
    const controller = new AbortController();
    void fetch("/api/flutterwave/verify", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ transactionId }), signal: controller.signal,
    }).then(async (response) => {
      const result = await response.json() as { verified?: boolean; orderNumber?: string; total?: number; currency?: string; error?: string };
      if (!response.ok || !result.verified) throw new Error(result.error || "Payment could not be verified.");
      router.replace(`/payment/success?gateway=Flutterwave&verified=1&order=${encodeURIComponent(result.orderNumber || "")}&total=${result.total || ""}&currency=${result.currency || "USD"}`);
    }).catch((reason) => {
      if (reason instanceof Error && reason.name !== "AbortError") setError(reason.message);
    });
    return () => controller.abort();
  }, [router, status, transactionId]);

  return <main className="status-page"><div className="status-card"><BrandStatusLogo/>
    {error ? <>
      <div className="cancel-mark">×</div><span className="eyebrow">Payment needs attention</span>
      <h1>We couldn’t confirm the payment.</h1><p>{error}</p>
      <Link className="button primary" href="/#bag">Return to checkout</Link>
    </> : <>
      <div className="success-mark loading-mark">↻</div><span className="eyebrow">Secure Flutterwave confirmation</span>
      <h1>Confirming your payment…</h1><p>Please keep this page open.</p>
    </>}
  </div></main>;
}

export default function FlutterwaveReturn() {
  return <Suspense><FlutterwaveReturnContent/></Suspense>;
}
