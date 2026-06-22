import type { BusinessType } from "@/lib/filing/case-matrix";
import { incomeBandFromGross } from "@/lib/filing/case-matrix";
import type { DraftState } from "@/lib/store/draft";
import type { BusinessInput, CapitalGainsInput, ProfileFlags, UserInput } from "./types";

const CAP_80TTB = 50_000;

function ageFromBand(band: DraftState["profile"]["ageBand"]): number {
  switch (band) {
    case "senior":
      return 65;
    case "super_senior":
      return 82;
    default:
      return 32;
  }
}

function incomeBandFromMatrix(
  band: DraftState["matrix"]["income"],
  grossSalary: number
): 1 | 2 | 3 | 4 | 5 {
  const fromMatrix = Number(band);
  const matrixBand =
    fromMatrix >= 1 && fromMatrix <= 5 ? (fromMatrix as 1 | 2 | 3 | 4 | 5) : 2;
  if (grossSalary <= 0) return matrixBand;
  const fromSalary = Number(incomeBandFromGross(grossSalary)) as 1 | 2 | 3 | 4 | 5;
  return fromSalary > matrixBand ? fromSalary : matrixBand;
}

function isSeniorAgeBand(band: DraftState["profile"]["ageBand"]): boolean {
  return band === "senior" || band === "super_senior";
}

function scaleByOwnership(amount: number, coOwnerPercent: number): number {
  const share = Math.min(100, Math.max(1, coOwnerPercent || 100)) / 100;
  return Math.round(amount * share);
}

/** Minimal non-zero placeholder so profiler routes ITR-2 in estimate mode. */
const CG_ESTIMATE_PLACEHOLDER = 1;

function businessTypeCodeFromDraft(
  matrixBusiness: BusinessType,
  incomeChips: string[]
): BusinessType {
  if (matrixBusiness !== "x") return matrixBusiness;
  if (
    incomeChips.includes("freelance") ||
    incomeChips.includes("business_presumptive")
  ) {
    return "w";
  }
  if (incomeChips.includes("capital_gains")) {
    return "z";
  }
  return matrixBusiness;
}

function businessFromChips(
  matrixBusiness: BusinessType,
  incomeChips: string[]
): BusinessInput | undefined {
  if (matrixBusiness === "v") {
    return {
      business_type: "regular_books",
      actual_gross_receipts: 0,
      actual_expenses: 0,
    };
  }
  if (incomeChips.includes("business_presumptive") || matrixBusiness === "w") {
    return {
      business_type: "presumptive_business",
      turnover: CG_ESTIMATE_PLACEHOLDER,
      digital_turnover_pct: 1,
    };
  }
  if (incomeChips.includes("freelance")) {
    return {
      business_type: "presumptive_profession",
      gross_professional_receipts: CG_ESTIMATE_PLACEHOLDER,
    };
  }
  return undefined;
}

function capitalGainsFromChips(incomeChips: string[]): CapitalGainsInput | undefined {
  if (!incomeChips.includes("capital_gains")) return undefined;
  return { stcg_other: CG_ESTIMATE_PLACEHOLDER };
}

function profileFlagsFromDraft(
  matrix: DraftState["matrix"],
  incomeChips: string[],
  grossSalary: number
): ProfileFlags {
  return {
    income_band: incomeBandFromMatrix(matrix.income, grossSalary),
    business_type_code: businessTypeCodeFromDraft(matrix.business, incomeChips),
    is_director: incomeChips.includes("director"),
    has_foreign_income: incomeChips.includes("foreign"),
    has_foreign_assets: incomeChips.includes("foreign"),
  };
}

function housePropertyToInput(
  hp: DraftState["houseProperty"]
): UserInput["house_property"] | undefined {
  if (hp.propertyType === "none") return undefined;

  const share = hp.coOwnerPercent;
  if (hp.propertyType === "let_out") {
    return {
      property_type: "let_out",
      annual_rent_received: scaleByOwnership(hp.annualRent, share),
      municipal_tax: scaleByOwnership(hp.municipalTax, share),
      home_loan_interest: scaleByOwnership(hp.homeLoanInterest, share),
    };
  }

  return {
    property_type: "self_occupied",
    home_loan_interest: scaleByOwnership(hp.homeLoanInterest, share),
  };
}

export function draftToUserInput(draft: Pick<
  DraftState,
  | "filingMode"
  | "profile"
  | "matrix"
  | "incomeChips"
  | "income"
  | "houseProperty"
  | "deductions"
  | "connectedConnectors"
>): UserInput {
  const age = ageFromBand(draft.profile.ageBand);
  const gross = draft.income.grossSalary;
  const basic = Math.round(gross * 0.5);
  const hasForm16 = draft.connectedConnectors.includes("form16");
  const fdInterest = draft.income.fdInterest;

  const salary: UserInput["salary"] = {
    gross_salary: gross,
    basic_salary: basic,
  };
  if (draft.income.hraReceived > 0) {
    salary.hra_received = draft.income.hraReceived;
  }
  if (draft.income.actualRentPaid > 0) {
    salary.actual_rent_paid = draft.income.actualRentPaid;
    salary.city_tier = draft.income.cityTier;
  }

  const deductions: UserInput["deductions"] = {
    epf: draft.deductions.section80C,
    health_insurance_self: draft.deductions.section80D,
    nps_self: draft.deductions.npsExtra,
  };

  if (draft.deductions.section80GG > 0) {
    deductions.rent_paid_no_hra = draft.deductions.section80GG;
  }

  if (isSeniorAgeBand(draft.profile.ageBand) && fdInterest > 0) {
    deductions.savings_interest_deduction = Math.min(fdInterest, CAP_80TTB);
  }

  const housePropertyInput = housePropertyToInput(draft.houseProperty);
  const capitalGainsInput = capitalGainsFromChips(draft.incomeChips);
  const businessInput = businessFromChips(draft.matrix.business, draft.incomeChips);
  const profileFlags = profileFlagsFromDraft(
    draft.matrix,
    draft.incomeChips,
    draft.income.grossSalary
  );

  return {
    age,
    mode: draft.filingMode,
    residential_status:
      draft.profile.residentialStatus === "non_resident" ? "nri" : draft.profile.residentialStatus,
    assessment_year: "2025-26",
    late_filing: draft.profile.lateFiling ?? false,
    salary,
    ...(housePropertyInput ? { house_property: housePropertyInput } : {}),
    ...(capitalGainsInput ? { capital_gains: capitalGainsInput } : {}),
    ...(businessInput ? { business: businessInput } : {}),
    other_income: {
      fd_interest: fdInterest,
    },
    deductions,
    taxes_paid: {
      tds_salary: draft.income.tds,
      advance_tax_paid: draft.income.advanceTax,
      self_assessment_tax_paid: draft.income.selfAssessmentTax,
    },
    profile_flags: profileFlags,
    documents: {
      has_form16: hasForm16,
      ...(draft.incomeChips.includes("capital_gains")
        ? { has_capital_gains_statement: true }
        : {}),
    },
  };
}
