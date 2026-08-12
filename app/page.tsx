"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "./components/cart-provider";
import { PremiumHeader } from "./components/premium-header";
import { ProductCard } from "./components/product-card";
import { SiteFooter } from "./components/site-footer";
import { Turnstile } from "./components/turnstile";
import type { Product } from "./lib/commerce-types";
import { CATEGORY_DETAILS } from "./lib/catalog";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [notice, setNotice] = useState("");
  const { items, count, total, currency, setOpen } = useCart();

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/products", { signal: controller.signal }).then((response) => response.json()).then((result: { products?: Product[] }) => {
      if (result.products) setProducts(result.products);
    }).catch(() => setNotice("The collection is refreshing. Please try again shortly."));
    return () => controller.abort();
  }, []);

  return <main>
    <PremiumHeader/>
    <section className="hero" id="new">
      <Image src="/campaign-hero.png" alt="Three women in modern Nigerian-inspired occasion wear" fill priority sizes="100vw"/>
      <div className="hero-copy"><span className="eyebrow">Made on request in Lagos</span><h1>Nigerian dress,<br/><em>made yours.</em></h1><p>Dresses, two-piece sets and lace outfits made for your measurements and delivered to the USA and UK.</p><div className="hero-ctas"><Link className="button primary" href="/shop">Shop the collection</Link><a className="text-link" href="#story">How our pieces are made →</a></div></div>
      <div className="hero-note">Made in small editions<br/>in Lagos &amp; the USA</div>
    </section>

    <section className="values" aria-label="Our promises">
      <div><b>01</b><span><strong>Made on request</strong>Production takes 5–7 working days.</span></div>
      <div><b>02</b><span><strong>Nigerian textiles</strong>Ankara, Adire and lace designs.</span></div>
      <div><b>03</b><span><strong>Global delivery</strong>Tracked USA &amp; UK shipping.</span></div>
    </section>

    <section className="collection" id="shop">
      <div className="section-heading"><div><span className="eyebrow">Recently added</span><h2>New arrivals</h2></div><Link href="/shop">Shop all pieces →</Link></div>
      <div className="product-grid">{products.slice(0, 8).map((product) => <ProductCard product={product} key={product.id}/>)}</div>
    </section>

    <section className="category-directory" aria-labelledby="category-title"><div className="section-heading"><div><span className="eyebrow">Shop by design</span><h2 id="category-title">Five ways to wear Afro.</h2></div></div><div>{CATEGORY_DETAILS.map((category, index) => <Link href={`/collections/${category.slug}`} key={category.slug}><span>0{index + 1}</span><strong>{category.name}</strong><small>Explore the collection →</small></Link>)}</div></section>

    <section className="story" id="story"><div className="story-pattern"><span>ÀṢÀ</span></div><div className="story-copy"><span className="eyebrow">Designed and made in Lagos</span><h2>Nigerian textiles,<br/>modern silhouettes.</h2><p>Afro.Fashionstyle makes women’s dresses, two-piece sets and lace outfits in Lagos. Each outfit is produced after ordering and can be prepared using the customer’s measurements.</p><a className="button light" href="#journal">Read the journal</a></div></section>

    <section className="editorial" id="journal"><span className="eyebrow">The journal</span><h2>Notes on style, culture &amp; craft</h2><div className="editorial-grid"><article><b>01</b><h3>How to style Ankara for a modern occasion</h3><Link href="/journal">Read our styling journal →</Link></article><article><b>02</b><h3>The living language of Adire</h3><Link href="/journal">Discover the story →</Link></article><article><b>03</b><h3>Your guide to finding the perfect fit</h3><Link href="/size-guide">View size guide →</Link></article></div></section>

    <section className="newsletter"><div><span className="eyebrow">Inside Afro</span><h2>Join the circle.</h2><p>Private previews, practical styling notes and first access to new pieces.</p></div><form onSubmit={async (event) => { event.preventDefault(); const form = event.currentTarget; const fields = new FormData(form); const email = String(fields.get("email") || ""); const response = await fetch("/api/newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, turnstileToken: fields.get("cf-turnstile-response") }) }); const result = await response.json() as { message?: string; error?: string }; setNotice(result.message || result.error || "Please try again."); if (response.ok) form.reset(); }}><div className="newsletter-fields"><label><span className="sr-only">Email address</span><input name="email" type="email" required placeholder="Email address"/></label><button>Join us →</button></div><Turnstile action="newsletter"/></form></section>

    <section className="bag-summary" id="bag">
      <div><span className="eyebrow">Your selection</span><h2>{count ? `${count} piece${count > 1 ? "s" : ""} in your bag` : "Your bag is empty"}</h2><p>{count ? items.map((item) => item.name).join(" · ") : "Browse made-to-order dresses, sets, lace outfits and accessories."}</p></div>
      <div><strong>{currency === "USD" ? "$" : "£"}{total.toFixed(2)}</strong><button onClick={() => { if (count) setOpen(true); }} className={`button primary ${!count ? "disabled" : ""}`}>Review bag &amp; checkout</button></div>
    </section>

    <SiteFooter/>
    {notice && <div className="toast" role="status">{notice}</div>}
  </main>;
}
