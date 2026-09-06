import type { MetadataRoute } from "next";
import { SITE_URL } from "@/content/links";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/projects", "/experience", "/about", "/resume", "/contact", "/projects/pavescan-ai", "/projects/civic-data-pipeline", "/projects/pop-up-chapel", "/projects/localflow"].map(path => ({ url: SITE_URL + path, changeFrequency: "monthly", priority: path ? 0.8 : 1 }));
}
