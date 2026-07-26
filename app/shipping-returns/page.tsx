import { PremiumHeader } from "../components/premium-header";

export const metadata = { title: "Shipping & Returns", description: "USA and UK shipping, delivery and returns information for Afro.Fashionstyle." };

export default function ShippingReturnsPage() {
  return <main><PremiumHeader/><article className="policy-page"><span className="eyebrow">Customer care</span><h1>Shipping &amp; returns</h1>
    <h2>USA and UK delivery</h2><p>Fly Logistics provides tracked doorstep delivery for orders in the USA and UK. Track your parcel through <a href="https://www.flylogistics.com.ng" target="_blank" rel="noreferrer">Fly Logistics</a>.</p>
    <h2>USA shipping fees</h2><p>USA delivery costs $50 for one outfit. A second outfit adds $39.50. Every additional outfit after the second adds $29.50. The complete delivery total is shown before payment.</p>
    <h2>Made-to-order processing</h2><p>Every outfit is made on request. Please allow 5–7 working days for production before dispatch. Delivery time begins after production is complete.</p>
    <h2>Measurements and sizing</h2><p>Please review the size guide carefully. If you are unsure of your size, forward your measurements to customer support before production begins.</p>
    <h2>No returns or refunds</h2><p>All outfits are made specifically on request. For this reason, orders cannot be returned, exchanged or refunded after production begins. This policy does not remove any mandatory rights that apply to faulty or incorrectly supplied goods under applicable law.</p>
    <h2>Support</h2><p>Customer support operates 24 hours a day, seven days a week.</p>
  </article></main>;
}
