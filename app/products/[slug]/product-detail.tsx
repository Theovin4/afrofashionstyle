"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "../../lib/commerce-types";
import { useCart } from "../../components/cart-provider";

const sizes = ["US 2", "US 4", "US 6", "US 8", "US 10", "US 12", "US 14", "US 16", "US 18"];

export function ProductDetail({ product }: { product: Product }) {
  const { addItem, currency } = useCart();
  const [size, setSize] = useState("");
  const [sizeError, setSizeError] = useState(false);
  const image = product.product_images?.[0];
  const price = Number(currency === "GBP" ? product.price_gbp : product.price_usd);

  function add() {
    if (!size) { setSizeError(true); return; }
    addItem(product, size);
    setSizeError(false);
  }

  return <section className="product-detail">
    <div className="product-gallery">
      {image ? <Image src={image.secure_url} alt={image.alt_text || product.name} fill priority sizes="(max-width: 900px) 100vw, 58vw"/> : <div className="product-detail-placeholder">AF</div>}
      <span>Limited edition</span>
    </div>
    <div className="product-info"><span className="eyebrow">{product.category}</span><h1>{product.name}</h1><p className="detail-price">{currency} {price.toFixed(2)}</p>
      <p className="detail-description">{product.description || "A considered Afro.Fashionstyle silhouette, crafted to celebrate Nigerian textile heritage through a modern feminine lens."}</p>
      <div className="size-heading"><b>Select size</b><button>Size guide</button></div>
      <div className="size-grid">{sizes.map((item) => <button className={size === item ? "active" : ""} onClick={() => { setSize(item); setSizeError(false); }} key={item}>{item}</button>)}</div>
      {sizeError && <p className="size-error">Please select your size.</p>}
      <button className="add-to-bag" disabled={product.stock < 1} onClick={add}>{product.stock ? "Add to bag" : "Sold out"} · {currency === "USD" ? "$" : "£"}{price.toFixed(2)}</button>
      <div className="product-promises"><p><b>Complimentary delivery</b><span>On US orders over $200</span></p><p><b>Made with intention</b><span>Produced in considered editions</span></p><p><b>Easy returns</b><span>14-day return window</span></p></div>
      <details open><summary>Story &amp; details</summary><p>{product.description || "Designed between Lagos and the USA with a focus on form, movement and cultural expression."}</p></details>
      <details><summary>Delivery &amp; returns</summary><p>Tracked shipping across the USA and UK. Delivery estimates are confirmed at checkout.</p></details>
    </div>
  </section>;
}
