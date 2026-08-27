import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PremiumHeader } from "../components/premium-header";
import { SiteFooter } from "../components/site-footer";

export const metadata: Metadata = {
  title: "Our Story | Premium Nigerian Fashion",
  description: "Discover Afro.Fashionstyle, a Lagos fashion brand bringing expressive Nigerian dresses, coordinated sets and lace occasion wear to women in the USA and UK.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "Our Story | Afro.Fashionstyle",
    description: "Nigerian artistry, expressive textiles and modern womenswear for memorable occasions.",
    url: "/about",
    images: [{ url: "/campaign-hero.webp", alt: "Afro.Fashionstyle Nigerian occasion wear" }],
  },
};

export default function AboutPage() {
  return <main>
    <PremiumHeader />
    <article className="about-page">
      <header className="about-hero">
        <div><span className="eyebrow">Our story</span><h1>Nigerian artistry.<br/><em>Modern confidence.</em></h1><p>Afro.Fashionstyle creates expressive womenswear for weddings, celebrations and every entrance worth remembering.</p><Link className="button primary" href="/shop">Explore the collection</Link></div>
        <div className="about-image"><Image src="/campaign-hero.webp" alt="Women wearing Afro.Fashionstyle Nigerian occasion designs" fill priority sizes="(max-width: 800px) 100vw, 50vw"/></div>
      </header>
      <section className="about-copy"><span className="eyebrow">Designed in Lagos · Styled worldwide</span><h2>Heritage textiles, shaped for now.</h2><p>Our collections celebrate the colour, movement and visual language of Ankara, Adire and Nigerian lace. We shape these textiles into polished dresses, coordinated two-piece outfits and occasion pieces for women who want style with presence.</p><p>From Lagos to customers across the USA and UK, every order is prepared with close attention to fit and presentation, then sent with tracked doorstep delivery.</p></section>
      <section className="about-values" aria-label="Afro Fashionstyle values"><div><b>01</b><h3>Distinctive design</h3><p>Confident silhouettes created to feel memorable, never ordinary.</p></div><div><b>02</b><h3>Nigerian expression</h3><p>Rich textiles and thoughtful details inspired by Nigerian style and culture.</p></div><div><b>03</b><h3>Personal support</h3><p>Friendly sizing and order assistance for customers wherever they shop.</p></div></section>
      <section className="about-cta"><h2>Find the piece that feels like you.</h2><div><Link className="button primary" href="/shop">Shop Afro.Fashionstyle</Link><Link className="text-link" href="/contact">Speak with our team →</Link></div></section>
    </article>
    <SiteFooter />
  </main>;
}
