"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDraftStore } from "@/lib/store/draft";
import { useProfileStore } from "@/lib/store/profile";
import { FilingLayout } from "@/components/filing/FilingLayout";
import {
  getItrPathReasons,
  getWhyNotItr3,
  resolveRecommendedForm,
} from "@/lib/filing/case-matrix";
import { INCOME_CHIPS } from "@/lib/filing/constants";
import type { AgeBand, BusinessType, IncomeBand } from "@/lib/filing/case-matrix";
import {
  buildParsingForm16Url,
  isForm16FastPath,
} from "@/lib/filing/routes";
import {
  FormSection,
  WhyWeNeedThis,
  FieldGroup,
} from "@/components/filing/OnboardingForm";
import {
  Banner,
  Card,
  Chip,
  ScreenTitle,
  SelectInput,
} from "@/components/filing/ui";
import { PlainEnglishField } from "@/components/filing/PlainEnglishField";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  Wallet,
  Home,
  TrendingUp,
  Briefcase,
  Calendar,
  Banknote,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CA_REVIEW_COMING_SOON,
  COMPLEX_CASE_ESCALATION_BODY,
  COMPLEX_CASE_ESCALATION_TITLE,
  COMPLEX_CASE_FLAG,
  NO_CA_REPLACEMENT,
  SELF_FILE_ELIGIBLE,
  WHY_WE_ASK,
} from "@/lib/copy/trust";

const FORM_PLAIN_LABELS: Record<string, string> = {
  "ITR-1": "Simple return for salaried employees",
  "ITR-2": "For capital gains, foreign income, or income above ₹50L",
  "ITR-3": "Business income with books of accounts",
  "ITR-4": "Presumptive business or profession",
  BLOCK: "Parent must file for minor",
};

const EXTRA_CHIP_IDS = new Set([
  "pension",
  "esop_rsu",
  "foreign",
  "director",
  "home_loan",
]);

function profileAgeToMatrixAge(ageBand: "under_60" | "senior" | "super_senior"): AgeBand {
  if (ageBand === "senior") return "b";
  if (ageBand === "super_senior") return "d";
  return "a";
}

function matrixAgeToProfileAge(age: AgeBand): "under_60" | "senior" | "super_senior" {
  if (age === "b" || age === "c") return "senior";
  if (age === "d") return "super_senior";
  return "under_60";
}

function applySeniorModeFromProfile(
  ageBand: "under_60" | "senior" | "super_senior",
  setSeniorMode: (enabled: boolean) => void
) {
  setSeniorMode(ageBand === "senior" || ageBand === "super_senior");
}

function EligibilityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const form16FastPath = isForm16FastPath(searchParams);
  const aboutYouStep = searchParams.get("step") === "about-you";
  const showIdentity = aboutYouStep || !form16FastPath;
  const { name: storeName } = useProfileStore();
  const {
    matrix,
    incomeChips,
    profile,
    itrConfirmed,
    filingPath,
    connectedConnectors,
    name,
    consentGiven,
    setName,
    setConsentGiven,
    setMatrix,
    setProfile,
    toggleIncomeChip,
    ensureIncomeChip,
    setRecommendedForm,
    setItrConfirmed,
    setSeniorMode,
    resetEligibilityStep,
    resetOnboardingProfile,
  } = useDraftStore();

  const userName = storeName || name || "";
  const firstName = userName ? userName.split(" ")[0] : "";

  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const landingName = searchParams.get("name");
    if (landingName) setName(landingName);
  }, [searchParams, setName]);

  useEffect(() => {
    if (!form16FastPath) return;
    ensureIncomeChip("salary");
  }, [form16FastPath, ensureIncomeChip]);

  useEffect(() => {
    setMatrix({ age: profileAgeToMatrixAge(profile.ageBand) });
    applySeniorModeFromProfile(profile.ageBand, setSeniorMode);
  }, [profile.ageBand, setMatrix, setSeniorMode]);

  const chips = useMemo(() => new Set(incomeChips), [incomeChips]);

  const mostlySalary = chips.has("salary") && !chips.has("freelance") && !chips.has("business_presumptive");
  const hasRent = chips.has("rent_received");
  const soldAssets = chips.has("capital_gains");
  const hasBusiness =
    chips.has("freelance") ||
    chips.has("business_presumptive") ||
    matrix.business === "w" ||
    matrix.business === "v";

  const rec = useMemo(() => resolveRecommendedForm(matrix, chips), [matrix, chips]);

  const showE1 = incomeChips.includes("capital_gains") || rec.form === "ITR-2";
  const showExpert = rec.expert || rec.form === "BLOCK";
  const reasons = getItrPathReasons(rec, matrix);
  const whyNot = getWhyNotItr3(rec);
  const form = rec.form;
  const plainFormLabel = FORM_PLAIN_LABELS[form] ?? form;

  const handleNext = () => setActiveSlide((s) => Math.min(s + 1, slides.length - 1));
  const handlePrev = () => setActiveSlide((s) => Math.max(s - 1, 0));

  const setMostlySalary = useCallback((yes: boolean) => {
    if (yes) {
      if (!incomeChips.includes("salary")) toggleIncomeChip("salary");
      setMatrix({ business: "x" });
    } else if (incomeChips.includes("salary")) toggleIncomeChip("salary");
    setTimeout(handleNext, 300);
  }, [incomeChips, setMatrix, toggleIncomeChip]);

  const setHasRent = useCallback((yes: boolean) => {
    const has = incomeChips.includes("rent_received");
    if (yes && !has) toggleIncomeChip("rent_received");
    if (!yes && has) toggleIncomeChip("rent_received");
    setTimeout(handleNext, 300);
  }, [incomeChips, toggleIncomeChip]);

  const setSoldAssets = useCallback((yes: boolean) => {
    const has = incomeChips.includes("capital_gains");
    if (yes && !has) {
      toggleIncomeChip("capital_gains");
      setMatrix({ business: "z" });
    }
    if (!yes && has) toggleIncomeChip("capital_gains");
    setTimeout(handleNext, 300);
  }, [incomeChips, setMatrix, toggleIncomeChip]);

  const setHasBusiness = useCallback((yes: boolean) => {
    if (yes) {
      if (!incomeChips.includes("freelance")) toggleIncomeChip("freelance");
      setMatrix({ business: "w" });
    } else {
      if (incomeChips.includes("freelance")) toggleIncomeChip("freelance");
      if (incomeChips.includes("business_presumptive")) toggleIncomeChip("business_presumptive");
      if (matrix.business === "w" || matrix.business === "v") setMatrix({ business: "x" });
    }
    setTimeout(handleNext, 300);
  }, [incomeChips, matrix.business, setMatrix, toggleIncomeChip]);

  const handleAgeChange = (age: AgeBand) => {
    setMatrix({ age });
    const ageBand = matrixAgeToProfileAge(age);
    setProfile({ ageBand });
    applySeniorModeFromProfile(ageBand, setSeniorMode);
    setTimeout(handleNext, 300);
  };

  const handleContinue = () => {
    applySeniorModeFromProfile(profile.ageBand, setSeniorMode);
    setRecommendedForm(rec.form, rec.caseId);
    if (form16FastPath) {
      router.push(buildParsingForm16Url());
      return;
    }
    router.push("/file/import/documents");
  };

  const form16Uploaded = connectedConnectors.includes("form16");
  const extraChips = INCOME_CHIPS.filter((c) => EXTRA_CHIP_IDS.has(c.id));

  // The Slides Array
  const slides = [];

  if (showIdentity) {
    slides.push({
      id: "identity",
      title: firstName ? `Hi ${firstName}, let's get your details` : "Your details",
      subtitle: "Secure your filing journey.",
      icon: User,
      render: () => (
        <div className="space-y-6">
          <WhyWeNeedThis>
            <p>Your PAN links your return to the Income Tax Department.</p>
            <p>We store documents only with your consent.</p>
          </WhyWeNeedThis>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PlainEnglishField
              govLabel="Permanent account number"
              simpleLabel="PAN number"
              helper="10 characters"
              placeholder="ABCDE1234F"
              maxLength={10}
            />
            <PlainEnglishField
              govLabel="Mobile number registered with ITD"
              simpleLabel="Mobile number"
              helper="Optional now"
              placeholder="9876543210"
              type="tel"
            />
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-blue-300 transition-colors">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => {
                setConsentGiven(e.target.checked);
                if (e.target.checked) setTimeout(handleNext, 300);
              }}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700">
              I consent to secure storage of my tax documents for ITR preparation.
            </span>
          </label>
          <div className="flex justify-end pt-4">
            <button
              onClick={handleNext}
              disabled={!consentGiven}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              Next <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )
    });
  }

  slides.push({
    id: "salary",
    title: firstName ? `${firstName}, is your income mostly from salary?` : "Is your income mostly from salary?",
    subtitle: "We use this to determine the complexity of your ITR.",
    icon: Wallet,
    render: () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setMostlySalary(true)}
          className={cn(
            "flex flex-col items-center justify-center gap-4 rounded-2xl border-2 p-8 transition-all hover:border-blue-400 hover:bg-blue-50/50",
            mostlySalary ? "border-blue-600 bg-blue-50/80" : "border-slate-100 bg-white"
          )}
        >
          <div className={cn("rounded-full p-4 text-white", mostlySalary ? "bg-blue-600" : "bg-slate-300")}>
            <Check className="size-8" />
          </div>
          <span className="text-lg font-semibold text-slate-900">Yes, mostly salary</span>
        </button>
        <button
          onClick={() => setMostlySalary(false)}
          className={cn(
            "flex flex-col items-center justify-center gap-4 rounded-2xl border-2 p-8 transition-all hover:border-blue-400 hover:bg-blue-50/50",
            !mostlySalary && !chips.has("salary") ? "border-blue-600 bg-blue-50/80" : "border-slate-100 bg-white"
          )}
        >
          <div className={cn("rounded-full p-4 text-white", !mostlySalary && !chips.has("salary") ? "bg-blue-600" : "bg-slate-300")}>
            <Check className="size-8" />
          </div>
          <span className="text-lg font-semibold text-slate-900">Not mostly salary</span>
        </button>
      </div>
    )
  });

  slides.push({
    id: "rent",
    title: "Did you receive rent from a property?",
    subtitle: "Select yes if you own a house and have put it on rent.",
    icon: Home,
    render: () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setHasRent(true)}
          className={cn(
            "flex flex-col items-center justify-center gap-4 rounded-2xl border-2 p-8 transition-all hover:border-blue-400 hover:bg-blue-50/50",
            hasRent ? "border-blue-600 bg-blue-50/80" : "border-slate-100 bg-white"
          )}
        >
          <div className={cn("rounded-full p-4 text-white", hasRent ? "bg-blue-600" : "bg-slate-300")}>
            <Check className="size-8" />
          </div>
          <span className="text-lg font-semibold text-slate-900">Yes, received rent</span>
        </button>
        <button
          onClick={() => setHasRent(false)}
          className={cn(
            "flex flex-col items-center justify-center gap-4 rounded-2xl border-2 p-8 transition-all hover:border-blue-400 hover:bg-blue-50/50",
            !hasRent ? "border-blue-600 bg-blue-50/80" : "border-slate-100 bg-white"
          )}
        >
          <div className={cn("rounded-full p-4 text-white", !hasRent ? "bg-blue-600" : "bg-slate-300")}>
            <Check className="size-8" />
          </div>
          <span className="text-lg font-semibold text-slate-900">No rent</span>
        </button>
      </div>
    )
  });

  slides.push({
    id: "assets",
    title: "Did you sell shares, property, or crypto?",
    subtitle: "Required for Capital Gains (ITR-2/3).",
    icon: TrendingUp,
    render: () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setSoldAssets(true)}
          className={cn(
            "flex flex-col items-center justify-center gap-4 rounded-2xl border-2 p-8 transition-all hover:border-blue-400 hover:bg-blue-50/50",
            soldAssets ? "border-blue-600 bg-blue-50/80" : "border-slate-100 bg-white"
          )}
        >
          <div className={cn("rounded-full p-4 text-white", soldAssets ? "bg-blue-600" : "bg-slate-300")}>
            <Check className="size-8" />
          </div>
          <span className="text-lg font-semibold text-slate-900">Yes, sold assets</span>
        </button>
        <button
          onClick={() => setSoldAssets(false)}
          className={cn(
            "flex flex-col items-center justify-center gap-4 rounded-2xl border-2 p-8 transition-all hover:border-blue-400 hover:bg-blue-50/50",
            !soldAssets ? "border-blue-600 bg-blue-50/80" : "border-slate-100 bg-white"
          )}
        >
          <div className={cn("rounded-full p-4 text-white", !soldAssets ? "bg-blue-600" : "bg-slate-300")}>
            <Check className="size-8" />
          </div>
          <span className="text-lg font-semibold text-slate-900">No sales</span>
        </button>
      </div>
    )
  });

  slides.push({
    id: "business",
    title: "Do you run a business or freelance?",
    subtitle: "Important for deciding between ITR-1, ITR-3, and ITR-4.",
    icon: Briefcase,
    render: () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setHasBusiness(true)}
          className={cn(
            "flex flex-col items-center justify-center gap-4 rounded-2xl border-2 p-8 transition-all hover:border-blue-400 hover:bg-blue-50/50",
            hasBusiness ? "border-blue-600 bg-blue-50/80" : "border-slate-100 bg-white"
          )}
        >
          <div className={cn("rounded-full p-4 text-white", hasBusiness ? "bg-blue-600" : "bg-slate-300")}>
            <Check className="size-8" />
          </div>
          <span className="text-lg font-semibold text-slate-900">Yes, business/freelance</span>
        </button>
        <button
          onClick={() => setHasBusiness(false)}
          className={cn(
            "flex flex-col items-center justify-center gap-4 rounded-2xl border-2 p-8 transition-all hover:border-blue-400 hover:bg-blue-50/50",
            !hasBusiness ? "border-blue-600 bg-blue-50/80" : "border-slate-100 bg-white"
          )}
        >
          <div className={cn("rounded-full p-4 text-white", !hasBusiness ? "bg-blue-600" : "bg-slate-300")}>
            <Check className="size-8" />
          </div>
          <span className="text-lg font-semibold text-slate-900">No business</span>
        </button>
      </div>
    )
  });

  slides.push({
    id: "late",
    title: "Are you filing after the July 31 due date?",
    subtitle: "Late filers may be subject to penalty (234F).",
    icon: Calendar,
    render: () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => { setProfile({ lateFiling: true }); setTimeout(handleNext, 300); }}
          className={cn(
            "flex flex-col items-center justify-center gap-4 rounded-2xl border-2 p-8 transition-all hover:border-blue-400 hover:bg-blue-50/50",
            profile.lateFiling === true ? "border-blue-600 bg-blue-50/80" : "border-slate-100 bg-white"
          )}
        >
          <div className={cn("rounded-full p-4 text-white", profile.lateFiling === true ? "bg-blue-600" : "bg-slate-300")}>
            <Check className="size-8" />
          </div>
          <span className="text-lg font-semibold text-slate-900">Yes, filing late</span>
        </button>
        <button
          onClick={() => { setProfile({ lateFiling: false }); setTimeout(handleNext, 300); }}
          className={cn(
            "flex flex-col items-center justify-center gap-4 rounded-2xl border-2 p-8 transition-all hover:border-blue-400 hover:bg-blue-50/50",
            profile.lateFiling === false ? "border-blue-600 bg-blue-50/80" : "border-slate-100 bg-white"
          )}
        >
          <div className={cn("rounded-full p-4 text-white", profile.lateFiling === false ? "bg-blue-600" : "bg-slate-300")}>
            <Check className="size-8" />
          </div>
          <span className="text-lg font-semibold text-slate-900">No, on time</span>
        </button>
      </div>
    )
  });

  slides.push({
    id: "income",
    title: "Approximate total income",
    subtitle: "Select your total annual income bracket.",
    icon: Banknote,
    render: () => (
      <div className="space-y-6">
        <SelectInput
          value={matrix.income}
          onChange={(v) => {
            setMatrix({ income: v as IncomeBand });
            setTimeout(handleNext, 300);
          }}
          options={[
            { value: "1", label: "Up to ₹5 lakh" },
            { value: "2", label: "₹5L – ₹10L" },
            { value: "3", label: "₹10L – ₹25L" },
            { value: "4", label: "₹25L – ₹50L" },
            { value: "5", label: "Above ₹50L" },
          ]}
        />
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            onClick={handleNext}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700"
          >
            Next <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    )
  });

  slides.push({
    id: "age",
    title: "Age band",
    subtitle: "Determines basic exemption limit and 80TTB eligibility.",
    icon: User,
    render: () => (
      <div className="space-y-6">
        <SelectInput
          value={matrix.age}
          onChange={(v) => handleAgeChange(v as AgeBand)}
          options={[
            { value: "a", label: "Under 60" },
            { value: "b", label: "60–64 (senior)" },
            { value: "c", label: "65–79" },
            { value: "d", label: "80+ (super senior)" },
            { value: "e", label: "Under 18 (clubbed with parent)" },
          ]}
        />
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            onClick={handleNext}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700"
          >
            Review ITR Form <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    )
  });

  slides.push({
    id: "review",
    title: "Review & Confirmation",
    subtitle: "Based on your answers, here is your recommended form.",
    icon: FileCheck2,
    render: () => (
      <div className="space-y-6">
        <Card className="flex items-center gap-3 bg-blue-50/50 border-blue-200">
          <FileCheck2 className="size-6 shrink-0 text-blue-600" />
          <div>
            <p className="text-base font-bold text-slate-900">
              Recommended: {form}
            </p>
            <p className="text-sm text-slate-600">
              {plainFormLabel}
              {rec.expert ? ` · ${COMPLEX_CASE_FLAG}` : ` · ${SELF_FILE_ELIGIBLE}`}
            </p>
          </div>
        </Card>

        {!showE1 && !showExpert && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <Card recommended>
              <h3 className="mb-3 font-semibold text-slate-900">
                {form} recommended
              </h3>
              <ul className="space-y-2 text-sm text-slate-700">
                {reasons.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className="text-emerald-600 font-bold">✓</span> {r}
                  </li>
                ))}
              </ul>
            </Card>

            <label className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/30 p-4 hover:bg-blue-50 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={itrConfirmed}
                onChange={(e) => setItrConfirmed(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-blue-900">
                I confirm to use {form} for this filing.
              </span>
            </label>

            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  resetEligibilityStep();
                  setActiveSlide(0);
                }}
                className="text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                Reset answers
              </button>
              <button
                onClick={handleContinue}
                disabled={!itrConfirmed || (showIdentity && !consentGiven)}
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800 disabled:opacity-50"
              >
                Continue <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {showE1 && !showExpert && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <Banner variant="critical">
              ITR-1 is not allowed when you have short-term capital gains or certain
              other income types.
            </Banner>
            <Card recommended>
              <h3 className="font-semibold text-slate-900">Use ITR-2 instead</h3>
              <p className="mt-2 text-sm text-slate-600">
                Upload your broker capital gains statement on the next screen.
              </p>
            </Card>
            <button
              onClick={handleContinue}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800"
            >
              Continue with ITR-2 <ChevronRight className="size-4" />
            </button>
          </div>
        )}

        {showExpert && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <Banner variant="warning">
              <strong>{COMPLEX_CASE_ESCALATION_TITLE}.</strong> {COMPLEX_CASE_ESCALATION_BODY}
            </Banner>
            <Card recommended>
              <h3 className="font-semibold text-slate-900">
                {rec.form === "BLOCK"
                  ? "Parent must file for minor"
                  : `${rec.form} · Professional review recommended`}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{rec.reason}</p>
            </Card>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push(filingPath === "cabrain" ? "/file/cabrain" : "/file/checkout/plans")}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700"
              >
                Consult CA
              </button>
              <button
                onClick={handleContinue}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white border-2 border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
              >
                Self file anyway
              </button>
            </div>
          </div>
        )}
      </div>
    )
  });

  const CurrentSlide = slides[activeSlide];
  const Icon = CurrentSlide.icon;

  return (
    <FilingLayout
      mirrorText="Residency and income type decide which ITR form you must use. We match you to the simplest form the law allows — wrong form means notices later."
    >
      {/* Horizontal Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Step {activeSlide + 1} of {slides.length}
          </span>
          <span className="text-xs font-semibold text-blue-600">
            {Math.round(((activeSlide + 1) / slides.length) * 100)}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
          {slides.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-full transition-all duration-300 flex-1",
                i <= activeSlide ? "bg-blue-600" : "bg-transparent"
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Icon className="size-5" />
            </span>
            {CurrentSlide.title}
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-xl">
            {CurrentSlide.subtitle}
          </p>
        </div>
        {/* Navigation Buttons for the wizard */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={activeSlide === 0}
            className="flex size-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={handleNext}
            disabled={activeSlide === slides.length - 1}
            className="flex size-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      {/* Slide Content Container with Animation Wrapper */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-10 shadow-sm min-h-[400px]">
        <div key={activeSlide} className="animate-in fade-in slide-in-from-right-8 duration-500 fill-mode-forwards">
          {CurrentSlide.render()}
        </div>
      </div>

    </FilingLayout>
  );
}

export default function EligibilityPage() {
  return (
    <Suspense fallback={<div className="p-12 text-slate-600">Loading…</div>}>
      <EligibilityContent />
    </Suspense>
  );
}
