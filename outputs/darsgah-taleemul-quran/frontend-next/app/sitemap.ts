import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
  return ["", "/books", "/resources", "/syllabus", "/gallery", "/privacy"].map((path) => ({
    url: `${site}${path}`,
    lastModified: new Date(),
    changeFrequency: path ? "weekly" : "daily",
    priority: path ? 0.7 : 1
  }));
}
