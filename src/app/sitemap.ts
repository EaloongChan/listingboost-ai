import { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/blog";

const SITE_URL = "https://www.ealoongchan.top";

// All supported language codes
const locales = ["en", "zh", "es", "de", "fr", "ja", "ko", "pt", "ar", "ru", "id", "th", "vi"];

// Static routes with priorities
const routes = [
  { path: "", priority: 1.0, changefreq: "weekly" as const },
  { path: "/blog", priority: 0.9, changefreq: "weekly" as const },
  { path: "/about", priority: 0.8, changefreq: "monthly" as const },
  { path: "/faq", priority: 0.8, changefreq: "monthly" as const },
  { path: "/contact", priority: 0.7, changefreq: "monthly" as const },
  { path: "/privacy-policy", priority: 0.3, changefreq: "yearly" as const },
  { path: "/terms-of-service", priority: 0.3, changefreq: "yearly" as const },
];

const SITE_LAST_MODIFIED = "2026-05-16";

export default function sitemap(): MetadataRoute.Sitemap {
  const urls: MetadataRoute.Sitemap = [];

  // Static routes (one per locale)
  for (const route of routes) {
    for (const locale of locales) {
      urls.push({
        url: `${SITE_URL}/${locale}${route.path}`,
        lastModified: new Date(SITE_LAST_MODIFIED),
        changeFrequency: route.changefreq,
        priority: route.priority,
      });
    }
  }

  // Blog articles (high value for SEO)
  const blogSlugs = getAllSlugs();
  for (const slug of blogSlugs) {
    urls.push({
      url: `${SITE_URL}/blog/${slug}`,
      lastModified: new Date(SITE_LAST_MODIFIED),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  return urls;
}
