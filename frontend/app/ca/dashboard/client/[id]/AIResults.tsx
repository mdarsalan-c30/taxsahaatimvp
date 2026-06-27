"use client";

import type { ComputeResponse } from "@/lib/engine/types";
import { CheckCircle2, TrendingUp, ShieldAlert, Sparkles, AlertTriangle } from "lucide-react";

export function AIResults({ response }: { response: ComputeResponse }) {
  const result = response.result;
  
  if (!result) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-xl">
        <h3 className="font-bold flex items-center gap-2"><AlertTriangle className="size-5" /> Engine Failed</h3>
        <p className="text-sm mt-1">{response.error || "No result returned from engine."}</p>
      </div>
    );
  }

  const { regime_comparison, recommendations, confidence, income_heads } = result;

  return (
    <div className="space-y-6">
      
      {/* Overview Metric */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="size-16 text-emerald-600" />
          </div>
          <p className="text-emerald-800 font-semibold text-sm mb-1 z-10">AI Found Tax Savings</p>
          <h2 className="text-3xl font-black text-emerald-600 z-10">
            ₹{regime_comparison.tax_saving.toLocaleString("en-IN")}
          </h2>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex flex-col justify-center">
          <p className="text-blue-800 font-semibold text-sm mb-1">Recommended Regime</p>
          <h2 className="text-2xl font-bold text-blue-900 capitalize">
            {regime_comparison.recommended_regime} Tax Regime
          </h2>
        </div>
      </div>

      {/* Regime Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-5 rounded-xl border-2 transition-all ${regime_comparison.recommended_regime === "old" ? "border-blue-500 bg-white shadow-md" : "border-slate-200 bg-slate-50 opacity-70"}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-slate-800">Old Regime</h3>
            {regime_comparison.recommended_regime === "old" && (
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                <CheckCircle2 className="size-3" /> BEST
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mb-1">Total Tax Payable</p>
          <p className="text-2xl font-black text-slate-900 mb-4">₹{regime_comparison.old.net_payable.toLocaleString("en-IN")}</p>
        </div>
        
        <div className={`p-5 rounded-xl border-2 transition-all ${regime_comparison.recommended_regime === "new" ? "border-blue-500 bg-white shadow-md" : "border-slate-200 bg-slate-50 opacity-70"}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-slate-800">New Regime</h3>
            {regime_comparison.recommended_regime === "new" && (
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                <CheckCircle2 className="size-3" /> BEST
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mb-1">Total Tax Payable</p>
          <p className="text-2xl font-black text-slate-900 mb-4">₹{regime_comparison.new.net_payable.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* AI Recommendations */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
          <Sparkles className="size-5 text-purple-600" />
          AI Optimizations & Loopholes
        </h3>
        
        {recommendations.length === 0 ? (
          <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-lg">No additional loopholes found for this scenario.</p>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-4 rounded-xl border border-purple-100 bg-purple-50 flex items-start gap-3">
                <div className="mt-0.5">
                  <ShieldAlert className={`size-5 ${rec.risk === "green" ? "text-emerald-500" : rec.risk === "yellow" ? "text-amber-500" : "text-red-500"}`} />
                </div>
                <div>
                  <h4 className="font-semibold text-purple-900">{rec.plain_english}</h4>
                  <p className="text-xs text-purple-700 mt-1">Section: {rec.gov_section} • Est Benefit: ₹{rec.estimated_benefit.toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
