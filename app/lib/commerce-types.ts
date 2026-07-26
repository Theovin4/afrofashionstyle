export type Currency = "USD" | "GBP";

export type ProductImage = {
  id?: string;
  secure_url: string;
  alt_text: string;
  position?: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price_usd: number;
  price_gbp: number;
  stock: number;
  status: string;
  featured: boolean;
  product_images?: ProductImage[];
};

export type CartItem = Pick<Product, "id" | "name" | "slug" | "price_usd" | "price_gbp" | "stock"> & {
  image?: string;
  size: string;
  quantity: number;
};
