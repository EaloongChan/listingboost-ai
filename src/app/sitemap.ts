import { MetadataRoute } from "next";

// All supported language codes
const locales = ["en", "zh", "es", "de", "fr", "ja", "ko", "pt", "ar", "ru", "id", "th", "vi"];

// Static routes
const staticRoutes = ["", "/about", "/faq", "/contact", "/privacy-policy", "/terms-of-service"];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.ealoongchan.top";

  const urls: MetadataRoute.Sitemap = [];

  // Add each route for each locale
  for (const route of staticRoutes) {
    for (const locale of locales) {
      urls.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === "" ? "weekly" : "monthly",
        priority: route === "" ? 1.0 : 0.8,
      });
    }
  }

  return urls;
}
