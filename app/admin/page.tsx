"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Product = { id?: number; name: string; category: string; price: number; stock: number; status: string };
const seed: Product[] = [
  { id: 1, name: "Zuri Sculpted Midi", category: "Ankara Edit", price: 189, stock: 24, status: "Active" },
  { id: 2, name: "Amara Adire Gown", category: "Adire Collection", price: 245, stock: 12, status: "Active" },
  { id: 3, name: "Ife Aso-Oke Set", category: "Occasion Wear", price: 320, stock: 6, status: "Low stock" },
];

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>(seed);
  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved] = useState("");
  useEffect(() => { fetch("/api/products").then((r) => r.ok ? r.json() : null).then((d) => d?.products?.length && setProducts(d.products)).catch(() => null); }, []);
  async function addProduct(formData: FormData) {
    const product = { name: String(formData.get("name")), category: String(formData.get("category")), price: Number(formData.get("price")), stock: Number(formData.get("stock")), status: "Active" };
    setProducts((all) => [{ ...product, id: Date.now() }, ...all]);
    setShowForm(false); setSaved("Product published successfully");
    await fetch("/api/products", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(product) }).catch(() => null);
  }
  return <main className="admin-shell">
    <aside className="admin-nav"><Link href="/" className="admin-logo"><img src="/afro-fashionstyle-logo.png" alt="Afro Fashionstyle" /></Link><p>Commerce studio</p><nav><a className="active" href="#overview">⌂ Overview</a><a href="#products">◇ Products</a><a href="#orders">▤ Orders</a><a href="#customers">♙ Customers</a><a href="#analytics">⌁ Analytics</a><a href="#marketing">✦ Marketing</a></nav><div><span>AF</span><small>Administrator<br/>Owner access</small></div></aside>
    <section className="admin-main">
      <header><div><span className="eyebrow">Saturday, July 25</span><h1>Good evening, Admin.</h1></div><div><Link href="/">View store ↗</Link><button onClick={() => setShowForm(true)}>＋ Add product</button></div></header>
      {saved && <div className="admin-success">{saved}<button onClick={() => setSaved("")}>×</button></div>}
      <div className="metric-grid" id="overview"><article><span>Net revenue</span><strong>$48,620</strong><small>↑ 18.4% vs last month</small></article><article><span>Orders</span><strong>286</strong><small>↑ 12.8% vs last month</small></article><article><span>Conversion rate</span><strong>3.82%</strong><small>↑ 0.6% vs last month</small></article><article><span>Avg. order value</span><strong>$170</strong><small>↑ 4.2% vs last month</small></article></div>
      <div className="dashboard-grid">
        <article className="chart-card" id="analytics"><div><h2>Revenue overview</h2><select><option>Last 30 days</option><option>Last 90 days</option></select></div><div className="chart-bars">{[42,54,47,68,60,78,71,88,74,92,84,98].map((h,i)=><span key={i} style={{height:`${h}%`}} />)}</div><div className="chart-labels"><span>Jun 26</span><span>Jul 5</span><span>Jul 15</span><span>Jul 25</span></div></article>
        <article className="market-card"><h2>Top markets</h2><div><span>🇺🇸 United States</span><b>68%</b></div><progress value="68" max="100"/><div><span>🇬🇧 United Kingdom</span><b>24%</b></div><progress value="24" max="100"/><div><span>🌍 Other</span><b>8%</b></div><progress value="8" max="100"/><hr/><small>Payments</small><p>Flutterwave <b>61%</b></p><p>PayPal <b>39%</b></p></article>
      </div>
      <article className="table-card" id="products"><div className="table-head"><div><h2>Products</h2><p>{products.length} active styles · Inventory synced</p></div><button onClick={() => setShowForm(true)}>Add new</button></div><div className="product-table"><div className="table-row labels"><span>Product</span><span>Category</span><span>Price</span><span>Inventory</span><span>Status</span></div>{products.map((p)=><div className="table-row" key={p.id ?? p.name}><span><i>{p.name.slice(0,1)}</i><b>{p.name}</b></span><span>{p.category}</span><span>${p.price}</span><span>{p.stock} units</span><span><em className={p.stock < 10 ? "warn" : ""}>{p.status}</em></span></div>)}</div></article>
    </section>
    {showForm && <div className="modal-backdrop" role="dialog" aria-modal="true"><form className="product-modal" action={addProduct}><div><span className="eyebrow">Catalog</span><h2>Add a new product</h2><button type="button" onClick={() => setShowForm(false)}>×</button></div><label>Product name<input name="name" required placeholder="e.g. Nia Adire Wrap Dress"/></label><label>Collection<select name="category"><option>Ankara Edit</option><option>Adire Collection</option><option>Occasion Wear</option><option>Everyday Luxury</option></select></label><div className="form-split"><label>Price (USD)<input name="price" type="number" min="1" required/></label><label>Inventory<input name="stock" type="number" min="0" required/></label></div><label>Product imagery<input name="image" type="file" accept="image/*"/></label><label>Description<textarea name="description" rows={4} placeholder="Tell the story of the piece..."/></label><button className="publish">Publish product</button></form></div>}
  </main>
}
