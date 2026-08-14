import { v2 as cloudinary } from "cloudinary";
import { revalidatePath } from "next/cache";
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
    const cloudinaryPublicId = String(form.get("cloudinaryPublicId") || "").trim();
    if (!name || !isProductCategory(category) || !Number.isFinite(priceUsd) || priceUsd < 0 || !Number.isFinite(priceGbp) || priceGbp < 0 || !Number.isInteger(stock) || stock < 0) {
      return Response.json({ error: "Valid name, USD/GBP prices and inventory are required" }, { status: 400 });
    }
    const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
    if (!cloudinaryPublicId && (!(image instanceof File) || !allowedImageTypes.has(image.type) || image.size > 4 * 1024 * 1024)) {
      return Response.json({ error: "Choose a JPG, PNG, WebP or AVIF image under 4MB. The image editor compresses large photos automatically." }, { status: 400 });
    }
    if (cloudinaryPublicId && !cloudinaryPublicId.startsWith("afro-fashionstyle/products/")) {
      return Response.json({ error: "The uploaded product image could not be verified." }, { status: 400 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return Response.json({ error: "Product image storage is not configured. Check the Cloudinary environment variables." }, { status: 503 });
    }
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    let uploaded: { asset_id: string; public_id: string; secure_url: string; width: number; height: number };
    if (cloudinaryPublicId) {
      const resource = await cloudinary.api.resource(cloudinaryPublicId, { resource_type: "image" });
      if (!resource?.asset_id || !resource.public_id || !resource.secure_url || !resource.width || !resource.height) throw new Error("Cloudinary returned an incomplete verified image");
      uploaded = { asset_id: resource.asset_id, public_id: resource.public_id, secure_url: resource.secure_url, width: resource.width, height: resource.height };
    } else {
      const bytes = Buffer.from(await (image as File).arrayBuffer());
      uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: "afro-fashionstyle/products", resource_type: "image", tags: ["afro-fashionstyle", "product"] }, (error, result) => {
          if (error || !result?.asset_id || !result.public_id || !result.secure_url || !result.width || !result.height) {
            reject(error || new Error("Cloudinary returned an incomplete upload result")); return;
          }
          resolve({ asset_id: result.asset_id, public_id: result.public_id, secure_url: result.secure_url, width: result.width, height: result.height });
        });
        stream.end(bytes);
      });
    }

    const baseSlug = slugify(name) || "product";
    const { data: existingSlug } = await supabase.from("products").select("id").eq("slug", baseSlug).maybeSingle();
    const productSlug = existingSlug ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;
    const { data: product, error: productError } = await supabase.from("products").insert({
      name,
      slug: productSlug,
      description,
      category,
      price_usd: priceUsd,
      price_gbp: priceGbp,
      stock,
      status: "active",
    }).select().single();
    if (productError) {
      await cloudinary.uploader.destroy(uploaded.public_id).catch(() => undefined);
      throw productError;
    }
    const { error: imageError } = await supabase.from("product_images").insert({
      product_id: product.id,
      cloudinary_asset_id: uploaded.asset_id,
      cloudinary_public_id: uploaded.public_id,
      secure_url: uploaded.secure_url,
      alt_text: `${name} by Afro.Fashionstyle`,
      width: uploaded.width,
      height: uploaded.height,
    });
    if (imageError) {
      await supabase.from("products").delete().eq("id", product.id);
      await cloudinary.uploader.destroy(uploaded.public_id).catch(() => undefined);
      throw imageError;
    }
    if (sizes.length) {
      const perSize = Math.floor(stock / sizes.length);
      const remainder = stock % sizes.length;
      const { error: variantError } = await supabase.from("product_variants").insert(sizes.map((size, index) => ({
        product_id: product.id, size, color: "As shown", sku: `${product.slug}-${size.replace(/[^a-z0-9]/gi, "").toUpperCase()}`,
        stock: perSize + (index < remainder ? 1 : 0),
      })));
      if (variantError) {
        await supabase.from("products").delete().eq("id", product.id);
        await cloudinary.uploader.destroy(uploaded.public_id).catch(() => undefined);
        throw variantError;
      }
    }
    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath(`/collections/${category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`);
    revalidatePath(`/products/${product.slug}`);
    revalidatePath("/sitemap.xml");
    return Response.json({
      product: {
        ...product,
        product_images: [{ secure_url: uploaded.secure_url, alt_text: `${name} by Afro.Fashionstyle`, position: 0 }],
        imageUrl: uploaded.secure_url,
      },
      message: `${name} is live in the store and ready for Google discovery.`,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown upload error";
    console.error("Product publish failed", { message });
    return Response.json({ error: message.includes("Cloudinary") ? "Cloudinary could not process this image. Try exporting it as JPG or WebP." : "Product could not be published. Please try again." }, { status: 500 });
  }
}
