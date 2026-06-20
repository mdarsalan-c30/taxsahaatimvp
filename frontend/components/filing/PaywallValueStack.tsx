"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";
import {
  CheckCircle2,
  FileText,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { COMPANION_ITD_DISCLAIMER } from "@/lib/copy/companion";
import { CHECKOUT_PLANS, FILING_COMPANION } from "@/lib/copy/filing";
import type { PlanId } from "@/lib/filing/types";
import { PLANS } from "@/lib/payments/plans";
import { getDisplayPricing, formatPlanPriceLabel } from "@/lib/marketing/pricing";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface PaywallValueStackProps {
  regimeSavings: number;
  mismatchesResolved: number;
  companionStepCount: number;
  completenessScore: number;
  recommendedPlan: PlanId;
  missingDocCount?: number;
  className?: string;
}

interface ValueItem {
  icon: ReactNode;
  label: string;
  detail?: string;
  amount?: string;
  hidden?: boolean;
}

export function PaywallValueStack({
  regimeSavings,
  mismatchesResolved,
  companionStepCount,
  completenessScore,
  recommendedPlan,
  missingDocCount = 0,
  className,
}: PaywallValueStackProps) {
  const plan = PLANS[recommendedPlan];
  const displayPricing = getDisplayPricing(recommendedPlan);
  const filingReady = completenessScore >= 90 && missingDocCount === 0;

  const items: ValueItem[] = [
    {
      icon: <Scale className="size-4 text-blue-600" />,
      label: "Regime savings locked in",
      detail: `You save ${formatINR(regimeSavings)} vs the other regime`,
      amount: regimeSavings > 0 ? formatINR(regimeSavings) : undefined,
      hidden: regimeSavings <= 0,
    },
    {
      icon: <ShieldCheck className="size-4 text-blue-600" />,
      label: "Critical mismatches resolved",
      detail: `${mismatchesResolved} mismatch${mismatchesResolved > 1 ? "es" : ""} caught before the gov portal`,
      hidden: mismatchesResolved <= 0,
    },
    {
      icon: <FileText className="size-4 text-blue-600" />,
      label: "Personalized portal filing guide",
      detail: `${companionStepCount}-step incometax.gov.in walkthrough — you file and submit yourself`,
    },
    {
      icon: <Sparkles className="size-4 text-blue-600" />,
      label: "Filing confidence",
      detail: filingReady
        ? `${Math.round(completenessScore)}% filing-ready`
        : `${Math.round(completenessScore)}% complete · ${missingDocCount} doc${missingDocCount !== 1 ? "s" : ""} left`,
    },
  ].filter((item) => !item.hidden);

  const sectionRef = useRef<HTMLElement>(null);
  const impressionTracked = useRef(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || impressionTracked.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || impressionTracked.current) return;
        impressionTracked.current = true;
        trackEvent("value_stack_impression", {
          recommended_plan: recommendedPlan,
          completeness_score: completenessScore,
        });
        observer.disconnect();
      },
      { threshold: 0.5 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [completenessScore, recommendedPlan]);

  return (
    <section
      ref={sectionRef}
      className={cn(
        "mb-6 rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/80 to-white p-5",
        className
      )}
      aria-label="Your earned value before checkout"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
        What you&apos;ve already earned
      </p>
      <h2 className="mt-1 text-lg font-bold text-slate-900">
        {FILING_COMPANION.paywallHeadline}
      </h2>

      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.label} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
              {item.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                {item.amount && (
                  <span className="text-sm font-bold tabular-nums text-blue-700">
                    {item.amount}
                  </span>
                )}
              </div>
              {item.detail && (
                <p className="mt-0.5 text-sm text-slate-600">{item.detail}</p>
              )}
            </div>
            <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-600" />
          </li>
        ))}
      </ul>

      <div className="my-5 border-t border-slate-200" />

      <div className="rounded-xl border border-blue-200/60 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Your unlock
        </p>
        <p className="mt-1 text-base font-bold text-slate-900">
          {plan.name} ·{" "}
          <span className="tabular-nums text-blue-700">
            {displayPricing.showOffer && displayPricing.original !== undefined ? (
              <>
                {formatPlanPriceLabel(displayPricing.current)}{" "}
                <span className="text-slate-500 line-through">
                  {formatPlanPriceLabel(displayPricing.original)}
                </span>
              </>
            ) : (
              formatPlanPriceLabel(displayPricing.current)
            )}
          </span>
        </p>
        <p className="mt-1 text-sm text-slate-600">{plan.description}</p>
        <p className="mt-2 text-xs text-slate-500">
          {CHECKOUT_PLANS.planValueNote}
        </p>
        <p className="mt-2 text-xs text-slate-500">{COMPANION_ITD_DISCLAIMER}</p>
      </div>
    </section>
  );
}
