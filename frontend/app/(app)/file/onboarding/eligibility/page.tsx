"use client";

import { Suspense, useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDraftStore } from "@/lib/store/draft";
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
  OnboardingActions,
  OnboardingProgress,
  FormSection,
  WhyWeNeedThis,
  FieldGroup,
} from "@/components/filing/OnboardingForm";
import {
  Banner,
  Card,
  Chip,
  ResetStepButton,
  ScreenTitle,
  SelectInput,
} from "@/components/filing/ui";
import { PlainEnglishField } from "@/components/filing/PlainEnglishField";
import { FileCheck2 } from "lucide-react";
import {
  CA_REVIEW_COMING_SOON,
  COMPLEX_CASE_ESCALATION_BODY,
  COMPLEX_CASE_ESCALATION_TITLE,
  COMPLEX_CASE_FLAG,
  ESCALATION_CTA_PRIMARY,
  ESCALATION_CTA_SECONDARY,
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

function profileAgeToMatrixAge(
  ageBand: "under_60" | "senior" | "super_senior"
): AgeBand {
  if (ageBand === "senior") return "b";
  if (ageBand === "super_senior") return "d";
  return "a";
}

function matrixAgeToProfileAge(
  age: AgeBand
): "under_60" | "senior" | "super_senior" {
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

  const rec = useMemo(
    () => resolveRecommendedForm(matrix, chips),
    [matrix, chips]
  );

  const showE1 =
    incomeChips.includes("capital_gains") || rec.form === "ITR-2";
  const showExpert = rec.expert || rec.form === "BLOCK";
  const reasons = getItrPathReasons(rec, matrix);
  const whyNot = getWhyNotItr3(rec);
  const form = rec.form;
  const plainFormLabel = FORM_PLAIN_LABELS[form] ?? form;

  const setMostlySalary = useCallback(
    (yes: boolean) => {
      if (yes) {
        if (!incomeChips.includes("salary")) toggleIncomeChip("salary");
        setMatrix({ business: "x" });
      } else if (incomeChips.includes("salary")) {
        toggleIncomeChip("salary");
      }
    },
    [incomeChips, setMatrix, toggleIncomeChip]
  );

  const setHasRent = useCallback(
    (yes: boolean) => {
      const has = incomeChips.includes("rent_received");
      if (yes && !has) toggleIncomeChip("rent_received");
      if (!yes && has) toggleIncomeChip("rent_received");
    },
    [incomeChips, toggleIncomeChip]
  );

  const setSoldAssets = useCallback(
    (yes: boolean) => {
      const has = incomeChips.includes("capital_gains");
      if (yes && !has) {
        toggleIncomeChip("capital_gains");
        setMatrix({ business: "z" });
      }
      if (!yes && has) toggleIncomeChip("capital_gains");
    },
    [incomeChips, setMatrix, toggleIncomeChip]
  );

  const setHasBusiness = useCallback(
    (yes: boolean) => {
      if (yes) {
        if (!incomeChips.includes("freelance")) toggleIncomeChip("freelance");
        setMatrix({ business: "w" });
      } else {
        if (incomeChips.includes("freelance")) toggleIncomeChip("freelance");
        if (incomeChips.includes("business_presumptive"))
          toggleIncomeChip("business_presumptive");
        if (matrix.business === "w" || matrix.business === "v") {
          setMatrix({ business: "x" });
        }
      }
    },
    [incomeChips, matrix.business, setMatrix, toggleIncomeChip]
  );

  const handleAgeChange = (age: AgeBand) => {
    setMatrix({ age });
    const ageBand = matrixAgeToProfileAge(age);
    setProfile({ ageBand });
    applySeniorModeFromProfile(ageBand, setSeniorMode);
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
  const showStepOne = showIdentity && !form16FastPath;
  const totalSteps = showStepOne ? 2 : 1;
  const identityBlocked = showStepOne && !consentGiven;
  const continueDisabled = !itrConfirmed || identityBlocked;
  const nextStepHint = form16FastPath
    ? "Review salary and TDS from your Form 16, then cross-check against AIS."
    : "Upload Form 16 — we pre-fill salary and TDS, then cross-check against AIS.";

  const handleSkipIdentity = () => {
    router.push("/file/import/documents");
  };

  const handleResetStep = () => {
    resetEligibilityStep();
  };

  const handleStartOver = () => {
    resetOnboardingProfile();
    resetEligibilityStep();
  };

  const hasEligibilitySelections =
    incomeChips.length > 0 ||
    profile.residentialStatus !== "resident" ||
    matrix.income !== "2" ||
    matrix.age !== "a" ||
    matrix.business !== "x" ||
    itrConfirmed;

  return (
    <FilingLayout
      mirrorText="Residency and income type decide which ITR form you must use. We match you to the simplest form the law allows — wrong form means notices later."
    >
      <OnboardingProgress
        current={showStepOne ? 1 : 1}
        total={totalSteps}
        label={showStepOne ? "Your details & income" : "Your income"}
      />

      <ScreenTitle
        title={
          form16FastPath
            ? "Anything else this year?"
            : aboutYouStep && name
              ? `Hi ${name}, about you`
              : "About you"
        }
        subtitle={
          form16FastPath
            ? form16Uploaded
              ? "We read your Form 16 for salary and TDS. Tell us about any other income so we pick the right ITR form."
              : "Salary from Form 16 is assumed — tell us about rent, business, capital gains, or other income before we review your PDF."
            : "Two quick steps: confirm who you are, then tell us about your income so we pick the right ITR form."
        }
      />

      {form16FastPath && (
        <div className="mb-4">
          <Banner variant="info">
            Salary is pre-filled from your Form 16 upload. Still answer the questions
            below — business or capital gains change which ITR form you need.
          </Banner>
        </div>
      )}

      {showStepOne && (
        <FormSection
          step={1}
          totalSteps={totalSteps}
          title="Your details"
          description="Used to pre-fill your return and keep your documents secure on this device."
          requirement="required"
        >
          <WhyWeNeedThis>
            <p>
              Your PAN links your return to the Income Tax Department. Your mobile
              number is used for payment and export steps on the government portal.
            </p>
            <p>
              We store documents only with your consent — you can delete them any
              time. We never auto-file on your behalf.
            </p>
          </WhyWeNeedThis>

          <PlainEnglishField
            govLabel="Permanent account number"
            simpleLabel="PAN number"
            helper="10 characters as on your PAN card"
            placeholder="ABCDE1234F"
            maxLength={10}
            glossaryTerm="PAN"
          />
          <PlainEnglishField
            govLabel="Mobile number registered with ITD"
            simpleLabel="Mobile number"
            helper="Optional now — needed before you pay or export"
            placeholder="9876543210"
            type="tel"
          />

          <FieldGroup
            label="Document storage consent"
            requirement="required"
            helper="Required to continue with document upload."
          >
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary"
              />
              <span className="text-sm leading-relaxed text-slate-700">
                I consent to secure storage of my tax documents for ITR preparation.
              </span>
            </label>
          </FieldGroup>
        </FormSection>
      )}

      <FormSection
        step={showStepOne ? 2 : 1}
        totalSteps={totalSteps}
        title="Your income situation"
        description={`Filing for ${profile.assessmentYear}. Answer a few yes/no questions so we recommend the correct ITR form.`}
        requirement="required"
      >
        <WhyWeNeedThis>
          <p>{WHY_WE_ASK.profileIncome}</p>
          <p className="text-tier-feature text-muted-foreground">{NO_CA_REPLACEMENT}</p>
        </WhyWeNeedThis>

        <FieldGroup
          label="Residential status"
          requirement="required"
          helper="Non-residents and RNOR may need ITR-2 or a tax professional — we flag that early."
        >
          <SelectInput
            value={profile.residentialStatus}
            onChange={(v) =>
              setProfile({
                residentialStatus: v as typeof profile.residentialStatus,
              })
            }
            options={[
              { value: "resident", label: "Resident" },
              { value: "non_resident", label: "Non-resident" },
              { value: "rnor", label: "RNOR" },
            ]}
          />
        </FieldGroup>

        <div className="space-y-5 border-t border-slate-100 pt-4">
          <p className="text-sm font-semibold text-slate-800">
            What kind of income do you have?
          </p>
          <FieldGroup label="Is your income mostly from salary?" requirement="required">
            <div className="flex flex-wrap gap-2">
              <Chip label="Yes, salary only" selected={mostlySalary} onClick={() => setMostlySalary(true)} />
              <Chip label="Not mostly salary" selected={!mostlySalary && !chips.has("salary")} onClick={() => setMostlySalary(false)} />
            </div>
          </FieldGroup>
          <FieldGroup label="Did you receive rent from a property?" requirement="required">
            <div className="flex flex-wrap gap-2">
              <Chip label="Yes, rent" selected={hasRent} onClick={() => setHasRent(true)} />
              <Chip label="No rent" selected={!hasRent} onClick={() => setHasRent(false)} />
            </div>
          </FieldGroup>
          <FieldGroup label="Did you sell shares, property, or crypto?" requirement="required">
            <div className="flex flex-wrap gap-2">
              <Chip label="Yes, sold assets" selected={soldAssets} onClick={() => setSoldAssets(true)} />
              <Chip label="No sales" selected={!soldAssets} onClick={() => setSoldAssets(false)} />
            </div>
          </FieldGroup>
          <FieldGroup label="Do you run a business or freelance?" requirement="required">
            <div className="flex flex-wrap gap-2">
              <Chip label="Yes, business / freelance" selected={hasBusiness} onClick={() => setHasBusiness(true)} />
              <Chip label="No business" selected={!hasBusiness} onClick={() => setHasBusiness(false)} />
            </div>
          </FieldGroup>
          <FieldGroup label="Are you filing after the July 31 due date?" requirement="required">
            <div className="flex flex-wrap gap-2">
              <Chip label="Yes, filing late" selected={profile.lateFiling === true} onClick={() => setProfile({ lateFiling: true })} />
              <Chip label="No, on time" selected={profile.lateFiling !== true} onClick={() => setProfile({ lateFiling: false })} />
            </div>
          </FieldGroup>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-4">
          <FieldGroup label="Approximate total income" requirement="required">
            <SelectInput
              value={matrix.income}
              onChange={(v) => setMatrix({ income: v as IncomeBand })}
              options={[
                { value: "1", label: "Up to ₹5 lakh" },
                { value: "2", label: "₹5L – ₹10L" },
                { value: "3", label: "₹10L – ₹25L" },
                { value: "4", label: "₹25L – ₹50L" },
                { value: "5", label: "Above ₹50L" },
              ]}
            />
          </FieldGroup>
          <FieldGroup label="Age band" requirement="required">
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
          </FieldGroup>
        </div>
      </FormSection>

      <div className="mb-4 flex flex-wrap gap-2">
        {hasEligibilitySelections && (
          <ResetStepButton label="Reset this step" onClick={handleResetStep} />
        )}
        {showStepOne && (name || consentGiven || hasEligibilitySelections) && (
          <ResetStepButton
            label="Start over"
            onClick={handleStartOver}
            variant="ghost"
          />
        )}
      </div>

      {(profile.ageBand === "senior" || profile.ageBand === "super_senior") && (
        <Banner variant="info">
          Senior citizens: higher basic exemption and 80TTB may apply to bank interest.
        </Banner>
      )}

      {extraChips.length > 0 && (
        <FormSection
          title="Anything else?"
          description="Only select if these apply — most salaried filers can skip this."
          requirement="optional"
        >
          <div className="flex flex-wrap gap-2">
            {extraChips.map((chip) => (
              <Chip
                key={chip.id}
                label={chip.label}
                selected={incomeChips.includes(chip.id)}
                onClick={() => toggleIncomeChip(chip.id)}
              />
            ))}
          </div>
        </FormSection>
      )}

      <Card className="flex items-center gap-3 bg-primary/5">
        <FileCheck2 className="size-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Recommended: {form}
          </p>
          <p className="text-xs text-muted-foreground">
            {plainFormLabel}
            {rec.expert ? ` · ${COMPLEX_CASE_FLAG}` : ` · ${SELF_FILE_ELIGIBLE}`}
          </p>
        </div>
      </Card>

      {!showE1 && !showExpert && (
        <>
          <Card recommended>
            <h3 className="mb-3 font-semibold text-slate-900">
              {form} recommended
            </h3>
            <ul className="space-y-1.5 text-sm text-slate-700">
              {reasons.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="text-emerald-600">✓</span> {r}
                </li>
              ))}
            </ul>
          </Card>

          <WhyWeNeedThis>
            <p>
              <strong>Why {form}?</strong> Based on your answers: {rec.reason}.
              We matched your income to the simplest form that covers your case.
            </p>
            <p>
              <strong>Why not ITR-3?</strong> {whyNot}
            </p>
          </WhyWeNeedThis>

          <FieldGroup label={`Confirm ${form} for this filing`} requirement="required">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={itrConfirmed}
                onChange={(e) => setItrConfirmed(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary"
              />
              I understand — use {form} for this filing
            </label>
          </FieldGroup>

          <OnboardingActions
            primaryLabel={
              form16FastPath ? "Continue to Form 16 review" : "Continue to documents"
            }
            onPrimary={handleContinue}
            primaryDisabled={continueDisabled}
            secondaryLabel={showStepOne ? "Skip for now" : undefined}
            onSecondary={showStepOne ? handleSkipIdentity : undefined}
            hint={
              <>
                <strong className="font-semibold text-slate-700">What happens next:</strong>{" "}
                {nextStepHint}
              </>
            }
          />
        </>
      )}

      {showE1 && !showExpert && (
        <>
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
          <OnboardingActions
            primaryLabel="Continue with ITR-2"
            onPrimary={handleContinue}
            hint={
              <>
                <strong className="font-semibold text-slate-700">What happens next:</strong>{" "}
                {form16FastPath
                  ? "Review Form 16 figures, then upload your broker capital gains statement."
                  : "Upload your broker capital gains statement on the next screen."}
              </>
            }
          />
        </>
      )}

      {showExpert && (
        <>
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
            <p className="mt-2 text-tier-feature text-muted-foreground">{CA_REVIEW_COMING_SOON}</p>
          </Card>
          <OnboardingActions
            primaryLabel={ESCALATION_CTA_PRIMARY}
            onPrimary={() =>
              router.push(
                filingPath === "cabrain" ? "/file/cabrain" : "/file/checkout/plans"
              )
            }
            secondaryLabel={ESCALATION_CTA_SECONDARY}
            onSecondary={handleContinue}
          />
        </>
      )}
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
