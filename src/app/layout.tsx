import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ClientProviders } from "./providers";

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
  metadataBase: new URL("https://ealoongchan.top"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ealoongchan.top",
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
      </head>
      <body className="min-h-full flex flex-col">
        <ClientProviders>{children}</ClientProviders>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5750850218373987"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
