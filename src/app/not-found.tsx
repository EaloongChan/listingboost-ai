import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found — ListingBoost AI",
  description: "The page you are looking for does not exist. Return to ListingBoost AI homepage.",
};

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center">
            {/* 404 Number */}
            <div className="text-8xl sm:text-9xl font-bold text-primary/10 leading-none mb-4">
              404
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Page Not Found
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
              Sorry, the page you are looking for does not exist or has been moved.
              Meanwhile, here are some helpful links:
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary-hover rounded-lg transition-all duration-200"
              >
                Go Home
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001 1v3a1 1 0 002 0v-3a1 1 0 011-1h2a1 1 0 011 1v3a1 1 0 002 0v-3a1 1 0 011-1h2a1 1 0 011 1v3a1 1 0 002 0v-3" />
                </svg>
              </Link>

              <Link
                href="/blog"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-foreground border border-border hover:border-foreground/20 rounded-lg transition-all duration-200"
              >
                Visit Blog
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Helpful links */}
            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">Popular pages:</p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                <Link href="/about" className="text-primary hover:underline">About</Link>
                <span className="text-border">|</span>
                <Link href="/faq" className="text-primary hover:underline">FAQ</Link>
                <span className="text-border">|</span>
                <Link href="/contact" className="text-primary hover:underline">Contact</Link>
                <span className="text-border">|</span>
                <Link href="/terms-of-service" className="text-primary hover:underline">Terms</Link>
                <span className="text-border">|</span>
                <Link href="/privacy-policy" className="text-primary hover:underline">Privacy</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
