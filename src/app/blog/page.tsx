import { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import { BlogListClient } from "./BlogListClient";

export const metadata: Metadata = {
  title: "Blog — ListingBoost AI | E-commerce Tips, SEO Guides & More",
  description:
    "Expert tips on Amazon listing optimization, e-commerce SEO, product description writing, and AI tools for online sellers. Free guides from ListingBoost AI.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Blog — ListingBoost AI",
    description:
      "Expert e-commerce tips, SEO guides, and AI tool reviews for online sellers.",
    url: "https://www.ealoongchan.top/blog",
    type: "website",
  },
};

export default function BlogPage() {
  return <BlogListClient />;
}
