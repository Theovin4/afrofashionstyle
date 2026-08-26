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
  const description = product.description || `Shop ${product.name}, a premium Nigerian ${product.category.toLowerCase()} design by Afro.Fashionstyle with tracked USA and UK delivery.`;
  return {
    title: product.name, description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title: product.name, description, type: "website", images: product.product_images?.[0]?.secure_url ? [product.product_images[0].secure_url] : ["/og.webp"] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  const { data: relatedRows } = await createPublicSupabase().from("products")
    .select("id,name,slug,description,category,price_usd,price_gbp,stock,status,featured,product_images(id,secure_url,alt_text,position)")
    .eq("status", "active").eq("category", product.category).neq("id", product.id).limit(3);
  const productDescriptionText = product.description || `Shop ${product.name}, a premium Nigerian ${product.category.toLowerCase()} design by Afro.Fashionstyle with tracked USA and UK delivery.`;
  const schema = {
    "@context": "https://schema.org", "@type": "Product", name: product.name, description: productDescriptionText,
    image: product.product_images?.map((image) => image.secure_url), sku: product.id, brand: { "@type": "Brand", name: "Afro.Fashionstyle" },
    category: product.category, audience: { "@type": "PeopleAudience", suggestedGender: "female" },
    offers: { "@type": "Offer", priceCurrency: "USD", price: Number(product.price_usd).toFixed(2), itemCondition: "https://schema.org/NewCondition", availability: product.stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `https://afro-fashionstyle.vercel.app/products/${product.slug}`, seller: { "@type": "Organization", name: "Afro.Fashionstyle" }, shippingDetails: [{ "@type": "OfferShippingDetails", shippingDestination: { "@type": "DefinedRegion", addressCountry: "US" }, shippingRate: { "@type": "MonetaryAmount", value: "50.00", currency: "USD" }, deliveryTime: { "@type": "ShippingDeliveryTime", handlingTime: { "@type": "QuantitativeValue", minValue: 5, maxValue: 7, unitCode: "DAY" } } }] },
    hasMerchantReturnPolicy: [{ "@type": "MerchantReturnPolicy", applicableCountry: ["US", "GB"], returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted" }],
  };
  const breadcrumb = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Shop", item: "https://afro-fashionstyle.vercel.app/shop" }, { "@type": "ListItem", position: 2, name: product.category, item: `https://afro-fashionstyle.vercel.app/collections/${product.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` }, { "@type": "ListItem", position: 3, name: product.name }] };
  return <main><PremiumHeader/><ProductDetail product={product} related={(relatedRows || []) as Product[]}/><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([schema, breadcrumb]) }}/></main>;
}
