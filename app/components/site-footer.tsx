"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export function SiteFooter() {
  const [socials, setSocials] = useState<Record<string, string>>({});
  useEffect(() => { void fetch("/api/commerce-config").then((response) => response.json()).then((result: { settings?: { socials?: Record<string, string> } }) => setSocials(result.settings?.socials || {})).catch(() => undefined); }, []);
  const socialLinks = [["Instagram", socials.instagram], ["Facebook", socials.facebook], ["TikTok", socials.tiktok], ["Pinterest", socials.pinterest]].filter((entry) => entry[1]);
  return <footer><div className="footer-brand"><Image src="/afro-fashionstyle-logo.png" alt="" width={180} height={90}/><p>Contemporary African fashion,<br/>designed without borders.</p></div><div><b>Shop</b><Link href="/shop">New arrivals</Link><Link href="/shop">Dresses</Link><Link href="/shop">Occasion wear</Link><Link href="/shop">Made to order</Link></div><div><b>Care</b><a href="#">Size guide</a><Link href="/shipping-returns">Delivery &amp; returns</Link><Link href="/orders/track">Track an order</Link><a href="#">Garment care</a></div><div><b>Follow</b>{socialLinks.map(([label, url]) => <a href={url} key={label} target="_blank" rel="noreferrer">{label}</a>)}{!socialLinks.length && <span>Social links coming soon</span>}<Link href="/admin">Admin studio</Link></div><small>© 2026 Afro.Fashionstyle · <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link> · Accessibility</small></footer>;
}
