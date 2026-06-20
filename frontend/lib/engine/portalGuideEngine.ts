import { fetchPortalGuide, getPortalGuide } from "./client";
import type {
  ITRResult,
  PortalFootprintScreen,
  PortalForm,
  PortalGuideResponse,
  PortalScreenField,
  PortalStep,
  UserInput,
} from "./types";
import type {
  PortalDraftSlice,
  PortalPersonalizationOverlay,
  PortalSopSkipCondition,
} from "@/lib/filing/portalSop";
import { FILING_COMPANION } from "@/lib/copy/filing";

export interface PortalGuideParams {
  form: PortalForm;
  draft: PortalDraftSlice;
  computeResult?: ITRResult;
  userInput?: UserInput;
  completedSteps?: number[];
  mismatches?: string[];
  paymentUnlocked?: boolean;
}

const OLD_REGIME_DEDUCTION_FIELDS = new Set([
  "deductions.capped_80c",
  "deductions.deduction_80d",
  "deductions.deduction_80g",
  "deductions.deduction_80gg",
  "deductions.deduction_80tta_ttb",
]);

function chipIncludes(chips: string[], ...needles: string[]): boolean {
  return needles.some((n) => chips.includes(n));
}

export function buildPersonalizationOverlay(
  draft: PortalDraftSlice,
  options?: { paymentUnlocked?: boolean; computeResult?: ITRResult }
): PortalPersonalizationOverlay {
  const chips = draft.incomeChips ?? [];
  const deductionsClaimed: string[] = [];
  if (draft.deductions.section80C > 0) deductionsClaimed.push("80C");
  if (draft.deductions.section80D > 0) deductionsClaimed.push("80D");
  if (draft.deductions.section80GG > 0) deductionsClaimed.push("80GG");
  if (draft.deductions.npsExtra > 0) deductionsClaimed.push("80CCD(1B)");

  const hasSalary =
    draft.income.grossSalary > 0 || chipIncludes(chips, "salary", "form16");
  const hasCapitalGains = chipIncludes(chips, "capital_gains");
  const hasBusinessIncome = chipIncludes(
    chips,
    "business_presumptive",
    "freelance",
    "business_books"
  );
  const hasHouseProperty = draft.houseProperty.propertyType !== "none";
  const hasForeignIncome = chipIncludes(chips, "foreign_income", "foreign_assets");

  const personalizedTips: string[] = [];
  const regime = draft.regime;

  if (regime === "new") {
    personalizedTips.push(
      "You selected the new tax regime — most Chapter VI-A deductions do not reduce tax. Skip or zero old-regime-only fields on the portal."
    );
  } else if (regime === "old" && deductionsClaimed.length > 0) {
    personalizedTips.push(
      `Old regime with ${deductionsClaimed.join(", ")} claimed — enter capped deduction totals exactly as shown, not raw investment amounts.`
    );
  }

  if (!draft.mismatchResolved) {
    personalizedTips.push(FILING_COMPANION.mismatchWarning);
  }

  if (options?.computeResult?.regime_comparison && regime == null) {
    const rec = options.computeResult.regime_comparison.recommended_regime;
    personalizedTips.push(
      `Engine recommends the ${rec} regime — confirm your portal regime toggle matches before entering deductions.`
    );
  }

  return {
    regime,
    incomeChips: chips,
    deductionsClaimed,
    hasSalary,
    hasCapitalGains,
    hasBusinessIncome,
    hasHouseProperty,
    hasForeignIncome,
    paymentUnlocked: options?.paymentUnlocked ?? Boolean(draft.paymentVerifiedAt),
    mismatchResolved: draft.mismatchResolved,
    recommendedForm: draft.recommendedForm,
    personalizedTips,
  };
}

export function shouldSkipByCondition(
  condition: PortalSopSkipCondition | string | undefined,
  overlay: PortalPersonalizationOverlay
): boolean {
  if (!condition) return false;

  switch (condition as PortalSopSkipCondition) {
    case "no_capital_gains":
      return !overlay.hasCapitalGains;
    case "no_business_income":
      return !overlay.hasBusinessIncome;
    case "no_house_property":
      return !overlay.hasHouseProperty;
    case "new_regime_selected":
      return overlay.regime === "new";
    case "no_foreign_income":
      return !overlay.hasForeignIncome;
    case "no_salary_income":
      return !overlay.hasSalary;
    case "old_regime_only_deduction":
      return overlay.regime === "new";
    default:
      return false;
  }
}

function personalizeField(
  field: PortalScreenField,
  overlay: PortalPersonalizationOverlay
): PortalScreenField | null {
  if (field.hidden) return null;
  if (shouldSkipByCondition(field.skipWhen, overlay)) return null;
  if (
    shouldSkipByCondition("old_regime_only_deduction", overlay) &&
    OLD_REGIME_DEDUCTION_FIELDS.has(field.ourValueKey)
  ) {
    return {
      ...field,
      action: "skip",
      copyValue: false,
      personalizedWhy:
        "New regime selected — this deduction does not reduce your tax. Skip or enter zero on the portal.",
      hidden: false,
      emphasized: false,
    };
  }

  const whyWeAsk = field.whyWeAsk ?? field.plainEnglishWhy;
  let personalizedWhy = field.personalizedWhy;
  let emphasized = field.emphasized ?? false;
  const validationTips = [...(field.validationTips ?? [])];

  if (overlay.regime === "new" && field.ourValueKey.startsWith("deductions.")) {
    if (!personalizedWhy) {
      personalizedWhy =
        "Under the new regime most Chapter VI-A deductions are unavailable — verify the portal field accepts zero.";
    }
    emphasized = field.ourValueKey === "deductions.deduction_80ccd_2";
  }

  if (
    overlay.deductionsClaimed.includes("80C") &&
    field.ourValueKey === "deductions.capped_80c"
  ) {
    validationTips.push("Use our capped ₹1.5L total — not the sum of all ELSS/PPF receipts.");
    emphasized = true;
  }

  if (overlay.hasSalary && field.ourValueKey === "income_heads.gross_salary") {
    validationTips.push("Match Form 16 Part B gross — not net pay or monthly × 12.");
    emphasized = true;
  }

  return {
    ...field,
    whyWeAsk,
    personalizedWhy,
    validationTips: validationTips.length > 0 ? validationTips : field.validationTips,
    emphasized,
  };
}

export function personalizeFootprintScreens(
  screens: PortalFootprintScreen[],
  overlay: PortalPersonalizationOverlay
): PortalFootprintScreen[] {
  return screens
    .filter((screen) => !shouldSkipByCondition(screen.skipWhen, overlay) && !screen.hidden)
    .map((screen) => {
      const fields = screen.fields
        .map((field) => personalizeField(field, overlay))
        .filter((field): field is PortalScreenField => field != null);

      const screenTips = [
        ...(screen.screenTips ?? []),
        ...(screen.id === "deductions" && overlay.regime === "new"
          ? ["New regime: leave old-regime-only deduction schedules blank unless portal requires explicit zero."]
          : []),
        ...(screen.id === "salary" && !overlay.hasSalary
          ? ["No salary in your profile — skip this schedule on the portal if it appears."]
          : []),
      ];

      return {
        ...screen,
        fields,
        screenTips: screenTips.length > 0 ? screenTips : screen.screenTips,
        personalizedTips: overlay.personalizedTips,
        warnings:
          overlay.regime === "new" && screen.id === "deductions"
            ? [
                ...screen.warnings,
                "New regime filers: do not enter 80C/80D expecting tax savings — confirm regime toggle first.",
              ]
            : screen.warnings,
      };
    })
    .filter((screen) => screen.fields.length > 0);
}

export function personalizePortalSteps(
  steps: PortalStep[],
  overlay: PortalPersonalizationOverlay
): PortalStep[] {
  return steps.map((step) => {
    let plainEnglish = step.plainEnglish;
    if (
      overlay.regime === "new" &&
      step.engineField &&
      OLD_REGIME_DEDUCTION_FIELDS.has(step.engineField)
    ) {
      plainEnglish = `${step.plainEnglish} (New regime — this deduction likely does not apply; enter zero or skip.)`;
    }
    return { ...step, plainEnglish };
  });
}

export function applyPersonalizationToGuide(
  guide: PortalGuideResponse,
  overlay: PortalPersonalizationOverlay
): PortalGuideResponse {
  const footprintScreens = guide.footprintScreens
    ? personalizeFootprintScreens(guide.footprintScreens, overlay)
    : undefined;

  return {
    ...guide,
    steps: personalizePortalSteps(guide.steps, overlay),
    footprintScreens,
  };
}

export async function fetchPersonalizedPortalGuide(
  params: PortalGuideParams
): Promise<PortalGuideResponse> {
  return fetchPortalGuide(
    params.form,
    params.computeResult,
    params.completedSteps ?? [],
    params.mismatches ?? [],
    params.userInput,
    {
      draft: params.draft,
      paymentUnlocked: params.paymentUnlocked,
    }
  );
}

export async function fetchStaticPortalGuide(
  form: PortalForm
): Promise<PortalGuideResponse> {
  return getPortalGuide(form);
}

export function draftToPortalSlice(
  draft: Pick<
    PortalDraftSlice,
    | "regime"
    | "incomeChips"
    | "recommendedForm"
    | "mismatchResolved"
    | "paidPlanId"
    | "paymentVerifiedAt"
    | "income"
    | "houseProperty"
    | "deductions"
  >
): PortalDraftSlice {
  return {
    regime: draft.regime,
    incomeChips: draft.incomeChips,
    recommendedForm: draft.recommendedForm,
    mismatchResolved: draft.mismatchResolved,
    paidPlanId: draft.paidPlanId,
    paymentVerifiedAt: draft.paymentVerifiedAt,
    income: draft.income,
    houseProperty: draft.houseProperty,
    deductions: draft.deductions,
  };
}
