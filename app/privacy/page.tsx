import { PremiumHeader } from "../components/premium-header";

export const metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return <main><PremiumHeader/><article className="policy-page"><span className="eyebrow">Legal</span><h1>Privacy policy</h1><p>Last updated July 26, 2026.</p>
    <h2>Information we collect</h2><p>We collect information needed to process orders, deliver products, provide support, prevent fraud and improve the store. This may include contact, delivery, transaction, device and shopping-interaction data.</p>
    <h2>How we use information</h2><p>Information is used for fulfilment, payment verification, customer communication, analytics, advertising measurement, security and legal compliance.</p>
    <h2>Service providers</h2><p>Order data may be processed by Supabase, Vercel, Cloudinary, PayPal, Flutterwave, Meta and delivery or email providers required to operate the store.</p>
    <h2>Advertising measurement and cookies</h2><p>If you allow optional marketing cookies, the Meta Pixel and Conversions API may receive shopping events, device identifiers, IP address, browser information and hashed contact details that you legitimately provide during checkout or a successful form submission. These signals help measure advertising performance and avoid counting the same action twice. We do not send passwords, payment-card details or private order notes to Meta.</p>
    <h2>Your choices</h2><p>You can decline optional marketing tracking from the cookie notice without affecting necessary shopping functions. You may also clear your browser storage and Meta cookies to reset that choice. You may request access, correction or deletion of eligible personal information and may opt out of marketing communications. Legal retention requirements may still apply.</p>
    <h2>Contact</h2><p>For privacy questions or eligible data requests, email <a href="mailto:afrofashionclub@gmail.com">afrofashionclub@gmail.com</a> or write to Afro.Fashionstyle, Lekki, Lagos, Nigeria.</p>
  </article></main>;
}
