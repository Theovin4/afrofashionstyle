import type { Metadata } from "next";
import { CartProvider } from "./components/cart-provider";
import { MetaPixel } from "./components/meta-pixel";
import { ContactActions } from "./components/contact-actions";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://afrofashionstyle.com"),
  title: { default: "Afro.Fashionstyle | Premium Nigerian Fashion for Women", template: "%s | Afro.Fashionstyle" },
  description: "Shop premium Afrocentric womenswear, Ankara dresses, Adire gowns and Nigerian occasion wear. Designed for women in the USA and UK.",
  keywords: ["African fashion for women USA", "Nigerian dresses online", "Ankara dresses USA", "Adire fashion", "African occasion wear UK"],
  openGraph: { title: "Afro.Fashionstyle — Wear Your Story", description: "Modern silhouettes. Nigerian soul. Premium womenswear for the USA and UK.", images: ["/og.png"], type: "website" },
  twitter: { card: "summary_large_image", title: "Afro.Fashionstyle — Wear Your Story", images: ["/og.png"] },
  icons: { icon: "/afro-fashionstyle-logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const schema = {
    "@context": "https://schema.org", "@type": "ClothingStore", name: "Afro.Fashionstyle",
    url: "https://afrofashionstyle.com", areaServed: ["US", "GB"],
    description: "Premium Nigerian-inspired womenswear serving customers in the USA and UK.",
    currenciesAccepted: "USD, GBP", paymentAccepted: "PayPal, Flutterwave",
  };
  return <html lang="en"><body><CartProvider>{children}</CartProvider><ContactActions/><MetaPixel/><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /></body></html>;
}
