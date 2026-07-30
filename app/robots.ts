import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin-login", "/api/", "/checkout", "/payment/"],
    },
    sitemap: "https://afro-fashionstyle.vercel.app/sitemap.xml",
    host: "https://afro-fashionstyle.vercel.app",
  };
}
