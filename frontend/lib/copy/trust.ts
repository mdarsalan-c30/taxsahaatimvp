/** Shared trust, escalation, and why-we-ask copy — Phase 6. */

export const AI_ASSISTED_POSITIONING =
  "AI-assisted ITR prep — you file and submit on incometax.gov.in yourself.";

export const AI_ASSISTED_TAGLINE =
  "Prepare your return with AI, then file on the government portal yourself.";

export const NO_CA_REPLACEMENT =
  "Not a substitute for professional advice on complex cases (business books, foreign assets, litigation).";

export const COMPLEX_CASE_ESCALATION_TITLE = "This needs a tax professional";

export const COMPLEX_CASE_ESCALATION_BODY =
  "Business books, foreign income or assets, director returns, or income above ₹50L usually need a CA or tax expert. We help with simpler salaried returns — you still submit on incometax.gov.in.";

export const CA_REVIEW_COMING_SOON =
  "CA Review is launching soon — optional human review before you file on the government portal.";

export const ESCALATION_CTA_PRIMARY = "Explore CA Review";
export const ESCALATION_CTA_SECONDARY = "Continue self-file anyway";

export const SELF_FILE_ELIGIBLE = "Self-file eligible with our guide";
export const COMPLEX_CASE_FLAG = "Complex case — professional help recommended";

/** Short why-we-ask hints for data-entry screens. */
export const WHY_WE_ASK = {
  profileIncome:
    "Income type decides which ITR form the law requires — wrong form triggers notices.",
  salaryConfirm:
    "We'll match salary and TDS against government records before you file — mismatches are the #1 cause of refund delays.",
  deductions:
    "Deductions reduce tax only in the old regime and only with proof — the portal validates totals.",
  regime:
    "You choose old or new regime once per year — it changes every deduction and slab downstream.",
  import:
    "Upload what you have now — you can always add AIS or other documents later.",
} as const;
