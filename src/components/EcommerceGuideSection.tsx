"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

export function EcommerceGuideSection() {
  const { t } = useI18n();

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card/50 p-6 sm:p-10 shadow-sm">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-6">
            Why Your Product Listings Make or Break Sales
          </h2>

          <div className="space-y-4 text-muted-foreground leading-relaxed text-[15px]">
            <p>
              Every day, millions of shoppers search for products on Amazon, Shopify, and other
              e-commerce platforms. Your product listing is often the only thing standing between a
              browsing visitor and a paying customer. The difference between a listing that converts
              at 2% and one that converts at 8% can be thousands of dollars in monthly revenue.
            </p>

            <p>
              Yet most sellers treat their product listings as an afterthought. They copy
              manufacturer descriptions, stuff keywords without strategy, and wonder why their
              products languish on page five of search results. The truth is, writing effective
              product copy is both an art and a science&mdash;and most sellers simply don&rsquo;t
              have the time to master it.
            </p>

            <h3 className="text-lg font-semibold text-foreground pt-2">
              What Makes a Product Listing Convert?
            </h3>
            <p>
              High-converting product listings share several characteristics. First, they lead with
              benefits rather than features. Instead of saying &ldquo;made with 1000-thread-count
              cotton,&rdquo; a converting listing says &ldquo;experience hotel-quality softness
              every night.&rdquo; Second, they address customer objections before they arise.
              Third, they incorporate relevant keywords naturally, improving both search visibility
              and readability.
            </p>
            <p>
              Research from Amazon itself shows that products with optimized titles and descriptions
              can see up to 40% more clicks from search results. And once a shopper clicks through,
              well-written bullet points and descriptions increase the likelihood of purchase by
              addressing exactly what the customer needs to know to make a buying decision.
            </p>

            <h3 className="text-lg font-semibold text-foreground pt-2">
              The Hidden Cost of Poor Listings
            </h3>
            <p>
              Bad product listings don&rsquo;t just cost you sales&mdash;they actively damage your
              brand. When shoppers encounter vague, poorly written, or keyword-stuffed descriptions,
              they lose trust in the seller. This leads to lower conversion rates, fewer reviews,
              and worse search rankings over time. It&rsquo;s a vicious cycle that&rsquo;s
              difficult to reverse.
            </p>
            <p>
              Consider this: a seller with 100 SKUs who spends just 5 minutes optimizing each
              listing could see a 15-25% increase in overall sales. For a business doing $50,000
              per month, that&rsquo;s an extra $7,500-$12,500&mdash;just from better copy.
              Multiply that across hundreds or thousands of products, and the opportunity becomes
              enormous.
            </p>

            <h3 className="text-lg font-semibold text-foreground pt-2">
              How ListingBoost AI Helps Sellers Win
            </h3>
            <p>
              ListingBoost AI was built specifically for e-commerce sellers who need professional
              product copy without the time or expense of hiring copywriters. Using advanced AI
              models trained on millions of high-performing listings, our tool generates
              conversion-optimized titles, bullet points, and descriptions tailored to your product
              and target platform.
            </p>
            <p>
              Simply enter your product name, key features, target audience, and select your
              platform&mdash;Amazon, Shopify, Etsy, or eBay. Our AI analyzes your input and
              produces polished, SEO-friendly copy in seconds. Each listing follows proven
              copywriting frameworks like AIDA (Attention-Interest-Desire-Action) and PAS
              (Problem-Agitate-Solution) to maximize conversion potential.
            </p>

            <h3 className="text-lg font-semibold text-foreground pt-2">
              Tips for Getting the Best Results
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-foreground">Be specific with features:</strong> Instead of
                &ldquo;high quality material,&rdquo; specify &ldquo;316L surgical-grade
                stainless steel.&rdquo; The more detail you provide, the better the output.
              </li>
              <li>
                <strong className="text-foreground">Know your audience:</strong> Selecting the right
                target audience (e.g., &ldquo;professional chefs&rdquo; vs. &ldquo;home
                cooks&rdquo;) dramatically changes the tone and focus of the generated listing.
              </li>
              <li>
                <strong className="text-foreground">Highlight what makes you different:</strong>
                If your product has a unique selling proposition&mdash;better materials, longer
                warranty, eco-friendly packaging&mdash;include it in the selling points.
              </li>
              <li>
                <strong className="text-foreground">Always review and personalize:</strong> AI
                generates an excellent starting point, but adding a personal touch&mdash;your
                brand voice, specific certifications, or a compelling brand story&mdash;can make
                the difference between good and great.
              </li>
            </ul>

            <div className="pt-4">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Read more e-commerce tips in our blog
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
        </div>
      </div>
    </section>
  );
}
