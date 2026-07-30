import { isAdmin } from "../../../lib/admin-auth";
import { productDescription, slugify } from "../../../lib/blog";
import { createAdminSupabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await createAdminSupabase().from("blog_posts").select("*").order("created_at", { ascending: false });
  return error ? Response.json({ error: "Posts could not be loaded" }, { status: 500 }) : Response.json({ posts: data || [] });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const input = await request.json() as Record<string, unknown>;
  const supabase = createAdminSupabase();
  if (input.action === "duplicate") {
    const { data: source } = await supabase.from("blog_posts").select("*").eq("id", input.id).single();
    if (!source) return Response.json({ error: "Post not found" }, { status: 404 });
    const title = `${source.title} (Copy)`;
    const { id: _id, created_at: _created, updated_at: _updated, ...copy } = source;
    void _id; void _created; void _updated;
    const { data, error } = await supabase.from("blog_posts").insert({ ...copy, title, slug: `${slugify(title)}-${Date.now().toString(36)}`, status: "draft", published_at: null }).select().single();
    return error ? Response.json({ error: "Post could not be duplicated" }, { status: 500 }) : Response.json({ post: data });
  }
  const title = String(input.title || "").trim();
  const content = String(input.content || "").trim() || productDescription(title, "Nigerian fashion editorial");
  if (title.length < 5) return Response.json({ error: "A complete title is required" }, { status: 400 });
  const excerpt = String(input.excerpt || "").trim() || content.replace(/\s+/g, " ").slice(0, 160);
  const status = input.status === "published" ? "published" : "draft";
  const { data, error } = await supabase.from("blog_posts").insert({
    title, slug: `${slugify(title)}-${Date.now().toString(36)}`, excerpt, content,
    topic: "Nigerian Fashion", status, seo_title: `${title} | Afro.Fashionstyle`,
    seo_description: excerpt, published_at: status === "published" ? new Date().toISOString() : null,
  }).select().single();
  return error ? Response.json({ error: "Post could not be created" }, { status: 500 }) : Response.json({ post: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const input = await request.json() as Record<string, unknown>;
  const allowedStatus = ["draft", "published", "archived"];
  const title = String(input.title || "").trim();
  const status = allowedStatus.includes(String(input.status)) ? String(input.status) : "draft";
  const excerpt = String(input.excerpt || "").trim();
  const content = String(input.content || "").trim();
  const { data, error } = await createAdminSupabase().from("blog_posts").update({
    title, excerpt, content, status, seo_title: `${title} | Afro.Fashionstyle`,
    seo_description: excerpt, published_at: status === "published" ? (input.publishedAt || new Date().toISOString()) : null,
    updated_at: new Date().toISOString(),
  }).eq("id", input.id).select().single();
  return error ? Response.json({ error: "Post could not be updated" }, { status: 500 }) : Response.json({ post: data });
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Post is required" }, { status: 400 });
  const { error } = await createAdminSupabase().from("blog_posts").delete().eq("id", id);
  return error ? Response.json({ error: "Post could not be deleted" }, { status: 500 }) : Response.json({ success: true });
}
