import type { Metadata } from "next";
import Script from "next/script";
import { CartProvider } from "./components/cart-provider";
import { MetaPixel } from "./components/meta-pixel";
import { ContactActions } from "./components/contact-actions";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://afro-fashionstyle.vercel.app"),
  title: { default: "Afro.Fashionstyle | Premium Nigerian Fashion for Women", template: "%s | Afro.Fashionstyle" },
  description: "Shop premium Afrocentric womenswear, Ankara dresses, Adire gowns and Nigerian occasion wear. Designed for women in the USA and UK.",
  keywords: ["African fashion for women USA", "Nigerian dresses online", "Ankara dresses USA", "Adire fashion", "African occasion wear UK"],
  openGraph: { title: "Afro.Fashionstyle — Wear Your Story", description: "Modern silhouettes. Nigerian soul. Premium womenswear for the USA and UK.", images: ["/og.png"], type: "website" },
  twitter: { card: "summary_large_image", title: "Afro.Fashionstyle — Wear Your Story", images: ["/og.png"] },
  icons: { icon: "/afro-fashionstyle-logo.png" },
  alternates: { canonical: "/" },
  verification: { google: "XBN4mZJ1-rjDyXZAObhygPIIh2bftEzrW_O_W4CehNo" },
  other: { "google-adsense-account": "ca-pub-7864399969744116" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const schema = {
    "@context": "https://schema.org", "@type": "ClothingStore", name: "Afro.Fashionstyle",
    url: "https://afrofashionstyle.com", areaServed: ["US", "GB"],
    description: "Premium Nigerian-inspired womenswear serving customers in the USA and UK.",
    currenciesAccepted: "USD, GBP", paymentAccepted: "PayPal, Flutterwave",
  };
  return <html lang="en"><body>
    <CartProvider>{children}</CartProvider>
    <ContactActions/>
    <MetaPixel/>
    <Script src="https://www.googletagmanager.com/gtag/js?id=G-BQGC29GHP8" strategy="afterInteractive"/>
    <Script id="google-analytics" strategy="afterInteractive">{`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-BQGC29GHP8');
    `}</Script>
    <Script
      id="google-adsense"
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7864399969744116"
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  </body></html>;
}
