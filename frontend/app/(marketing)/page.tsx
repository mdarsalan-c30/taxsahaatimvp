import type { Metadata } from "next";
import Link from "next/link";
import { LandingJsonLd } from "@/components/marketing/LandingJsonLd";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { ExpandedFaq } from "@/components/marketing/ExpandedFaq";
import { FinalCta } from "@/components/marketing/FinalCta";
import { PricingSection } from "@/components/marketing/PricingSection";
import { QuickStart } from "@/components/marketing/QuickStart";
import { WhyUsSection } from "@/components/marketing/WhyUsSection";
import { HeroSection } from "@/components/marketing/HeroSection";
import { ReviewsCarousel } from "@/components/marketing/ReviewsCarousel";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { pageMetadata } from "@/lib/seo";
import { SITE_TAGLINE } from "@/lib/constants";

export const metadata: Metadata = pageMetadata({
  title: "File ITR before the deadline",
  description: SITE_TAGLINE,
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <LandingJsonLd />
      <SiteHeader />
      <main>
        {/* ─── HERO ───────────────────────────────── */}
        <HeroSection />

        <HowItWorks />
        <QuickStart />
        <WhyUsSection />
        <ReviewsCarousel />
        <PricingSection />
        <FinalCta />
        <ExpandedFaq maxItems={5} />
      </main>
      <SiteFooter />
    </>
  );
}
