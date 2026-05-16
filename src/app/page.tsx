import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { EcommerceGuideSection } from "@/components/EcommerceGuideSection";
import { Workspace } from "@/components/Workspace";
import { FeaturesSection } from "@/components/FeaturesSection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="flex-1">
        <HeroSection />

        {/* ─── Main Workspace ─── */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Workspace />
        </div>

        <EcommerceGuideSection />

        <FeaturesSection />
      </main>

      <Footer />
    </>
  );
}
