import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PremiumHeader } from "../../components/premium-header";
import { createPublicSupabase } from "../../lib/supabase";
import type { Product } from "../../lib/commerce-types";
import { ProductDetail } from "./product-detail";

async function getProduct(slug: string) {
  const { data } = await createPublicSupabase().from("products")
    .select("id,name,slug,description,category,price_usd,price_gbp,stock,status,featured,product_images(id,secure_url,alt_text,position),product_variants(id,size,color,sku,stock,active),product_reviews(id,customer_name,rating,title,body,verified_purchase,created_at)")
    .eq("slug", slug).eq("status", "active").single();
  return data as Product | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return {};
  const description = product.description || `Shop ${product.name}, premium Nigerian-inspired womenswear by Afro.Fashionstyle. USA and UK delivery.`;
  return {
    title: product.name, description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title: product.name, description, type: "website", images: product.product_images?.[0]?.secure_url ? [product.product_images[0].secure_url] : ["/og.png"] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  const { data: relatedRows } = await createPublicSupabase().from("products")
    .select("id,name,slug,description,category,price_usd,price_gbp,stock,status,featured,product_images(id,secure_url,alt_text,position)")
    .eq("status", "active").eq("category", product.category).neq("id", product.id).limit(3);
  const schema = {
    "@context": "https://schema.org", "@type": "Product", name: product.name, description: product.description,
    image: product.product_images?.map((image) => image.secure_url), sku: product.id, brand: { "@type": "Brand", name: "Afro.Fashionstyle" },
    offers: [
      { "@type": "Offer", priceCurrency: "USD", price: Number(product.price_usd).toFixed(2), availability: product.stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `https://afro-fashionstyle.vercel.app/products/${product.slug}` },
      { "@type": "Offer", priceCurrency: "GBP", price: Number(product.price_gbp).toFixed(2), availability: product.stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
    ],
  };
  return <main><PremiumHeader/><ProductDetail product={product} related={(relatedRows || []) as Product[]}/><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}/></main>;
}
