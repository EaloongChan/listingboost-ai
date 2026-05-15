import { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact ListingBoost AI — Get in Touch with Our Team",
  description:
    "Have questions or feedback about ListingBoost AI? Contact our team. We typically respond within 24-48 hours.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact ListingBoost AI",
    description:
      "Get in touch with the ListingBoost AI team. We're here to help with any questions about our AI listing generator.",
    url: "https://www.ealoongchan.top/contact",
    type: "website",
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
