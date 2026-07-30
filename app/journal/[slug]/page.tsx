import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PremiumHeader } from "../../components/premium-header";
import { SiteFooter } from "../../components/site-footer";
import { createPublicSupabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";

async function getPost(slug: string) {
  const { data } = await createPublicSupabase().from("blog_posts").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = await getPost((await params).slug);
  return post ? { title: post.seo_title || post.title, description: post.seo_description || post.excerpt, alternates: { canonical: `/journal/${post.slug}` } } : {};
}

export default async function JournalPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  return <main><PremiumHeader/><article className="journal-article"><header><span className="eyebrow">{post.topic} · {new Date(post.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span><h1>{post.title}</h1><p>{post.excerpt}</p></header><div>{String(post.content).split(/\n\n+/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></article><SiteFooter/></main>;
}
