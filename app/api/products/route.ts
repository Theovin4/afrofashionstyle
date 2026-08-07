import { v2 as cloudinary } from "cloudinary";
import { isAdmin } from "../../lib/admin-auth";
import { createAdminSupabase, createPublicSupabase } from "../../lib/supabase";
import { productDescription } from "../../lib/blog";
import { isProductCategory } from "../../lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function GET() {
  try {
    const { data, error } = await createPublicSupabase()
      .from("products")
      .select("id,name,slug,description,category,price_usd,price_gbp,stock,status,featured,product_images(id,secure_url,alt_text,position),product_variants(id,size,color,sku,stock,active),product_reviews(id,customer_name,rating,title,body,verified_purchase,created_at)")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Response.json({ products: data }, { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    console.error("Product read failed", error);
    return Response.json({ error: "Unable to load products" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const supabase = createAdminSupabase();
    const { data: currencySetting } = await supabase.from("site_settings").select("value").eq("key", "currency").maybeSingle();
    const usdToGbp = Number((currencySetting?.value as { usd_to_gbp?: number } | null)?.usd_to_gbp || .751);
    const form = await request.formData();
    const name = String(form.get("name") || "").trim();
    const suppliedDescription = String(form.get("description") || "").trim();
    const category = String(form.get("category") || "").trim();
    const description = suppliedDescription || productDescription(name, category);
    const priceUsd = Number(form.get("priceUsd"));
    const priceGbp = Math.round(priceUsd * usdToGbp * 100) / 100;
    const stockValue = String(form.get("stock") || "").trim();
    const stock = stockValue ? Number(stockValue) : 500;
    const sizes = String(form.get("sizes") || "US 2,US 4,US 6,US 8,US 10,US 12,US 14,US 16,US 18").split(",").map((size) => size.trim()).filter(Boolean).slice(0, 20);
    const image = form.get("image");
    if (!name || !isProductCategory(category) || !Number.isFinite(priceUsd) || priceUsd < 0 || !Number.isFinite(priceGbp) || priceGbp < 0 || !Number.isInteger(stock) || stock < 0) {
      return Response.json({ error: "Valid name, USD/GBP prices and inventory are required" }, { status: 400 });
    }
    if (!(image instanceof File) || !image.type.startsWith("image/") || image.size > 10 * 1024 * 1024) {
      return Response.json({ error: "A JPG, PNG, WebP or AVIF image under 10MB is required" }, { status: 400 });
    }

    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    const bytes = Buffer.from(await image.arrayBuffer());
    const uploaded = await new Promise<{ asset_id: string; public_id: string; secure_url: string; width: number; height: number }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({
        folder: "afro-fashionstyle/products",
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || undefined,
        resource_type: "image",
        transformation: [{ width: 1800, height: 2400, crop: "limit", quality: "auto", fetch_format: "auto" }],
        tags: ["afro-fashionstyle", "product"],
      }, (error, result) => {
        if (error || !result?.asset_id || !result.public_id || !result.secure_url || !result.width || !result.height) {
          reject(error || new Error("Cloudinary returned an incomplete upload result"));
          return;
        }
        resolve({
          asset_id: result.asset_id,
          public_id: result.public_id,
          secure_url: result.secure_url,
          width: result.width,
          height: result.height,
        });
      });
      stream.end(bytes);
    });

    const { data: product, error: productError } = await supabase.from("products").insert({
      name,
      slug: `${slugify(name) || "product"}-${Date.now().toString(36)}`,
      description,
      category,
      price_usd: priceUsd,
      price_gbp: priceGbp,
      stock,
      status: "active",
    }).select().single();
    if (productError) throw productError;
    const { error: imageError } = await supabase.from("product_images").insert({
      product_id: product.id,
      cloudinary_asset_id: uploaded.asset_id,
      cloudinary_public_id: uploaded.public_id,
      secure_url: uploaded.secure_url,
      alt_text: `${name} by Afro.Fashionstyle`,
      width: uploaded.width,
      height: uploaded.height,
    });
    if (imageError) throw imageError;
    if (sizes.length) {
      const perSize = Math.floor(stock / sizes.length);
      const remainder = stock % sizes.length;
      const { error: variantError } = await supabase.from("product_variants").insert(sizes.map((size, index) => ({
        product_id: product.id, size, color: "As shown", sku: `${product.slug}-${size.replace(/[^a-z0-9]/gi, "").toUpperCase()}`,
        stock: perSize + (index < remainder ? 1 : 0),
      })));
      if (variantError) console.error("Product variants could not be created", variantError);
    }
    return Response.json({ product: { ...product, imageUrl: uploaded.secure_url } }, { status: 201 });
  } catch (error) {
    console.error("Product publish failed", error);
    return Response.json({ error: "Product could not be published" }, { status: 500 });
  }
}
