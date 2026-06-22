"use client";

import { useState } from "react";
import { useDraftStore } from "@/lib/store/draft";
import { formatINR } from "@/lib/filing/types";
import { FilingLayout } from "@/components/filing/FilingLayout";
import { ConfidencePanel } from "@/components/filing/ConfidencePanel";
import { EngineComputeFallback } from "@/components/filing/EngineComputeFallback";
import { OptimizationTips } from "@/components/filing/OptimizationTips";
import {
  Banner,
  Button,
  Card,
  RiskBadge,
  ScreenTitle,
} from "@/components/filing/ui";
import { PresubmitChecklist } from "@/components/filing/PresubmitChecklist";
import { useDraftTaxCompute } from "@/lib/hooks/useDraftTaxCompute";

export default function RiskReviewPage() {
  const { mismatchResolved, income, deductions, recommendedForm, regime } =
    useDraftStore();
  const [useSnapshot, setUseSnapshot] = useState(false);
  const {
    loading,
    error,
    isEstimated,
    engineUnavailable,
    result,
    lastSnapshot,
    confidence,
    userInput,
    compute,
  } = useDraftTaxCompute();

  const effectiveResult = result ?? (useSnapshot ? lastSnapshot : null);
  const totalIncome = income.grossSalary + income.fdInterest;
  const activeRegime =
    regime ?? effectiveResult?.regime_comparison.recommended_regime ?? "new";
  const selectedPay = effectiveResult?.regime_comparison
    ? effectiveResult.regime_comparison[activeRegime].net_payable
    : null;

  return (
    <FilingLayout
      mirrorText="This summary shows what the tax department is likely to question. Green means you're in good shape to file."
    >
      <ScreenTitle
        title="Risk & proof review"
        subtitle="Your filing summary before final checks — from your tax analysis."
      />

      {error && !engineUnavailable && (
        <Banner variant="warning">
          {error}
          {isEstimated ? " Figures below are estimates from your draft." : ""}
        </Banner>
      )}

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

      {loading ? (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 animate-pulse">
          <div className="h-4 w-40 rounded bg-slate-100" />
          <div className="mt-4 h-2 rounded-full bg-slate-100" />
        </div>
      ) : (
        <ConfidencePanel confidence={confidence} variant="full" className="mb-4" />
      )}

      {!loading && effectiveResult && (
        <OptimizationTips
          recommendations={effectiveResult.recommendations}
          netPayable={selectedPay}
          recommendedRegime={activeRegime}
          className="mb-4"
        />
      )}

      <Card>
        <p className="text-sm text-slate-700">
          <strong>Total income:</strong> {formatINR(totalIncome)}
        </p>
        <p className="text-sm text-slate-700 mt-1">
          <strong>Deductions:</strong> 80C {formatINR(deductions.section80C)} · 80D{" "}
          {formatINR(deductions.section80D)}
        </p>
        {selectedPay !== null && (
          <p className="text-sm text-slate-700 mt-1">
            <strong>Expected {selectedPay < 0 ? "refund" : "tax payable"}:</strong>{" "}
            <span className="tabular-nums">            {formatINR(Math.abs(selectedPay))}</span> (
            {activeRegime} regime)
          </p>
        )}
        {effectiveResult?.regime_comparison?.[activeRegime]?.late_filing_fee !== undefined &&
          effectiveResult.regime_comparison[activeRegime].late_filing_fee > 0 && (
            <p className="text-sm text-slate-700 mt-1">
              <strong>Late Filing Fee (Sec 234F):</strong>{" "}
              <span className="tabular-nums">{formatINR(effectiveResult.regime_comparison[activeRegime].late_filing_fee)}</span>
            </p>
          )}
        <p className="text-sm text-slate-700 mt-1">
          <strong>Mismatches:</strong> {mismatchResolved ? "2 resolved · 0 open" : "1 open"}
        </p>
        <p className="text-sm text-slate-700 mt-1 flex items-center gap-2">
          <strong>ITR form:</strong> {recommendedForm}
          <RiskBadge variant="green">Low risk</RiskBadge>
        </p>
      </Card>

      <PresubmitChecklist
        className="mt-8 pt-8 border-t border-slate-200"
        secondaryAction={
          <Button variant="ghost">Download proof checklist (PDF)</Button>
        }
      />
    </FilingLayout>
  );
}
