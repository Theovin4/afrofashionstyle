"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CATEGORY_DETAILS } from "../lib/catalog";
import { BrandLogo } from "./brand-logo";

export function SiteFooter() {
  const [socials, setSocials] = useState<Record<string, string>>({});
  const [supportEmail, setSupportEmail] = useState("");
  useEffect(() => { void fetch("/api/commerce-config").then((response) => response.json()).then((result: { settings?: { socials?: Record<string, string>; contact?: { support_email?: string } } }) => { setSocials(result.settings?.socials || {}); setSupportEmail(result.settings?.contact?.support_email || ""); }).catch(() => undefined); }, []);
  const socialLinks = [["Instagram", socials.instagram], ["Facebook", socials.facebook], ["TikTok", socials.tiktok], ["Pinterest", socials.pinterest]].filter((entry) => entry[1]);

  return <footer>
    <div className="footer-brand"><BrandLogo variant="footer" decorative/><p>Nigerian womenswear made on request in Lagos for customers in the USA and UK.</p>{supportEmail && <a href={`mailto:${supportEmail}`}>{supportEmail}</a>}</div>
    <div><b>Shop</b>{CATEGORY_DETAILS.map((category) => <Link href={`/collections/${category.slug}`} key={category.slug}>{category.name}</Link>)}</div>
    <div><b>Care</b><Link href="/size-guide">Size guide</Link><Link href="/shipping-returns">Delivery &amp; order policy</Link><Link href="/orders/track">Track an order</Link><Link href="/garment-care">Garment care</Link></div>
    <div><b>Follow</b>{socialLinks.map(([label, url]) => <a href={url} key={label} target="_blank" rel="noreferrer">{label}</a>)}<a href="https://wa.me/2347049841931" target="_blank" rel="noreferrer">WhatsApp</a><Link href="/contact" data-meta-contact="enquiry">Contact us</Link><Link href="/journal">Journal</Link></div>
    <small>© 2026 Afro.Fashionstyle · <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link> · Accessibility</small>
  </footer>;
}
