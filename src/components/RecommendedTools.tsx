"use client";

export function RecommendedTools() {
  return (
    <div className="mt-6 rounded-2xl border border-border p-5 sm:p-6 bg-gradient-to-br from-card via-card to-accent/30 relative overflow-hidden">
      {/* Decorative gradient border accent */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-success/10 pointer-events-none" />
      <div className="absolute inset-[1px] rounded-2xl bg-card pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <h4 className="text-sm font-semibold text-foreground">
            Recommended Tools
          </h4>
          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            Partners
          </span>
        </div>

        {/* Tool Cards */}
        <div className="space-y-3">
          {/* Helium 10 */}
          <a
            href="https://i.helium10.com/c/7311265/3054775/37271"
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="group flex items-center gap-4 p-3.5 rounded-xl border border-border bg-background hover:bg-accent/50 hover:border-primary/30 transition-all duration-300 no-underline"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">H10</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground">
                  Optimize SEO with Helium 10
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Keyword research, product analytics & listing optimization
              </p>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>

          {/* Shopify */}
          <a
            href="#shopify-affiliate"
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="group flex items-center gap-4 p-3.5 rounded-xl border border-border bg-background hover:bg-accent/50 hover:border-success/30 transition-all duration-300 no-underline"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground">
                  Build Your Store with Shopify
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Start your online store with a free trial — no coding required
              </p>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground group-hover:text-success group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
