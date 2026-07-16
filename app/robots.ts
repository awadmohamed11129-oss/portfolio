import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/go/", "/me"],
    },
    sitemap: "https://mohamadawad.vercel.app/sitemap.xml",
  };
}
