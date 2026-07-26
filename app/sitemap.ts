import type { MetadataRoute } from "next";
import { createPublicSupabase } from "./lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://afro-fashionstyle.vercel.app";
  let products: Array<{ slug: string; updated_at: string }> = [];
  try {
    const { data } = await createPublicSupabase().from("products").select("slug,updated_at").eq("status", "active");
    products = data || [];
  } catch {
    // Keep core routes available in build environments where runtime secrets are injected later.
  }
  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/shop`, changeFrequency: "daily", priority: .9 },
    { url: `${baseUrl}/orders/track`, changeFrequency: "monthly", priority: .4 },
    ...products.map((product) => ({ url: `${baseUrl}/products/${product.slug}`, lastModified: product.updated_at, changeFrequency: "weekly" as const, priority: .8 })),
  ];
}
