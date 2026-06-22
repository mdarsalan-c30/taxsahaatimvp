"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDraftStore } from "@/lib/store/draft";
import { getPlan } from "@/lib/payments/plans";
import { getEffectivePrice, getDisplayPricing, formatPlanPriceLabel } from "@/lib/marketing/pricing";
import { FilingLayout } from "@/components/filing/FilingLayout";
import { EngineComputeFallback } from "@/components/filing/EngineComputeFallback";
import RazorpayButton from "@/components/filing/checkout/RazorpayButton";
import { usePaymentSession } from "@/lib/hooks/usePaymentSession";
import { useDraftTaxCompute } from "@/lib/hooks/useDraftTaxCompute";
import { CHECKOUT_PAYMENT, FILING_COMPANION } from "@/lib/copy/filing";
import { PAYMENT_COPY } from "@/lib/copy/marketing";
import { formatINR } from "@/lib/format";
import {
  Banner,
  Card,
  FilingActions,
  ScreenTitle,
  Button,
} from "@/components/filing/ui";
import { getBrowserSessionId } from "@/lib/store/sessionInit";
import { triggerConfetti } from "@/components/filing/Confetti";

export default function PaymentPage() {
  const router = useRouter();
  const { plan, regime, setPaymentVerified } = useDraftStore();
  const { refresh: refreshPaymentSession } = usePaymentSession();
  const [useSnapshot, setUseSnapshot] = useState(false);
  const {
    loading,
    error,
    engineUnavailable,
    result,
    lastSnapshot,
    userInput,
    compute,
  } = useDraftTaxCompute();
  const selectedPlan = getPlan(plan);
  const effectivePrice = getEffectivePrice(plan);
  const displayPricing = getDisplayPricing(plan);
  const [paymentError, setPaymentError] = useState<string | null>(null);

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

  const effectiveResult = result ?? (useSnapshot ? lastSnapshot : null);
  const rc = effectiveResult?.regime_comparison;
  const activeRegime = regime ?? rc?.recommended_regime ?? "new";
  const netPayable = rc ? rc[activeRegime].net_payable : null;
  const refundAmount =
    netPayable !== null && netPayable < 0 ? Math.abs(netPayable) : 0;
  const taxDue = netPayable !== null && netPayable > 0 ? netPayable : 0;

  return (
    <FilingLayout
      mirrorText="You're paying for the step-by-step portal guide — not government filing. Refund and tax-due figures are estimates based on what you've entered so far."
    >
      <ScreenTitle
        title={CHECKOUT_PAYMENT.title}
        subtitle={CHECKOUT_PAYMENT.subtitle}
      />

      <EngineComputeFallback
        loading={loading}
        error={error}
        engineUnavailable={engineUnavailable}
        lastSnapshot={lastSnapshot}
        onRetry={() => {
          setUseSnapshot(false);
          void compute(userInput);
        }}
        onContinueWithSnapshot={() => setUseSnapshot(true)}
      />

      <Card recommended>
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 w-3/4 rounded bg-slate-100" />
            <div className="h-4 w-1/2 rounded bg-slate-100" />
            <div className="h-4 w-2/3 rounded bg-slate-100" />
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-700">
              <strong>Estimated refund (if ITD accepts your return):</strong>{" "}
              <span className="tabular-nums">{formatINR(refundAmount)}</span>
            </p>
            <p className="text-sm text-slate-700 mt-1">
              <strong>Tax due before filing:</strong>{" "}
              <span className="tabular-nums">{formatINR(taxDue)}</span>
            </p>
            {effectiveResult?.regime_comparison?.[activeRegime]?.late_filing_fee !== undefined &&
              effectiveResult.regime_comparison[activeRegime].late_filing_fee > 0 && (
                <p className="text-sm text-slate-700 mt-1">
                  <strong>Late Filing Fee (Sec 234F):</strong>{" "}
                  <span className="tabular-nums">{formatINR(effectiveResult.regime_comparison[activeRegime].late_filing_fee)}</span>
                </p>
              )}
            {netPayable !== null && (
              <p className="text-xs text-slate-500 mt-2">
                Based on your {activeRegime} regime selection. Final amount
                confirmed only after ITD processes your return.
              </p>
            )}
            {netPayable === null && error && (
              <p className="text-xs text-amber-700 mt-2">
                Tax estimate unavailable — figures shown as ₹0 until your draft
                is recalculated.
              </p>
            )}
          </>
        )}
        <p className="text-sm text-slate-700 mt-3">
          <strong>Plan:</strong> {selectedPlan.name} ·{" "}
          <span className="tabular-nums">
            {displayPricing.showOffer && displayPricing.original !== undefined ? (
              <>
                {formatPlanPriceLabel(effectivePrice)}{" "}
                <span className="text-slate-500 line-through">
                  {formatPlanPriceLabel(displayPricing.original)}
                </span>
              </>
            ) : (
              formatPlanPriceLabel(effectivePrice)
            )}
          </span>
        </p>
      </Card>

      <Card className="mt-4">
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

      <Banner variant="info">
        Refunds go to your pre-validated bank account only after ITD processes your return.
      </Banner>

      <Banner variant="info">
        {FILING_COMPANION.paywallHeadline} — copy each value into incometax.gov.in yourself.
        We never auto-submit to the Income Tax Department. Independently operated — not
        affiliated with ITD.
      </Banner>

      {paymentError && (
        <Banner variant="critical">{paymentError}</Banner>
      )}

      <p className="text-xs text-slate-500">
        By paying you agree to our{" "}
        <Link href="/terms" className="text-primary underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/refund-policy" className="text-primary underline">
          Refund Policy
        </Link>
        . This unlocks your portal filing guide — you file and e-verify on incometax.gov.in
        yourself.
      </p>

      <FilingActions
        hint={
          <p className="text-tier-legal">
            {PAYMENT_COPY.secureLine} · {PAYMENT_COPY.portalLine}
          </p>
        }
      >
        <RazorpayButton
          planId={plan}
          onSuccess={async () => {
            setPaymentVerified(plan);
            await refreshPaymentSession();
            router.push("/file/companion?unlocked=1");
          }}
          onError={setPaymentError}
          className="min-h-11 w-full md:w-auto"
        />
      </FilingActions>
    </FilingLayout>
  );
}
