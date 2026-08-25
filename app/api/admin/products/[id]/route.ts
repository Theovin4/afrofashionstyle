import { v2 as cloudinary } from "cloudinary";
import { revalidatePath } from "next/cache";
import { isAdmin } from "../../../../lib/admin-auth";
import { productDescription, slugify } from "../../../../lib/blog";
import { createAdminSupabase } from "../../../../lib/supabase";
import { isProductCategory } from "../../../../lib/catalog";
import { payloadError, readLimitedJson } from "../../../../lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function revalidateCatalog(product?: { slug?: string; category?: string }) {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/sitemap.xml");
  if (product?.slug) revalidatePath(`/products/${product.slug}`);
  if (product?.category) revalidatePath(`/collections/${slugify(product.category)}`);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "Invalid product" }, { status: 400 });
  let input: Record<string, unknown>;
  try { input = await readLimitedJson<Record<string, unknown>>(request, 16_384); } catch (error) { return payloadError(error); }
  const name = String(input.name || "").trim();
  const category = String(input.category || "").trim();
  const priceUsd = Number(input.priceUsd);
  const stock = Number(input.stock);
  const status = ["active", "draft", "archived"].includes(String(input.status)) ? String(input.status) : "active";
  if (!name || !isProductCategory(category) || !Number.isFinite(priceUsd) || priceUsd < 0 || !Number.isInteger(stock) || stock < 0) {
    return Response.json({ error: "Valid product details are required" }, { status: 400 });
  }
  const supabase = createAdminSupabase();
  const { data: currency } = await supabase.from("site_settings").select("value").eq("key", "currency").maybeSingle();
  const rate = Number((currency?.value as { usd_to_gbp?: number } | null)?.usd_to_gbp || .751);
  const description = String(input.description || "").trim() || productDescription(name, category);
  const { data, error } = await supabase.from("products").update({
    name, category, description, price_usd: priceUsd, price_gbp: Math.round(priceUsd * rate * 100) / 100,
    stock, status, featured: Boolean(input.featured), updated_at: new Date().toISOString(),
  }).eq("id", id).select().single();
  if (error || !data) return Response.json({ error: "Product could not be updated" }, { status: 500 });
  revalidateCatalog(data);
  return Response.json({ product: data });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "Invalid product" }, { status: 400 });
  const supabase = createAdminSupabase();
  const { data: source } = await supabase.from("products").select("*,product_images(*)").eq("id", id).single();
  if (!source) return Response.json({ error: "Product not found" }, { status: 404 });
  const name = `${source.name} (Copy)`;
  const { product_images: images, id: _id, created_at: _created, updated_at: _updated, ...copy } = source;
  void _id; void _created; void _updated;
  const { data: product, error } = await supabase.from("products").insert({
    ...copy, name, slug: `${slugify(name)}-${Date.now().toString(36)}`, status: "draft",
  }).select().single();
  if (error || !product) return Response.json({ error: "Product could not be duplicated" }, { status: 500 });
  if (images?.length) {
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    const duplicatedImages = await Promise.all(images.map(async (image: Record<string, unknown>) => {
      const uploaded = await cloudinary.uploader.upload(String(image.secure_url), {
        folder: "afro-fashionstyle/products", tags: ["afro-fashionstyle", "product", "duplicate"],
      });
      return {
        product_id: product.id, cloudinary_asset_id: uploaded.asset_id, cloudinary_public_id: uploaded.public_id,
        secure_url: uploaded.secure_url, alt_text: `${name} by Afro.Fashionstyle`,
        width: uploaded.width, height: uploaded.height, position: image.position,
      };
    }));
    await supabase.from("product_images").insert(duplicatedImages);
  }
  revalidateCatalog(product);
  return Response.json({ product: { ...product, imageUrl: images?.[0]?.secure_url } }, { status: 201 });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "Invalid product" }, { status: 400 });
  const supabase = createAdminSupabase();
  const { data: product } = await supabase.from("products").select("slug,category").eq("id", id).maybeSingle();
  const { data: images } = await supabase.from("product_images").select("cloudinary_public_id").eq("product_id", id);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return Response.json({ error: "Product could not be deleted. It may belong to an existing order." }, { status: 409 });
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  await Promise.all((images || []).map((image) => cloudinary.uploader.destroy(image.cloudinary_public_id).catch(() => undefined)));
  revalidateCatalog(product || undefined);
  return Response.json({ success: true });
}
