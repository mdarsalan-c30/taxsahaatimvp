"use client";

import { useMemo } from "react";
import { Lightbulb, ShieldCheck, TrendingUp } from "lucide-react";
import type { Recommendation, TaxRegime } from "@/lib/engine/types";
import { selectOptimizationTips } from "@/lib/filing/optimizationTips";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface OptimizationTipsProps {
  recommendations: Recommendation[];
  /** Net payable for the selected/recommended regime. Negative means a refund. */
  netPayable: number | null;
  recommendedRegime: TaxRegime;
  /** Max tips to show. */
  limit?: number;
  className?: string;
}

/**
 * Companion-style header: surfaces the engine's already-computed lawful
 * optimisation recommendations (estimated refund + top lawful tips).
 *
 * Regime comparison tips always surface. Chapter VI-A tips are only shown for
 * the old regime, since new-regime filers cannot claim most deductions.
 */
export function OptimizationTips({
  recommendations,
  netPayable,
  recommendedRegime,
  limit = 3,
  className,
}: OptimizationTipsProps) {
  const tips = useMemo(
    () => selectOptimizationTips(recommendations, recommendedRegime, limit),
    [recommendations, recommendedRegime, limit]
  );

  const isRefund = netPayable !== null && netPayable < 0;
  const headlineAmount = netPayable !== null ? Math.abs(netPayable) : null;
  const potentialSaving = tips.reduce((sum, t) => sum + t.estimated_benefit, 0);

  if (headlineAmount === null && tips.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-blue-200/70 bg-blue-50/40 p-4",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 shrink-0 text-blue-700" aria-hidden />
          <strong className="text-sm text-slate-900">Your Smart Tax Summary</strong>
        </div>
        {headlineAmount !== null && (
          <p className="text-sm text-slate-700">
            {isRefund ? "Estimated refund" : "Estimated tax payable"}:{" "}
            <strong className="tabular-nums text-slate-900">
              {formatINR(headlineAmount)}
            </strong>
          </p>
        )}
      </div>

      {headlineAmount !== null && (
        <p className="mt-1 text-xs text-slate-500">
          Estimate from your draft — final figure depends on what ITD accepts.
        </p>
      )}

      {tips.length > 0 && (
        <>
          <div className="mt-3 flex items-center gap-1.5">
            <Lightbulb className="size-3.5 shrink-0 text-amber-600" aria-hidden />
            <p className="text-xs font-semibold text-slate-700">
              💡 Your Personal Tax Savings Plan
              {potentialSaving > 0 && (
                <span className="ml-1 font-normal text-emerald-700">
                  (Save up to {formatINR(potentialSaving)} more)
                </span>
              )}
            </p>
          </div>
          <ul className="mt-2 space-y-2">
            {tips.map((tip) => (
              <li
                key={tip.id}
                className="rounded-lg border border-slate-100 bg-white px-3 py-2.5 text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-slate-700">{tip.plain_english}</p>
                  {tip.estimated_benefit > 0 && (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-emerald-700">
                      ~{formatINR(tip.estimated_benefit)}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">
                    {tip.gov_section}
                  </span>
                  {tip.proof_required.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="size-3" aria-hidden />
                      Proof: {tip.proof_required.join(", ")}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-500">
            We only suggest 100% legal deductions. Please ensure you have the receipts or
            proof to back them up!
          </p>
        </>
      )}
    </div>
  );
}
