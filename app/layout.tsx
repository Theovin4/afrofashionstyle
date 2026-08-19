import type { Metadata } from "next";
import Script from "next/script";
import { CartProvider } from "./components/cart-provider";
import { MetaPixel } from "./components/meta-pixel";
import { ContactActions } from "./components/contact-actions";
import { ThemeControl } from "./components/theme-control";
import { ActionToastViewport } from "./components/action-toast";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://afro-fashionstyle.vercel.app"),
  title: { default: "Afro.Fashionstyle | Premium Nigerian Fashion for Women", template: "%s | Afro.Fashionstyle" },
  description: "Shop made-to-order Nigerian dresses, two-piece outfits, lace occasion wear and African fashion designs for women in the USA and UK.",
  keywords: ["African fashion for women USA", "Nigerian dresses online", "Ankara dresses USA", "Adire fashion", "African occasion wear UK"],
  openGraph: { title: "Afro.Fashionstyle — Nigerian Womenswear for the USA & UK", description: "Made-to-order Nigerian dresses, sets, lace outfits and occasion wear with tracked USA and UK delivery.", images: ["/og.webp"], type: "website", locale: "en_US", alternateLocale: ["en_GB"] },
  twitter: { card: "summary_large_image", title: "Afro.Fashionstyle — Wear Your Story", images: ["/og.webp"] },
  icons: { icon: "/afro-fashionstyle-monogram.png", apple: "/afro-fashionstyle-monogram.png" },
  alternates: { canonical: "/" },
  verification: { google: "XBN4mZJ1-rjDyXZAObhygPIIh2bftEzrW_O_W4CehNo" },
  other: { "google-adsense-account": "ca-pub-7864399969744116" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const schema = {
    "@context": "https://schema.org", "@type": "ClothingStore", name: "Afro.Fashionstyle",
    url: "https://afro-fashionstyle.vercel.app", logo: "https://afro-fashionstyle.vercel.app/afro-fashionstyle-monogram.png", areaServed: ["US", "GB"],
    description: "Made-to-order Nigerian womenswear produced in Lagos and delivered to customers in the USA and UK.",
    address: { "@type": "PostalAddress", addressLocality: "Lekki", addressRegion: "Lagos", addressCountry: "NG" },
    email: "afrofashionclub@gmail.com", telephone: "+2347049841931",
    currenciesAccepted: "USD, GBP", paymentAccepted: "PayPal, Flutterwave",
  };
  return <html lang="en" suppressHydrationWarning><body>
    <Script id="theme-bootstrap" strategy="beforeInteractive">{`
      try {
        var admin = location.pathname.indexOf('/admin') === 0;
        var saved = localStorage.getItem('afro-theme');
        var theme = admin ? 'dark' : (saved === 'dark' || saved === 'light' ? saved : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
      } catch (_) {}
    `}</Script>
    <Script id="google-consent-default" strategy="beforeInteractive">{`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('consent', 'default', {
        ad_storage: 'denied',
        analytics_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        wait_for_update: 500
      });
    `}</Script>
    <CartProvider>{children}</CartProvider>
    <ActionToastViewport/>
    <ContactActions/>
    <ThemeControl/>
    <MetaPixel/>
    <Script src="https://www.googletagmanager.com/gtag/js?id=G-BQGC29GHP8" strategy="afterInteractive"/>
    <Script id="google-analytics" strategy="afterInteractive">{`
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function(){dataLayer.push(arguments);};
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
