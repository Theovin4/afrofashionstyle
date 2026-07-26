"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Product = { id: string; name: string; category: string; price: number; stock: number; status: string; imageUrl?: string };
type ApiProduct = { id: string; name: string; category: string; price_usd: number; stock: number; status: string; product_images?: Array<{ secure_url: string }> };

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetch("/api/products").then((response) => response.ok ? response.json() : Promise.reject())
      .then(({ products: rows }: { products: ApiProduct[] }) => setProducts(rows.map((product) => ({
        id: product.id, name: product.name, category: product.category, price: Number(product.price_usd),
        stock: product.stock, status: product.status === "active" ? "Active" : product.status,
        imageUrl: product.product_images?.[0]?.secure_url,
      })))).catch(() => setNotice("Products could not be loaded."));
  }, []);

  async function addProduct(formData: FormData) {
    setPublishing(true);
    setNotice("Uploading image and publishing product…");
    try {
      const response = await fetch("/api/products", { method: "POST", body: formData });
      const result = await response.json() as { product?: ApiProduct & { imageUrl: string }; error?: string };
      if (!response.ok || !result.product) throw new Error(result.error || "Product could not be published");
      const product = result.product;
      setProducts((all) => [{
        id: product.id, name: product.name, category: product.category, price: Number(product.price_usd),
        stock: product.stock, status: "Active", imageUrl: product.imageUrl,
      }, ...all]);
      setShowForm(false);
      setNotice("Product published successfully.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Product could not be published.");
    } finally {
      setPublishing(false);
    }
  }

  return <main className="admin-shell">
    <aside className="admin-nav">
      <Link href="/" className="admin-logo" aria-label="Afro.Fashionstyle storefront">
        <Image src="/afro-fashionstyle-logo.png" alt="Afro.Fashionstyle" width={220} height={220} priority/>
      </Link>
      <p>Commerce studio</p>
      <nav><a className="active" href="#overview">⌂ Overview</a><a href="#products">◇ Products</a><a href="#orders">▤ Orders</a><a href="#customers">♙ Customers</a><a href="#analytics">⌁ Analytics</a></nav>
      <div className="admin-owner"><span>AF</span><small>Administrator<br/>Owner access</small><form action="/api/admin/logout" method="post"><button>Sign out</button></form></div>
    </aside>
    <section className="admin-main">
      <header>
        <div className="admin-heading">
          <span className="admin-heading-logo" aria-hidden="true">
            <Image src="/afro-fashionstyle-logo.png" alt="" width={140} height={140}/>
          </span>
          <div><span className="eyebrow">Commerce overview</span><h1>Welcome, Admin.</h1></div>
        </div>
        <div><Link href="/">View store ↗</Link><button onClick={() => setShowForm(true)}>＋ Add product</button></div>
      </header>
      {notice && <div className="admin-success">{notice}<button onClick={() => setNotice("")}>×</button></div>}
      <div className="metric-grid" id="overview">
        <article><span>Products</span><strong>{products.length}</strong><small>Stored in Supabase</small></article>
        <article><span>Inventory</span><strong>{products.reduce((sum, product) => sum + product.stock, 0)}</strong><small>Units available</small></article>
        <article><span>Low stock</span><strong>{products.filter((product) => product.stock < 10).length}</strong><small>Needs attention</small></article>
        <article><span>Media</span><strong>Cloudinary</strong><small>Optimized delivery</small></article>
      </div>
      <article className="table-card" id="products">
        <div className="table-head"><div><h2>Products</h2><p>{products.length} active styles · Inventory synced</p></div><button onClick={() => setShowForm(true)}>Add new</button></div>
        <div className="product-table">
          <div className="table-row labels"><span>Product</span><span>Category</span><span>Price</span><span>Inventory</span><span>Status</span></div>
          {products.map((product) => <div className="table-row" key={product.id}>
            <span>{product.imageUrl ? <Image src={product.imageUrl} alt="" width={42} height={52}/> : <i>{product.name.slice(0, 1)}</i>}<b>{product.name}</b></span>
            <span>{product.category}</span><span>${product.price}</span><span>{product.stock} units</span>
            <span><em className={product.stock < 10 ? "warn" : ""}>{product.status}</em></span>
          </div>)}
        </div>
      </article>
    </section>
    {showForm && <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="product-modal" action={addProduct}>
        <div><span className="eyebrow">Catalog</span><h2>Add a new product</h2><button type="button" onClick={() => setShowForm(false)}>×</button></div>
        <label>Product name<input name="name" required placeholder="e.g. Nia Adire Wrap Dress"/></label>
        <label>Collection<select name="category"><option>Ankara Edit</option><option>Adire Collection</option><option>Occasion Wear</option><option>Everyday Luxury</option></select></label>
        <div className="form-split"><label>Price (USD)<input name="priceUsd" type="number" min="1" step="0.01" required/></label><label>Price (GBP)<input name="priceGbp" type="number" min="1" step="0.01" required/></label></div>
        <label>Inventory<input name="stock" type="number" min="0" required/></label>
        <label>Product imagery<input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required/></label>
        <label>Description<textarea name="description" rows={4} placeholder="Tell the story of the piece…"/></label>
        <button className="publish" disabled={publishing}>{publishing ? "Publishing…" : "Publish product"}</button>
      </form>
    </div>}
  </main>;
}
