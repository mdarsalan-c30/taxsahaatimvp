"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FilingLayout } from "@/components/filing/FilingLayout";
import ConnectorGrid from "@/components/filing/connectors/ConnectorGrid";
import {
  QuickEstimateForm,
  EMPTY_QUICK_ESTIMATE,
  type QuickEstimateValues,
} from "@/components/filing/import/QuickEstimateForm";
import {
  Banner,
  Button,
  FilingActions,
  CardGrid,
  ModeCard,
  ResetStepButton,
  ScreenTitle,
} from "@/components/filing/ui";
import { ItrAnalyticsPanel } from "@/components/filing/ItrAnalyticsPanel";
import { WhyWeAskHint } from "@/components/filing/WhyWeAskHint";
import { WHY_WE_ASK } from "@/lib/copy/trust";
import { FILING_IMPORT } from "@/lib/copy/filing";
import { useDraftStore } from "@/lib/store/draft";
import { trackEvent } from "@/lib/analytics";
import { useDraftTaxCompute } from "@/lib/hooks/useDraftTaxCompute";
import { useItrAiSummary } from "@/lib/hooks/useItrAiSummary";
import {
  applySalariedFastPathDefaults,
  FORM16_FAST_PATH_SOURCE,
  isForm16FastPath,
} from "@/lib/filing/routes";
import { FILING_WORKSPACE } from "@/lib/design/layout";
import {
  getImportContinueHref,
  IMPORT_START_MODES,
  type ImportStartMode,
} from "@/lib/filing/importModes";

function DocumentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    name,
    income,
    deductions,
    setName,
    setFilingMode,
    setFilingPath,
    ensureIncomeChip,
    setItrConfirmed,
    setIncome,
    setDeductions,
    connectedConnectors,
    lastParseResult,
  } = useDraftStore();
  const form16FastPath = isForm16FastPath(searchParams);
  const addEmployerMode = searchParams.get("addEmployer") === "1";
  const form16Connected = connectedConnectors.includes("form16");
  const [importMode, setImportMode] = useState<ImportStartMode | null>(null);
  const [estimateValues, setEstimateValues] = useState<QuickEstimateValues>({
    grossSalary: income.grossSalary,
    tds: income.tds,
    section80C: deductions.section80C,
    section80D: deductions.section80D,
  });
  const { result: taxResult } = useDraftTaxCompute();
  const taxSnapshot = useMemo(
    () =>
      taxResult
        ? {
            recommendedRegime: taxResult.regime_comparison.recommended_regime,
            taxOld: taxResult.regime_comparison.old.total_tax,
            taxNew: taxResult.regime_comparison.new.total_tax,
            taxSaving: taxResult.regime_comparison.tax_saving,
            refundEstimate:
              taxResult.regime_comparison.recommended_regime === "old"
                ? taxResult.regime_comparison.old.net_payable
                : taxResult.regime_comparison.new.net_payable,
          }
        : undefined,
    [taxResult]
  );
  const { aiSummary, aiLoading, aiEnabled } = useItrAiSummary({
    income,
    deductions,
    lastParseResult,
    connectedConnectors,
    taxSnapshot,
    enabled: form16FastPath || importMode === "form16",
  });

  useEffect(() => {
    trackEvent("import_started", {
      source: form16FastPath ? "form16_fast_path" : "documents",
    });
  }, [form16FastPath]);

  useEffect(() => {
    if (!form16FastPath) return;
    applySalariedFastPathDefaults(
      { setName, setFilingMode, setFilingPath, ensureIncomeChip, setItrConfirmed },
      searchParams.get("name")
    );
  }, [
    form16FastPath,
    searchParams,
    setName,
    setFilingMode,
    setFilingPath,
    ensureIncomeChip,
    setItrConfirmed,
  ]);

  const handleModeSelect = useCallback((mode: ImportStartMode) => {
    setImportMode(mode);
    trackEvent("import_mode_selected", { mode });
  }, []);

  const handleClearImportMode = useCallback(() => {
    setImportMode(null);
    setEstimateValues({ ...EMPTY_QUICK_ESTIMATE });
  }, []);

  const applyEstimateDraft = useCallback(() => {
    setFilingMode("estimate");
    setFilingPath("simple");
    ensureIncomeChip("salary");
    setItrConfirmed(true);
    setIncome({
      grossSalary: estimateValues.grossSalary,
      tds: estimateValues.tds,
    });
    setDeductions({
      section80C: estimateValues.section80C,
      section80D: estimateValues.section80D,
    });
    trackEvent("import_estimate_submitted", {
      grossSalary: estimateValues.grossSalary,
      section80C: estimateValues.section80C,
    });
  }, [
    ensureIncomeChip,
    estimateValues,
    setDeductions,
    setFilingMode,
    setFilingPath,
    setIncome,
    setItrConfirmed,
  ]);

  /** Form 16 landing skips mode cards — treat as form16 upload path. */
  const effectiveImportMode: ImportStartMode | null = form16FastPath
    ? "form16"
    : importMode;

  const continueHref =
    effectiveImportMode !== null
      ? getImportContinueHref(effectiveImportMode, {
          form16Connected,
          form16FastPath,
        })
      : null;

  const handleContinue = useCallback(() => {
    if (effectiveImportMode === "manual") {
      if (estimateValues.grossSalary <= 0) return;
      applyEstimateDraft();
      router.push("/file/regime");
      return;
    }
    if (continueHref) {
      router.push(continueHref);
    }
  }, [
    applyEstimateDraft,
    continueHref,
    effectiveImportMode,
    estimateValues.grossSalary,
    router,
  ]);

  const continueLabel = (() => {
    if (effectiveImportMode === null) {
      return "Pick a start option above";
    }
    if (form16FastPath) {
      return form16Connected
        ? "Tell us what else you earned"
        : "Continue — upload Form 16 first";
    }
    if (effectiveImportMode === "form16") {
      return form16Connected
        ? "Review imported figures"
        : "Continue with Form 16";
    }
    if (effectiveImportMode === "manual") {
      return "See my tax estimate";
    }
    return "ERI connect coming soon";
  })();

  const continueDisabled =
    effectiveImportMode === null ||
    effectiveImportMode === "itd" ||
    (effectiveImportMode === "manual" && estimateValues.grossSalary <= 0);

  const whatHappensNext = (() => {
    if (effectiveImportMode === null) {
      return "Choose Form 16 upload, rough estimates, or ITD import — then we'll guide you through the next step.";
    }
    if (form16FastPath) {
      return "Confirm any other income (business, rent, capital gains), then we show every Form 16 figure for you to review (~3 min).";
    }
    if (effectiveImportMode === "manual") {
      return "We compare old vs new tax regime using your rough numbers (~1 min). Upload documents later to sharpen the estimate.";
    }
    if (effectiveImportMode === "itd") {
      return "When ERI connect launches, we'll pull AIS and 26AS directly from incometax.gov.in.";
    }
    return "We read your Form 16 and show every figure for you to confirm (~3 min).";
  })();

  return (
    <FilingLayout
      mirrorText="Form 16 is your employer's summary of salary and TDS. AIS and 26AS show what the tax department already has on record."
    >
      <ScreenTitle
        title={
          form16FastPath
            ? FILING_IMPORT.titleForm16(name || undefined)
            : FILING_IMPORT.titleDefault
        }
        subtitle={
          form16FastPath
            ? FILING_IMPORT.subtitleForm16
            : FILING_IMPORT.subtitleDefault
        }
      />

      <WhyWeAskHint className="mb-4">{WHY_WE_ASK.import}</WhyWeAskHint>

      {!form16FastPath && (
        <>
          <CardGrid className="mb-4 sm:grid-cols-1 lg:grid-cols-3">
            {(Object.keys(IMPORT_START_MODES) as ImportStartMode[]).map((mode) => {
              const config = IMPORT_START_MODES[mode];
              return (
                <ModeCard
                  key={mode}
                  title={config.title}
                  description={config.description}
                  small={config.small}
                  selected={importMode === mode}
                  onClick={() => handleModeSelect(mode)}
                />
              );
            })}
          </CardGrid>
          {importMode !== null && (
            <div className="mb-4">
              <ResetStepButton
                label="Clear selection"
                onClick={handleClearImportMode}
                variant="ghost"
              />
            </div>
          )}
        </>
      )}

      {!form16FastPath && importMode === null && (
        <Banner variant="info">
          Pick how you want to start — upload Form 16, use rough estimates, or wait for
          ITD import.
        </Banner>
      )}

      {!form16FastPath && importMode === "manual" && (
        <div className="mb-6">
          <QuickEstimateForm
            values={estimateValues}
            onChange={setEstimateValues}
          />
        </div>
      )}

      {!form16FastPath && importMode === "itd" && (
        <Banner variant="info">
          <strong>Import from ITD is coming soon.</strong> We&apos;re building a
          secure ERI connection to pull AIS and Form 26AS automatically. For now,
          upload Form 16 or start with rough salary estimates.
        </Banner>
      )}

      {(form16FastPath || importMode === "form16") && (
        <div className={FILING_WORKSPACE.importLayout}>
          <div className="min-w-0 space-y-4">
            {addEmployerMode && (
              <Banner variant="info">
                <strong>Adding another Form 16 (job change).</strong> Upload the
                next employer&apos;s Form 16 — we add its salary and TDS to your
                existing total instead of replacing it.
              </Banner>
            )}
            <ConnectorGrid
              highlightConnectorId={
                form16FastPath ? FORM16_FAST_PATH_SOURCE : "form16"
              }
              form16FastPath={form16FastPath}
              appendAsEmployer={addEmployerMode}
            />
          </div>
          <ItrAnalyticsPanel
            income={income}
            deductions={deductions}
            lastParseResult={lastParseResult}
            connectedConnectors={connectedConnectors}
            aiSummary={aiSummary}
            aiLoading={aiLoading}
            aiEnabled={aiEnabled}
            taxSnapshot={taxSnapshot}
          />
        </div>
      )}

      {(form16FastPath || importMode === "form16") && (
        <div className="mt-6">
          <Banner variant="warning">
            Missing recommended: AIS · Form 26AS
          </Banner>
        </div>
      )}

      <FilingActions
        hint={
          <p className="text-tier-feature">
            <strong>What happens next:</strong> {whatHappensNext}
          </p>
        }
      >
        {continueHref && effectiveImportMode !== "manual" ? (
          <Button href={continueHref} disabled={continueDisabled}>
            {continueLabel}
          </Button>
        ) : (
          <Button onClick={handleContinue} disabled={continueDisabled}>
            {continueLabel}
          </Button>
        )}
        {importMode === "form16" && (
          <Link
            href="/file/import/tds"
            className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline"
          >
            TDS & advance tax →
          </Link>
        )}
      </FilingActions>
    </FilingLayout>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-slate-600">Loading…</div>}>
      <DocumentsContent />
    </Suspense>
  );
}
