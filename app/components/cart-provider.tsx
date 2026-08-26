"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, useContext, useEffect, useState } from "react";
import type { CartItem, Currency, Product } from "../lib/commerce-types";
import { trackMeta } from "./meta-pixel";
import { showActionToast } from "./action-toast";

type CartContextValue = {
  items: CartItem[];
  currency: Currency;
  isOpen: boolean;
  count: number;
  total: number;
  setCurrency: (currency: Currency) => void;
  setOpen: (open: boolean) => void;
  addItem: (product: Product, size?: string) => void;
  updateQuantity: (id: string, size: string, quantity: number) => void;
  removeItem: (id: string, size: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "afro-fashionstyle-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}") as { items?: CartItem[]; currency?: Currency };
      if (Array.isArray(saved.items)) {
        queueMicrotask(() => setItems(saved.items || []));
      }
      if (saved.currency === "GBP") {
        queueMicrotask(() => setCurrencyState("GBP"));
      }
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ items, currency }));
  }, [items, currency]);

  function addItem(product: Product, size = "One size") {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id && item.size === size);
      if (existing) return current.map((item) => item === existing ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item);
      return [...current, {
        id: product.id, name: product.name, slug: product.slug, price_usd: Number(product.price_usd),
        price_gbp: Number(product.price_gbp), stock: product.stock, size, quantity: 1,
        image: product.product_images?.[0]?.secure_url,
      }];
    });
    trackMeta("AddToCart", {
      content_name: product.name, content_category: product.category, content_ids: [product.id],
      contents: [{ id: product.id, quantity: 1, item_price: Number(currency === "GBP" ? product.price_gbp : product.price_usd) }],
      content_type: "product", value: Number(currency === "GBP" ? product.price_gbp : product.price_usd), currency,
    });
    setOpen(true);
    showActionToast(`${product.name} was added to your bag.`);
  }

  function updateQuantity(id: string, size: string, quantity: number) {
    setItems((current) => current.flatMap((item) => {
      if (item.id !== id || item.size !== size) return [item];
      if (quantity < 1) return [];
      return [{ ...item, quantity: Math.min(quantity, item.stock) }];
    }));
  }

  function removeItem(id: string, size: string) {
    setItems((current) => current.filter((item) => item.id !== id || item.size !== size));
    showActionToast("Item removed from your bag.", "info");
  }

  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + Number(currency === "GBP" ? item.price_gbp : item.price_usd) * item.quantity, 0);
  const value = {
    items, currency, isOpen, count, total, setCurrency: setCurrencyState, setOpen, addItem, updateQuantity, removeItem,
  };

  return <CartContext.Provider value={value}>
    {children}
    {isOpen && <div className="cart-layer">
      <button className="cart-scrim" aria-label="Close shopping bag" onClick={() => setOpen(false)}/>
      <aside className="cart-drawer" aria-label="Shopping bag">
        <header><div><span className="eyebrow">Your selection</span><h2>Shopping bag</h2></div><button onClick={() => setOpen(false)} aria-label="Close">×</button></header>
        <div className="cart-items">
          {!items.length && <div className="cart-empty"><b>Your bag is ready for something unforgettable.</b><p>Explore premium Nigerian dresses, sets and occasion wear.</p></div>}
          {items.map((item) => <article key={`${item.id}-${item.size}`}>
            <div className="cart-thumb">{item.image ? <Image src={item.image} alt="" fill sizes="90px"/> : <span>AF</span>}</div>
            <div><Link href={`/products/${item.slug}`} onClick={() => setOpen(false)}>{item.name}</Link><small>Size: {item.size}</small>
              <div className="quantity-control"><button onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}>−</button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}>+</button></div>
              <button className="remove-item" onClick={() => removeItem(item.id, item.size)}>Remove</button>
            </div>
            <strong>{currency === "USD" ? "$" : "£"}{(Number(currency === "GBP" ? item.price_gbp : item.price_usd) * item.quantity).toFixed(2)}</strong>
          </article>)}
        </div>
        <footer><div><span>Subtotal</span><strong>{currency} {total.toFixed(2)}</strong></div><p>Tracked delivery and taxes calculated at checkout.</p>
          <Link className={`button primary ${!items.length ? "disabled" : ""}`} href={items.length ? `/checkout?items=${items.flatMap((item) => Array(item.quantity).fill(item.id)).join(",")}&sizes=${items.flatMap((item) => Array(item.quantity).fill(encodeURIComponent(item.size))).join(",")}&currency=${currency}` : "#"} onClick={() => {
            if (items.length) trackMeta("InitiateCheckout", {
              content_ids: items.map((item) => item.id),
              contents: items.map((item) => ({ id: item.id, quantity: item.quantity, item_price: Number(currency === "GBP" ? item.price_gbp : item.price_usd) })),
              content_type: "product", num_items: count, value: total, currency,
            });
            setOpen(false);
          }}>Secure checkout</Link>
          <button onClick={() => setOpen(false)}>Continue shopping</button>
        </footer>
      </aside>
    </div>}
  </CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
