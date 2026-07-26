"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "../lib/commerce-types";
import { useCart } from "./cart-provider";

export function ProductCard({ product }: { product: Product }) {
  const { currency } = useCart();
  const price = Number(currency === "GBP" ? product.price_gbp : product.price_usd);
  return <article className="product-card">
    <div className="product-image dynamic-product">
      <Link href={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
        {product.product_images?.[0] ? <Image className="catalog-image" src={product.product_images[0].secure_url} alt={product.product_images[0].alt_text || product.name} fill sizes="(max-width: 700px) 50vw, 25vw"/> : <span className="product-placeholder">AF</span>}
      </Link>
      <span>{product.featured ? "Featured" : product.stock < 8 ? "Limited" : "New"}</span>
      <button disabled={product.stock < 1} onClick={() => window.location.assign(`/products/${product.slug}`)} aria-label={`Choose a size for ${product.name}`}>→</button>
    </div>
    <p>{product.category}</p><Link href={`/products/${product.slug}`}><h3>{product.name}</h3></Link>
    <div className="product-meta"><span>{currency === "USD" ? "$" : "£"}{price.toFixed(2)}</span><small>{product.stock > 0 ? "US 2–18" : "Sold out"}</small></div>
  </article>;
}
