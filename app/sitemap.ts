import type { MetadataRoute } from "next";
import { createPublicSupabase } from "./lib/supabase";
import { CATEGORY_DETAILS } from "./lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://afro-fashionstyle.vercel.app";
  let products: Array<{ slug: string; updated_at: string }> = [];
  let posts: Array<{ slug: string; updated_at: string }> = [];
  try {
    const [{ data: productRows }, { data: postRows }] = await Promise.all([
      createPublicSupabase().from("products").select("slug,updated_at").eq("status", "active"),
      createPublicSupabase().from("blog_posts").select("slug,title,updated_at,published_at").eq("status", "published").order("published_at", { ascending: true }),
    ]);
    products = productRows || [];
    const seenTitles = new Set<string>();
    posts = (postRows || []).filter((post: { slug: string; updated_at: string; title?: string }) => {
      const key = String(post.title || post.slug).trim().toLowerCase();
      if (seenTitles.has(key)) return false;
      seenTitles.add(key);
      return true;
    });
  } catch {
    // Keep core routes available in build environments where runtime secrets are injected later.
  }
  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/shop`, changeFrequency: "daily", priority: .9 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: .7 },
    ...CATEGORY_DETAILS.map((category) => ({ url: `${baseUrl}/collections/${category.slug}`, changeFrequency: "weekly" as const, priority: .85 })),
    { url: `${baseUrl}/shipping-returns`, changeFrequency: "monthly", priority: .5 },
    { url: `${baseUrl}/size-guide`, changeFrequency: "monthly", priority: .6 },
    { url: `${baseUrl}/garment-care`, changeFrequency: "monthly", priority: .5 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: .6 },
    { url: `${baseUrl}/journal`, changeFrequency: "daily", priority: .8 },
    ...products.map((product) => ({ url: `${baseUrl}/products/${product.slug}`, lastModified: product.updated_at, changeFrequency: "weekly" as const, priority: .8 })),
    ...posts.map((post) => ({ url: `${baseUrl}/journal/${post.slug}`, lastModified: post.updated_at, changeFrequency: "monthly" as const, priority: .7 })),
  ];
}
