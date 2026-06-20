import Link from "next/link";
import { PlanCard } from "@/components/pricing/PlanCard";
import { CountdownOffer } from "@/components/marketing/CountdownOffer";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { PRICING_SECTION } from "@/lib/copy/marketing";
import { OFFER_HELPER_COPY } from "@/lib/marketing/offer";
import { getDisplayPricing, formatPlanPriceLabel } from "@/lib/marketing/pricing";
import { ASSESSMENT_YEAR, PRICING_PLANS } from "@/lib/constants";
import { CONTENT_MAX, TYPOGRAPHY_SCALE } from "@/lib/design/layout";
import { cn } from "@/lib/utils";

export function PricingSection() {
  const aiSmartPricing = getDisplayPricing("ai_smart");

  return (
    <section
      id="pricing"
      className="section-shell overflow-hidden border-y border-border/60 bg-muted/20 px-4 sm:px-6 lg:px-8"
    >
      <div className={`mx-auto w-full min-w-0 ${CONTENT_MAX}`}>
        <ScrollReveal className="text-center" delay={1}>
          <p
            className={cn(
              "text-primary font-semibold uppercase tracking-[0.16em]",
              TYPOGRAPHY_SCALE.caption
            )}
          >
            {PRICING_SECTION.eyebrow}
          </p>
          <h2 className={cn("mt-3 font-semibold text-foreground", TYPOGRAPHY_SCALE.headline)}>
            {PRICING_SECTION.headline}
          </h2>
          <p className={cn("mx-auto mt-3 max-w-2xl text-muted-foreground", TYPOGRAPHY_SCALE.body)}>
            {PRICING_SECTION.subhead} · {ASSESSMENT_YEAR}
          </p>
        </ScrollReveal>

        <ScrollReveal className="mt-4 flex justify-center" delay={2}>
          <CountdownOffer />
        </ScrollReveal>

        <ScrollReveal
          className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-full border border-border/70 bg-white/80 px-4 py-2.5 shadow-sm"
          delay={2}
        >
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            AI Smart launch
          </span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/40" aria-hidden />
          <span className="text-sm font-medium text-foreground">
            {aiSmartPricing.showOffer && aiSmartPricing.original !== undefined ? (
              <>
                {formatPlanPriceLabel(aiSmartPricing.current)}{" "}
                <span className="text-muted-foreground line-through">
                  {formatPlanPriceLabel(aiSmartPricing.original)}
                </span>
              </>
            ) : (
              <>AI Smart {formatPlanPriceLabel(aiSmartPricing.current)}</>
            )}
          </span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/40" aria-hidden />
          <span className="text-sm font-medium text-foreground">Secure Razorpay checkout</span>
        </ScrollReveal>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {PRICING_PLANS.map((plan) => (
            <ScrollReveal key={plan.id} delay={3}>
              <PlanCard
                plan={plan}
                variant="marketing"
                href={
                  plan.id === "free"
                    ? "/file/onboarding/eligibility?step=about-you"
                    : `/file/checkout/plans?plan=${plan.id}`
                }
                ctaLabel={plan.id === "free" ? "Start free" : "Choose plan"}
              />
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal
          className="text-tier-legal mx-auto mt-6 max-w-3xl space-y-2 text-center"
          delay={4}
        >
          <p>{OFFER_HELPER_COPY}</p>
          <p>{PRICING_SECTION.helperLine}</p>
          <p className="flex flex-wrap items-center justify-center gap-3">
            <span>Prices shown in Indian Rupees (₹), inclusive unless noted at checkout.</span>
            <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:inline-block" aria-hidden />
            <Link href="/refund-policy" className="font-medium text-primary hover:underline">
              See refund policy
            </Link>
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
