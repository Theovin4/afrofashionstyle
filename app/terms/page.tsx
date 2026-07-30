import { PremiumHeader } from "../components/premium-header";

export const metadata = { title: "Terms & Conditions", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return <main><PremiumHeader/><article className="policy-page"><span className="eyebrow">Legal</span><h1>Terms &amp; conditions</h1><p>Last updated July 26, 2026.</p>
    <h2>Orders and payment</h2><p>An order is accepted only after payment has been successfully verified. We may cancel or refund orders affected by stock errors, suspected fraud or incorrect pricing.</p>
    <h2>Made-to-order and final sale</h2><p>Every outfit is made on request and production normally requires 5–7 working days. Customers should forward their measurements when unsure of sizing. Orders cannot be returned, exchanged or refunded after production begins, except where mandatory consumer law requires a remedy for faulty or incorrectly supplied goods.</p>
    <h2>Product presentation</h2><p>We work to represent colors and textiles accurately. Device displays and handcrafted textile variations may cause minor differences.</p>
    <h2>Intellectual property</h2><p>Afro.Fashionstyle branding, photography, product designs, copy and site materials may not be reproduced without permission.</p>
    <h2>Liability</h2><p>Nothing in these terms limits rights that cannot legally be excluded. Otherwise, liability is limited to the amount paid for the affected order to the extent permitted by law.</p>
    <h2>Governing details</h2><p>The final legal business name, registered address and governing jurisdiction must be supplied by the business owner before formal legal review.</p>
  </article></main>;
}
