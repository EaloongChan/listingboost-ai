import { Metadata } from "next";
import FAQClient from "./FAQClient";
import { translations } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "FAQ — ListingBoost AI Common Questions & Answers",
  description:
    "Frequently asked questions about ListingBoost AI: how it works, supported platforms, data privacy, and tips for generating high-converting product listings.",
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "FAQ — ListingBoost AI",
    description:
      "Find answers to common questions about ListingBoost AI's AI product description generator.",
    url: "https://www.ealoongchan.top/faq",
    type: "website",
  },
};

export default function FAQPage() {
  // Get English FAQ data for JSON-LD structured data
  const en = translations.en;

  const faqItems = [
    { q: en.faq.questions.q1, a: en.faq.answers.a1 },
    { q: en.faq.questions.q2, a: en.faq.answers.a2 },
    { q: en.faq.questions.q3, a: en.faq.answers.a3 },
    { q: en.faq.questions.q4, a: en.faq.answers.a4 },
    { q: en.faq.questions.q5, a: en.faq.answers.a5 },
    { q: en.faq.questions.q6, a: en.faq.answers.a6 },
    { q: en.faq.questions.q7, a: en.faq.answers.a7 },
    { q: en.faq.questions.q8, a: en.faq.answers.a8 },
    { q: en.faq.questions.q9, a: en.faq.answers.a9 },
    { q: en.faq.questions.q10, a: en.faq.answers.a10 },
    { q: en.faq.questions.q11, a: en.faq.answers.a11 },
    { q: en.faq.questions.q12, a: en.faq.answers.a12 },
    { q: en.faq.questions.q13, a: en.faq.answers.a13 },
    { q: en.faq.questions.q14, a: en.faq.answers.a14 },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FAQClient />
    </>
  );
}
