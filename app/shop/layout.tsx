import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Nigerian & African Dresses for Women",
  description: "Shop made-to-order Ankara dresses, Adire gowns, lace outfits and Nigerian occasion wear for women in the USA and UK.",
  alternates: { canonical: "/shop" },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
