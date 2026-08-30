import type { Metadata } from "next";
import { MarketLanding } from "../components/market-landing";

const regionalAlternates = { "en-US": "/usa", "en-GB": "/uk", "x-default": "/" };

export const metadata: Metadata = {
  title: "African Fashion in UK | Nigerian Clothing & Ankara Dresses",
  description: "Shop African fashion in the UK, including Ankara dresses, Nigerian lace, Adire, coordinated outfits and accessories with GBP checkout and tracked delivery.",
  keywords: ["African fashion in UK", "African clothing UK", "Ankara dresses UK", "Nigerian clothing UK"],
  alternates: { canonical: "/uk", languages: regionalAlternates },
  openGraph: { title: "African Fashion in the UK | Afro.Fashionstyle", description: "Shop premium Nigerian and African fashion in pounds with tracked UK delivery.", url: "/uk", locale: "en_GB", alternateLocale: ["en_US"], images: [{ url: "/og.webp", alt: "Afro.Fashionstyle African fashion for UK customers" }] },
};

export default function UkPage() {
  return <MarketLanding market="UK" eyebrow="African fashion · United Kingdom" heading="African fashion in the UK, rich in colour and confidence." introduction="Shop Nigerian Ankara, Adire and lace designs for weddings, celebrations and standout occasions, with pound sterling pricing and tracked UK delivery." delivery="3–7 working days" currency="Pounds sterling (£)" paragraphs={[
    "Afro.Fashionstyle connects UK customers with confident Nigerian fashion shaped for contemporary celebrations. Browse Ankara dresses, refined Adire designs, Nigerian lace outfits, coordinated two-piece sets and expressive accessories for weddings, traditional events, milestone parties and elegant evenings. The collection celebrates African textile traditions without treating them as costume: every piece is presented as modern fashion for women who value colour, craft and a memorable silhouette. Clear product photography and detailed descriptions help you shop online with confidence.",
    "Customers in England, Scotland, Wales and Northern Ireland can select GBP to see prices in pounds sterling. Checkout displays the complete product subtotal, any valid promotion, applicable product tax and the GBP equivalent of delivery charges before payment. The UK delivery estimate is 3–7 working days, depending on the destination, carrier network and customs processing. Fly Logistics provides tracked doorstep delivery, and tracking information is sent once your order has been dispatched so you can follow its progress.",
    "UK shoppers can pay with PayPal, Flutterwave or cryptocurrency. PayPal and Flutterwave transactions are verified securely by the server before an order is marked as paid. If you select cryptocurrency, checkout displays the supported network and deposit address. You must upload proof of payment and continue to WhatsApp for confirmation. The order remains pending until our Commerce Studio administrator verifies and approves the transfer; an uploaded screenshot alone never marks an order as paid.",
    "For the best fit, compare your bust, waist and hip measurements with our official size chart rather than relying only on your usual high-street size. You can send measurements to our team through WhatsApp if you are between sizes or need help with garment length. Support is available 24/7 by WhatsApp and email. Please confirm your size, delivery address and postcode carefully before completing checkout because confirmed outfit sales are final.",
  ]} faqs={[
    { question: "Do you deliver African clothing across the UK?", answer: "Yes. We accept supported addresses across the United Kingdom and provide tracked doorstep delivery through Fly Logistics and its delivery partners." },
    { question: "Can I view and pay in pounds sterling?", answer: "Yes. Select GBP to display product prices and the GBP equivalent of shipping and checkout totals." },
    { question: "Which payment methods are available in the UK?", answer: "UK customers can use PayPal, Flutterwave or cryptocurrency. Availability of particular cards or wallets is controlled by the payment provider and your bank." },
    { question: "How long does delivery to the UK take?", answer: "The current estimate is 3–7 working days. Destination, customs processing and carrier conditions may affect the final date." },
    { question: "Can you help me select a size?", answer: "Yes. Review the official size guide, then send your measurements on WhatsApp if you would like a fit recommendation before checkout." },
  ]}/>;
}
