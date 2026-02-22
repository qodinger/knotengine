import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/login", "/terms", "/privacy"],
      disallow: ["/dashboard/", "/api/"],
    },
    sitemap: "https://dashboard.knotengine.com/sitemap.xml",
  };
}
