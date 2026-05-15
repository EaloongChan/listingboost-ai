import { MetadataRoute } from "next";

const SITE_URL = "https://www.ealoongchan.top";

// All supported language codes
const locales = ["en", "zh", "es", "de", "fr", "ja", "ko", "pt", "ar", "ru", "id", "th", "vi"];

// Static routes with priorities
const routes = [
  { path: "", priority: 1.0, changefreq: "weekly" as const },
  { path: "/about", priority: 0.8, changefreq: "monthly" as const },
  { path: "/faq", priority: 0.8, changefreq: "monthly" as const },
  { path: "/contact", priority: 0.7, changefreq: "monthly" as const },
  { path: "/privacy-policy", priority: 0.3, changefreq: "yearly" as const },
  { path: "/terms-of-service", priority: 0.3, changefreq: "yearly" as const },
];

const SITE_LAST_MODIFIED = "2026-05-15";

export default function sitemap(): MetadataRoute.Sitemap {
  const urls: MetadataRoute.Sitemap = [];

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

  return urls;
}
