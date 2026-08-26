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
  title: { default: "Afro.Fashionstyle | Nigerian Dresses & African Fashion", template: "%s | Afro.Fashionstyle" },
  description: "Shop premium Nigerian dresses, Ankara styles, two-piece sets and lace occasion wear for women, with tracked delivery across the USA and UK.",
  keywords: ["Nigerian dresses for women", "African fashion USA", "Ankara dresses online", "Nigerian occasion wear UK", "African two piece outfits", "Nigerian lace dresses"],
  openGraph: { title: "Afro.Fashionstyle — Premium Nigerian Fashion for Women", description: "Statement Nigerian dresses, coordinated sets, lace occasion wear and accessories with tracked USA and UK delivery.", images: ["/og.webp"], type: "website", locale: "en_US", alternateLocale: ["en_GB"] },
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
    description: "Premium Nigerian womenswear, Ankara dresses, lace occasion wear and coordinated sets designed in Lagos for women in the USA and UK.",
    address: { "@type": "PostalAddress", addressLocality: "Lekki", addressRegion: "Lagos", addressCountry: "NG" },
    email: "afrofashionclub@gmail.com", telephone: "+2347049841931",
    currenciesAccepted: "USD, GBP", paymentAccepted: "PayPal, Flutterwave, Cryptocurrency",
    sameAs: ["https://www.instagram.com/afro.fashionstyle", "https://www.facebook.com/afro.fashionstyles", "https://tiktok.com/@afrofashionstyle"],
    hasMerchantReturnPolicy: { "@type": "MerchantReturnPolicy", applicableCountry: ["US", "GB"], returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted" },
  };
  return <html lang="en" data-theme="dark" style={{ colorScheme: "dark" }} suppressHydrationWarning><body>
    <Script id="theme-bootstrap" strategy="beforeInteractive">{`
      try {
        var admin = location.pathname.indexOf('/admin') === 0;
        var saved = localStorage.getItem('afro-theme');
        var theme = admin ? 'dark' : (saved === 'dark' || saved === 'light' ? saved : 'dark');
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
    <script
      id="google-adsense"
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7864399969744116"
      crossOrigin="anonymous"
    />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  </body></html>;
}
