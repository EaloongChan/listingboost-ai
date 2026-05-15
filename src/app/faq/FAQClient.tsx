"use client";

import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

export default function FAQClient() {
  const { t } = useI18n();
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleQuestion = (key: string) => {
    setOpenIndex(openIndex === key ? null : key);
  };

  const faqSections = [
    {
      key: "general",
      title: t.faq.categories.general,
      questions: [
        { q: t.faq.questions.q1, a: t.faq.answers.a1 },
        { q: t.faq.questions.q2, a: t.faq.answers.a2 },
        { q: t.faq.questions.q3, a: t.faq.answers.a3 },
        { q: t.faq.questions.q4, a: t.faq.answers.a4 },
      ],
    },
    {
      key: "platforms",
      title: t.faq.categories.platforms,
      questions: [
        { q: t.faq.questions.q5, a: t.faq.answers.a5 },
        { q: t.faq.questions.q6, a: t.faq.answers.a6 },
        { q: t.faq.questions.q7, a: t.faq.answers.a7 },
        { q: t.faq.questions.q8, a: t.faq.answers.a8 },
      ],
    },
    {
      key: "data",
      title: t.faq.categories.data,
      questions: [
        { q: t.faq.questions.q9, a: t.faq.answers.a9 },
        { q: t.faq.questions.q10, a: t.faq.answers.a10 },
        { q: t.faq.questions.q11, a: t.faq.answers.a11 },
      ],
    },
    {
      key: "tips",
      title: t.faq.categories.tips,
      questions: [
        { q: t.faq.questions.q12, a: t.faq.answers.a12 },
        { q: t.faq.questions.q13, a: t.faq.answers.a13 },
        { q: t.faq.questions.q14, a: t.faq.answers.a14 },
      ],
    },
  ];

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
              {t.faq.badge}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              {t.faq.title}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t.faq.subtitle}
            </p>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-10">
            {faqSections.map((section) => (
              <div key={section.key}>
                <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
                  {section.title}
                </h2>
                <div className="space-y-3">
                  {section.questions.map((item, idx) => {
                    const key = `${section.key}-${idx}`;
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
              {t.faq.stillHaveQuestions}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {/* Can't find the answer you're looking for? Feel free to reach out to us. */}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary-hover rounded-lg transition-all duration-200"
            >
              {t.faq.contactBtn}
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
