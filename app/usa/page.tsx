import type { Metadata } from "next";
import { MarketLanding } from "../components/market-landing";

const regionalAlternates = { "en-US": "/usa", "en-GB": "/uk", "x-default": "/" };

export const metadata: Metadata = {
  title: "African Fashion in USA | Ankara & Nigerian Clothing",
  description: "Shop African fashion in the USA, including Ankara dresses, Nigerian lace, Adire, two-piece outfits and accessories with secure USD checkout and tracked delivery.",
  keywords: ["African fashion in USA", "Ankara dresses USA", "Nigerian clothing USA", "African dresses online USA"],
  alternates: { canonical: "/usa", languages: regionalAlternates },
  openGraph: { title: "African Fashion in USA | Afro.Fashionstyle", description: "Shop premium Nigerian and African fashion in USD with tracked USA delivery.", url: "/usa", locale: "en_US", alternateLocale: ["en_GB"], images: [{ url: "/og.webp", alt: "Afro.Fashionstyle African fashion for USA customers" }] },
};

export default function UsaPage() {
  return <MarketLanding market="USA" eyebrow="African fashion · United States" heading="African fashion in the USA, styled with presence." introduction="Discover expressive Ankara dresses, Nigerian lace, Adire, coordinated outfits and accessories selected for weddings, celebrations and confident occasion dressing." delivery="5–7 working days" currency="US dollars ($)" paragraphs={[
    "Afro.Fashionstyle brings modern Nigerian design to women shopping for authentic African fashion in the USA. Our collection combines the colour and movement of Ankara, the depth of Adire and the occasion-ready elegance of Nigerian lace. Explore statement dresses, polished two-piece outfits, distinctive luxury designs and accessories for weddings, cultural celebrations, milestone events and elevated evenings. Each product page includes clear images, prices and available sizing so you can choose with confidence from anywhere in the United States.",
    "USA customers shop and check out in US dollars. Your bag shows the product subtotal, any qualifying promotion, product tax and tracked delivery before you authorize payment. Shipping is $50 for one or two items, an additional $35.50 for the third item and $29.50 for each item after the third. Fly Logistics provides tracked doorstep delivery. The current delivery estimate for the USA is 5–7 working days; timing can vary with destination, carrier conditions and customs processing. Your tracking details are sent when your parcel is dispatched.",
    "Secure payment options include PayPal, Flutterwave and cryptocurrency. PayPal and Flutterwave payments are confirmed only after our server verifies the transaction. Customers choosing cryptocurrency receive the correct deposit address at checkout, upload payment evidence and contact our team through the provided WhatsApp confirmation link. Cryptocurrency orders remain pending until an administrator reviews and approves the payment, protecting both the customer and the store from unverified transfers.",
    "Fit is central to a confident online purchase. Review our official US size chart before ordering and send your bust, waist, hip, height and preferred garment length if you need assistance. Our support team is available around the clock through WhatsApp and email. Because outfits are prepared specifically for confirmed orders and sales are final, checking your size and delivery information carefully before payment helps us provide the smoothest possible experience.",
  ]} faqs={[
    { question: "Do you deliver African clothing throughout the United States?", answer: "Yes. We accept delivery addresses across the USA and provide tracked doorstep delivery through Fly Logistics and its delivery partners." },
    { question: "Can I pay in US dollars?", answer: "Yes. Select USD on the storefront to view product prices, delivery charges, tax and your final checkout total in US dollars." },
    { question: "Which payment methods can USA customers use?", answer: "You can pay securely through PayPal, Flutterwave or cryptocurrency. Card and wallet availability may depend on the payment provider and issuing bank." },
    { question: "How long does USA delivery take?", answer: "The current estimate is 5–7 working days. Carrier conditions, destination and customs checks can affect the final delivery date." },
    { question: "What if I am unsure of my size?", answer: "Use our official size guide or send your measurements through WhatsApp before checkout so our team can help you choose." },
  ]}/>;
}
