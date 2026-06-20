"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { useDraftStore } from "@/lib/store/draft";
import { formatINR } from "@/lib/filing/types";
import { FilingLayout } from "@/components/filing/FilingLayout";
import { EngineComputeFallback } from "@/components/filing/EngineComputeFallback";
import {
  Banner,
  Button,
  Card,
  ScreenTitle,
} from "@/components/filing/ui";
import { useDraftTaxCompute } from "@/lib/hooks/useDraftTaxCompute";
import {
  REVIEW_TABS,
  buildReviewUrl,
  parseReviewTab,
  type ReviewTab,
} from "@/lib/filing/routes";
import { FILING_REVIEW } from "@/lib/copy/filing";
import {
  getReviewTabStatuses,
  statusDotClass,
} from "@/lib/filing/navStatus";
import {
  buildDeductionChecklist,
  summarizeDeductionChecklist,
  type DeductionStatus,
} from "@/lib/filing/deductionChecklist";
import {
  buildReconciliationFlags,
  buildReconciliationStatements,
  summarizeReconciliationRows,
  type ReconciliationRow,
  type ReconciliationRowSeverity,
} from "@/lib/filing/reconciliation";
import { PORTAL_ITR1_SECTIONS } from "@/lib/engine/portalSections";
import type { ITRResult, TaxRegime } from "@/lib/engine/types";

const TAB_LABELS: Record<ReviewTab, string> = {
  import: "Import",
  income: "Income",
  deductions: "Deductions",
  taxes: "Taxes",
  summary: "Summary",
};

const DEDUCTION_STATUS_STYLE: Record<
  DeductionStatus,
  { label: string; className: string }
> = {
  claimed: { label: "Claimed", className: "bg-emerald-100 text-emerald-800" },
  "needs-proof": { label: "Needs proof", className: "bg-amber-100 text-amber-900" },
  "not-applicable": { label: "Not applicable", className: "bg-slate-100 text-slate-600" },
};

const ROW_STYLE: Record<
  ReconciliationRowSeverity,
  { label: string; badge: string; dot: string }
> = {
  matched: {
    label: "Matched",
    badge: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500",
  },
  attention: {
    label: "Needs attention",
    badge: "bg-amber-100 text-amber-900",
    dot: "bg-amber-500",
  },
  missing: {
    label: "Add source",
    badge: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  },
};

const DOC_SOURCES = [
  {
    id: "form16",
    label: "Form 16",
    role: "Salary & TDS from your employer",
    importHref: "/file/import/documents?source=form16",
  },
  {
    id: "ais",
    label: "AIS",
    role: "What the tax department already knows",
    importHref: "/file/import/documents?source=ais",
  },
  {
    id: "form26as",
    label: "Form 26AS",
    role: "TDS credited against your PAN",
    importHref: "/file/import/documents?source=form26as",
  },
] as const;

function reconValue(value: number | undefined): string {
  return value === undefined ? "—" : formatINR(value);
}

function ReconcileRowCard({ row }: { row: ReconciliationRow }) {
  const style = ROW_STYLE[row.severity];
  return (
    <li className="rounded-xl border border-slate-200 px-3.5 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <span className={`size-2 shrink-0 rounded-full ${style.dot}`} aria-hidden />
          {row.label}
        </span>
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}
        >
          {style.label}
        </span>
      </div>
      <dl className="mt-2.5 grid grid-cols-3 gap-2 text-center">
        {(
          [
            ["Form 16", row.form16],
            ["AIS", row.ais],
            ["26AS", row.form26as],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg bg-slate-50 px-2 py-1.5"
          >
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {label}
            </dt>
            <dd className="mt-0.5 text-xs font-semibold tabular-nums text-slate-800">
              {reconValue(value)}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-slate-600">{row.detail}</p>
    </li>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}

function EmptyState({
  title,
  body,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <Card>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
      <Button href={ctaHref} variant="secondary" className="mt-3 self-start">
        {ctaLabel}
      </Button>
    </Card>
  );
}

function ImportTab() {
  const connectedConnectors = useDraftStore((s) => s.connectedConnectors);
  const income = useDraftStore((s) => s.income);
  const deductions = useDraftStore((s) => s.deductions);
  const houseProperty = useDraftStore((s) => s.houseProperty);
  const regime = useDraftStore((s) => s.regime);
  const mismatchResolved = useDraftStore((s) => s.mismatchResolved);
  const employers = useMemo(() => income.employers ?? [], [income.employers]);

  const rows = useMemo(
    () =>
      buildReconciliationStatements({
        connectedConnectors,
        grossSalary: income.grossSalary,
        tds: income.tds,
        fdInterest: income.fdInterest,
        mismatchResolved,
      }),
    [connectedConnectors, income.grossSalary, income.tds, income.fdInterest, mismatchResolved]
  );
  const rowSummary = useMemo(() => summarizeReconciliationRows(rows), [rows]);

  const flags = useMemo(
    () =>
      buildReconciliationFlags({
        connectedConnectors,
        employers,
        grossSalary: income.grossSalary,
        tds: income.tds,
        mismatchResolved,
      }),
    [connectedConnectors, employers, income.grossSalary, income.tds, mismatchResolved]
  );
  const multiEmployerFlag = flags.find((f) => f.id === "multi-employer");

  const deductionItems = useMemo(
    () => buildDeductionChecklist({ deductions, houseProperty, income, regime }),
    [deductions, houseProperty, income, regime]
  );
  const deductionSummary = useMemo(
    () => summarizeDeductionChecklist(deductionItems),
    [deductionItems]
  );

  if (connectedConnectors.length === 0) {
    return (
      <EmptyState
        title={FILING_REVIEW.emptyImportTitle}
        body={FILING_REVIEW.emptyImportBody}
        ctaHref="/file/import/documents"
        ctaLabel={FILING_REVIEW.uploadDocumentsCta}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Document sources — what's imported vs still to add */}
      <ul className="recon-doc-grid">
        {DOC_SOURCES.map((doc) => {
          const imported = connectedConnectors.includes(doc.id);
          return (
            <li
              key={doc.id}
              className={`flex flex-col rounded-2xl border p-4 ${
                imported
                  ? "border-emerald-200 bg-emerald-50/40"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-900">{doc.label}</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    imported
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      imported ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                    aria-hidden
                  />
                  {imported ? "Imported" : "Not imported"}
                </span>
              </div>
              <p className="mt-1 flex-1 text-xs text-slate-600">{doc.role}</p>
              {doc.id === "form16" && imported && (
                <p className="mt-2 text-xs font-medium tabular-nums text-slate-700">
                  Gross {formatINR(income.grossSalary)} · TDS {formatINR(income.tds)}
                </p>
              )}
              {!imported && (
                <Link
                  href={doc.importHref}
                  className="mt-2 text-xs font-semibold text-primary hover:underline"
                >
                  Add {doc.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {/* Line-item three-way reconciliation */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-slate-900">Cross-check your figures</h3>
          <span className="text-xs text-slate-500">
            {rowSummary.matched} matched · {rowSummary.attention} need attention ·{" "}
            {rowSummary.missing} to add
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Form 16 vs AIS vs Form 26AS, line by line. Resolve attention rows before you
          file on the portal.
        </p>
        <ul className="mt-3 space-y-2">
          {rows.map((row) => (
            <ReconcileRowCard key={row.id} row={row} />
          ))}
        </ul>
        {multiEmployerFlag && (
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {multiEmployerFlag.detail}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button href="/file/import/mismatch" variant="secondary" className="self-start">
            Open mismatch resolution
          </Button>
          <Button href="/file/import/documents" variant="ghost" className="self-start">
            Manage documents
          </Button>
        </div>
      </Card>

      {/* Deduction checklist summary — full detail lives on the Deductions tab */}
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Deduction checklist</h3>
          <Link
            href={buildReviewUrl("deductions")}
            className="text-sm font-medium text-primary hover:underline"
          >
            Review all
          </Link>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {deductionSummary.claimed} claimed · {deductionSummary.needsProof} need proof ·{" "}
          {deductionSummary.notApplicable} not applicable. Total claimed{" "}
          {formatINR(deductionSummary.totalClaimedAmount)}.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Only claim deductions that actually happened and that you can prove.
        </p>
      </Card>
    </div>
  );
}

function IncomeTab() {
  const income = useDraftStore((s) => s.income);
  const houseProperty = useDraftStore((s) => s.houseProperty);
  const employers = income.employers ?? [];
  const hasAnyIncome =
    income.grossSalary > 0 || income.fdInterest > 0 || houseProperty.propertyType !== "none";

  if (!hasAnyIncome) {
    return (
      <EmptyState
        title="No income captured yet"
        body="Add salary, house property, or other income so we can compute your tax."
        ctaHref="/file/income"
        ctaLabel="Add income"
      />
    );
  }

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Salary</h3>
          <Link href="/file/income" className="text-sm font-medium text-primary hover:underline">
            Edit
          </Link>
        </div>
        <p className="mt-2 text-sm text-slate-700">
          <strong>Gross salary:</strong> {formatINR(income.grossSalary)}
        </p>
        <p className="mt-1 text-sm text-slate-700">
          <strong>TDS:</strong> {formatINR(income.tds)}
        </p>
        {employers.length > 1 && (
          <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3">
            {employers.map((e) => (
              <li key={e.id} className="text-sm text-slate-600">
                {e.name}: {formatINR(e.grossSalary)} · TDS {formatINR(e.tds)}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">House property</h3>
          <Link href="/file/house-property" className="text-sm font-medium text-primary hover:underline">
            Edit
          </Link>
        </div>
        <p className="mt-2 text-sm text-slate-700">
          {houseProperty.propertyType === "none"
            ? "None declared."
            : `${houseProperty.propertyType === "let_out" ? "Let out" : "Self-occupied"} · loan interest ${formatINR(houseProperty.homeLoanInterest)}`}
        </p>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Other sources</h3>
          <Link href="/file/other" className="text-sm font-medium text-primary hover:underline">
            Edit
          </Link>
        </div>
        <p className="mt-2 text-sm text-slate-700">
          <strong>Interest income:</strong> {formatINR(income.fdInterest)}
        </p>
      </Card>
    </div>
  );
}

function DeductionsTab() {
  const deductions = useDraftStore((s) => s.deductions);
  const houseProperty = useDraftStore((s) => s.houseProperty);
  const income = useDraftStore((s) => s.income);
  const regime = useDraftStore((s) => s.regime);

  const items = useMemo(
    () =>
      buildDeductionChecklist({
        deductions,
        houseProperty,
        income,
        regime,
      }),
    [deductions, houseProperty, income, regime]
  );
  const summary = useMemo(() => summarizeDeductionChecklist(items), [items]);

  return (
    <div className="space-y-3">
      {regime === null && (
        <Banner variant="info">
          Regime not selected yet — statuses assume the old regime.{" "}
          <Link href="/file/regime" className="font-medium underline">
            Choose a regime
          </Link>
          .
        </Banner>
      )}
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Deduction checklist</h3>
          <Link href="/file/deductions" className="text-sm font-medium text-primary hover:underline">
            Edit
          </Link>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {summary.claimed} claimed · {summary.needsProof} need proof ·{" "}
          {summary.notApplicable} not applicable. Total claimed{" "}
          {formatINR(summary.totalClaimedAmount)}.
        </p>
        <ul className="mt-3 space-y-2">
          {items.map((item) => {
            const style = DEDUCTION_STATUS_STYLE[item.status];
            return (
              <li
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2.5"
              >
                <span className="min-w-0">
                  <span className="text-sm font-semibold text-slate-900">
                    {item.label}{" "}
                    <span className="font-normal text-slate-500">({item.section})</span>
                  </span>
                  <span className="block text-xs text-slate-600">{item.note}</span>
                </span>
                <span className="flex items-center gap-2">
                  {item.amount > 0 && item.status !== "not-applicable" && (
                    <span className="text-sm font-semibold tabular-nums text-slate-900">
                      {formatINR(item.amount)}
                    </span>
                  )}
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${style.className}`}
                  >
                    {style.label}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          Labels are factual — only claim deductions that actually happened and that you can prove.
        </p>
      </Card>
    </div>
  );
}

function TaxesTab({
  result,
  selectedRegime,
}: {
  result: ITRResult | null;
  selectedRegime: TaxRegime;
}) {
  if (!result) {
    return (
      <EmptyState
        title="No computation yet"
        body="Add income and deductions to compute tax. Your figures update automatically."
        ctaHref="/file/income"
        ctaLabel="Add income"
      />
    );
  }

  const slab = result.regime_comparison[selectedRegime];
  const isRefund = slab.net_payable < 0;

  const rows: Array<{ label: string; value: string }> = [
    { label: "Taxable income", value: formatINR(slab.taxable_income) },
    { label: "Tax + surcharge", value: formatINR(slab.tax_plus_surcharge) },
    { label: "Health & education cess", value: formatINR(slab.cess) },
    { label: "Total tax", value: formatINR(slab.total_tax) },
    { label: "TDS + advance tax", value: formatINR(slab.tds_and_advance_tax) },
  ];

  return (
    <div className="space-y-3">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          {selectedRegime === "new" ? "New regime" : "Old regime"} · estimate
        </p>
        <p
          className={`mt-1 text-2xl font-bold tabular-nums ${
            isRefund ? "text-emerald-700" : "text-slate-900"
          }`}
        >
          {isRefund ? "Est. refund " : "Est. tax due "}
          {formatINR(Math.abs(slab.net_payable))}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Not guaranteed — incometax.gov.in confirms the final amount.
        </p>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-900">How we got there</h3>
        <dl className="mt-3 divide-y divide-slate-100">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2">
              <dt className="text-sm text-slate-600">{row.label}</dt>
              <dd className="text-sm font-semibold tabular-nums text-slate-900">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
        <Button href="/file/regime" variant="ghost" className="mt-3 self-start">
          Change regime
        </Button>
      </Card>
    </div>
  );
}

function SummaryTab({
  result,
  selectedRegime,
}: {
  result: ITRResult | null;
  selectedRegime: TaxRegime;
}) {
  const recommendedForm = useDraftStore((s) => s.recommendedForm);

  if (!result) {
    return (
      <EmptyState
        title="Summary not ready"
        body="Once we have your income and deductions, you'll see a regime comparison and your filing summary here."
        ctaHref="/file/import/documents"
        ctaLabel={FILING_REVIEW.uploadDocumentsCta}
      />
    );
  }

  const rc = result.regime_comparison;
  const oldPay = rc.old.net_payable;
  const newPay = rc.new.net_payable;
  const recommended = rc.recommended_regime;

  return (
    <div className="space-y-3">
      <Card>
        <h3 className="font-semibold text-slate-900">Old vs new regime</h3>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(["old", "new"] as const).map((regime) => {
            const pay = regime === "old" ? oldPay : newPay;
            const isRefund = pay < 0;
            const winner = recommended === regime;
            return (
              <div
                key={regime}
                className={`rounded-2xl border p-4 text-center ${
                  winner ? "border-primary/40 bg-primary/5 ring-2 ring-primary/15" : "border-slate-200"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {regime === "old" ? "Old regime" : "New regime"}
                </p>
                <p
                  className={`mt-1 text-xl font-bold tabular-nums ${
                    isRefund ? "text-emerald-700" : "text-slate-900"
                  }`}
                >
                  {isRefund ? "Refund " : ""}
                  {formatINR(Math.abs(pay))}
                </p>
                {winner && (
                  <span className="mt-1 inline-block rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    Lower tax
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-slate-700">
          {rc.tax_saving > 0 ? (
            <>
              {recommended === "old" ? "Old" : "New"} regime is lower by{" "}
              <span className="font-semibold text-emerald-700">
                {formatINR(rc.tax_saving)}
              </span>{" "}
              on your numbers.
            </>
          ) : (
            "Both regimes are about the same on your numbers."
          )}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          You&apos;re currently set to the {selectedRegime} regime. This is an estimate — ITD confirms the final amount when you file.
        </p>
        <Button href="/file/regime" variant="ghost" className="mt-2 self-start">
          Review regime choice
        </Button>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-900">Filing summary</h3>
        <p className="mt-2 text-sm text-slate-700">
          <strong>ITR form:</strong> {result.profile.itr_form || recommendedForm}
        </p>
        <p className="mt-1 text-sm text-slate-700">
          <strong>Completeness:</strong> {Math.round(result.confidence.completeness_score)}%
          {result.confidence.filing_ready ? " · filing-ready" : " · keep going"}
        </p>
        {result.confidence.missing_documents.length > 0 && (
          <p className="mt-1 text-sm text-slate-600">
            Still missing: {result.confidence.missing_documents.join(", ")}
          </p>
        )}
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-900">File on the government portal</h3>
        <p className="mt-1 text-sm text-slate-600">
          When your draft is ready, open the companion to copy verified values into
          incometax.gov.in — you submit and e-verify yourself.
        </p>
        <Button href="/file/companion" className="mt-3 self-start">
          Open portal companion
        </Button>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Jump to a portal section
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PORTAL_ITR1_SECTIONS.map((section) => (
            <Link
              key={section.id}
              href={`/file/companion?section=${section.id}`}
              className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-primary/30 hover:text-primary"
            >
              {section.label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ReconcileHero({
  result,
  selectedRegime,
}: {
  result: ITRResult | null;
  selectedRegime: TaxRegime;
}) {
  const connectedConnectors = useDraftStore((s) => s.connectedConnectors);
  const income = useDraftStore((s) => s.income);
  const mismatchResolved = useDraftStore((s) => s.mismatchResolved);

  const rowSummary = useMemo(
    () =>
      summarizeReconciliationRows(
        buildReconciliationStatements({
          connectedConnectors,
          grossSalary: income.grossSalary,
          tds: income.tds,
          fdInterest: income.fdInterest,
          mismatchResolved,
        })
      ),
    [connectedConnectors, income.grossSalary, income.tds, income.fdInterest, mismatchResolved]
  );

  const slab = result?.regime_comparison[selectedRegime];
  const netPayable = slab?.net_payable ?? 0;
  const isRefund = netPayable < 0;
  const hasResult = Boolean(result && slab);
  const openItems = rowSummary.attention + rowSummary.missing;

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-white to-slate-50/80">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            {FILING_REVIEW.estimateLabel(selectedRegime)}
          </p>
          {hasResult ? (
            <p
              className={`mt-1 text-3xl font-bold tabular-nums ${
                isRefund ? "text-emerald-700" : "text-slate-900"
              }`}
            >
              {isRefund ? "Refund " : ""}
              {formatINR(Math.abs(netPayable))}
            </p>
          ) : (
            <p className="mt-1 text-2xl font-bold text-slate-400">
              Add income to see your estimate
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            {FILING_REVIEW.estimateDisclaimer}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-3.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Your checklist
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {openItems === 0 ? (
              <span className="font-semibold text-emerald-700">
                {FILING_REVIEW.allClear}
              </span>
            ) : (
              <span className="font-semibold text-amber-700">
                {FILING_REVIEW.actionRequired(openItems)}
              </span>
            )}
          </p>
          {openItems > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              {FILING_REVIEW.actionRequiredSubtext}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

function ReviewDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseReviewTab(searchParams.get("tab"));

  const regime = useDraftStore((s) => s.regime);
  const navDraft = useDraftStore(
    useShallow((s) => ({
      income: s.income,
      houseProperty: s.houseProperty,
      deductions: s.deductions,
      regime: s.regime,
      incomeChips: s.incomeChips,
      connectedConnectors: s.connectedConnectors,
      mismatchResolved: s.mismatchResolved,
    }))
  );
  const tabStatuses = getReviewTabStatuses(navDraft);

  const { loading, error, engineUnavailable, result, lastSnapshot, userInput, compute } =
    useDraftTaxCompute();
  const effectiveResult = result ?? lastSnapshot;
  const selectedRegime: TaxRegime =
    regime ?? effectiveResult?.regime_comparison.recommended_regime ?? "new";

  const selectTab = (tab: ReviewTab) => {
    router.replace(buildReviewUrl(tab), { scroll: false });
  };

  const needsCompute = activeTab === "taxes" || activeTab === "summary";

  return (
    <FilingLayout mirrorText="This dashboard is your reconcile-and-review hub. Confirm imports, income, and deductions, then compare regimes before you file on the portal.">
      <ScreenTitle
        title={FILING_REVIEW.title}
        subtitle={FILING_REVIEW.subtitle}
      />

      <ReconcileHero result={effectiveResult} selectedRegime={selectedRegime} />

      <div
        role="tablist"
        aria-label="Review sections"
        className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {REVIEW_TABS.map((tab) => {
          const active = tab === activeTab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectTab(tab)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span
                className={`size-2 rounded-full ${statusDotClass(tabStatuses[tab])}`}
                aria-hidden
              />
              {TAB_LABELS[tab]}
            </button>
          );
        })}
      </div>

      {needsCompute && error && (
        <EngineComputeFallback
          loading={loading}
          error={error}
          engineUnavailable={engineUnavailable}
          lastSnapshot={lastSnapshot}
          onRetry={() => void compute(userInput)}
        />
      )}

      <div role="tabpanel">
        {activeTab === "import" && <ImportTab />}
        {activeTab === "income" && <IncomeTab />}
        {activeTab === "deductions" && <DeductionsTab />}
        {activeTab === "taxes" &&
          (loading && !effectiveResult ? (
            <SkeletonRows />
          ) : (
            <TaxesTab result={effectiveResult} selectedRegime={selectedRegime} />
          ))}
        {activeTab === "summary" &&
          (loading && !effectiveResult ? (
            <SkeletonRows />
          ) : (
            <SummaryTab result={effectiveResult} selectedRegime={selectedRegime} />
          ))}
      </div>
    </FilingLayout>
  );
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <FilingLayout>
          <ScreenTitle title={FILING_REVIEW.title} subtitle={FILING_REVIEW.loadingSubtitle} />
          <SkeletonRows />
        </FilingLayout>
      }
    >
      <ReviewDashboard />
    </Suspense>
  );
}
