import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { divisions } from "@/lib/content/divisions";
import { activeRoles } from "@/lib/content/careers";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, "");
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/quote`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${base}/services`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/reviews`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/careers`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
  ];

  const divisionRoutes: MetadataRoute.Sitemap = divisions.map((d) => ({
    url: `${base}/divisions/${d.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  const roleRoutes: MetadataRoute.Sitemap = activeRoles().map((r) => ({
    url: `${base}/careers/${r.slug}`,
    lastModified: new Date(r.datePosted),
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  return [...staticRoutes, ...divisionRoutes, ...roleRoutes];
}
