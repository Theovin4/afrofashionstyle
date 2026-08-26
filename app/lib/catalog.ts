export const PRODUCT_CATEGORIES = ["Dresses", "Two piece", "Lace Outfit", "Other Luxury Designs", "Accessories"] as const;
export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

export const CATEGORY_DETAILS = [
  { slug: "dresses", name: "Dresses", title: "Nigerian & African Dresses for Women", description: "Shop statement Ankara, Adire and Nigerian dresses for weddings, celebrations and elevated occasions, with tracked delivery across the USA and UK." },
  { slug: "two-piece", name: "Two piece", title: "African Two-Piece Outfits for Women", description: "Discover polished Nigerian two-piece outfits that move effortlessly from special events to elevated evenings, available across the USA and UK." },
  { slug: "lace-outfit", name: "Lace Outfit", title: "Nigerian Lace Outfits & Occasion Wear", description: "Choose elegant Nigerian lace outfits for weddings, parties and milestone celebrations, with secure tracked USA and UK delivery." },
  { slug: "other-luxury-designs", name: "Other Luxury Designs", title: "Luxury Nigerian Fashion & Occasion Wear", description: "Explore distinctive silhouettes, rich textiles and limited Afro.Fashionstyle designs for women who want memorable Nigerian occasion wear." },
  { slug: "accessories", name: "Accessories", title: "African Fashion Accessories for Women", description: "Complete your look with expressive African-inspired accessories selected to complement dresses, sets and occasion outfits." },
] as const satisfies ReadonlyArray<{ slug: string; name: ProductCategory; title: string; description: string }>;

export function isProductCategory(value: string): value is ProductCategory {
  return PRODUCT_CATEGORIES.includes(value as ProductCategory);
}
