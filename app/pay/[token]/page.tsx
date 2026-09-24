import type { Metadata } from "next";
import { PaymentLinkCheckout } from "./payment-link-checkout";

export const metadata: Metadata = {
  title: "Secure payment | Afro.Fashionstyle",
  description: "Review and securely pay your Afro.Fashionstyle order.",
  robots: { index: false, follow: false },
};

export default async function PaymentLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PaymentLinkCheckout token={token}/>;
}
