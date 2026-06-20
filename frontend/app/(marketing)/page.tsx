import type { Metadata } from "next";
import {
  FilingJourneySection,
  FilingPrepHooksSection,
  ScenarioHooksSection,
} from "@/components/marketing/EngagementHooksSections";
import { CompanionModeCallout } from "@/components/marketing/CompanionModeCallout";
import { HeroCharacterIllustration } from "@/components/marketing/HeroCharacterIllustration";
import { LandingJsonLd } from "@/components/marketing/LandingJsonLd";
import { OfferPill } from "@/components/marketing/OfferPill";
import { PainPointSection } from "@/components/marketing/PainPointSection";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { AiCaChecksSection } from "@/components/marketing/AiCaChecksSection";
import { PortalCompanionSection } from "@/components/marketing/PortalCompanionSection";
import { IndianUseCases } from "@/components/marketing/IndianUseCases";
import { ProofDeductionSection } from "@/components/marketing/ProofDeductionSection";
import { ExpandedFaq } from "@/components/marketing/ExpandedFaq";
import { FinalCta } from "@/components/marketing/FinalCta";
import { PricingSection } from "@/components/marketing/PricingSection";
import { QuickStart } from "@/components/marketing/QuickStart";
import { WhyUsSection } from "@/components/marketing/WhyUsSection";
import { RegimeCompareCard } from "@/components/marketing/RegimeCompareCard";
import { ReviewsCarousel } from "@/components/marketing/ReviewsCarousel";
import { PopularGuides } from "@/components/marketing/PopularGuides";
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
import { ASSESSMENT_YEAR, FINANCIAL_YEAR, SITE_TAGLINE } from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";
import { Clock } from "lucide-react";

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
      <main className="min-w-0 w-full overflow-x-clip">
        <ScrollReveal delay={0}>
          <section className="hero-mesh relative overflow-hidden border-b border-border/40 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-6xl min-w-0 py-4 sm:py-5 lg:py-6">
              <div className="grid w-full min-w-0 grid-cols-1 items-start gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10">
                <div className="min-w-0 w-full text-center lg:text-left">
                  <div className="landing-reveal inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-3 py-1 text-xs font-medium text-primary shadow-sm backdrop-blur-sm sm:text-sm">
                    <Clock className="size-3.5" />
                    {ASSESSMENT_YEAR} · {FINANCIAL_YEAR}
                  </div>
                  <div className="landing-reveal landing-reveal-delay-1 mt-3">
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
                    <CompanionModeCallout />
                  </div>
                  <div className="landing-reveal landing-reveal-delay-4 mt-3 w-full">
                    <SocialProofBar
                      trustVariant="hero"
                      showBetaBadge={false}
                      showCheckoutNote={false}
                      className="w-full"
                    />
                  </div>
                </div>

                <HeroParallax className="landing-reveal landing-reveal-delay-2 relative min-w-0 w-full">
                  <div className="mx-auto flex w-full min-w-0 max-w-xl flex-col gap-3 lg:max-w-none">
                    <RegimeCompareCard className="relative w-full" />
                    <HeroCharacterIllustration />
                  </div>
                </HeroParallax>
              </div>
            </div>
          </section>
        </ScrollReveal>

        <PainPointSection />
        <HowItWorks />
        <WhyUsSection />
        <AiCaChecksSection />
        <FilingPrepHooksSection />
        <ScenarioHooksSection />
        <PortalCompanionSection />
        <IndianUseCases />
        <FilingJourneySection />
        <ProofDeductionSection />
        <ExpandedFaq />
        <FinalCta />

        <ScrollReveal delay={1}>
          <QuickStart />
        </ScrollReveal>

        <ScrollReveal delay={2}>
          <PopularGuides />
        </ScrollReveal>

        <ScrollReveal delay={3}>
          <ReviewsCarousel />
        </ScrollReveal>

        <ScrollReveal delay={4}>
          <PricingSection />
        </ScrollReveal>
      </main>
      <SiteFooter />
    </>
  );
}
