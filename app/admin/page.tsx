"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BrandLogo } from "../components/brand-logo";
import { PRODUCT_CATEGORIES } from "../lib/catalog";

type Product = { id: string; name: string; category: string; price: number; stock: number; status: string; imageUrl?: string; description?: string };
type ApiProduct = { id: string; name: string; category: string; price_usd: number; stock: number; status: string; product_images?: Array<{ secure_url: string }> };
type Order = { id: string; order_number: string; customer_name: string; customer_email: string; currency: string; total: number; payment_status: string; fulfillment_status: string; tracking_number?: string; tracking_url?: string; carrier?: string; created_at: string; order_items?: Array<{ product_name: string; quantity: number; selected_size?: string }> };
type Operations = {
  discounts: Array<{ id: string; code: string; kind: string; value: number; active: boolean; uses: number }>;
  shipping: Array<{ id: string; country: string; currency: string; name: string; rate: number; free_over: number | null; delivery_min_days: number; delivery_max_days: number }>;
  reviews: Array<{ id: string; customer_name: string; rating: number; title: string; body: string; status: string; products?: { name?: string } }>;
  settings: Record<string, Record<string, string>>;
};
type BlogPost = { id: string; title: string; slug: string; excerpt: string; content: string; status: string; published_at?: string };

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const defaultReportStart = () => { const date = new Date(); date.setDate(date.getDate() - 29); return isoDate(date); };

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [operations, setOperations] = useState<Operations>({ discounts: [], shipping: [], reviews: [], settings: {} });
  const [productQuery, setProductQuery] = useState("");
  const [productCategory, setProductCategory] = useState("all");
  const [productStatus, setProductStatus] = useState("all");
  const [orderQuery, setOrderQuery] = useState("");
  const [orderPayment, setOrderPayment] = useState("all");
  const [orderFulfillment, setOrderFulfillment] = useState("all");
  const [orderCurrency, setOrderCurrency] = useState("all");
  const [orderStart, setOrderStart] = useState("");
  const [orderEnd, setOrderEnd] = useState("");
  const [postQuery, setPostQuery] = useState("");
  const [postStatus, setPostStatus] = useState("all");
  const [reportStart, setReportStart] = useState(defaultReportStart);
  const [reportEnd, setReportEnd] = useState(() => isoDate(new Date()));

  const filteredProducts = useMemo(() => products.filter((product) => {
    const query = productQuery.trim().toLowerCase();
    return (!query || `${product.name} ${product.category}`.toLowerCase().includes(query))
      && (productCategory === "all" || product.category === productCategory)
      && (productStatus === "all" || product.status.toLowerCase() === productStatus);
  }), [products, productQuery, productCategory, productStatus]);
  const filteredOrders = useMemo(() => orders.filter((order) => {
    const query = orderQuery.trim().toLowerCase();
    const orderDate = order.created_at.slice(0, 10);
    return (!query || `${order.order_number} ${order.customer_name} ${order.customer_email}`.toLowerCase().includes(query))
      && (orderPayment === "all" || order.payment_status === orderPayment)
      && (orderFulfillment === "all" || order.fulfillment_status === orderFulfillment)
      && (orderCurrency === "all" || order.currency === orderCurrency)
      && (!orderStart || orderDate >= orderStart)
      && (!orderEnd || orderDate <= orderEnd);
  }), [orders, orderQuery, orderPayment, orderFulfillment, orderCurrency, orderStart, orderEnd]);
  const filteredPosts = useMemo(() => posts.filter((post) => {
    const query = postQuery.trim().toLowerCase();
    return (!query || `${post.title} ${post.excerpt}`.toLowerCase().includes(query))
      && (postStatus === "all" || post.status === postStatus);
  }), [posts, postQuery, postStatus]);

  useEffect(() => {
    fetch("/api/admin/products").then((response) => response.ok ? response.json() : Promise.reject())
      .then(({ products: rows }: { products: ApiProduct[] }) => setProducts(rows.map((product) => ({
        id: product.id, name: product.name, category: product.category, price: Number(product.price_usd),
        stock: product.stock, status: product.status === "active" ? "Active" : product.status,
        imageUrl: product.product_images?.[0]?.secure_url,
      })))).catch(() => setNotice("Products could not be loaded."));
  }, []);

  async function loadPosts() {
    const response = await fetch("/api/admin/blog");
    if (response.ok) setPosts(((await response.json()) as { posts: BlogPost[] }).posts);
  }
  useEffect(() => { queueMicrotask(() => void loadPosts()); }, []);

  async function productAction(product: Product, action: "edit" | "duplicate" | "delete") {
    if (action === "delete" && !window.confirm(`Delete ${product.name}? This cannot be undone.`)) return;
    let response: Response;
    if (action === "edit") {
      const name = window.prompt("Product name", product.name);
      if (!name) return;
      const priceUsd = Number(window.prompt("Price in USD", String(product.price)));
      const stock = Number(window.prompt("Inventory", String(product.stock)));
      const category = window.prompt("Collection", product.category) || product.category;
      response = await fetch(`/api/admin/products/${product.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, priceUsd, stock, category, status: product.status.toLowerCase() }) });
    } else {
      response = await fetch(`/api/admin/products/${product.id}`, { method: action === "delete" ? "DELETE" : "POST" });
    }
    const result = await response.json() as { product?: ApiProduct; error?: string };
    if (!response.ok) { setNotice(result.error || `Product could not be ${action}d.`); return; }
    if (action === "delete") setProducts((all) => all.filter((item) => item.id !== product.id));
    else if (action === "duplicate" && result.product) setProducts((all) => [{ id: result.product!.id, name: result.product!.name, category: result.product!.category, price: Number(result.product!.price_usd), stock: result.product!.stock, status: "draft" }, ...all]);
    else if (result.product) setProducts((all) => all.map((item) => item.id === product.id ? { ...item, name: result.product!.name, category: result.product!.category, price: Number(result.product!.price_usd), stock: result.product!.stock, status: result.product!.status } : item));
    setNotice(`Product ${action === "edit" ? "updated" : action === "duplicate" ? "duplicated as a draft" : "deleted"}.`);
  }

  async function createPost() {
    const title = window.prompt("Journal title");
    if (!title) return;
    const response = await fetch("/api/admin/blog", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, status: "draft" }) });
    const result = await response.json() as { post?: BlogPost; error?: string };
    if (response.ok && result.post) { setPosts((all) => [result.post!, ...all]); setNotice("Journal draft created with optimized starter copy."); }
    else setNotice(result.error || "Post could not be created.");
  }

  async function blogAction(post: BlogPost, action: "edit" | "duplicate" | "delete" | "publish") {
    let response: Response;
    if (action === "delete") {
      if (!window.confirm(`Delete “${post.title}”?`)) return;
      response = await fetch(`/api/admin/blog?id=${post.id}`, { method: "DELETE" });
    } else if (action === "duplicate") {
      response = await fetch("/api/admin/blog", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "duplicate", id: post.id }) });
    } else {
      const title = action === "edit" ? window.prompt("Post title", post.title) : post.title;
      if (!title) return;
      const excerpt = action === "edit" ? window.prompt("Short summary", post.excerpt) || post.excerpt : post.excerpt;
      const content = action === "edit" ? window.prompt("Article content", post.content) || post.content : post.content;
      response = await fetch("/api/admin/blog", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...post, title, excerpt, content, status: action === "publish" ? "published" : post.status }) });
    }
    const result = await response.json() as { post?: BlogPost; error?: string };
    if (!response.ok) { setNotice(result.error || "Journal update failed."); return; }
    if (action === "delete") setPosts((all) => all.filter((item) => item.id !== post.id));
    else if (action === "duplicate" && result.post) setPosts((all) => [result.post!, ...all]);
    else if (result.post) setPosts((all) => all.map((item) => item.id === post.id ? result.post! : item));
    setNotice("Journal updated.");
  }

  async function loadOperations() {
    const response = await fetch("/api/admin/operations");
    if (response.ok) setOperations(await response.json() as Operations);
  }

  useEffect(() => { queueMicrotask(() => void loadOperations()); }, []);

  async function operation(payload: Record<string, unknown>) {
    const response = await fetch("/api/admin/operations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json() as { error?: string };
    setNotice(response.ok ? "Commerce settings updated." : result.error || "Update failed.");
    if (response.ok) await loadOperations();
  }

  useEffect(() => {
    fetch("/api/admin/orders").then((response) => response.ok ? response.json() : Promise.reject())
      .then(({ orders: rows }: { orders: Order[] }) => setOrders(rows)).catch(() => setNotice("Orders could not be loaded."));
  }, []);

  async function updateOrder(order: Order, fulfillmentStatus: string) {
    const trackingNumber = fulfillmentStatus === "shipped" ? window.prompt("Tracking number", order.tracking_number || "") || "" : order.tracking_number || "";
    const carrier = fulfillmentStatus === "shipped" ? window.prompt("Carrier", order.carrier || "") || "" : order.carrier || "";
    const trackingUrl = fulfillmentStatus === "shipped" ? window.prompt("Tracking URL", order.tracking_url || "") || "" : order.tracking_url || "";
    const response = await fetch("/api/admin/orders", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: order.id, fulfillmentStatus, trackingNumber, carrier, trackingUrl }) });
    const result = await response.json() as { order?: Partial<Order>; error?: string };
    if (!response.ok || !result.order) { setNotice(result.error || "Order could not be updated."); return; }
    setOrders((all) => all.map((item) => item.id === order.id ? { ...item, ...result.order } : item));
    setNotice(`${order.order_number} updated.`);
  }

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
      <BrandLogo variant="admin" priority/>
      <p>Commerce studio</p>
      <nav><a className="active" href="#overview">⌂ Overview</a><a href="#products">◇ Products</a><a href="#orders">▤ Orders</a><a href="#journal">✦ Journal</a><a href="#customers">♙ Customers</a><a href="#analytics">⌁ Analytics</a></nav>
      <div className="admin-owner"><span>AF</span><small>Administrator<br/>Owner access</small><form action="/api/admin/logout" method="post"><button>Sign out</button></form></div>
    </aside>
    <section className="admin-main">
      <header>
        <div className="admin-heading">
          <BrandLogo variant="adminMark" href={null} decorative/>
          <div><span className="eyebrow">Commerce overview</span><h1>Welcome, Admin.</h1></div>
        </div>
        <div><Link className="admin-security-link" href="/admin-reset">Change password</Link><Link href="/">View store ↗</Link><button onClick={() => setShowForm(true)}>＋ Add product</button></div>
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
        <div className="admin-filters"><input type="search" value={productQuery} onChange={(event) => setProductQuery(event.target.value)} placeholder="Search products"/><select value={productCategory} onChange={(event) => setProductCategory(event.target.value)}><option value="all">All collections</option>{Array.from(new Set(products.map((product) => product.category))).map((category) => <option key={category}>{category}</option>)}</select><select value={productStatus} onChange={(event) => setProductStatus(event.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="draft">Draft</option></select><small>{filteredProducts.length} shown</small></div>
        <div className="product-table">
          <div className="table-row labels"><span>Product</span><span>Category</span><span>Price</span><span>Inventory</span><span>Status / actions</span></div>
          {filteredProducts.map((product) => <div className="table-row" key={product.id}>
            <span>{product.imageUrl ? <Image src={product.imageUrl} alt="" width={42} height={52}/> : <i>{product.name.slice(0, 1)}</i>}<b>{product.name}</b></span>
            <span>{product.category}</span><span>${product.price}</span><span>{product.stock} units</span>
            <span className="row-actions"><em className={product.stock < 10 ? "warn" : ""}>{product.status}</em><button onClick={() => void productAction(product, "edit")}>Edit</button><button onClick={() => void productAction(product, "duplicate")}>Duplicate</button><button className="danger" onClick={() => void productAction(product, "delete")}>Delete</button></span>
          </div>)}
        </div>
      </article>
      <article className="table-card" id="journal">
        <div className="table-head"><div><h2>Journal publishing</h2><p>{posts.length} posts · One Nigerian fashion article publishes automatically every day</p></div><button onClick={() => void createPost()}>New draft</button></div>
        <div className="admin-filters"><input type="search" value={postQuery} onChange={(event) => setPostQuery(event.target.value)} placeholder="Search journal"/><select value={postStatus} onChange={(event) => setPostStatus(event.target.value)}><option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option></select><small>{filteredPosts.length} shown</small></div>
        <div className="compact-list">{filteredPosts.map((post) => <div className="blog-admin-row" key={post.id}><span><b>{post.title}</b><small>{post.status}{post.published_at ? ` · ${new Date(post.published_at).toLocaleDateString()}` : ""}</small></span><span><button onClick={() => void blogAction(post, "edit")}>Edit</button><button onClick={() => void blogAction(post, "duplicate")}>Duplicate</button>{post.status !== "published" && <button onClick={() => void blogAction(post, "publish")}>Publish</button>}<button className="danger" onClick={() => void blogAction(post, "delete")}>Delete</button></span></div>)}{!filteredPosts.length && <p>No journal posts match these filters.</p>}</div>
      </article>
      <article className="table-card orders-card" id="orders">
        <div className="table-head"><div><h2>Orders</h2><p>{orders.length} recent orders · Payments verified by webhook</p></div></div>
        <div className="admin-filters order-filters"><input type="search" value={orderQuery} onChange={(event) => setOrderQuery(event.target.value)} placeholder="Order, customer or email"/><select value={orderPayment} onChange={(event) => setOrderPayment(event.target.value)}><option value="all">Any payment</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select><select value={orderFulfillment} onChange={(event) => setOrderFulfillment(event.target.value)}><option value="all">Any fulfilment</option><option value="unfulfilled">Unfulfilled</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select><select value={orderCurrency} onChange={(event) => setOrderCurrency(event.target.value)}><option value="all">USD and GBP</option><option>USD</option><option>GBP</option></select><label>From<input type="date" value={orderStart} onChange={(event) => setOrderStart(event.target.value)}/></label><label>To<input type="date" value={orderEnd} onChange={(event) => setOrderEnd(event.target.value)}/></label><button onClick={() => { setOrderQuery(""); setOrderPayment("all"); setOrderFulfillment("all"); setOrderCurrency("all"); setOrderStart(""); setOrderEnd(""); }}>Clear</button><small>{filteredOrders.length} shown</small></div>
        <div className="orders-table">
          <div className="order-row labels"><span>Order</span><span>Customer</span><span>Total</span><span>Payment</span><span>Fulfilment</span></div>
          {filteredOrders.map((order) => <div className="order-row" key={order.id}>
            <span><b>{order.order_number}</b><small>{new Date(order.created_at).toLocaleDateString()}</small></span>
            <span><b>{order.customer_name}</b><small>{order.order_items?.map((item) => `${item.product_name} × ${item.quantity}${item.selected_size ? ` (${item.selected_size})` : ""}`).join(", ")}</small></span>
            <span>{order.currency} {Number(order.total).toFixed(2)}</span><span><em>{order.payment_status}</em></span>
            <span><select value={order.fulfillment_status} onChange={(event) => void updateOrder(order, event.target.value)}><option value="unfulfilled">Unfulfilled</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select>{order.tracking_number && <small>{order.carrier}: {order.tracking_number}</small>}</span>
          </div>)}
          {!filteredOrders.length && <p className="admin-empty">No orders match these filters.</p>}
        </div>
      </article>
      <article className="table-card" id="customers">
        <div className="table-head"><div><h2>Customers</h2><p>Customer history generated from verified orders.</p></div></div>
        <div className="compact-list">{Array.from(new Map(orders.map((order) => [order.customer_email, order])).values()).map((customer) => <p key={customer.customer_email}><b>{customer.customer_name}</b><span>{customer.customer_email} · {orders.filter((order) => order.customer_email === customer.customer_email).length} order(s)</span></p>)}{!orders.length && <p>No customer orders yet.</p>}</div>
      </article>
      <section id="analytics">
        <article className="table-card export-card"><div><span className="eyebrow">Business analysis</span><h2>Download a clear performance report</h2><p>Select a period for a PDF with sales breakdowns, graphs, plain-language insights and practical next steps. USD and GBP stay separate.</p><div className="report-period"><label>From<input type="date" value={reportStart} max={reportEnd} onChange={(event) => setReportStart(event.target.value)}/></label><label>To<input type="date" value={reportEnd} min={reportStart} max={isoDate(new Date())} onChange={(event) => setReportEnd(event.target.value)}/></label></div></div><div className="export-actions"><a className="button primary" href={`/api/admin/report/pdf?start=${reportStart}&end=${reportEnd}`}>Download PDF analysis</a><a className="button secondary" href="/api/admin/export">Download Excel workbook</a></div></article>
      </section>
      <section className="operations-grid">
        <article className="table-card"><div className="table-head"><div><h2>Discount codes</h2><p>Create conversion-focused promotions.</p></div></div>
          <form className="inline-admin-form" onSubmit={(event) => { event.preventDefault(); const fields = new FormData(event.currentTarget); void operation({ action: "create_discount", code: fields.get("code"), kind: fields.get("kind"), value: fields.get("value"), currency: fields.get("currency"), minimumOrder: fields.get("minimumOrder") }); event.currentTarget.reset(); }}>
            <input name="code" required placeholder="WELCOME10"/><select name="kind"><option value="percent">Percent</option><option value="fixed">Fixed amount</option></select><input name="value" type="number" min="1" required placeholder="10"/><select name="currency"><option value="">Any currency</option><option>USD</option><option>GBP</option></select><input name="minimumOrder" type="number" min="0" placeholder="Minimum order"/><button>Create code</button>
          </form><div className="compact-list">{operations.discounts.map((discount) => <p key={discount.id}><b>{discount.code}</b><span>{discount.kind === "percent" ? `${discount.value}%` : discount.value} · {discount.uses} uses</span></p>)}</div>
        </article>
        <article className="table-card"><div className="table-head"><div><h2>Shipping rules</h2><p>USA and UK delivery pricing.</p></div></div>
          <div className="compact-list">{operations.shipping.map((rule) => <form key={rule.id} onSubmit={(event) => { event.preventDefault(); const fields = new FormData(event.currentTarget); void operation({ action: "update_shipping", id: rule.id, rate: fields.get("rate"), freeOver: fields.get("freeOver"), minDays: fields.get("minDays"), maxDays: fields.get("maxDays") }); }}><b>{rule.country} · {rule.name}</b><input name="rate" type="number" step=".01" defaultValue={rule.rate}/><input name="freeOver" type="number" step=".01" defaultValue={rule.free_over || ""} placeholder="Free over"/><input name="minDays" type="number" defaultValue={rule.delivery_min_days}/><input name="maxDays" type="number" defaultValue={rule.delivery_max_days}/><button>Save</button></form>)}</div>
        </article>
        <article className="table-card"><div className="table-head"><div><h2>Review moderation</h2><p>Approve customer stories before publication.</p></div></div>
          <div className="compact-list">{operations.reviews.filter((review) => review.status === "pending").map((review) => <div key={review.id}><b>{"★".repeat(review.rating)} · {review.products?.name || "Product"}</b><p>{review.body}</p><button onClick={() => void operation({ action: "moderate_review", id: review.id, status: "approved" })}>Approve</button><button onClick={() => void operation({ action: "moderate_review", id: review.id, status: "rejected" })}>Reject</button></div>)}{!operations.reviews.some((review) => review.status === "pending") && <p>No reviews awaiting approval.</p>}</div>
        </article>
        <article className="table-card"><div className="table-head"><div><h2>Brand contacts</h2><p>WhatsApp, support and social destinations.</p></div></div>
          <form className="settings-form" onSubmit={(event) => { event.preventDefault(); const fields = new FormData(event.currentTarget); void Promise.all([
            operation({ action: "update_settings", key: "contact", value: { support_email: fields.get("supportEmail"), whatsapp: fields.get("whatsapp") } }),
            operation({ action: "update_settings", key: "socials", value: { instagram: fields.get("instagram"), facebook: fields.get("facebook"), tiktok: fields.get("tiktok"), pinterest: fields.get("pinterest") } }),
            operation({ action: "update_settings", key: "business", value: { legal_name: fields.get("legalName"), return_address: fields.get("returnAddress") } }),
          ]); }}>
            <label>Support email<input name="supportEmail" type="email" defaultValue={operations.settings.contact?.support_email || ""}/></label><label>WhatsApp number<input name="whatsapp" defaultValue={operations.settings.contact?.whatsapp || ""} placeholder="+1…"/></label>
            <label>Instagram URL<input name="instagram" type="url" defaultValue={operations.settings.socials?.instagram || ""}/></label><label>Facebook URL<input name="facebook" type="url" defaultValue={operations.settings.socials?.facebook || ""}/></label><label>TikTok URL<input name="tiktok" type="url" defaultValue={operations.settings.socials?.tiktok || ""}/></label><label>Pinterest URL<input name="pinterest" type="url" defaultValue={operations.settings.socials?.pinterest || ""}/></label>
            <label>Legal business name<input name="legalName" defaultValue={operations.settings.business?.legal_name || "Afro.Fashionstyle"}/></label><label>Return address<textarea name="returnAddress" defaultValue={operations.settings.business?.return_address || ""}/></label><button>Save brand details</button>
          </form>
        </article>
      </section>
    </section>
    {showForm && <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="product-modal" action={addProduct}>
        <div><span className="eyebrow">Catalog</span><h2>Add a new product</h2><button type="button" onClick={() => setShowForm(false)}>×</button></div>
        <label>Product name<input name="name" required placeholder="e.g. Nia Adire Wrap Dress"/></label>
        <label>Category<select name="category">{PRODUCT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
        <div className="form-split"><label>Price (USD)<input name="priceUsd" type="number" min="1" step="0.01" required/></label><label>Price (GBP)<input value="Calculated automatically from USD" readOnly/></label></div>
        <label>Inventory<input name="stock" type="number" min="0" defaultValue="500"/><small>Defaults to 500 units.</small></label>
        <label>Available sizes<input name="sizes" defaultValue="US 2, US 4, US 6, US 8, US 10, US 12, US 14, US 16, US 18"/></label>
        <label>Product imagery<input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required/></label>
        <label>Description<textarea name="description" rows={4} placeholder="Optional — include fabric, fit and suitable occasions. A factual product summary is added if left blank."/></label>
        <button className="publish" disabled={publishing}>{publishing ? "Publishing…" : "Publish product"}</button>
      </form>
    </div>}
  </main>;
}
