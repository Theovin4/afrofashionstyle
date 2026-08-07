export const PRODUCT_CATEGORIES = ["Dresses", "Two piece", "Lace Outfit", "Other Luxury Designs", "Accessories"] as const;
export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

export const CATEGORY_DETAILS = [
  { slug: "dresses", name: "Dresses", title: "African & Nigerian Dresses for Women", description: "Shop made-to-order Ankara, Adire and Nigerian dresses for weddings, celebrations and statement dressing, with tracked delivery across the USA and UK." },
  { slug: "two-piece", name: "Two piece", title: "African Two-Piece Outfits for Women", description: "Shop coordinated Nigerian two-piece outfits made in Lagos for women in the USA and UK, from polished sets to celebration-ready separates." },
  { slug: "lace-outfit", name: "Lace Outfit", title: "Nigerian Lace Outfits for Women", description: "Discover Nigerian lace outfits made for weddings, parties and milestone occasions, available for tracked USA and UK delivery." },
  { slug: "other-luxury-designs", name: "Other Luxury Designs", title: "Luxury Nigerian Fashion Designs", description: "Explore distinctive Nigerian occasion wear and limited Afro.Fashionstyle designs made on request for customers in the USA and UK." },
  { slug: "accessories", name: "Accessories", title: "African Fashion Accessories", description: "Complete your look with African-inspired accessories selected to accompany Afro.Fashionstyle outfits in the USA and UK." },
] as const satisfies ReadonlyArray<{ slug: string; name: ProductCategory; title: string; description: string }>;

export function isProductCategory(value: string): value is ProductCategory {
  return PRODUCT_CATEGORIES.includes(value as ProductCategory);
}
