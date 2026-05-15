"use client";

import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import Link from "next/link";

const faqCategories = [
  {
    category: "General",
    questions: [
      {
        q: "What is ListingBoost AI?",
        a: "ListingBoost AI is an AI-powered tool that generates professional product listings for e-commerce platforms. It creates optimized product titles, bullet points, and descriptions tailored to platforms like Amazon, Shopify, Etsy, eBay, and more.",
      },
      {
        q: "Is ListingBoost AI free to use?",
        a: "Yes! ListingBoost AI offers free listing generation powered by advanced AI models. You can generate unlimited product listings without any cost.",
      },
      {
        q: "How does the AI generate listings?",
        a: "Our AI uses state-of-the-art language models (powered by ZhipuAI) trained on millions of high-performing e-commerce listings. You simply provide your product name, key selling points, target audience, and preferred tone — the AI handles the rest.",
      },
      {
        q: "How long does it take to generate a listing?",
        a: "Most listings are generated in under 5 seconds. The AI processes your input and returns a complete, ready-to-use product listing with title, 5 bullet points, and a detailed product description.",
      },
    ],
  },
  {
    category: "Platforms & Features",
    questions: [
      {
        q: "Which e-commerce platforms are supported?",
        a: "ListingBoost AI currently supports Amazon, Shopify, Etsy, eBay, independent websites (Shopify/WooCommerce), and Alibaba/1688. Each platform has specific optimization rules that the AI follows.",
      },
      {
        q: "What languages are supported?",
        a: "Our interface supports 13 languages: English, Chinese, Spanish, German, French, Japanese, Korean, Portuguese, Arabic, Russian, Indonesian, Thai, and Vietnamese. The AI can also generate listing content in the language of your choice.",
      },
      {
        q: "What tone options are available?",
        a: "We offer 5 tone options: Professional, Casual & Friendly, Luxury/Premium, Technical/Spec-focused, and Emotional/Story-driven. Each tone adjusts the language style and vocabulary to match your brand voice.",
      },
      {
        q: "Can I customize the generated content?",
        a: "Absolutely! The generated content is fully editable. We recommend reviewing and customizing the AI output to perfectly match your product and brand before publishing.",
      },
    ],
  },
  {
    category: "Data & Privacy",
    questions: [
      {
        q: "Is my product data safe?",
        a: "Yes. Your product information is processed in real-time and is not permanently stored on our servers. Generated listings are displayed in your browser session only. Please refer to our Privacy Policy for complete details.",
      },
      {
        q: "Do you share my data with third parties?",
        a: "Product data is sent to our AI provider (ZhipuAI) for processing. We do not sell, rent, or share your data with any other third parties for marketing purposes. See our Privacy Policy for full transparency.",
      },
      {
        q: "Can I delete my data?",
        a: "Since we don't permanently store your product input data, there is nothing to delete on our end. Generated listings exist only in your browser session. You can clear your browser data to remove any locally stored preferences.",
      },
    ],
  },
  {
    category: "Tips & Best Practices",
    questions: [
      {
        q: "How can I get the best results from the AI?",
        a: "For optimal results: (1) Provide a clear, descriptive product name, (2) Include 3-5 specific selling points with measurable details, (3) Select the most relevant target audience, (4) Choose a tone that matches your brand. The more specific your input, the better the output.",
      },
      {
        q: "Should I edit the AI-generated content before publishing?",
        a: "We strongly recommend reviewing and editing all generated content before publishing. The AI provides an excellent starting point, but you should verify factual claims, add brand-specific information, and ensure compliance with your target platform's policies.",
      },
      {
        q: "How many listings can I generate per day?",
        a: "There is no daily limit on the number of listings you can generate. Feel free to create as many listings as you need for your products.",
      },
    ],
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleQuestion = (key: string) => {
    setOpenIndex(openIndex === key ? null : key);
  };

  return (
    <PageLayout>
      <section className="pt-28 pb-16 sm:pt-32 sm:pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
              </svg>
              FAQ
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground text-lg">
              Everything you need to know about ListingBoost AI.
            </p>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-10">
            {faqCategories.map((section) => (
              <div key={section.category}>
                <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
                  {section.category}
                </h2>
                <div className="space-y-3">
                  {section.questions.map((item, idx) => {
                    const key = `${section.category}-${idx}`;
                    const isOpen = openIndex === key;
                    return (
                      <div
                        key={key}
                        className="rounded-lg border border-border bg-card overflow-hidden"
                      >
                        <button
                          onClick={() => toggleQuestion(key)}
                          className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-foreground hover:bg-accent/50 transition-colors duration-150"
                        >
                          <span>{item.q}</span>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`flex-shrink-0 ml-4 text-muted-foreground transition-transform duration-200 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          >
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </button>
                        <div
                          className={`overflow-hidden transition-all duration-200 ${
                            isOpen ? "max-h-96" : "max-h-0"
                          }`}
                        >
                          <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                            {item.a}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Still have questions? */}
          <div className="mt-16 text-center bg-muted/50 rounded-2xl p-8 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Still have questions?
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Can&apos;t find the answer you&apos;re looking for? Feel free to reach out to us.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary-hover rounded-lg transition-all duration-200"
            >
              Contact Us
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
