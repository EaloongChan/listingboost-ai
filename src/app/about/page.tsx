import type { Metadata } from "next";
import { PageLayout } from "@/components/PageLayout";

export const metadata: Metadata = {
  title: "About Us — ListingBoost AI",
  description:
    "Learn about ListingBoost AI, our mission to empower e-commerce sellers with AI-powered listing optimization, and the technology behind our platform.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="pt-28 pb-12 sm:pt-32 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
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
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            About ListingBoost AI
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Empowering E-commerce Sellers
            <br />
            <span className="text-primary">with AI-Powered Copywriting</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            We believe every seller deserves access to professional-grade product listings. Our
            mission is to democratize e-commerce copywriting using cutting-edge artificial
            intelligence.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
                Our Mission
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                ListingBoost AI was founded with a simple goal: help e-commerce sellers create
                high-converting product listings in seconds, not hours. We understand that writing
                compelling product descriptions, bullet points, and titles is time-consuming and
                requires specialized copywriting skills.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our AI-powered platform eliminates this bottleneck, enabling sellers of all sizes —
                from individual entrepreneurs to large-scale operations — to produce
                professional-quality listings optimized for platforms like Amazon, Shopify, Etsy, and
                eBay.
              </p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">50K+</div>
                  <div className="text-sm text-muted-foreground mt-1">Active Sellers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">2M+</div>
                  <div className="text-sm text-muted-foreground mt-1">Listings Generated</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">13</div>
                  <div className="text-sm text-muted-foreground mt-1">Languages Supported</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">4.8/5</div>
                  <div className="text-sm text-muted-foreground mt-1">User Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="py-16 bg-muted/50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
              Powered by Advanced AI
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform leverages state-of-the-art language models specifically fine-tuned for
              e-commerce copywriting.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                ),
                title: "Fast Generation",
                description:
                  "Generate complete product listings in under 5 seconds using optimized AI inference pipelines.",
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                  </svg>
                ),
                title: "Multi-Language",
                description:
                  "Support for 13+ languages with native-quality translations and culturally adapted content.",
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                ),
                title: "SEO Optimized",
                description:
                  "Every listing is crafted with high-converting keywords strategically placed for maximum visibility.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
              What We Believe
            </h2>
          </div>
          <div className="space-y-8 max-w-3xl mx-auto">
            {[
              {
                title: "Accessibility First",
                description:
                  "Professional copywriting should not be a luxury. We make it accessible to every seller, regardless of budget or expertise.",
              },
              {
                title: "Quality Without Compromise",
                description:
                  "We never sacrifice quality for speed. Our AI is trained on millions of high-performing listings to deliver content that converts.",
              },
              {
                title: "Seller Empowerment",
                description:
                  "Our tool augments human creativity, not replaces it. We give sellers the foundation to build upon, so they can focus on growing their business.",
              },
              {
                title: "Continuous Innovation",
                description:
                  "The e-commerce landscape evolves constantly. We invest heavily in R&D to ensure our platform stays ahead of market trends and platform algorithm changes.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-muted/50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
            Ready to Boost Your Listings?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join 50,000+ sellers who are already using ListingBoost AI to create
            high-converting product listings.
          </p>
          <a
            href="/#workspace"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary-hover rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-primary/20"
          >
            Start Generating — Free
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </section>
    </PageLayout>
  );
}
