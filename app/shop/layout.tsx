import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Nigerian & African Dresses for Women",
  description: "Shop premium Ankara dresses, Adire gowns and Nigerian occasion wear for women in the USA and UK.",
  alternates: { canonical: "/shop" },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
