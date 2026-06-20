"use client";

import { useRouter } from "next/navigation";
import { useDraftStore } from "@/lib/store/draft";
import { formatINR } from "@/lib/filing/types";
import { FilingLayout } from "@/components/filing/FilingLayout";
import {
  Banner,
  Button,
  FilingActions,
  RiskBadge,
  ScreenTitle,
} from "@/components/filing/ui";

export default function MismatchPage() {
  const router = useRouter();
  const {
    mismatchResolved,
    mismatchProceedWithExplanation,
    income,
    setMismatchProceedWithExplanation,
  } = useDraftStore();

  const handleProceedWithExplanation = () => {
    setMismatchProceedWithExplanation(true);
    router.push("/file/import/tds");
  };

  return (
    <FilingLayout
      mirrorText="AIS shows what the tax department already knows. Fixing mismatches here prevents refund delays and scrutiny notices."
    >
      <ScreenTitle
        title="Mismatch resolution"
        subtitle="This value does not match AIS. Choose the source you trust and tell us why."
      />

      {!mismatchResolved && (
        <Banner variant="critical">
          Submit stays disabled until critical mismatches are resolved.
        </Banner>
      )}

      <p className="text-sm text-slate-700 mb-4">
        <strong>Summary:</strong>{" "}
        {mismatchResolved ? "0 critical · 1 warning · 3 matched" : "1 critical · 1 warning · 2 matched"}
      </p>

      <div
        className={`rounded-xl border p-4 mb-3 ${
          mismatchResolved
            ? "border-emerald-200 bg-emerald-50/30"
            : "border-red-200 bg-red-50/30"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <RiskBadge variant={mismatchResolved ? "green" : "red"}>
            {mismatchResolved ? "OK" : "Critical"}
          </RiskBadge>
          <strong className="text-sm">Salary</strong>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-600 mb-3">
          <span>Form 16: {formatINR(income.grossSalary)}</span>
          <span>AIS: ₹12,15,000</span>
          <span>Draft: {formatINR(income.grossSalary)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button href="/file/import/mismatch/salary" variant="primary" className="text-xs px-3 py-1.5">
            Fix now
          </Button>
          <Button
            href="/file/import/mismatch/salary"
            variant="ghost"
            className="text-xs"
          >
            I have proof
          </Button>
          <Button
            href="/file/import/mismatch/salary"
            variant="ghost"
            className="text-xs"
          >
            AIS feedback guide
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-4 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <RiskBadge variant="yellow">Warning</RiskBadge>
          <strong className="text-sm">FD interest</strong>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-600 mb-3">
          <span>AIS: {formatINR(income.fdInterest)}</span>
          <span>Draft: ₹0</span>
        </div>
        <Button href="/file/other" variant="primary" className="text-xs px-3 py-1.5">
          Add income
        </Button>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <RiskBadge variant="green">OK</RiskBadge>
          <strong className="text-sm">TDS</strong>
        </div>
        <p className="text-xs text-slate-600">
          Form 16 & 26AS: {formatINR(income.tds)}
        </p>
      </div>

      <FilingActions
        hint={
          <p className="text-tier-feature">
            <strong>What happens next:</strong> Cross-check TDS in Form 26AS, then
            review income and deductions.
          </p>
        }
      >
        <Button href="/file/import/tds" disabled={!mismatchResolved}>
          Continue when critical rows are green
        </Button>
        {!mismatchResolved && (
          <Button variant="ghost" onClick={handleProceedWithExplanation}>
            Proceed with explanation
          </Button>
        )}
      </FilingActions>
      {mismatchProceedWithExplanation && !mismatchResolved && (
        <div className="mt-4">
          <Banner variant="info">
            You chose to proceed with an unresolved mismatch. We&apos;ll flag this in
            your filing guide — keep proof handy.
          </Banner>
        </div>
      )}
    </FilingLayout>
  );
}
