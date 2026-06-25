"use client";

import Link from "next/link";
import { PlanCard } from "@/components/pricing/PlanCard";
import { CountdownOffer } from "@/components/marketing/CountdownOffer";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { PRICING_SECTION } from "@/lib/copy/marketing";
import { OFFER_HELPER_COPY } from "@/lib/marketing/offer";
import { ASSESSMENT_YEAR, PRICING_PLANS } from "@/lib/constants";

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="section-pad-lg px-4 sm:px-6 lg:px-8"
      style={{ background: "#F3F4F7" }}
    >
      <div className="mx-auto w-full max-w-[1180px]">
        {/* Header */}
        <ScrollReveal className="text-center mb-10" delay={1}>
          <span className="eyebrow-label">{PRICING_SECTION.eyebrow}</span>
          <h2 className="font-manrope mt-3.5 text-[clamp(26px,3vw,36px)] font-bold tracking-[-0.02em] text-[#0B1220] leading-[1.15]">
            {PRICING_SECTION.headline}
          </h2>
          <p className="mt-3.5 text-[16px] text-[#6B7280] leading-relaxed max-w-[600px] mx-auto">
            {PRICING_SECTION.subhead} · {ASSESSMENT_YEAR}
          </p>
        </ScrollReveal>

        {/* Countdown timer */}
        <ScrollReveal className="flex justify-center mb-10" delay={2}>
          <CountdownOffer />
        </ScrollReveal>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-4">
          {PRICING_PLANS.map((plan, i) => (
            <ScrollReveal key={plan.id} delay={3}>
              <div className={`relative flex h-full flex-col rounded-[16px] p-7 transition-all duration-300 hover:-translate-y-1 ${
                plan.id === "ai_smart"
                  ? "border-[1.5px] border-[#0e5f63] bg-gradient-to-b from-[#F5F8FF] to-white shadow-[0_24px_48px_-24px_rgba(11,18,32,.18)]"
                  : "border-[1.5px] border-[#E6E8EC] bg-white hover:shadow-[0_24px_48px_-24px_rgba(11,18,32,.18)]"
              }`}>
                {/* Popular badge */}
                {plan.id === "ai_smart" && (
                  <span
                    className="absolute -top-3 right-5 rounded-full px-3 py-1 text-[11px] font-bold text-white"
                    style={{ background: "#0e5f63" }}
                  >
                    Popular
                  </span>
                )}
                {/* Coming soon badge */}
                {plan.id === "ca" && (
                  <span
                    className="mb-3 inline-block w-fit rounded-[6px] px-2 py-0.5 text-[10.5px] font-bold"
                    style={{ background: "#FFF7E6", color: "#92670F" }}
                  >
                    Coming soon
                  </span>
                )}

                <PlanCard
                  plan={plan}
                  variant="marketing"
                  href={
                    plan.id === "free"
                      ? "/file/onboarding/eligibility?step=about-you"
                      : `/file/checkout/plans?plan=${plan.id}`
                  }
                  ctaLabel={
                    plan.id === "free"
                      ? "Start free"
                      : plan.id === "ca"
                      ? "Join waitlist"
                      : "Choose plan"
                  }
                />
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Footer note */}
        <ScrollReveal className="mt-10 text-center text-[12.5px] text-[#6B7280] leading-[1.7] space-y-1" delay={4}>
          <p>{OFFER_HELPER_COPY}</p>
          <p>{PRICING_SECTION.helperLine}</p>
          <p className="flex flex-wrap items-center justify-center gap-3">
            <span>Prices shown in Indian Rupees (₹), inclusive unless noted at checkout.</span>
            <Link href="/refund-policy" className="font-medium text-[#0e5f63] hover:underline">
              See refund policy
            </Link>
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
