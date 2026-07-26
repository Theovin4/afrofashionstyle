import { PremiumHeader } from "../components/premium-header";

export const metadata = { title: "Shipping & Returns", description: "USA and UK shipping, delivery and returns information for Afro.Fashionstyle." };

export default function ShippingReturnsPage() {
  return <main><PremiumHeader/><article className="policy-page"><span className="eyebrow">Customer care</span><h1>Shipping &amp; returns</h1>
    <h2>United States delivery</h2><p>Orders are shipped with tracking. Complimentary standard delivery applies when the cart reaches the threshold shown at checkout. Estimated delivery times begin after order processing.</p>
    <h2>United Kingdom delivery</h2><p>UK orders are shipped with tracking. Duties and taxes are displayed or described during checkout where available. Customers remain responsible for charges not collected at checkout.</p>
    <h2>Processing</h2><p>Ready-to-wear pieces normally enter processing within two business days. Made-to-order pieces may require additional production time, which will be shown on the product page.</p>
    <h2>Returns</h2><p>Eligible unworn merchandise may be returned within 14 days of delivery with original tags attached. Final-sale, altered and made-to-order pieces are not returnable unless faulty.</p>
    <h2>Start a return</h2><p>Contact customer support with your order number before returning an item. The final support email and return address will be published when supplied by the business owner.</p>
  </article></main>;
}
