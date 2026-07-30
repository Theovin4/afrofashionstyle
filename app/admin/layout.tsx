import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "../lib/admin-auth";

export const metadata: Metadata = {
  title: "Commerce Studio",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin-login");
  return children;
}
