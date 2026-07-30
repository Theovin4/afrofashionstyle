import { PremiumHeader } from "../components/premium-header";

export const metadata = {
  title: "Women's Size & Measurement Guide",
  description: "Use the Afro.Fashionstyle USA and UK women’s size guide and learn how to send measurements for made-to-order Nigerian outfits.",
  alternates: { canonical: "/size-guide" },
};

export default function SizeGuidePage() {
  return <main><PremiumHeader/><article className="policy-page"><span className="eyebrow">Made for you</span><h1>Size &amp; measurement guide</h1><p>Because every outfit is made on request and cannot be returned or refunded, please confirm your size carefully before ordering.</p>
    <h2>Measurements to send</h2><p>Bust, waist, full hip, shoulder width, shoulder-to-waist, sleeve length, upper arm circumference, dress or trouser length, and your height.</p>
    <h2>How to measure</h2><p>Use a soft measuring tape over light clothing. Keep the tape level and comfortably close to the body without pulling tight. Ask another person to help where possible.</p>
    <h2>Unsure of your size?</h2><p>Send your measurements through <a href="https://wa.me/2347049841931?text=Hello%20Afro.Fashionstyle%2C%20I%20need%20help%20with%20my%20measurements." target="_blank" rel="noreferrer">WhatsApp</a> before production begins. Support is available 24/7.</p>
  </article></main>;
}
