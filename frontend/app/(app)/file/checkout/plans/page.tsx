"use client";

import { Suspense, useEffect, useState } from "react";
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
  Card,
} from "@/components/filing/ui";
import { usePaymentSession } from "@/lib/hooks/usePaymentSession";
import { getBrowserSessionId } from "@/lib/store/sessionInit";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { triggerConfetti } from "@/components/filing/Confetti";

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
    setPaymentVerified,
  } = useDraftStore();
  const { refresh: refreshPaymentSession } = usePaymentSession();

  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError(null);
    setCouponSuccess(null);
    try {
      const sessionId = getBrowserSessionId();
      const res = await fetch("/api/coupons/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), planId: plan, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to apply coupon");
      }
      if (data.unlocked) {
        setCouponSuccess("Coupon applied successfully! Unlocking guide...");
        setPaymentVerified(plan);
        await refreshPaymentSession();
        triggerConfetti();
        setTimeout(() => {
          router.push("/file/companion?unlocked=1");
        }, 1500);
      } else {
        setCouponError("Coupon applied but did not unlock filing companion.");
      }
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : "Invalid coupon code");
    } finally {
      setApplyingCoupon(false);
    }
  };
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
            You&apos;re {Math.round(gate.completenessScore)}% ready to checkout.{" "}
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => router.push(gate.blockingHref)}
            >
              {gate.blockingLabel}
            </button>{" "}
            to unlock payment.
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

      <div className="filing-card-grid mb-4">
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

      <Card className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Have a coupon code?</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            className="flex-1 min-h-11 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary uppercase font-mono bg-white text-slate-800"
            disabled={applyingCoupon}
          />
          <Button
            variant="secondary"
            className="min-h-11 px-4 text-xs font-semibold shrink-0"
            onClick={handleApplyCoupon}
            disabled={applyingCoupon}
          >
            {applyingCoupon ? "Applying..." : "Apply Coupon"}
          </Button>
        </div>
        {couponError && <p className="text-xs text-red-600 mt-1">{couponError}</p>}
        {couponSuccess && <p className="text-xs text-green-600 mt-1">{couponSuccess}</p>}
      </Card>

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
