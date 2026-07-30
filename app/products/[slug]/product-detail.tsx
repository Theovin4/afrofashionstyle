"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Product } from "../../lib/commerce-types";
import { useCart } from "../../components/cart-provider";
import { ProductCard } from "../../components/product-card";
import { trackMeta } from "../../components/meta-pixel";

const sizes = ["US 2", "US 4", "US 6", "US 8", "US 10", "US 12", "US 14", "US 16", "US 18"];

export function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  const { addItem, currency } = useCart();
  const [size, setSize] = useState("");
  const [sizeError, setSizeError] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [wishlisted, setWishlisted] = useState(false);
  const image = product.product_images?.[0];
  const price = Number(currency === "GBP" ? product.price_gbp : product.price_usd);
  const trackedProduct = useRef("");

  useEffect(() => {
    const key = "afro-recently-viewed";
    const current = JSON.parse(localStorage.getItem(key) || "[]") as string[];
    localStorage.setItem(key, JSON.stringify([product.slug, ...current.filter((slug) => slug !== product.slug)].slice(0, 8)));
    if (trackedProduct.current !== product.id) {
      trackedProduct.current = product.id;
      trackMeta("ViewContent", {
        content_ids: [product.id], content_name: product.name, content_category: product.category,
        content_type: "product", contents: [{ id: product.id, quantity: 1, item_price: price }],
        value: price, currency,
      });
    }
  }, [product.id, product.slug, product.name, product.category, price, currency]);

  function add() {
    if (!size) { setSizeError(true); return; }
    addItem(product, size);
    setSizeError(false);
  }

  return <>
  <section className="product-detail">
    <div className="product-gallery">
      {image ? <Image src={image.secure_url} alt={image.alt_text || product.name} fill priority sizes="(max-width: 900px) 100vw, 58vw"/> : <div className="product-detail-placeholder">AF</div>}
      <span>Limited edition</span>
    </div>
    <div className="product-info"><span className="eyebrow">{product.category}</span><h1>{product.name}</h1><p className="detail-price">{currency} {price.toFixed(2)}</p>
      <p className="detail-description">{product.description || "A considered Afro.Fashionstyle silhouette, crafted to celebrate Nigerian textile heritage through a modern feminine lens."}</p>
      <div className="size-heading"><b>Select size</b><Link href="/size-guide">Size guide</Link></div>
      <div className="size-grid">{(product.product_variants?.filter((variant) => variant.active && variant.stock > 0).map((variant) => variant.size) || sizes).map((item) => <button className={size === item ? "active" : ""} onClick={() => { setSize(item); setSizeError(false); }} key={item}>{item}</button>)}</div>
      {sizeError && <p className="size-error">Please select your size.</p>}
      <button className="add-to-bag" disabled={product.stock < 1} onClick={add}>{product.stock ? "Add to bag" : "Sold out"} · {currency === "USD" ? "$" : "£"}{price.toFixed(2)}</button>
      <button className="wishlist-button" onClick={() => { const next = !wishlisted; setWishlisted(next); localStorage.setItem(`wishlist:${product.id}`, String(next)); }}>{wishlisted ? "♥ Saved to wishlist" : "♡ Save to wishlist"}</button>
      <div className="product-promises"><p><b>Fly Logistics delivery</b><span>Tracked doorstep delivery</span></p><p><b>Made on request</b><span>Allow 5–7 working days</span></p><p><b>Need size help?</b><span>Forward your measurements before production</span></p></div>
      <details open><summary>Story &amp; details</summary><p>{product.description || "Designed between Lagos and the USA with a focus on form, movement and cultural expression."}</p></details>
      <details><summary>Delivery &amp; order policy</summary><p>Fly Logistics provides tracked USA and UK doorstep delivery. All outfits are made on request, so no returns or refunds are offered after production begins. Please forward your measurements if you are unsure of your size.</p></details>
      <section className="reviews-block"><span className="eyebrow">Customer stories</span><h2>Reviews</h2>
        {product.product_reviews?.length ? product.product_reviews.map((review) => <article key={review.id}><b>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</b><h3>{review.title || "Beautifully made"}</h3><p>{review.body}</p><small>{review.customer_name}{review.verified_purchase ? " · Verified purchase" : ""}</small></article>) : <p>Be the first to share how this piece made you feel.</p>}
        <form onSubmit={async (event) => {
          event.preventDefault(); setReviewMessage("Sending…"); const fields = new FormData(event.currentTarget);
          const response = await fetch("/api/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
            productId: product.id, name: fields.get("name"), email: fields.get("email"), rating: Number(fields.get("rating")), title: fields.get("title"), body: fields.get("body"),
          }) }); const result = await response.json() as { message?: string; error?: string }; setReviewMessage(result.message || result.error || "Unable to submit review.");
          if (response.ok) event.currentTarget.reset();
        }}>
          <div className="form-split"><label>Name<input name="name" required/></label><label>Email<input name="email" type="email" required/></label></div>
          <div className="form-split"><label>Rating<select name="rating" defaultValue="5"><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select></label><label>Title<input name="title"/></label></div>
          <label>Your review<textarea name="body" minLength={10} required rows={4}/></label><button>Submit review</button>{reviewMessage && <p role="status">{reviewMessage}</p>}
        </form>
      </section>
    </div>
  </section>
  {related.length > 0 && <section className="related-products"><span className="eyebrow">Complete the story</span><h2>You may also love</h2><div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item}/>)}</div></section>}
  </>;
}
