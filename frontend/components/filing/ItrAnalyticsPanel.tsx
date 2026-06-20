"use client";

import { Fragment, useMemo } from "react";
import { formatINR } from "@/lib/filing/types";
import {
  buildAnalyticsRows,
  sectionSubtotals,
} from "@/lib/itr/buildAnalyticsRows";
import type { ItrSummaryPayload } from "@/lib/itr/summaryTypes";
import type {
  DeductionDraft,
  FieldConfidence,
  IncomeDraft,
  LastParseResult,
} from "@/lib/store/draft";
import { AlertCircle, CheckCircle2, Info, Sparkles } from "lucide-react";

const CONFIDENCE_CHIP: Record<
  FieldConfidence,
  { label: string; className: string }
> = {
  high: { label: "Verified", className: "bg-emerald-50 text-emerald-700" },
  review: { label: "Review", className: "bg-amber-50 text-amber-800" },
  missing: { label: "Missing", className: "bg-zinc-100 text-zinc-600" },
};

export interface ItrAnalyticsPanelProps {
  income: IncomeDraft;
  deductions: DeductionDraft;
  lastParseResult: LastParseResult | null;
  connectedConnectors: string[];
  aiSummary: ItrSummaryPayload | null;
  aiLoading: boolean;
  aiEnabled: boolean;
  taxSnapshot?: {
    recommendedRegime?: string;
    taxOld?: number;
    taxNew?: number;
    taxSaving?: number;
    refundEstimate?: number;
  };
}

function AmountCell({ amount }: { amount: number | null }) {
  if (amount === null) {
    return <span className="text-zinc-400">—</span>;
  }
  return (
    <span className="font-mono tabular-nums text-zinc-900">
      {formatINR(amount)}
    </span>
  );
}

function FlagIcon({ type }: { type: "warning" | "info" | "success" }) {
  if (type === "warning") {
    return <AlertCircle className="size-3.5 shrink-0 text-amber-600" />;
  }
  if (type === "success") {
    return <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />;
  }
  return <Info className="size-3.5 shrink-0 text-blue-600" />;
}

export function ItrAnalyticsPanel({
  income,
  deductions,
  lastParseResult,
  connectedConnectors,
  aiSummary,
  aiLoading,
  aiEnabled,
  taxSnapshot,
}: ItrAnalyticsPanelProps) {
  const rows = useMemo(
    () =>
      buildAnalyticsRows({
        income,
        deductions,
        lastParseResult,
        connectedConnectors,
      }),
    [income, deductions, lastParseResult, connectedConnectors]
  );

  const subtotals = useMemo(() => sectionSubtotals(rows), [rows]);

  const rowsWithInsights = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        insight: aiSummary?.rowInsights[r.particular],
      })),
    [rows, aiSummary?.rowInsights]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, typeof rowsWithInsights>();
    for (const r of rowsWithInsights) {
      const list = map.get(r.category) ?? [];
      list.push(r);
      map.set(r.category, list);
    }
    return map;
  }, [rowsWithInsights]);

  const hasData =
    connectedConnectors.length > 0 ||
    income.grossSalary > 0 ||
    lastParseResult !== null;

  return (
    <aside className="flex w-full min-w-0 flex-col self-start rounded-xl border border-zinc-200 bg-white shadow-sm lg:sticky lg:top-14 lg:max-h-[min(32rem,calc(100vh-5rem))] lg:overflow-hidden 2xl:max-h-[calc(100vh-5rem)]">
      <div className="shrink-0 border-b border-zinc-200 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-900">
            ITR summary sheet
          </h2>
          {aiEnabled && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-700">
              <Sparkles className="size-3" />
              AI
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">
          Live view of parsed Form 16 figures and draft totals
        </p>
      </div>

      {!hasData ? (
        <div className="px-4 py-4 text-sm leading-relaxed text-zinc-500">
          Upload Form 16 to populate this summary. Your salary, TDS, and deduction
          rows will appear here as you import documents.
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          {(aiLoading || aiSummary) && (
            <div className="border-b border-zinc-100 bg-zinc-50/80 px-4 py-3">
              {aiLoading ? (
                <p className="text-xs text-zinc-500">Generating AI summary…</p>
              ) : aiSummary ? (
                <div className="space-y-2">
                  <ul className="space-y-1 text-xs text-zinc-700">
                    {aiSummary.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-1.5">
                        <span className="text-primary">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  {aiSummary.flags.length > 0 && (
                    <ul className="space-y-1">
                      {aiSummary.flags.map((flag) => (
                        <li
                          key={flag.text}
                          className="flex items-start gap-1.5 text-xs text-zinc-700"
                        >
                          <FlagIcon type={flag.type} />
                          <span>{flag.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {(aiSummary.regimeHint || taxSnapshot?.recommendedRegime) && (
                    <p className="rounded-md border border-blue-100 bg-blue-50/80 px-2 py-1.5 text-xs text-blue-900">
                      {aiSummary.regimeHint ??
                        `Engine suggests ${taxSnapshot?.recommendedRegime} regime`}
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {taxSnapshot &&
            (taxSnapshot.taxOld !== undefined ||
              taxSnapshot.refundEstimate !== undefined) && (
              <div className="grid grid-cols-2 gap-2 border-b border-zinc-100 px-4 py-3 text-xs">
                {taxSnapshot.taxOld !== undefined &&
                  taxSnapshot.taxNew !== undefined && (
                    <>
                      <div className="rounded border border-zinc-200 p-2">
                        <p className="text-zinc-500">Old regime tax</p>
                        <p className="font-mono font-medium tabular-nums">
                          {formatINR(taxSnapshot.taxOld)}
                        </p>
                      </div>
                      <div className="rounded border border-zinc-200 p-2">
                        <p className="text-zinc-500">New regime tax</p>
                        <p className="font-mono font-medium tabular-nums">
                          {formatINR(taxSnapshot.taxNew)}
                        </p>
                      </div>
                    </>
                  )}
                {taxSnapshot.taxSaving !== undefined &&
                  taxSnapshot.taxSaving > 0 && (
                    <div className="col-span-2 rounded border border-emerald-200 bg-emerald-50/50 p-2">
                      <p className="text-emerald-800">
                        Regime saving:{" "}
                        <span className="font-mono font-semibold">
                          {formatINR(taxSnapshot.taxSaving)}
                        </span>
                      </p>
                    </div>
                  )}
              </div>
            )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-100/80">
                  <th className="px-3 py-2 text-left font-semibold text-zinc-600">
                    Category
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-zinc-600">
                    Particular
                  </th>
                  <th className="px-3 py-2 text-right font-semibold text-zinc-600">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-zinc-600">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from(grouped.entries()).map(([category, sectionRows]) => (
                  <Fragment key={category}>
                    {sectionRows.map((r, idx) => (
                      <tr
                        key={`${category}-${r.particular}`}
                        className="border-b border-zinc-100 hover:bg-zinc-50/50"
                      >
                        <td className="px-3 py-2 text-zinc-600">
                          {idx === 0 ? category : ""}
                        </td>
                        <td className="px-3 py-2 text-zinc-800">
                          <div>{r.particular}</div>
                          {r.insight && (
                            <p className="mt-0.5 text-[10px] text-violet-700">
                              {r.insight}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <AmountCell amount={r.amount} />
                        </td>
                        <td className="px-3 py-2 text-zinc-600">
                          <div className="flex flex-wrap items-center gap-1">
                            <span>{r.source}</span>
                            {r.confidence && r.confidence !== "high" && (
                              <span
                                className={`rounded px-1 py-0.5 text-[10px] font-medium ${CONFIDENCE_CHIP[r.confidence].className}`}
                              >
                                {CONFIDENCE_CHIP[r.confidence].label}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {subtotals[category] !== undefined && (
                      <tr className="border-b-2 border-zinc-200 bg-zinc-50 font-medium">
                        <td className="px-3 py-1.5" colSpan={2}>
                          {category} subtotal
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono tabular-nums">
                          {formatINR(subtotals[category])}
                        </td>
                        <td className="px-3 py-1.5" />
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {lastParseResult?.warnings && lastParseResult.warnings.length > 0 && (
            <div className="border-t border-amber-100 bg-amber-50/50 px-4 py-3">
              <p className="text-xs font-medium text-amber-900">Parse notes</p>
              <ul className="mt-1 space-y-0.5 text-xs text-amber-800">
                {lastParseResult.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
