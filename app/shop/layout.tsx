import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Nigerian Dresses & African Fashion for Women",
  description: "Shop premium Ankara dresses, Adire styles, Nigerian lace outfits, two-piece sets and occasion wear for women in the USA and UK.",
  alternates: { canonical: "/shop" },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
