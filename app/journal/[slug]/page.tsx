import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { PremiumHeader } from "../../components/premium-header";
import { SiteFooter } from "../../components/site-footer";
import { createPublicSupabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";
const modernJournalSlug = (slug: string) => slug.replace("how-to-measure-for-a-made-to-order-african-dress", "how-to-measure-for-an-african-dress-online");

async function getPost(slug: string) {
  const { data } = await createPublicSupabase().from("blog_posts").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  return data;
}

async function getCanonicalPost(title: string) {
  const { data } = await createPublicSupabase().from("blog_posts")
    .select("slug")
    .eq("title", title)
    .eq("status", "published")
    .order("published_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = await getPost((await params).slug);
  const canonical = post ? await getCanonicalPost(post.title) : null;
  return post ? {
    title: { absolute: post.seo_title || `${post.title} | Afro.Fashionstyle` },
    description: post.seo_description || post.excerpt,
    alternates: { canonical: `/journal/${canonical?.slug || post.slug}` },
  } : {};
}

export default async function JournalPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const requestedSlug = (await params).slug;
  const modernSlug = modernJournalSlug(requestedSlug);
  if (modernSlug !== requestedSlug) permanentRedirect(`/journal/${modernSlug}`);
  const post = await getPost(requestedSlug);
  if (!post) notFound();
  const canonical = await getCanonicalPost(post.title);
  if (canonical && canonical.slug !== post.slug) permanentRedirect(`/journal/${canonical.slug}`);
  const schema = {
    "@context": "https://schema.org", "@type": "Article", headline: post.title,
    description: post.excerpt, datePublished: post.published_at, dateModified: post.updated_at || post.published_at,
    author: { "@type": "Organization", name: "Afro.Fashionstyle" },
    publisher: { "@type": "Organization", name: "Afro.Fashionstyle", logo: { "@type": "ImageObject", url: "https://afro-fashionstyle.vercel.app/afro-fashionstyle-monogram.png" } },
    mainEntityOfPage: `https://afro-fashionstyle.vercel.app/journal/${post.slug}`,
  };
  return <main><PremiumHeader/><article className="journal-article"><header><span className="eyebrow">{post.topic} · {new Date(post.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span><h1>{post.title}</h1><p>{post.excerpt}</p></header><div>{String(post.content).split(/\n\n+/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></article><SiteFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}/></main>;
}
