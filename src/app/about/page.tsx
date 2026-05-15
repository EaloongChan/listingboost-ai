import { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "About ListingBoost AI — AI-Powered E-Commerce Listing Tool",
  description:
    "Learn about ListingBoost AI, the free AI product description generator trusted by 50,000+ sellers. Powered by advanced AI models including ZhipuAI GLM-4.7.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About ListingBoost AI",
    description:
      "Learn about ListingBoost AI, the free AI product description generator trusted by 50,000+ sellers worldwide.",
    url: "https://www.ealoongchan.top/about",
    type: "website",
  },
};

export default function AboutPage() {
  return <AboutClient />;
}
