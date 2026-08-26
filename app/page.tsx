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
import { showActionToast } from "./components/action-toast";

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
      <Image src="/campaign-hero.webp" alt="Three women in modern Nigerian-inspired occasion wear" fill priority sizes="100vw"/>
      <div className="hero-copy"><span className="eyebrow">Premium Nigerian fashion · USA &amp; UK delivery</span><h1>Own the room.<br/><em>Wear your story.</em></h1><p>Discover striking Nigerian dresses, polished two-piece sets and lace occasion wear designed for weddings, celebrations and unforgettable entrances.</p><div className="hero-ctas"><Link className="button primary" href="/shop">Shop new arrivals</Link><a className="text-link" href="#story">Discover Afro.Fashionstyle →</a></div></div>
      <div className="hero-note">Designed in Lagos<br/>Styled worldwide</div>
    </section>

    <section className="values" aria-label="Our promises">
      <div><b>01</b><span><strong>Confident silhouettes</strong>Statement designs with a considered fit.</span></div>
      <div><b>02</b><span><strong>Nigerian artistry</strong>Expressive Ankara, Adire and lace.</span></div>
      <div><b>03</b><span><strong>Tracked delivery</strong>Doorstep service across the USA and UK.</span></div>
    </section>

    <section className="collection" id="shop">
      <div className="section-heading"><div><span className="eyebrow">Recently added</span><h2>New arrivals</h2></div><Link href="/shop">Shop all pieces →</Link></div>
      <div className="product-grid">{products.slice(0, 8).map((product) => <ProductCard product={product} key={product.id}/>)}</div>
    </section>

    <section className="category-directory" aria-labelledby="category-title"><div className="section-heading"><div><span className="eyebrow">Find your look</span><h2 id="category-title">Dress for the moment.</h2></div></div><div>{CATEGORY_DETAILS.map((category, index) => <Link href={`/collections/${category.slug}`} key={category.slug}><span>0{index + 1}</span><strong>{category.name}</strong><small>Shop now →</small></Link>)}</div></section>

    <section className="story" id="story"><div className="story-pattern"><span>ÀṢÀ</span></div><div className="story-copy"><span className="eyebrow">Designed in Lagos</span><h2>Heritage textiles,<br/>modern confidence.</h2><p>Afro.Fashionstyle brings the colour, movement and artistry of Nigerian Ankara, Adire and lace into refined womenswear. Each silhouette is created to help you feel distinctive at weddings, cultural celebrations and standout everyday moments.</p><a className="button light" href="#journal">Explore Nigerian style</a></div></section>

    <section className="editorial" id="journal"><span className="eyebrow">The journal</span><h2>Notes on style, culture &amp; craft</h2><div className="editorial-grid"><article><b>01</b><h3>How to style Ankara for a modern occasion</h3><Link href="/journal">Read our styling journal →</Link></article><article><b>02</b><h3>The living language of Adire</h3><Link href="/journal">Discover the story →</Link></article><article><b>03</b><h3>Your guide to finding the perfect fit</h3><Link href="/size-guide">View size guide →</Link></article></div></section>

    <section className="newsletter"><div><span className="eyebrow">Inside Afro</span><h2>Join the circle.</h2><p>Private previews, practical styling notes and first access to new pieces.</p></div><form onSubmit={async (event) => { event.preventDefault(); const form = event.currentTarget; const fields = new FormData(form); const email = String(fields.get("email") || ""); const response = await fetch("/api/newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, turnstileToken: fields.get("cf-turnstile-response") }) }); const result = await response.json() as { message?: string; error?: string }; const message = result.message || result.error || "Please try again."; setNotice(message); showActionToast(message, response.ok ? "success" : "error"); if (response.ok) form.reset(); }}><div className="newsletter-fields"><label><span className="sr-only">Email address</span><input name="email" type="email" required placeholder="Email address"/></label><button>Join us →</button></div><Turnstile action="newsletter"/></form></section>

    <section className="bag-summary" id="bag">
      <div><span className="eyebrow">Your selection</span><h2>{count ? `${count} piece${count > 1 ? "s" : ""} in your bag` : "Find your next statement piece"}</h2><p>{count ? items.map((item) => item.name).join(" · ") : "Explore Nigerian dresses, coordinated sets, lace outfits and accessories."}</p></div>
      <div><strong>{currency === "USD" ? "$" : "£"}{total.toFixed(2)}</strong><button onClick={() => { if (count) setOpen(true); }} className={`button primary ${!count ? "disabled" : ""}`}>Review bag &amp; checkout</button></div>
    </section>

    <SiteFooter/>
    {notice && <div className="toast" role="status">{notice}</div>}
  </main>;
}
