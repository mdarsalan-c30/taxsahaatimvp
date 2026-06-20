"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { FilingLayout } from "@/components/filing/FilingLayout";
import { PortalGuideTable } from "@/components/filing/companion/PortalGuideTable";
import { EngineComputeFallback } from "@/components/filing/EngineComputeFallback";
import {
  Banner,
  Button,
  FilingActions,
  ScreenTitle,
  TrackerSteps,
} from "@/components/filing/ui";
import { OptimizationTips } from "@/components/filing/OptimizationTips";
import { formatINR } from "@/lib/format";
import { FILING_COMPANION } from "@/lib/copy/filing";
import { draftToUserInput } from "@/lib/engine/draftToUserInput";
import {
  draftToPortalSlice,
  fetchPersonalizedPortalGuide,
} from "@/lib/engine/portalGuideEngine";
import { getPortalGuide } from "@/lib/engine/client";
import {
  firstScreenIndexForSection,
  isPortalSectionId,
} from "@/lib/engine/portalSections";
import type { PortalForm, PortalGuideResponse } from "@/lib/engine/types";
import { useTaxCompute } from "@/lib/hooks/useTaxCompute";
import { trackCompanionLoad } from "@/lib/monitoring/events";
import { usePaymentSession } from "@/lib/hooks/usePaymentSession";
import { isClientPaymentBypassEnabled } from "@/lib/payments/bypass";
import { draftSnapshotForLog, logSessionEvent } from "@/lib/sessionLogClient";
import { useDraftStore } from "@/lib/store/draft";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FORMS: PortalForm[] = ["ITR-1", "ITR-2", "ITR-3", "ITR-4"];
type CompanionViewMode = "guided" | "checklist";

const PortalFootprintWizard = dynamic(
  () =>
    import("@/components/filing/companion/PortalFootprintWizard").then(
      (mod) => mod.PortalFootprintWizard
    ),
  {
    loading: () => <PortalFootprintWizardSkeleton />,
    ssr: false,
  }
);

function PortalFootprintWizardSkeleton() {
  return (
    <div
      className="mb-6 rounded-xl border border-slate-200 bg-white p-6 animate-pulse"
      aria-hidden
    >
      <div className="h-5 w-48 rounded bg-slate-100" />
      <div className="mt-4 h-40 rounded-lg bg-slate-100" />
      <div className="mt-4 flex gap-2">
        <div className="h-10 w-24 rounded bg-slate-100" />
        <div className="h-10 w-24 rounded bg-slate-100" />
      </div>
    </div>
  );
}

function CompanionPageFallback() {
  return (
    <FilingLayout mirrorText="Loading your portal guide…">
      <div
        className="animate-pulse space-y-4"
        aria-busy="true"
        aria-label="Loading companion"
      >
        <div className="h-8 w-64 max-w-full rounded bg-slate-100" />
        <div className="h-4 w-full max-w-lg rounded bg-slate-100" />
        <div className="h-48 rounded-xl bg-slate-100" />
      </div>
    </FilingLayout>
  );
}

export default function CompanionPage() {
  return (
    <Suspense fallback={<CompanionPageFallback />}>
      <CompanionContent />
    </Suspense>
  );
}

function CompanionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draft = useDraftStore();
  const { session, loading: sessionLoading } = usePaymentSession();
  const userInput = useMemo(() => draftToUserInput(draft), [draft]);
  const { result, compute, loading: computing, error: computeError, engineUnavailable, lastSnapshot } = useTaxCompute();
  const [useSnapshot, setUseSnapshot] = useState(false);
  const effectiveResult = result ?? (useSnapshot ? lastSnapshot : null);
  const [form, setForm] = useState<PortalForm>(
    (draft.recommendedForm as PortalForm) || "ITR-1"
  );
  const [guide, setGuide] = useState<PortalGuideResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [viewMode, setViewMode] = useState<CompanionViewMode>("guided");
  const companionLoggedRef = useRef(false);

  const paymentBypass = isClientPaymentBypassEnabled();
  const exportUnlocked =
    paymentBypass ||
    (!sessionLoading && session?.verified === true && session.companionAccess === true);

  const justUnlocked = searchParams.get("unlocked") === "1" && exportUnlocked;
  const sectionParam = searchParams.get("section");

  const initialScreenId = useMemo(() => {
    const screens = guide?.footprintScreens;
    if (!screens || screens.length === 0 || !isPortalSectionId(sectionParam)) {
      return undefined;
    }
    const idx = firstScreenIndexForSection(screens, sectionParam);
    return idx >= 0 ? screens[idx].id : undefined;
  }, [guide?.footprintScreens, sectionParam]);

  const loadGuide = useCallback(async () => {
    if (!exportUnlocked) return;
    setLoading(true);
    setLoadError(null);
    setLoadWarning(null);
    const loadStartedAt = Date.now();
    try {
      const mismatches = draft.mismatchResolved ? [] : ["import-mismatch"];
      const data = await fetchPersonalizedPortalGuide({
        form,
        draft: draftToPortalSlice(draft),
        computeResult: effectiveResult ?? undefined,
        userInput,
        completedSteps: [],
        mismatches,
        paymentUnlocked: exportUnlocked,
      });
      setGuide(data);
      trackCompanionLoad({
        source: "client",
        form,
        durationMs: Date.now() - loadStartedAt,
      });
    } catch (err) {
      try {
        const fallback = await getPortalGuide(form);
        setGuide(fallback);
        setLoadWarning(
          "Personalized guide unavailable — showing standard checklist without your computed values."
        );
        trackCompanionLoad({
          source: "client",
          form,
          durationMs: Date.now() - loadStartedAt,
          error: "personalized_failed_used_static_fallback",
        });
      } catch {
        setGuide(null);
        setLoadError(
          err instanceof Error
            ? err.message
            : "We could not load your portal guide. Please try again."
        );
        trackCompanionLoad({
          source: "client",
          form,
          durationMs: Date.now() - loadStartedAt,
          error: err instanceof Error ? err.message : "unknown",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [exportUnlocked, form, effectiveResult, draft, userInput]);

  useEffect(() => {
    if (!exportUnlocked || companionLoggedRef.current) return;
    companionLoggedRef.current = true;
    void logSessionEvent("companion_open", {
      draft: draftSnapshotForLog(useDraftStore.getState()),
      meta: { form, bypass: paymentBypass },
    });
  }, [exportUnlocked, paymentBypass, form]);

  useEffect(() => {
    if (paymentBypass) return;
    if (!exportUnlocked) {
      router.replace("/file/checkout/plans?reason=companion");
    }
  }, [exportUnlocked, paymentBypass, router]);

  useEffect(() => {
    if (!exportUnlocked) return;
    compute(userInput);
  }, [compute, exportUnlocked, userInput]);

  useEffect(() => {
    if (!exportUnlocked) return;
    loadGuide();
  }, [exportUnlocked, loadGuide, retryKey]);

  if (!exportUnlocked) {
    return (
      <FilingLayout mirrorText="Checking whether your portal guide is unlocked…">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-medium text-slate-900">
            {sessionLoading ? "Checking payment access…" : "Redirecting to plans…"}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            One moment — we will take you to checkout if your guide is not unlocked yet.
          </p>
        </div>
      </FilingLayout>
    );
  }

  const handleRetry = () => setRetryKey((k) => k + 1);

  const mismatchBlock =
    !draft.mismatchResolved || (guide?.hasMismatches ?? false);

  return (
    <FilingLayout
      variant="companion"
      mirrorText="Each row maps to a field on the government portal. Copy values exactly — typos cause validation errors when you submit on incometax.gov.in."
    >
      <div className="companion-page-grid">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <ScreenTitle
                title={FILING_COMPANION.title}
                subtitle={FILING_COMPANION.subtitle}
                badge={
                  <span className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary">
                    Personal filing guide
                  </span>
                }
              />
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center lg:pt-8">
              <label htmlFor="companion-form" className="text-sm font-medium text-slate-700">
                ITR form
              </label>
              <select
                id="companion-form"
                value={form}
                onChange={(e) => setForm(e.target.value as PortalForm)}
                className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:w-auto"
              >
                {FORMS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              {(computing || loading) && (
                <span className="text-sm text-slate-500">Loading figures…</span>
              )}
            </div>
          </div>

      {justUnlocked && (
        <Banner variant="success">
          Your portal guide is unlocked — copy each value into incometax.gov.in as you
          go. {guide ? `${guide.steps.length} steps` : "Loading steps…"} with your
          return numbers pre-filled.
        </Banner>
      )}

      <EngineComputeFallback
        loading={computing}
        error={computeError}
        engineUnavailable={engineUnavailable}
        lastSnapshot={lastSnapshot}
        onRetry={() => {
          setUseSnapshot(false);
          void compute(userInput);
        }}
        onContinueWithSnapshot={() => setUseSnapshot(true)}
      />

      {loadWarning && (
        <div className="mb-4">
          <Banner variant="warning">{loadWarning}</Banner>
        </div>
      )}

      {loadError && !loading && (
        <div
          className="mb-6 rounded-xl border border-red-200 bg-red-50 p-6 text-center"
          role="alert"
        >
          <p className="text-sm font-medium text-red-900">
            Could not load your portal guide
          </p>
          <p className="mt-1 text-sm text-red-700">{loadError}</p>
          <Button
            variant="primary"
            onClick={handleRetry}
            className="mt-4 min-h-11"
          >
            Try again
          </Button>
        </div>
      )}

      {guide && (
        <>
          {guide.footprintScreens && guide.footprintScreens.length > 0 && (
            <div className="mb-4 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                View mode
              </p>
              <div className="grid grid-cols-2 gap-2 sm:w-auto">
                <Button
                  variant={viewMode === "guided" ? "primary" : "secondary"}
                  className="min-h-10 w-full text-xs sm:w-auto"
                  onClick={() => setViewMode("guided")}
                >
                  Guided wizard
                </Button>
                <Button
                  variant={viewMode === "checklist" ? "primary" : "secondary"}
                  className="min-h-10 w-full text-xs sm:w-auto"
                  onClick={() => setViewMode("checklist")}
                >
                  Full checklist
                </Button>
              </div>
            </div>
          )}
          {guide.footprintScreens &&
            guide.footprintScreens.length > 0 &&
            viewMode === "guided" && (
            <PortalFootprintWizard
              key={form}
              form={guide.form}
              screens={guide.footprintScreens}
              steps={guide.steps}
              initialScreenId={initialScreenId}
            />
            )}
          {(!guide.footprintScreens ||
            guide.footprintScreens.length === 0 ||
            viewMode === "checklist") && (
            <PortalGuideTable
              form={guide.form}
              steps={guide.steps}
              exportUnlocked={exportUnlocked}
              blockExport={mismatchBlock}
              mismatches={draft.mismatchResolved ? [] : ["import-mismatch"]}
            />
          )}
        </>
      )}

      {!guide && !loading && !loadError && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No portal guide available for {form}.
        </div>
      )}

      <FilingActions className="mt-4">
        <Button href="/file/support" variant="secondary" className="w-full sm:w-auto">
          Support & audit trail
        </Button>
        <Button href="/file" variant="ghost" className="w-full sm:w-auto">
          Back to filing
        </Button>
      </FilingActions>
        </div>

        <aside className="companion-summary-rail">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <Accordion defaultValue={[]} multiple>
              <AccordionItem value="how-companion-works" className="border-b-0">
                <AccordionTrigger className="py-2">
                  How companion mode works (3 steps)
                </AccordionTrigger>
                <AccordionContent className="pb-1">
                  <ol className="text-tier-feature space-y-1.5 pl-4 list-decimal">
                    <li>Open incometax.gov.in in a second tab and keep this guide visible.</li>
                    <li>Follow each screen in order, copying only the values we mark.</li>
                    <li>Submit and e-verify on the portal yourself; we do not auto-file.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {effectiveResult?.regime_comparison && (
            <OptimizationTips
              recommendations={effectiveResult.recommendations}
              netPayable={
                effectiveResult.regime_comparison[
                  draft.regime ?? effectiveResult.regime_comparison.recommended_regime
                ].net_payable
              }
              recommendedRegime={effectiveResult.regime_comparison.recommended_regime}
              className="mb-0"
              limit={2}
            />
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-4 card-premium">
            <h4 className="text-sm font-semibold text-slate-900">What this means</h4>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Each row maps to a field on incometax.gov.in. Copy values exactly — typos
              cause validation errors when you submit on the government portal.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-base font-semibold text-slate-900">Filing progress</h2>
            <p className="text-tier-feature mt-1">
              After payment you file on incometax.gov.in yourself.
            </p>
            <div className="mt-3" id="filing-progress">
              <TrackerSteps
                steps={[
                  { label: "Payment", status: "done" },
                  { label: "File on portal", status: "current" },
                  { label: "E-verify", status: "pending" },
                  { label: "Refund", status: "pending" },
                ]}
              />
            </div>
            {effectiveResult?.regime_comparison && (
              <p className="text-tier-feature mt-3">
                <strong>Est. refund:</strong>{" "}
                <span className="tabular-nums">
                  {formatINR(
                    Math.max(
                      0,
                      -effectiveResult.regime_comparison[
                        draft.regime ?? effectiveResult.regime_comparison.recommended_regime
                      ].net_payable
                    )
                  )}
                </span>
              </p>
            )}
          </div>

          <div className="text-xs">
            <Banner variant="info">
              Open{" "}
              <a
                href="https://www.incometax.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline"
              >
                incometax.gov.in
              </a>{" "}
              in another tab alongside this guide.
            </Banner>
          </div>
        </aside>
      </div>
    </FilingLayout>
  );
}
