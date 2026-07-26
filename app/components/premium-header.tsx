"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "./cart-provider";

export function PremiumHeader() {
  const { count, currency, setCurrency, setOpen } = useCart();
  return <>
    <div className="announcement">Complimentary US delivery over $200 · Duties included for UK orders</div>
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Afro.Fashionstyle home"><Image src="/afro-fashionstyle-logo.png" alt="Afro.Fashionstyle" width={220} height={220} priority/></Link>
      <nav aria-label="Main navigation"><Link href="/shop">New In</Link><Link href="/shop">Shop</Link><Link href="/#story">Our Story</Link><Link href="/#journal">Journal</Link></nav>
      <div className="header-actions">
        <button onClick={() => setCurrency(currency === "USD" ? "GBP" : "USD")} aria-label="Switch currency">{currency}</button>
        <Link className="search-link" href="/shop" aria-label="Search collection">⌕</Link>
        <button className="bag-button" onClick={() => setOpen(true)}>Bag <span>{count}</span></button>
      </div>
    </header>
  </>;
}
