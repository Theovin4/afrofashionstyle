import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PremiumHeader } from "../../components/premium-header";
import { ProductCard } from "../../components/product-card";
import { SiteFooter } from "../../components/site-footer";
import { CATEGORY_DETAILS } from "../../lib/catalog";
import type { Product } from "../../lib/commerce-types";
import { createPublicSupabase } from "../../lib/supabase";

const baseUrl = "https://afro-fashionstyle.vercel.app";
const findCategory = (slug: string) => CATEGORY_DETAILS.find((category) => category.slug === slug);
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const category = findCategory((await params).slug);
  if (!category) return {};
  return {
    title: category.title,
    description: category.description,
    alternates: { canonical: `/collections/${category.slug}` },
    openGraph: { title: `${category.title} | Afro.Fashionstyle`, description: category.description, url: `/collections/${category.slug}`, images: ["/og.png"] },
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const category = findCategory((await params).slug);
  if (!category) notFound();
  const { data } = await createPublicSupabase().from("products")
    .select("id,name,slug,description,category,price_usd,price_gbp,stock,status,featured,product_images(id,secure_url,alt_text,position)")
    .eq("status", "active").eq("category", category.name).order("created_at", { ascending: false });
  const products = (data || []) as Product[];
  const schema = {
    "@context": "https://schema.org", "@type": "CollectionPage", name: category.title,
    description: category.description, url: `${baseUrl}/collections/${category.slug}`,
    mainEntity: { "@type": "ItemList", numberOfItems: products.length, itemListElement: products.map((product, index) => ({ "@type": "ListItem", position: index + 1, url: `${baseUrl}/products/${product.slug}`, name: product.name })) },
  };
  return <main><PremiumHeader/><section className="collection-landing"><span className="eyebrow">Afro.Fashionstyle collection</span><h1>{category.name}</h1><p>{category.description}</p></section><section className="collection-results"><div className="section-heading"><div><span className="eyebrow">Made on request</span><h2>{products.length ? `${products.length} available ${products.length === 1 ? "design" : "designs"}` : "New pieces are being prepared"}</h2></div></div>{products.length ? <div className="product-grid">{products.map((product) => <ProductCard product={product} key={product.id}/>)}</div> : <div className="empty-results"><h2>Coming soon.</h2><p>Contact us for a made-to-order enquiry while this collection is being prepared.</p><a className="button primary" href="https://wa.me/2347049841931" target="_blank" rel="noreferrer">Ask on WhatsApp</a></div>}</section><SiteFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}/></main>;
}
