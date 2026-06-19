import type { Metadata } from "next";
import { CompanionModeCallout } from "@/components/marketing/CompanionModeCallout";
import { ExpandedFaq } from "@/components/marketing/ExpandedFaq";
import { FinalCta } from "@/components/marketing/FinalCta";
import { IndianUseCases } from "@/components/marketing/IndianUseCases";
import { LandingItrQuizSection } from "@/components/marketing/LandingItrQuizSection";
import { LandingJsonLd } from "@/components/marketing/LandingJsonLd";
import { LandingPainStepsSection } from "@/components/marketing/LandingPainStepsSection";
import { LandingWhyAiBand } from "@/components/marketing/LandingWhyAiBand";
import { OfferPill } from "@/components/marketing/OfferPill";
import { PopularGuides } from "@/components/marketing/PopularGuides";
import { PricingSection } from "@/components/marketing/PricingSection";
import { QuickStart } from "@/components/marketing/QuickStart";
import { RegimeCompareCard } from "@/components/marketing/RegimeCompareCard";
import { ReviewsCarousel } from "@/components/marketing/ReviewsCarousel";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SocialProofBar } from "@/components/marketing/SocialProofBar";
import { HeroParallax } from "@/components/motion/HeroParallax";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import {
  HERO_EMOTIONAL_HOOK,
  HERO_HEADLINE,
  HERO_HEADLINE_ACCENT,
} from "@/lib/copy/marketing";
import { TYPOGRAPHY_SCALE } from "@/lib/design/layout";
import { SITE_TAGLINE } from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";

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
        <ScrollReveal delay={0}>
          <section className="hero-mesh relative overflow-hidden border-b border-border/40 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-6xl min-w-0 py-6 lg:py-8">
              <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-8">
                <div className="min-w-0 text-center lg:text-left">
                  <div className="landing-reveal landing-reveal-delay-1">
                    <OfferPill />
                  </div>
                  <h1
                    className={`landing-reveal landing-reveal-delay-1 mt-2 font-heading font-semibold text-foreground sm:mt-3 ${TYPOGRAPHY_SCALE.display}`}
                  >
                    {HERO_HEADLINE}
                    <br />
                    <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                      {HERO_HEADLINE_ACCENT}
                    </span>
                  </h1>
                  <p
                    className={`landing-reveal landing-reveal-delay-2 mx-auto mt-2 max-w-xl text-muted-foreground lg:mx-0 ${TYPOGRAPHY_SCALE.body} leading-normal sm:mt-3`}
                  >
                    {HERO_EMOTIONAL_HOOK}
                  </p>
                  <div className="landing-reveal landing-reveal-delay-3 mx-auto mt-4 max-w-xl lg:mx-0">
                    <CompanionModeCallout variant="cta-only" />
                  </div>
                </div>

                <HeroParallax className="landing-reveal landing-reveal-delay-2 relative min-w-0">
                  <RegimeCompareCard className="relative w-full" compact />
                </HeroParallax>
              </div>

              <div className="landing-reveal landing-reveal-delay-4 mt-6 w-full border-t border-border/40 pt-4">
                <SocialProofBar
                  trustVariant="hero"
                  showBetaBadge={false}
                  showCheckoutNote={false}
                  className="mx-auto max-w-4xl"
                />
              </div>
            </div>
          </section>
        </ScrollReveal>

        <LandingPainStepsSection />
        <LandingItrQuizSection />
        <ReviewsCarousel />
        <LandingWhyAiBand />
        <IndianUseCases />
        <QuickStart />
        <PopularGuides />
        <ExpandedFaq />
        <PricingSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
