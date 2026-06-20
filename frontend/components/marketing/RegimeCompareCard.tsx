"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ResetStepButton } from "@/components/filing/ui";
import { draftToUserInput } from "@/lib/engine/draftToUserInput";
import { formatINR } from "@/lib/format";
import { useTaxCompute } from "@/lib/hooks/useTaxCompute";
import type { UserInput } from "@/lib/engine/types";
import {
  describeNetPayable,
  summarizeRegimeComparison,
  summarizeRegimeComparisonFallback,
} from "@/lib/regimeDisplay";
import { useDraftStore } from "@/lib/store/draft";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";
import { CheckCircle2, TrendingDown } from "lucide-react";

const DEFAULT_SALARY = 1_200_000;
const SALARY_MIN = 300_000;
const SALARY_MAX = 50_000_000;
const SALARY_STEP = 100_000;
const DEFAULT_AGE = 32;
const DEFAULT_FILING_MODE = "estimate";
const DEFAULT_PROFILE = {
  ageBand: "under_60",
  residentialStatus: "resident",
} as const;
const DEFAULT_MATRIX = { income: "2", age: "a", business: "x" } as const;
const DEFAULT_INCOME = {
  grossSalary: DEFAULT_SALARY,
  tds: 85_000,
  fdInterest: 18_400,
  employer: "Acme Pvt Ltd",
  advanceTax: 0,
  selfAssessmentTax: 0,
  hraReceived: 0,
  actualRentPaid: 0,
  cityTier: "metro" as const,
} as const;
const DEFAULT_HOUSE = {
  propertyType: "none" as const,
  annualRent: 0,
  homeLoanInterest: 0,
  municipalTax: 0,
  coOwnerPercent: 100,
} as const;
const DEFAULT_DEDUCTIONS = {
  section80C: 150_000,
  section80D: 25_000,
  section80GG: 0,
  npsExtra: 50_000,
} as const;

type CompareEngineSource = "api" | "fallback";

function formatSalaryLakhs(amount: number): string {
  const lakhs = amount / 100_000;
  return lakhs >= 10 ? `₹${lakhs.toFixed(0)}L` : `₹${lakhs.toFixed(1)}L`;
}

function formatSalaryAmount(amount: number): string {
  if (amount >= 10_000_000) {
    const crores = amount / 10_000_000;
    const formatted =
      crores >= 10 || Number.isInteger(crores)
        ? crores.toFixed(0)
        : crores.toFixed(1);
    return `₹${formatted}Cr`;
  }
  return formatSalaryLakhs(amount);
}

function buildDemoInput(grossSalary: number): UserInput {
  return {
    age: DEFAULT_AGE,
    mode: DEFAULT_FILING_MODE,
    salary: {
      gross_salary: grossSalary,
      basic_salary: Math.round(grossSalary * 0.5),
    },
    other_income: {
      fd_interest: DEFAULT_INCOME.fdInterest,
    },
    deductions: {
      epf: DEFAULT_DEDUCTIONS.section80C,
      health_insurance_self: DEFAULT_DEDUCTIONS.section80D,
      nps_self: DEFAULT_DEDUCTIONS.npsExtra,
    },
    // Compare tax liability before TDS credits — avoids misleading refunds in the hero demo.
    taxes_paid: { tds_salary: 0 },
  };
}

function applySalary(input: UserInput, grossSalary: number): UserInput {
  return {
    ...input,
    salary: {
      ...(input.salary ?? {}),
      gross_salary: grossSalary,
      basic_salary: Math.round(grossSalary * 0.5),
    },
  };
}

function sumTaxPaid(input: UserInput): number {
  const taxes = input.taxes_paid;
  if (!taxes) return 0;
  return (
    (taxes.tds_salary ?? 0) +
    (taxes.tds_other ?? 0) +
    (taxes.advance_tax_paid ?? 0) +
    (taxes.self_assessment_tax_paid ?? 0)
  );
}

function computeSlabTax(
  taxableIncome: number,
  slabs: Array<{ limit: number; rate: number }>
): number {
  let tax = 0;
  let previousLimit = 0;
  let remaining = Math.max(0, taxableIncome);

  for (const slab of slabs) {
    if (remaining <= 0) break;
    const slabWidth = slab.limit - previousLimit;
    const taxedAtThisRate = Math.min(remaining, slabWidth);
    tax += taxedAtThisRate * slab.rate;
    remaining -= taxedAtThisRate;
    previousLimit = slab.limit;
  }

  if (remaining > 0) {
    tax += remaining * 0.3;
  }

  return tax;
}

function estimateRegimeTaxes(input: UserInput): { oldTax: number; newTax: number } {
  const grossSalary = Math.max(0, input.salary?.gross_salary ?? DEFAULT_SALARY);
  const standardDeduction = 50_000;
  const totalDeductions = Object.values(input.deductions ?? {}).reduce((sum, value) => {
    return sum + (typeof value === "number" && Number.isFinite(value) ? value : 0);
  }, 0);
  const taxPaid = sumTaxPaid(input);

  const taxableOld = Math.max(0, grossSalary - standardDeduction - totalDeductions);
  const taxableNew = Math.max(0, grossSalary - standardDeduction);

  const oldBase = computeSlabTax(taxableOld, [
    { limit: 250_000, rate: 0 },
    { limit: 500_000, rate: 0.05 },
    { limit: 1_000_000, rate: 0.2 },
  ]);
  const newBase = computeSlabTax(taxableNew, [
    { limit: 400_000, rate: 0 },
    { limit: 800_000, rate: 0.05 },
    { limit: 1_200_000, rate: 0.1 },
    { limit: 1_600_000, rate: 0.15 },
    { limit: 2_000_000, rate: 0.2 },
    { limit: 2_400_000, rate: 0.25 },
  ]);

  const oldAfterRebate = taxableOld <= 500_000 ? 0 : oldBase;
  const newAfterRebate = taxableNew <= 1_200_000 ? 0 : newBase;

  const oldTotalTax = oldAfterRebate * 1.04;
  const newTotalTax = newAfterRebate * 1.04;

  return {
    oldTax: Math.round(oldTotalTax - taxPaid),
    newTax: Math.round(newTotalTax - taxPaid),
  };
}

function hasUserEnteredData(draft: {
  profile: { ageBand: "under_60" | "senior" | "super_senior"; residentialStatus: string };
  matrix: { income: string; age: string; business: string };
  income: {
    grossSalary: number;
    tds: number;
    fdInterest: number;
    advanceTax: number;
    selfAssessmentTax: number;
  };
  houseProperty: {
    propertyType: string;
    annualRent: number;
    homeLoanInterest: number;
    municipalTax: number;
    coOwnerPercent: number;
  };
  deductions: {
    section80C: number;
    section80D: number;
    section80GG: number;
    npsExtra: number;
  };
  connectedConnectors: string[];
  lastParseResult: unknown;
}): boolean {
  return (
    draft.profile.ageBand !== DEFAULT_PROFILE.ageBand ||
    draft.profile.residentialStatus !== DEFAULT_PROFILE.residentialStatus ||
    draft.matrix.income !== DEFAULT_MATRIX.income ||
    draft.matrix.age !== DEFAULT_MATRIX.age ||
    draft.matrix.business !== DEFAULT_MATRIX.business ||
    draft.income.grossSalary !== DEFAULT_INCOME.grossSalary ||
    draft.income.tds !== DEFAULT_INCOME.tds ||
    draft.income.fdInterest !== DEFAULT_INCOME.fdInterest ||
    draft.income.advanceTax !== DEFAULT_INCOME.advanceTax ||
    draft.income.selfAssessmentTax !== DEFAULT_INCOME.selfAssessmentTax ||
    draft.houseProperty.propertyType !== DEFAULT_HOUSE.propertyType ||
    draft.houseProperty.annualRent !== DEFAULT_HOUSE.annualRent ||
    draft.houseProperty.homeLoanInterest !== DEFAULT_HOUSE.homeLoanInterest ||
    draft.houseProperty.municipalTax !== DEFAULT_HOUSE.municipalTax ||
    draft.houseProperty.coOwnerPercent !== DEFAULT_HOUSE.coOwnerPercent ||
    draft.deductions.section80C !== DEFAULT_DEDUCTIONS.section80C ||
    draft.deductions.section80D !== DEFAULT_DEDUCTIONS.section80D ||
    draft.deductions.section80GG !== DEFAULT_DEDUCTIONS.section80GG ||
    draft.deductions.npsExtra !== DEFAULT_DEDUCTIONS.npsExtra ||
    draft.connectedConnectors.length > 0 ||
    draft.lastParseResult !== null
  );
}

function useCountUp(target: number, duration = 1400, active = true) {
  const [value, setValue] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, duration, active]);

  return value;
}

export function RegimeCompareCard({ className }: { className?: string }) {
  const { loading, result, compute, error } = useTaxCompute();
  const draft = useDraftStore(
    useShallow((s) => ({
    filingMode: s.filingMode,
    profile: s.profile,
    matrix: s.matrix,
    income: s.income,
    incomeChips: s.incomeChips,
    houseProperty: s.houseProperty,
    deductions: s.deductions,
    connectedConnectors: s.connectedConnectors,
    lastParseResult: s.lastParseResult,
    }))
  );
  const [salary, setSalary] = useState(DEFAULT_SALARY);
  const [oldNetPayable, setOldNetPayable] = useState<number>(0);
  const [newNetPayable, setNewNetPayable] = useState<number>(0);
  const [recommended, setRecommended] = useState<"old" | "new">("new");
  const [savings, setSavings] = useState<number>(0);
  const [computeSource, setComputeSource] = useState<CompareEngineSource>("api");
  const [useUserProfile, setUseUserProfile] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInputRef = useRef<UserInput>(buildDemoInput(DEFAULT_SALARY));

  const userHasEnteredData = hasUserEnteredData(draft);
  const userInput = useMemo(() => draftToUserInput(draft), [draft]);
  const profileSource = useUserProfile && userHasEnteredData ? "user" : "demo";
  const baseInput = useMemo(
    () => (profileSource === "user" ? userInput : buildDemoInput(DEFAULT_SALARY)),
    [profileSource, userInput]
  );
  const compareInput = useMemo(() => applySalary(baseInput, salary), [baseInput, salary]);
  const disclaimerText =
    profileSource === "user"
      ? "Based on your entered profile and income details"
      : "Based on default sample profile";

  useEffect(() => {
    lastInputRef.current = compareInput;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void compute(compareInput);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [compareInput, compute]);

  useEffect(() => {
    const rc = result?.regime_comparison;
    if (rc) {
      const summary = summarizeRegimeComparison(rc);
      setOldNetPayable(summary.oldNetPayable);
      setNewNetPayable(summary.newNetPayable);
      setRecommended(summary.recommended);
      setSavings(summary.savings);
      setComputeSource("api");
    } else if (error) {
      const estimate = estimateRegimeTaxes(lastInputRef.current);
      const summary = summarizeRegimeComparisonFallback(
        estimate.oldTax,
        estimate.newTax
      );
      setOldNetPayable(summary.oldNetPayable);
      setNewNetPayable(summary.newNetPayable);
      setRecommended(summary.recommended);
      setSavings(summary.savings);
      setComputeSource("fallback");
    }
  }, [result, error]);

  const oldDisplay = describeNetPayable(oldNetPayable);
  const newDisplay = describeNetPayable(newNetPayable);
  const animatedOld = useCountUp(oldDisplay.amount, 1400, !loading);
  const animatedNew = useCountUp(newDisplay.amount, 1400, !loading);

  const handleReset = () => {
    const resetInput = buildDemoInput(DEFAULT_SALARY);
    lastInputRef.current = resetInput;
    setSalary(DEFAULT_SALARY);
    setUseUserProfile(false);
    void compute(resetInput);
  };

  const showProfileToggle = userHasEnteredData;

  const recommendedLabel = recommended === "old" ? "Old" : "New";

  return (
    <div id="regime-compare" className={cn("card-premium card-glow overflow-hidden", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/60 bg-gradient-to-r from-blue-50/80 to-white px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Live estimate
          </p>
          <h3 className="mt-0.5 text-base font-bold text-foreground sm:text-lg">
            Your Smart Tax Estimate
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="shrink-0 border-0 bg-primary/10 font-medium text-primary"
          >
            {computeSource === "api" ? "Live" : "Estimated"} · {formatSalaryAmount(salary)}
          </Badge>
          <ResetStepButton
            label="Reset"
            onClick={handleReset}
            variant="ghost"
            className="min-h-9 px-3 py-1.5 text-xs"
          />
        </div>
      </div>

      <div className="border-b border-border/60 px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Annual salary</span>
          <span className="font-bold tabular-nums text-primary">
            {formatSalaryAmount(salary)}
          </span>
        </div>
        <Slider
          value={[salary]}
          onValueChange={(value) => {
            const next = Array.isArray(value) ? value[0] : (value as number);
            if (typeof next === "number") setSalary(next);
          }}
          min={SALARY_MIN}
          max={SALARY_MAX}
          step={SALARY_STEP}
          className="mt-3"
        />
        <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
          <span>{formatSalaryAmount(SALARY_MIN)}</span>
          <span>{formatSalaryAmount(SALARY_MAX)}</span>
        </div>
        {showProfileToggle && (
          <button
            type="button"
            onClick={() => setUseUserProfile((prev) => !prev)}
            className="mt-2 w-full text-left text-[11px] font-medium leading-snug text-primary hover:underline"
          >
            {useUserProfile ? "Using your profile details" : "Using sample profile"} ·{" "}
            {useUserProfile ? "Switch to sample" : "Switch to your profile"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 p-4 sm:gap-3 sm:p-5">
        <RegimeTile
          label="Old regime"
          display={oldDisplay}
          animatedAmount={loading ? null : animatedOld}
          loading={loading}
          winner={recommended === "old"}
        />
        <RegimeTile
          label="New regime"
          display={newDisplay}
          animatedAmount={loading ? null : animatedNew}
          loading={loading}
          winner={recommended === "new"}
        />
      </div>

      <div className="border-t border-border/60 bg-muted/30 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            {recommended === "new" ? (
              <TrendingDown className="size-4" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              🏆 Recommended: {recommendedLabel} Regime
            </p>
            <p className="mt-1 text-sm text-emerald-700">
              {savings <= 0
                ? "Both regimes result in the same tax outcome for this profile."
                : `Choosing this path legally saves you ${formatINR(savings)} this year.`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {disclaimerText}
              {computeSource === "fallback"
                ? " · showing estimated comparison while compute is unavailable"
                : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegimeTile({
  label,
  display,
  animatedAmount,
  loading,
  winner,
}: {
  label: string;
  display: ReturnType<typeof describeNetPayable>;
  animatedAmount: number | null;
  loading: boolean;
  winner: boolean;
}) {
  const amountText =
    animatedAmount !== null ? formatINR(animatedAmount) : display.formattedAmount;

  return (
    <div
      className={cn(
        "relative rounded-2xl border p-4 text-center transition-all duration-300",
        winner
          ? "border-emerald-300/80 bg-emerald-50/70 regime-winner ring-2 ring-emerald-200/80"
          : "border-border/80 bg-white"
      )}
    >
      {winner && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
          Recommended
        </span>
      )}
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <div
        className={cn(
          "mt-2 text-2xl font-bold tabular-nums tracking-tight",
          winner ? "text-emerald-700" : "text-foreground",
          display.isRefund && "text-emerald-700",
          !loading && animatedAmount !== null && "count-shimmer"
        )}
      >
        {loading ? (
          <span className="inline-block h-8 w-24 animate-pulse rounded bg-muted" />
        ) : display.isRefund ? (
          <>
            <span className="block text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Refund
            </span>
            <span>{amountText}</span>
          </>
        ) : (
          amountText
        )}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{display.label}</p>
    </div>
  );
}
