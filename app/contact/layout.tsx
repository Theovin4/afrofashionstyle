import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Style Enquiries",
  description: "Contact Afro.Fashionstyle for sizing, styling, product and delivery support for Nigerian fashion orders in the USA and UK.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
