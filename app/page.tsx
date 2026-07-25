"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { trackMeta } from "./components/meta-pixel";

const products = [
  { name: "Zuri Sculpted Midi", category: "Ankara Edit", price: 189, color: "orange", tag: "Bestseller" },
  { name: "Amara Adire Gown", category: "Adire Collection", price: 245, color: "plum", tag: "New" },
  { name: "Ife Aso-Oke Set", category: "Occasion Wear", price: 320, color: "brown", tag: "Limited" },
  { name: "Sade Wrap Dress", category: "Everyday Luxury", price: 165, color: "teal", tag: "Exclusive" },
];

export default function Home() {
  const [bag, setBag] = useState<string[]>([]);
  const [currency, setCurrency] = useState<"USD" | "GBP">("USD");
  const [notice, setNotice] = useState("");
  const rate = currency === "USD" ? 1 : 0.78;
  const symbol = currency === "USD" ? "$" : "£";
  const total = useMemo(() => bag.reduce((sum, name) => sum + (products.find((p) => p.name === name)?.price ?? 0), 0), [bag]);

  function addToBag(name: string) {
    const product = products.find((item) => item.name === name);
    setBag((items) => [...items, name]);
    setNotice(`${name} added to your bag`);
    trackMeta("ViewContent", {
      content_name: name,
      content_category: product?.category,
      content_ids: [name],
      content_type: "product",
      value: Math.round((product?.price ?? 0) * rate),
      currency,
    });
    trackMeta("AddToCart", {
      content_name: name,
      content_ids: [name],
      content_type: "product",
      value: Math.round((product?.price ?? 0) * rate),
      currency,
    });
    setTimeout(() => setNotice(""), 2200);
  }

  return (
    <main>
      <div className="announcement">Complimentary US delivery over $200 · Duties included for UK orders</div>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Afro Fashionstyle home">
          <img src="/afro-fashionstyle-logo.png" alt="Afro Fashionstyle" />
        </Link>
        <nav aria-label="Main navigation">
          <a href="#new">New In</a><a href="#shop">Shop</a><a href="#story">Our Story</a><a href="#journal">Journal</a>
        </nav>
        <div className="header-actions">
          <button onClick={() => setCurrency(currency === "USD" ? "GBP" : "USD")} aria-label="Switch currency">{currency}</button>
          <button aria-label="Search">⌕</button>
          <button className="bag-button" onClick={() => document.getElementById("bag")?.scrollIntoView({ behavior: "smooth" })}>Bag <span>{bag.length}</span></button>
        </div>
      </header>

      <section className="hero" id="new">
        <img src="/campaign-hero.png" alt="Three women in modern Nigerian-inspired occasion wear" />
        <div className="hero-copy">
          <span className="eyebrow">The Heritage Collection · 2026</span>
          <h1>Wear your<br/><em>story.</em></h1>
          <p>Modern silhouettes. Nigerian soul. Designed for women who arrive with purpose.</p>
          <div className="hero-ctas"><a className="button primary" href="#shop">Shop the collection</a><a className="text-link" href="#story">Discover our craft →</a></div>
        </div>
        <div className="hero-note">Made in small editions<br/>in Lagos &amp; the USA</div>
      </section>

      <section className="values" aria-label="Our promises">
        <div><b>01</b><span><strong>Made with intention</strong>Small-batch, considered production.</span></div>
        <div><b>02</b><span><strong>Authentic textiles</strong>Fabric stories rooted in heritage.</span></div>
        <div><b>03</b><span><strong>Global delivery</strong>Tracked USA &amp; UK shipping.</span></div>
      </section>

      <section className="collection" id="shop">
        <div className="section-heading"><div><span className="eyebrow">Curated for you</span><h2>New arrivals</h2></div><a href="#shop">Shop all pieces →</a></div>
        <div className="product-grid">
          {products.map((product, index) => (
            <article className="product-card" key={product.name}>
              <div className={`product-image ${product.color}`}>
                <span>{product.tag}</span>
                <div className="fabric-mark" aria-hidden="true">{["✦","◒","✥","◆"][index]}</div>
                <button onClick={() => addToBag(product.name)} aria-label={`Add ${product.name} to bag`}>＋</button>
              </div>
              <p>{product.category}</p><h3>{product.name}</h3>
              <div className="product-meta"><span>{symbol}{Math.round(product.price * rate)}</span><small>US 2–18</small></div>
            </article>
          ))}
        </div>
      </section>

      <section className="story" id="story">
        <div className="story-pattern"><span>ÀṢÀ</span></div>
        <div className="story-copy"><span className="eyebrow">Rooted in culture. Made for now.</span><h2>A celebration<br/>of becoming.</h2><p>Afro.Fashionstyle brings Nigerian textile traditions into a modern wardrobe. Every piece is made to hold attention, carry meaning, and move beautifully through your world.</p><a className="button light" href="#journal">Read our story</a></div>
      </section>

      <section className="editorial" id="journal">
        <span className="eyebrow">The journal</span><h2>Notes on style, culture &amp; craft</h2>
        <div className="editorial-grid"><article><b>01</b><h3>How to style Ankara for a modern occasion</h3><a href="#">Read the edit →</a></article><article><b>02</b><h3>The living language of Adire</h3><a href="#">Discover the story →</a></article><article><b>03</b><h3>Your guide to finding the perfect fit</h3><a href="#">View size guide →</a></article></div>
      </section>

      <section className="newsletter">
        <div><span className="eyebrow">Inside Afro</span><h2>Join the circle.</h2><p>Private previews, styling notes and 10% off your first order.</p></div>
        <form onSubmit={(e) => { e.preventDefault(); trackMeta("Lead", { content_name: "Newsletter signup" }); setNotice("Welcome to the circle — check your inbox."); }}><label><span className="sr-only">Email address</span><input type="email" required placeholder="Email address" /></label><button>Join us →</button></form>
      </section>

      <section className="bag-summary" id="bag">
        <div><span className="eyebrow">Your selection</span><h2>{bag.length ? `${bag.length} piece${bag.length > 1 ? "s" : ""} reserved` : "Your bag is waiting"}</h2><p>{bag.length ? bag.join(" · ") : "Explore limited-edition pieces made to be remembered."}</p></div>
        <div><strong>{symbol}{Math.round(total * rate)}</strong><a onClick={() => bag.length && trackMeta("InitiateCheckout", { value: Math.round(total * rate), currency, num_items: bag.length, content_ids: bag })} className={`button primary ${!bag.length ? "disabled" : ""}`} href={bag.length ? `/checkout?gateway=flutterwave&total=${Math.round(total * rate)}&currency=${currency}` : "#shop"}>Checkout with Flutterwave</a><a onClick={() => bag.length && trackMeta("InitiateCheckout", { value: Math.round(total * rate), currency, num_items: bag.length, content_ids: bag })} className={`button paypal ${!bag.length ? "disabled" : ""}`} href={bag.length ? `/checkout?gateway=paypal&total=${Math.round(total * rate)}&currency=${currency}` : "#shop"}>PayPal checkout</a></div>
      </section>

      <footer><div className="footer-brand"><img src="/afro-fashionstyle-logo.png" alt="" /><p>Contemporary African fashion,<br/>designed without borders.</p></div><div><b>Shop</b><a href="#shop">New arrivals</a><a href="#shop">Dresses</a><a href="#shop">Occasion wear</a><a href="#shop">Made to order</a></div><div><b>Care</b><a href="#">Size guide</a><a href="#">Delivery &amp; returns</a><Link href="/orders/track">Track an order</Link><a href="#">Garment care</a></div><div><b>Follow</b><a href="#">Instagram</a><a href="#">Pinterest</a><a href="#">TikTok</a><Link href="/admin">Admin studio</Link></div><small>© 2026 Afro.Fashionstyle · Privacy · Terms · Accessibility</small></footer>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  );
}
