import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { services } from "@/lib/content/services";
import { serviceAreas, serviceOfferedInArea } from "@/lib/content/service-areas";
import { workCategories } from "@/lib/content/work-categories";
import { activeRoles } from "@/lib/content/careers";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, "");
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/quote`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${base}/services`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/service-areas`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/our-work`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/reviews`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/insurance`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/support`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/careers`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/winter-packages`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const serviceRoutes: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${base}/services/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  const areaRoutes: MetadataRoute.Sitemap = serviceAreas.map((a) => ({
    url: `${base}/service-areas/${a.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.85,
  }));

  // Service + Area combination pages, captures "<service> + <city>"
  // search intent. Snow combos only exist where snow coverage does
  // (Petawawa active, Pembroke expanding).
  const comboRoutes: MetadataRoute.Sitemap = [];
  for (const s of services) {
    for (const a of serviceAreas) {
      if (!serviceOfferedInArea(s.slug, a)) continue;
      comboRoutes.push({
        url: `${base}/services/${s.slug}/${a.slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  }

  const workRoutes: MetadataRoute.Sitemap = workCategories.map((c) => ({
    url: `${base}/our-work/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const roleRoutes: MetadataRoute.Sitemap = activeRoles().map((r) => ({
    url: `${base}/careers/${r.slug}`,
    lastModified: new Date(r.datePosted),
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  return [
    ...staticRoutes,
    ...serviceRoutes,
    ...areaRoutes,
    ...comboRoutes,
    ...workRoutes,
    ...roleRoutes,
  ];
}
