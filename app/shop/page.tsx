"use client";

import { useEffect, useMemo, useState } from "react";
import { PremiumHeader } from "../components/premium-header";
import { ProductCard } from "../components/product-card";
import { trackMeta } from "../components/meta-pixel";
import type { Product } from "../lib/commerce-types";
import { PRODUCT_CATEGORIES } from "../lib/catalog";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/products", { signal: controller.signal }).then((response) => response.json()).then((result: { products?: Product[] }) => setProducts(result.products || [])).finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const categories = ["All", ...PRODUCT_CATEGORIES];
  const visible = useMemo(() => products.filter((product) =>
    (category === "All" || product.category === category) &&
    `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => {
    if (sort === "price-low") return Number(a.price_usd) - Number(b.price_usd);
    if (sort === "price-high") return Number(b.price_usd) - Number(a.price_usd);
    if (sort === "name") return a.name.localeCompare(b.name);
    return Number(b.featured) - Number(a.featured);
  }), [products, category, query, sort]);

  return <main>
    <PremiumHeader/>
    <section className="shop-hero"><span className="eyebrow">The complete collection</span><h1>Designed to be<br/><em>remembered.</em></h1><p>Limited-edition Nigerian-inspired womenswear, made for entrances, celebrations and every story in between.</p></section>
    <section className="shop-shell">
      <aside className="shop-filters"><form onSubmit={(event) => { event.preventDefault(); const search = query.trim(); if (search) trackMeta("Search", { search_string: search }); }}><label>Search<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search dresses, Adire…"/></label><button className="search-submit">Search</button></form>
        <fieldset><legend>Collection</legend>{categories.map((item) => <button className={category === item ? "active" : ""} key={item} onClick={() => setCategory(item)}>{item}</button>)}</fieldset>
      </aside>
      <div className="shop-results">
        <header><span>{loading ? "Loading the collection…" : `${visible.length} styles`}</span><label>Sort<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name</option></select></label></header>
        <div className="product-grid">{visible.map((product) => <ProductCard product={product} key={product.id}/>)}</div>
        {!loading && !visible.length && <div className="empty-results"><h2>No pieces found.</h2><p>Try a different search or collection.</p><button onClick={() => { setQuery(""); setCategory("All"); }}>View all pieces</button></div>}
      </div>
    </section>
  </main>;
}
