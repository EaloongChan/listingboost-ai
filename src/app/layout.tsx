import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "./providers";

const SITE_URL = "https://www.ealoongchan.top";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title:
    "ListingBoost AI — AI Product Description Generator for E-commerce | 10x Your Conversions",
  description:
    "Generate high-converting product listings in seconds with AI. Optimized for Amazon, Shopify, Etsy, eBay, and independent stores. Free AI product description generator trusted by 50,000+ sellers worldwide.",
  keywords: [
    "AI product description generator",
    "e-commerce listing optimization",
    "Amazon listing generator",
    "Shopify product description",
    "AI copywriting tool",
    "product title generator",
    "bullet point generator",
    "SEO product listing",
    "e-commerce AI tool",
    "free listing generator",
    "product description writer",
    "Amazon SEO tool",
    "Etsy listing optimizer",
    "eBay product description",
    "conversion rate optimization",
    "AI writing assistant",
  ],
  authors: [{ name: "ListingBoost AI" }],
  creator: "ListingBoost AI",
  publisher: "ListingBoost AI",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
    languages: {
      "en": "/en",
      "zh": "/zh",
      "es": "/es",
      "de": "/de",
      "fr": "/fr",
      "ja": "/ja",
      "ko": "/ko",
      "pt": "/pt",
      "ar": "/ar",
      "ru": "/ru",
      "id": "/id",
      "th": "/th",
      "vi": "/vi",
      "x-default": "/en",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    title:
      "ListingBoost AI — AI Product Description Generator for E-commerce",
    description:
      "Generate high-converting product listings in seconds. Optimized for Amazon, Shopify, Etsy, and more.",
    siteName: "ListingBoost AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "ListingBoost AI — AI Product Description Generator",
    description:
      "Generate high-converting product listings in seconds with AI. Free tool trusted by 50,000+ sellers.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#2563eb" />
        <link rel="icon" href="/favicon.ico" />
        {/* Google Analytics 4 */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-1HTCYSWRJY"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-1HTCYSWRJY', {
                page_title: document.title,
                send_page_view: true
              });
            `,
          }}
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5750850218373987"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "ListingBoost AI",
              url: SITE_URL,
              description:
                "Free AI-powered product description generator for e-commerce sellers. Generate optimized listings for Amazon, Shopify, Etsy, eBay and more.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${SITE_URL}/en?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "ListingBoost AI",
              url: SITE_URL,
              logo: `${SITE_URL}/logo.png`,
              sameAs: [],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "ListingBoost AI",
              url: SITE_URL,
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
                description: "Free plan with generous daily limits",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "50000",
                bestRating: "5",
                worstRating: "1",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
