"use client";

import Link from "next/link";
import { useCart } from "./cart-provider";
import { BrandLogo } from "./brand-logo";

export function PremiumHeader() {
  const { count, currency, setCurrency, setOpen } = useCart();
  return <>
    <div className="announcement">Premium Nigerian fashion · Tracked USA &amp; UK delivery</div>
    <header className="site-header">
      <BrandLogo priority/>
      <nav aria-label="Main navigation"><Link href="/shop">New In</Link><Link href="/shop">Shop</Link><Link href="/#story">Our Story</Link><Link href="/journal">Journal</Link></nav>
      <div className="header-actions">
        <button onClick={() => setCurrency(currency === "USD" ? "GBP" : "USD")} aria-label="Switch currency">{currency}</button>
        <Link className="search-link" href="/shop" aria-label="Search collection">⌕</Link>
        <button className="bag-button" onClick={() => setOpen(true)}>Bag <span>{count}</span></button>
      </div>
    </header>
  </>;
}
