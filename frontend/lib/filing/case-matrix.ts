export type IncomeBand = "1" | "2" | "3" | "4" | "5";
export type AgeBand = "a" | "b" | "c" | "d" | "e";
export type BusinessType = "x" | "y" | "z" | "w" | "v";

export interface CaseMatrix {
  income: IncomeBand;
  age: AgeBand;
  business: BusinessType;
}

export interface FormRecommendation {
  form: string;
  caseId: string;
  expert: boolean;
  reason: string;
}

export function incomeBandFromGross(gross: number): IncomeBand {
  if (gross > 5_000_000) return "5";
  if (gross > 2_500_000) return "4";
  if (gross > 1_000_000) return "3";
  if (gross > 500_000) return "2";
  return "1";
}

function higherIncomeBand(a: IncomeBand, b: IncomeBand): IncomeBand {
  return Number(a) >= Number(b) ? a : b;
}

export function resolveRecommendedForm(
  matrix: CaseMatrix,
  chips: Set<string>,
  grossSalary?: number
): FormRecommendation {
  const { income, age, business } = matrix;
  const effectiveIncome =
    grossSalary !== undefined && grossSalary > 0
      ? higherIncomeBand(income, incomeBandFromGross(grossSalary))
      : income;

  const hasBusiness =
    business === "v" ||
    business === "w" ||
    chips.has("business_presumptive") ||
    chips.has("freelance");

  const hasComplexNonBusiness =
    chips.has("capital_gains") ||
    chips.has("foreign") ||
    chips.has("director") ||
    business === "z" ||
    effectiveIncome === "5" ||
    (grossSalary !== undefined && grossSalary > 50_00_000);

  if (age === "e") {
    return {
      form: "BLOCK",
      caseId: `BLOCK-${effectiveIncome}${age}-${business}`,
      expert: true,
      reason: "Minor — income clubbed with parent",
    };
  }
  
  if (business === "v") {
    return {
      form: "ITR-3",
      caseId: `ITR3-${effectiveIncome}${age}-${business}`,
      expert: true,
      reason: "Business with books / audit",
    };
  }

  if (hasBusiness && hasComplexNonBusiness) {
    return {
      form: "ITR-3",
      caseId: `ITR3-${effectiveIncome}${age}-${business}-complex`,
      expert: true,
      reason: "Business income plus capital gains/foreign income/large income requires ITR-3",
    };
  }

  if (hasBusiness) {
    return {
      form: "ITR-4",
      caseId: `ITR4-${effectiveIncome}${age}-${business}`,
      expert: false,
      reason: "Presumptive taxation — Section 44AD/44ADA may apply",
    };
  }

  if (hasComplexNonBusiness) {
    return {
      form: "ITR-2",
      caseId: `ITR2-${effectiveIncome}${age}-${business}`,
      expert: false,
      reason: "Capital gains, foreign income, or income above ₹50L",
    };
  }

  return {
    form: "ITR-1",
    caseId: `ITR1-${effectiveIncome}${age}-${business}`,
    expert: false,
    reason: "Salaried profile within ITR-1 limits",
  };
}

export function getItrPathReasons(
  rec: FormRecommendation,
  matrix: CaseMatrix
): string[] {
  if (rec.form === "ITR-1") {
    return [
      "Salary + bank interest only",
      "No capital gains or foreign assets",
      "Income under ₹50 lakh",
      "Not a company director",
    ];
  }
  return [
    rec.reason,
    `Income band ${matrix.income} · Age ${matrix.age}`,
    `Business type ${matrix.business}`,
    "Lawful optimization only — no blocked claims",
  ];
}

export function getWhyNotItr3(rec: FormRecommendation): string {
  if (rec.form === "ITR-1") {
    return "Business with books of accounts or audit cases need ITR-3.";
  }
  if (rec.form === "ITR-2") {
    return "Pure salaried cases with only salary and interest can use ITR-1.";
  }
  return "ITR-3 is for business income with books of accounts.";
}
