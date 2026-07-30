import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Style Enquiries",
  description: "Contact Afro.Fashionstyle for sizing, made-to-order and Nigerian fashion enquiries.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
