import type { Metadata } from "next";
import Link from "next/link";
import { PremiumHeader } from "../components/premium-header";
import { SiteFooter } from "../components/site-footer";
import { createPublicSupabase } from "../lib/supabase";

export const metadata: Metadata = {
  title: "Nigerian Fashion Journal",
  description: "Daily styling guides and cultural notes on Ankara, Adire and contemporary Nigerian womenswear.",
  alternates: { canonical: "/journal" },
};
export const dynamic = "force-dynamic";

export default async function JournalPage() {
  let posts: Array<{ id: string; title: string; slug: string; excerpt: string; topic: string; published_at: string }> = [];
  try {
    const { data } = await createPublicSupabase().from("blog_posts")
      .select("id,title,slug,excerpt,topic,published_at").eq("status", "published")
      .lte("published_at", new Date().toISOString()).order("published_at", { ascending: false }).limit(24);
    posts = data || [];
  } catch {
    // Runtime configuration is injected by Vercel; keep the page build-safe.
  }
  return <main><PremiumHeader/><section className="journal-hero"><span className="eyebrow">The Afro.Fashionstyle journal</span><h1>Nigerian style,<br/><em>considered.</em></h1><p>Daily notes on African fashion, authentic textiles, fit and the art of dressing with purpose.</p></section>
    <section className="journal-grid">{posts.map((post, index) => <article key={post.id}><span>{String(index + 1).padStart(2, "0")} · {post.topic}</span><h2><Link href={`/journal/${post.slug}`}>{post.title}</Link></h2><p>{post.excerpt}</p><Link href={`/journal/${post.slug}`}>Read the story →</Link></article>)}{!posts.length && <article><h2>The journal is preparing its first edition.</h2><p>New Nigerian fashion stories are published daily.</p></article>}</section><SiteFooter/></main>;
}
