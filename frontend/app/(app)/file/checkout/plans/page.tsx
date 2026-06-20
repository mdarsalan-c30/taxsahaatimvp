"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { useDraftStore } from "@/lib/store/draft";
import { PLAN_LIST, PLANS } from "@/lib/payments/plans";
import { FilingLayout } from "@/components/filing/FilingLayout";
import { PaywallValueStack } from "@/components/filing/PaywallValueStack";
import { PlanCard } from "@/components/pricing/PlanCard";
import { useDraftTaxCompute } from "@/lib/hooks/useDraftTaxCompute";
import {
  CHECKOUT_PLANS,
  FILING_COMPANION,
} from "@/lib/copy/filing";
import { CA_REVIEW_COMING_SOON } from "@/lib/copy/trust";
import { companionStepCountForForm } from "@/lib/filing/confidence";
import { resolveCheckoutGate } from "@/lib/filing/checkoutGate";
import { recommendPlanFromConfidence } from "@/lib/filing/planRecommendation";
import {
  Banner,
  Button,
  FilingActions,
  ScreenTitle,
} from "@/components/filing/ui";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function PlansPage() {
  return (
    <Suspense fallback={<div className="p-12 text-slate-600">Loading…</div>}>
      <PlansContent />
    </Suspense>
  );
}

function PlansContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    plan,
    setPlan,
    recommendedForm,
    mismatchResolved,
    mismatchProceedWithExplanation,
  } = useDraftStore();
  const { loading, confidence, regimeSavings, engineUnavailable } =
    useDraftTaxCompute();

  const gate = resolveCheckoutGate({
    mismatchResolved,
    mismatchProceedWithExplanation,
    confidence,
    engineUnavailable,
    loading,
  });

  const mismatchesResolved =
    mismatchResolved || mismatchProceedWithExplanation ? 2 : 0;
  const companionSteps = companionStepCountForForm(recommendedForm);
  const recommendedPlan = recommendPlanFromConfidence(confidence);
  const companionRedirect = searchParams.get("reason") === "companion";
  const selectedPlan = PLANS[plan];
  const checkoutBlocked = selectedPlan.comingSoon === true;

  useEffect(() => {
    if (plan === "ca") {
      setPlan(recommendedPlan === "ca" ? "ai_smart" : recommendedPlan);
    }
  }, [plan, recommendedPlan, setPlan]);

  useEffect(() => {
    trackEvent("paywall_view", {
      filing_ready: gate.canCheckout,
      recommended_plan: recommendedPlan,
    });
  }, [gate.canCheckout, recommendedPlan]);

  useEffect(() => {
    if (!loading && gate.canCheckout) {
      setPlan(recommendedPlan);
    }
  }, [loading, gate.canCheckout, recommendedPlan, setPlan]);

  const handlePlanSelect = (planId: typeof plan) => {
    if (!gate.canCheckout || PLANS[planId].comingSoon) return;
    setPlan(planId);
    trackEvent("plan_select", { plan_id: planId });
  };

  const paidPlans = PLAN_LIST.filter((p) => p.id !== "free");

  return (
    <FilingLayout
      mirrorText="Plans unlock the step-by-step portal guide — you still file yourself on incometax.gov.in. No government submission from us."
    >
      <ScreenTitle title={CHECKOUT_PLANS.title} subtitle={CHECKOUT_PLANS.subtitle} />

      {companionRedirect && (
        <Banner variant="info">
          Unlock the portal filing guide by choosing a plan below. {CA_REVIEW_COMING_SOON}{" "}
          DIY and AI Smart are available now.
        </Banner>
      )}

      <PaywallValueStack
        regimeSavings={regimeSavings}
        mismatchesResolved={mismatchesResolved}
        companionStepCount={companionSteps}
        completenessScore={confidence.completeness_score}
        missingDocCount={confidence.missing_documents.length}
        recommendedPlan={recommendedPlan}
      />

      {!loading && !gate.canCheckout && (
        <div className="mb-4">
          <Banner variant="info">
            {CHECKOUT_PLANS.progressBlocker}{" "}
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => router.push(gate.blockingHref)}
            >
              {gate.blockingLabel}
            </button>
          </Banner>
        </div>
      )}

      {!loading && gate.engineOverride && (
        <div className="mb-4">
          <Banner variant="info">
            Tax calculation is temporarily unavailable, but you can still checkout.
            Your filing guide will use saved draft figures — double-check amounts
            before filing on the portal.
          </Banner>
        </div>
      )}

      <div className="filing-workspace-card-grid mb-4">
        {paidPlans.map((p) => (
          <PlanCard
            key={p.id}
            plan={p}
            variant="checkout"
            selected={plan === p.id}
            engineRecommended={recommendedPlan === p.id}
            disabled={!gate.canCheckout}
            onSelect={() => handlePlanSelect(p.id)}
          />
        ))}
      </div>

      <p className="text-xs text-slate-500 mb-6">
        Who this plan is for: resident salaried · {recommendedForm} · no capital gains
      </p>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white px-4">
        <Accordion defaultValue={[]} multiple>
          <AccordionItem value="portal-guide-coverage" className="border-b-0">
            <AccordionTrigger>
              What&apos;s included in portal guide
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <span className="font-semibold text-slate-900">ITR-1:</span> Salary,
                  deductions, taxes paid, preview and submit flow.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">ITR-2:</span> Salary
                  (if applicable), capital gains, other income, Part D tax checks.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">ITR-3:</span> Business
                  schedules, salary mix, deductions, Part D tax verification.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">ITR-4:</span>{" "}
                  Presumptive 44AD/44ADA path, salary mix, deductions and taxes paid.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <FilingActions
        hint={
          <p className="text-tier-feature">
            <strong>What happens next:</strong> {CHECKOUT_PLANS.nextStep}
          </p>
        }
      >
        <Button
          href={gate.canCheckout && !checkoutBlocked ? "/file/checkout/payment" : undefined}
          disabled={!gate.canCheckout || checkoutBlocked}
          className="w-full sm:w-auto"
        >
          {FILING_COMPANION.paywallHeadline}
        </Button>
      </FilingActions>
    </FilingLayout>
  );
}
