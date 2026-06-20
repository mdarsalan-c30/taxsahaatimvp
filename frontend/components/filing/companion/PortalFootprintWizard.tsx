"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  HelpCircle,
  Monitor,
} from "lucide-react";
import type {
  PortalFieldAction,
  PortalFootprintScreen,
  PortalForm,
  PortalStep,
} from "@/lib/engine/types";
import { fetchAiExplain } from "@/lib/ai/client";
import { buildExplainFallback } from "@/lib/ai/explainFallback";
import {
  buildPortalSectionRoadmap,
  portalSectionForScreen,
} from "@/lib/engine/portalSections";
import { trackEvent } from "@/lib/analytics";
import { displayValue } from "@/lib/format";
import { Button } from "@/components/filing/ui";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface PortalFootprintWizardProps {
  form: PortalForm;
  screens: PortalFootprintScreen[];
  steps?: PortalStep[];
  /** Optional portal screenshot URL — falls back to placeholder when omitted */
  portalScreenshotUrl?: string;
  /** Deep-link entry: open on the first screen of this footprint screen id. */
  initialScreenId?: string;
}

function actionLabel(action: PortalFieldAction): string {
  switch (action) {
    case "enter":
      return "Enter this";
    case "skip":
      return "Skip this";
    case "deselect":
      return "Deselect this";
    case "select_no":
      return "Select No";
    case "verify":
      return "Verify on portal";
    default: {
      const exhaustiveCheck: never = action;
      return exhaustiveCheck;
    }
  }
}

function actionClass(action: PortalFieldAction): string {
  switch (action) {
    case "enter":
      return "bg-emerald-100 text-emerald-700";
    case "skip":
      return "bg-slate-100 text-slate-700";
    case "deselect":
      return "bg-amber-100 text-amber-800";
    case "select_no":
      return "bg-red-100 text-red-700";
    case "verify":
      return "bg-blue-100 text-blue-800";
    default: {
      const exhaustiveCheck: never = action;
      return exhaustiveCheck;
    }
  }
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function PortalScreenshot({
  url,
  alt,
  imageClassName,
  className,
}: {
  url: string;
  alt: string;
  imageClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full aspect-[4/3]", className)}>
      <Image
        src={url}
        alt={alt}
        fill
        unoptimized
        sizes="(max-width: 1024px) 100vw, 280px"
        className={cn(
          "rounded-xl border border-slate-200 object-cover shadow-sm",
          imageClassName
        )}
      />
    </div>
  );
}

export function PortalFootprintWizard({
  form,
  screens,
  steps = [],
  portalScreenshotUrl,
  initialScreenId,
}: PortalFootprintWizardProps) {
  const [screenIndex, setScreenIndex] = useState(() => {
    if (!initialScreenId) return 0;
    const idx = screens.findIndex((s) => s.id === initialScreenId);
    return idx >= 0 ? idx : 0;
  });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [screenHelpText, setScreenHelpText] = useState<string | null>(null);
  const [screenHelpLoading, setScreenHelpLoading] = useState(false);
  const visitedScreenIds = useRef(new Set<string>());
  const wizardCompletedFired = useRef(false);
  const currentScreen = screens[screenIndex];

  const sectionRoadmap = useMemo(
    () => buildPortalSectionRoadmap(screens),
    [screens]
  );
  const currentSectionId = useMemo(
    () => (currentScreen ? portalSectionForScreen(currentScreen).id : null),
    [currentScreen]
  );

  const pasteFields = useMemo(
    () => currentScreen.fields.filter((field) => field.action === "enter"),
    [currentScreen.fields]
  );
  const verifyFields = useMemo(
    () => currentScreen.fields.filter((field) => field.action === "verify"),
    [currentScreen.fields]
  );
  const enterCount = pasteFields.length;

  const fieldGovSections = useMemo(() => {
    const lookup = new Map<string, string>();
    const currentPortalLabel = normalizeText(currentScreen.portalScreenTitle);

    for (const field of currentScreen.fields) {
      const fieldLabel = normalizeText(field.label);
      const exactMatch = steps.find(
        (step) =>
          normalizeText(step.fieldLabel) === fieldLabel &&
          currentPortalLabel.includes(normalizeText(step.portalPage))
      );
      const fallbackMatch =
        exactMatch ??
        steps.find((step) => normalizeText(step.fieldLabel) === fieldLabel);

      if (fallbackMatch?.govSection) {
        lookup.set(field.label, fallbackMatch.govSection);
      }
    }

    return lookup;
  }, [currentScreen.fields, currentScreen.portalScreenTitle, steps]);

  useEffect(() => {
    if (screens.length === 0) return;

    const screen = screens[screenIndex];
    if (!screen) return;

    trackEvent("companion_footprint_step_viewed", {
      form,
      screenId: screen.id,
      screenIndex,
    });

    for (const field of screen.fields) {
      trackEvent("companion_field_action", {
        form,
        screenId: screen.id,
        fieldLabel: field.label,
        action: field.action,
        hadCopyValue: Boolean(field.copyValue && field.ourValue != null),
      });
    }

    visitedScreenIds.current.add(screen.id);

    if (
      !wizardCompletedFired.current &&
      visitedScreenIds.current.size === screens.length
    ) {
      wizardCompletedFired.current = true;
      trackEvent("companion_wizard_completed", {
        form,
        screenCount: screens.length,
      });
    }
  }, [form, screenIndex, screens]);

  const handleScreenHelp = useCallback(async () => {
    const screen = screens[screenIndex];
    if (!screen) return;

    trackEvent("companion_field_confusion", {
      form,
      screenId: screen.id,
      reason: "help",
    });

    setScreenHelpLoading(true);
    setScreenHelpText(null);

    const staticFallback = buildExplainFallback({
      type: "companion",
      context: {
        stepTitle: screen.title,
        portalField: screen.portalScreenTitle,
      },
    }).explanation;

    try {
      const response = await fetchAiExplain({
        type: "companion",
        context: {
          stepTitle: screen.title,
          portalField: screen.portalScreenTitle,
          screenTips: screen.screenTips,
        },
      });
      setScreenHelpText(response.explain.explanation);
    } catch {
      setScreenHelpText(staticFallback);
    } finally {
      setScreenHelpLoading(false);
    }
  }, [form, screenIndex, screens]);

  useEffect(() => {
    setScreenHelpText(null);
  }, [screenIndex]);

  if (screens.length === 0 || !currentScreen) return null;

  const canGoBack = screenIndex > 0;
  const canGoNext = screenIndex < screens.length - 1;

  const handleCopy = async (fieldLabel: string, value: string | number | null | undefined) => {
    if (value === null || value === undefined) return;
    await navigator.clipboard.writeText(String(value));
    setCopiedKey(fieldLabel);
    trackEvent("companion_field_copy", {
      form,
      screenId: currentScreen.id,
      fieldLabel,
    });
    setTimeout(() => setCopiedKey(null), 1200);
  };

  const handleWrongField = (fieldLabel: string) => {
    trackEvent("companion_field_confusion", {
      form,
      screenId: currentScreen.id,
      fieldLabel,
      reason: "wrong_field",
    });
  };

  return (
    <section className="card-premium mb-0 p-4 sm:p-5">
      <div className="filing-step-indicator" aria-hidden>
        {screens.map((screen, index) => (
          <div
            key={`wizard-seg-${screen.id}`}
            data-active={index === screenIndex}
            data-done={index < screenIndex}
            className="filing-step-segment"
          />
        ))}
      </div>

      {sectionRoadmap.length > 1 && (
        <nav className="mt-4" aria-label="ITR portal sections">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            incometax.gov.in flow
          </p>
          <ol className="flex flex-wrap gap-1.5">
            {sectionRoadmap.map((entry) => {
              const active = entry.section.id === currentSectionId;
              return (
                <li key={entry.section.id}>
                  <button
                    type="button"
                    onClick={() => setScreenIndex(entry.firstScreenIndex)}
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-slate-200 text-slate-600 hover:border-primary/30 hover:text-primary"
                    )}
                  >
                    {entry.section.label}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      <div className="mb-4 mt-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Digital footprint · {form}
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
            {currentScreen.title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {currentScreen.portalScreenTitle}
          </p>
          <p className="mt-1 text-xs text-slate-500">{currentScreen.portalPath}</p>
          {(currentScreen.personalizedTips?.length ?? 0) > 0 && (
            <ul className="mt-2 space-y-1 rounded-lg border border-blue-100 bg-blue-50/80 px-3 py-2 text-xs text-blue-900">
              {currentScreen.personalizedTips!.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary">
          Screen {screenIndex + 1} of {screens.length}
        </span>
      </div>

      <div className="mb-4 lg:hidden">
        {portalScreenshotUrl ? (
          <PortalScreenshot
            url={portalScreenshotUrl}
            alt={`${currentScreen.portalScreenTitle} on incometax.gov.in`}
          />
        ) : (
          <div className="filing-portal-preview">
            <Monitor className="mb-2 size-8 text-slate-300" aria-hidden />
            <p className="text-xs font-medium text-slate-600">
              Portal preview
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              Screenshot of this screen on incometax.gov.in will appear here
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] xl:items-start">
        <div
          className={cn(
            "grid gap-3",
            currentScreen.fields.length > 1
              ? "md:grid-cols-2"
              : "grid-cols-1"
          )}
        >
          {currentScreen.fields.map((field) => (
            <div
              key={`${currentScreen.id}-${field.id ?? field.label}`}
              className={cn(
                "rounded-xl border border-slate-200 p-3",
                field.emphasized && "border-primary/30 bg-blue-50/40",
                currentScreen.fields.length === 1 && "md:col-span-2"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{field.label}</h3>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    actionClass(field.action)
                  )}
                >
                  {actionLabel(field.action)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Your number</p>
                  <p className="font-mono text-sm font-semibold text-slate-900">
                    {displayValue(field.ourValue)}
                  </p>
                </div>
                {field.copyValue && field.ourValue != null && (
                  <button
                    type="button"
                    onClick={() => handleCopy(field.label, field.ourValue)}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-primary"
                  >
                    {copiedKey === field.label ? (
                      <>
                        <Check className="size-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        Copy value
                      </>
                    )}
                  </button>
                )}
              </div>
              <Collapsible className="mt-3">
                <CollapsibleTrigger className="min-h-9 rounded-md border-slate-100 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700">
                  Learn more about this field
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  {(field.whyWeAsk ?? field.plainEnglishWhy) && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Why we ask
                      </p>
                      <p className="text-xs text-slate-700">
                        {field.whyWeAsk ?? field.plainEnglishWhy}
                      </p>
                    </div>
                  )}
                  {field.personalizedWhy && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                        For your return
                      </p>
                      <p className="text-xs text-amber-900">{field.personalizedWhy}</p>
                    </div>
                  )}
                  {(field.validationTips?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Validation tips
                      </p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-slate-700">
                        {field.validationTips!.map((tip) => (
                          <li key={tip}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(field.itrFormCrossLink ?? fieldGovSections.get(field.label)) && (
                    <p className="text-[11px] text-slate-500">
                      Government reference:{" "}
                      <span className="font-semibold text-slate-700">
                        {field.itrFormCrossLink ?? fieldGovSections.get(field.label)}
                      </span>
                    </p>
                  )}
                </CollapsibleContent>
              </Collapsible>
              <button
                type="button"
                onClick={() => handleWrongField(field.label)}
                className="mt-2 text-[11px] font-medium text-slate-500 underline decoration-dotted underline-offset-2 hover:text-amber-800"
              >
                I entered this in the wrong field
              </button>
            </div>
          ))}
        </div>

        <aside className="flex flex-col self-start rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4 xl:sticky xl:top-14">
          <div className="mb-3 hidden xl:block">
            {portalScreenshotUrl ? (
              <PortalScreenshot
                url={portalScreenshotUrl}
                alt={`${currentScreen.portalScreenTitle} on incometax.gov.in`}
                imageClassName="rounded-lg"
              />
            ) : (
              <div className="filing-portal-preview aspect-[5/4]">
                <Monitor className="mb-2 size-7 text-slate-300" aria-hidden />
                <p className="text-[11px] font-medium text-slate-600">
                  Portal preview
                </p>
              </div>
            )}
          </div>
          <h3 className="text-sm font-semibold text-slate-900">This screen checklist</h3>
          <p className="mt-1 text-xs text-slate-600">
            Enter {enterCount} value{enterCount === 1 ? "" : "s"} on this portal screen.
          </p>
          {pasteFields.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                Copy this exactly:
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-slate-700">
                {pasteFields.map((field) => (
                  <li key={`paste-${field.id ?? field.label}`}>{field.label}</li>
                ))}
              </ul>
            </div>
          )}
          {verifyFields.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                Double-check this:
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-slate-700">
                {verifyFields.map((field) => (
                  <li key={`verify-${field.id ?? field.label}`}>{field.label}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={() => void handleScreenHelp()}
            disabled={screenHelpLoading}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-primary/30 hover:text-primary disabled:opacity-60"
          >
            <HelpCircle className="size-3.5" />
            {screenHelpLoading ? "Loading help…" : "Need help with this screen?"}
          </button>
          {screenHelpText && (
            <p className="mt-2 rounded-lg border border-slate-200 bg-white p-2.5 text-xs leading-relaxed text-slate-700">
              {screenHelpText}
            </p>
          )}
          <div className="mt-3 space-y-2">
            {(currentScreen.screenTips?.length ?? 0) > 0 && (
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="text-xs">
                  Screen tips
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg border border-slate-200 bg-white p-2.5">
                  <ul className="list-disc space-y-1 pl-4 text-xs text-slate-700">
                    {currentScreen.screenTips!.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            )}
            <Collapsible>
              <CollapsibleTrigger className="text-xs">
                Why this screen matters
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 rounded-lg border border-slate-200 bg-white p-2.5">
                <ul className="space-y-1.5 text-xs text-slate-700">
                  <li>
                    This screen contributes directly to your taxable income and final
                    refund estimate.
                  </li>
                  {currentScreen.fields.slice(0, 2).map((field) => (
                    <li key={`${currentScreen.id}-why-${field.label}`}>
                      {field.label}: {field.plainEnglishWhy}
                    </li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
            <Collapsible>
              <CollapsibleTrigger className="text-xs">
                Common mistakes on this screen
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {currentScreen.warnings.map((warning) => (
                  <div
                    key={warning}
                    className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900"
                  >
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    <span>{warning}</span>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </aside>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-between">
        <Button
          variant="secondary"
          onClick={() => setScreenIndex((idx) => Math.max(0, idx - 1))}
          disabled={!canGoBack}
          className="w-full sm:w-auto"
        >
          <ChevronLeft className="mr-1 size-4" />
          ← Back
        </Button>
        <Button
          variant="primary"
          onClick={() =>
            setScreenIndex((idx) => Math.min(screens.length - 1, idx + 1))
          }
          disabled={!canGoNext}
          className="w-full sm:w-auto"
        >
          Next Step →
        </Button>
      </div>
    </section>
  );
}
