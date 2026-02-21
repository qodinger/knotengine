import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/checkout/"],
      disallow: ["/", "/api/"], // Disallow root if it's just the search page
    },
    sitemap: "https://checkout.knotengine.com/sitemap.xml",
  };
}
