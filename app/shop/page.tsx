import { PremiumHeader } from "../components/premium-header";
import { SiteFooter } from "../components/site-footer";
import type { Product } from "../lib/commerce-types";
import { createPublicSupabase } from "../lib/supabase";
import { ShopClient } from "./shop-client";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const { data } = await createPublicSupabase().from("products")
    .select("id,name,slug,description,category,price_usd,price_gbp,stock,status,featured,product_images(id,secure_url,alt_text,position)")
    .eq("status", "active")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });
  const products = (data || []) as Product[];
  return <main>
    <PremiumHeader/>
    <section className="shop-hero"><span className="eyebrow">The complete collection</span><h1>Nigerian fashion<br/><em>with presence.</em></h1><p>Shop premium dresses, two-piece sets, lace occasion wear and accessories designed in Lagos, with secure tracked delivery across the USA and UK.</p></section>
    <ShopClient products={products}/>
    <SiteFooter/>
  </main>;
}
