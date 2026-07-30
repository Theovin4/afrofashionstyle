import { PremiumHeader } from "../components/premium-header";

export const metadata = {
  title: "African Textile Garment Care",
  description: "Learn how to care for Ankara, Adire, Aso Oke and other Nigerian textile garments so their colour and structure last.",
  alternates: { canonical: "/garment-care" },
};

export default function GarmentCarePage() {
  return <main><PremiumHeader/><article className="policy-page"><span className="eyebrow">Protect the story</span><h1>Garment care</h1>
    <h2>Ankara and printed cotton</h2><p>Hand wash separately in cool water with mild detergent. Do not bleach. Dry away from direct sunlight and iron on the reverse at a moderate temperature.</p>
    <h2>Adire and hand-dyed textiles</h2><p>Color variation is part of the textile character. Hand wash separately in cold water, avoid soaking and harsh detergents, and dry flat or hang in shade.</p>
    <h2>Aso-Oke and embellished pieces</h2><p>Professional dry cleaning is recommended. Store flat or on a padded hanger and keep embellishment away from rough surfaces.</p>
    <h2>Need help?</h2><p>Send a photo through <a href="https://wa.me/2347049841931?text=Hello%20Afro.Fashionstyle%2C%20I%20need%20garment%20care%20help." target="_blank" rel="noreferrer">WhatsApp</a> for garment-specific guidance.</p>
  </article></main>;
}
