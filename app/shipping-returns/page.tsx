import { PremiumHeader } from "../components/premium-header";

export const metadata = {
  title: "Shipping & Returns",
  description: "Afro.Fashionstyle USA and UK shipping fees, Fly Logistics tracking, processing times, sizing support and final-sale policy.",
  alternates: { canonical: "/shipping-returns" },
};

export default function ShippingReturnsPage() {
  return <main><PremiumHeader/><article className="policy-page"><span className="eyebrow">Customer care</span><h1>Shipping &amp; returns</h1>
    <h2>USA and UK delivery</h2><p>Fly Logistics provides tracked doorstep delivery for orders in the USA and UK. Track your parcel through <a href="https://www.flylogistics.com.ng" target="_blank" rel="noreferrer">Fly Logistics</a>.</p>
    <h2>USA shipping fees</h2><p>USA delivery costs $50 for one outfit. A second outfit adds $39.50. Every additional outfit after the second adds $29.50. The complete delivery total is shown before payment.</p>
    <h2>UK shipping fees</h2><p>GBP charges use the stored USD equivalent: £37.55 for one outfit, an additional £29.66 for the second outfit, and £22.15 for every outfit after the second. Product prices and the Ankara bundle are converted using the same store rate.</p>
    <h2>Order preparation</h2><p>Please allow 5–7 working days for your outfit to be prepared before dispatch. The carrier’s delivery estimate begins after the parcel is collected.</p>
    <h2>Measurements and sizing</h2><p>Please review the size guide carefully. If you are unsure of your size, forward your measurements to customer support before production begins.</p>
    <h2>Final-sale policy</h2><p>Outfits are final sale and cannot be returned, exchanged or refunded after preparation begins. This policy does not remove any mandatory rights that apply to faulty or incorrectly supplied goods under applicable law.</p>
    <h2>Support</h2><p>Customer support operates 24 hours a day, seven days a week. Email <a href="mailto:afrofashionclub@gmail.com">afrofashionclub@gmail.com</a> or contact us through <a href="https://wa.me/2347049841931" target="_blank" rel="noreferrer">WhatsApp</a>.</p>
  </article></main>;
}
