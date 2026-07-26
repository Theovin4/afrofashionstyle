"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Product = { id: string; name: string; category: string; price: number; stock: number; status: string; imageUrl?: string };
type ApiProduct = { id: string; name: string; category: string; price_usd: number; stock: number; status: string; product_images?: Array<{ secure_url: string }> };
type Order = { id: string; order_number: string; customer_name: string; customer_email: string; currency: string; total: number; payment_status: string; fulfillment_status: string; tracking_number?: string; tracking_url?: string; carrier?: string; created_at: string; order_items?: Array<{ product_name: string; quantity: number; selected_size?: string }> };
type Operations = {
  discounts: Array<{ id: string; code: string; kind: string; value: number; active: boolean; uses: number }>;
  shipping: Array<{ id: string; country: string; currency: string; name: string; rate: number; free_over: number | null; delivery_min_days: number; delivery_max_days: number }>;
  reviews: Array<{ id: string; customer_name: string; rating: number; title: string; body: string; status: string; products?: { name?: string } }>;
  settings: Record<string, Record<string, string>>;
};

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [operations, setOperations] = useState<Operations>({ discounts: [], shipping: [], reviews: [], settings: {} });

  useEffect(() => {
    fetch("/api/products").then((response) => response.ok ? response.json() : Promise.reject())
      .then(({ products: rows }: { products: ApiProduct[] }) => setProducts(rows.map((product) => ({
        id: product.id, name: product.name, category: product.category, price: Number(product.price_usd),
        stock: product.stock, status: product.status === "active" ? "Active" : product.status,
        imageUrl: product.product_images?.[0]?.secure_url,
      })))).catch(() => setNotice("Products could not be loaded."));
  }, []);

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
      <article className="table-card orders-card" id="orders">
        <div className="table-head"><div><h2>Orders</h2><p>{orders.length} recent orders · Payments verified by webhook</p></div></div>
        <div className="orders-table">
          <div className="order-row labels"><span>Order</span><span>Customer</span><span>Total</span><span>Payment</span><span>Fulfilment</span></div>
          {orders.map((order) => <div className="order-row" key={order.id}>
            <span><b>{order.order_number}</b><small>{new Date(order.created_at).toLocaleDateString()}</small></span>
            <span><b>{order.customer_name}</b><small>{order.order_items?.map((item) => `${item.product_name} × ${item.quantity}${item.selected_size ? ` (${item.selected_size})` : ""}`).join(", ")}</small></span>
            <span>{order.currency} {Number(order.total).toFixed(2)}</span><span><em>{order.payment_status}</em></span>
            <span><select value={order.fulfillment_status} onChange={(event) => void updateOrder(order, event.target.value)}><option value="unfulfilled">Unfulfilled</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select>{order.tracking_number && <small>{order.carrier}: {order.tracking_number}</small>}</span>
          </div>)}
          {!orders.length && <p className="admin-empty">New paid orders will appear here automatically.</p>}
        </div>
      </article>
      <article className="table-card" id="customers">
        <div className="table-head"><div><h2>Customers</h2><p>Customer history generated from verified orders.</p></div></div>
        <div className="compact-list">{Array.from(new Map(orders.map((order) => [order.customer_email, order])).values()).map((customer) => <p key={customer.customer_email}><b>{customer.customer_name}</b><span>{customer.customer_email} · {orders.filter((order) => order.customer_email === customer.customer_email).length} order(s)</span></p>)}{!orders.length && <p>No customer orders yet.</p>}</div>
      </article>
      <section className="operations-grid" id="analytics">
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
        <label>Collection<select name="category"><option>Ankara Edit</option><option>Adire Collection</option><option>Occasion Wear</option><option>Everyday Luxury</option></select></label>
        <div className="form-split"><label>Price (USD)<input name="priceUsd" type="number" min="1" step="0.01" required/></label><label>Price (GBP)<input value="Calculated automatically from USD" readOnly/></label></div>
        <label>Inventory<input name="stock" type="number" min="0" required/></label>
        <label>Available sizes<input name="sizes" defaultValue="US 2, US 4, US 6, US 8, US 10, US 12, US 14, US 16, US 18"/></label>
        <label>Product imagery<input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required/></label>
        <label>Description<textarea name="description" rows={4} placeholder="Tell the story of the piece…"/></label>
        <button className="publish" disabled={publishing}>{publishing ? "Publishing…" : "Publish product"}</button>
      </form>
    </div>}
  </main>;
}
