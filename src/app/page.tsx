import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { Workspace } from "@/components/Workspace";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import { FeaturesSection } from "@/components/FeaturesSection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="flex-1">
        <HeroSection />

        {/* ─── Leaderboard Ad (728x90) ─── */}
        <div className="px-4 sm:px-6 lg:px-8 -mt-4 mb-8">
          <div className="mx-auto max-w-3xl">
            <AdPlaceholder size="728x90" />
          </div>
        </div>

        {/* ─── Main Workspace with Sidebar Ad ─── */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:gap-8">
            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              <Workspace />
            </div>

            {/* Sidebar Ad (desktop only) */}
            <aside className="hidden lg:block w-[300px] flex-shrink-0">
              <div className="sticky top-24 space-y-8">
                <AdPlaceholder size="300x250" />
                <AdPlaceholder size="300x250" className="mt-8" />
              </div>
            </aside>
          </div>
        </div>

        {/* ─── Below-Result Ad (responsive) ─── */}
        <div className="px-4 sm:px-6 lg:px-8 mt-8 mb-4">
          <div className="mx-auto max-w-3xl">
            <AdPlaceholder size="responsive" />
          </div>
        </div>

        <FeaturesSection />

        {/* ─── Bottom Ad ─── */}
        <div className="px-4 sm:px-6 lg:px-8 mb-8">
          <div className="mx-auto max-w-3xl">
            <AdPlaceholder size="728x90" />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
