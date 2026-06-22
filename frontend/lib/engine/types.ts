/** TypeScript types mirroring engine/models.py */

export type ITRForm = "ITR-1" | "ITR-2" | "ITR-3" | "ITR-4";
export type RecommendationRisk = "green" | "yellow" | "red";
export type BusinessTypeCode = "x" | "y" | "z" | "w" | "v";
export type IncomeBand = 1 | 2 | 3 | 4 | 5;
export type FilingMode = "estimate" | "exact";
export type ResidentialStatus = "resident" | "nri" | "rnor";
export type TaxRegime = "old" | "new";

export interface SalaryInput {
  gross_salary: number;
  basic_salary: number;
  hra_received?: number;
  actual_rent_paid?: number;
  city_tier?: "metro" | "non_metro";
  professional_tax?: number;
  lta_claimed?: number;
  perquisites_taxable?: number;
  multiple_employers?: boolean;
  employer_nps_contribution?: number;
}

export interface HousePropertyInput {
  property_type?: "self_occupied" | "let_out" | "none";
  annual_rent_received?: number;
  municipal_tax?: number;
  home_loan_interest?: number;
  home_loan_principal?: number;
  pre_construction_interest?: number;
}

export interface OtherIncomeInput {
  fd_interest?: number;
  savings_account_interest?: number;
  dividend_income?: number;
}

export interface CapitalGainsInput {
  stcg_111a?: number;
  ltcg_112a?: number;
  stcg_other?: number;
  ltcg_other?: number;
  stcl_equity?: number;
  ltcl?: number;
}

export interface DeductionsInput {
  epf?: number;
  ppf?: number;
  elss?: number;
  lic_premium?: number;
  nsc?: number;
  home_loan_principal?: number;
  tuition_fees?: number;
  other_80c?: number;
  health_insurance_self?: number;
  health_insurance_parents?: number;
  parents_senior?: boolean;
  nps_self?: number;
  education_loan_interest?: number;
  rent_paid_no_hra?: number;
  donations_100pct?: number;
  donations_50pct?: number;
  savings_interest_deduction?: number;
  self_disability?: boolean;
  disability_severe?: boolean;
}

export interface TaxPaidInput {
  tds_salary?: number;
  tds_other?: number;
  advance_tax_paid?: number;
  self_assessment_tax_paid?: number;
}

export interface BusinessInput {
  business_type?:
    | "none"
    | "presumptive_business"
    | "presumptive_profession"
    | "regular_books";
  turnover?: number;
  digital_turnover_pct?: number;
  gross_professional_receipts?: number;
  actual_gross_receipts?: number;
  actual_expenses?: number;
  profession_name?: string;
  cash_receipts_pct?: number;
}

export interface ProfileFlags {
  income_band?: IncomeBand;
  business_type_code?: BusinessTypeCode;
  is_director?: boolean;
  has_unlisted_equity?: boolean;
  has_foreign_income?: boolean;
  has_foreign_assets?: boolean;
  tds_deducted_194n?: boolean;
  esop_tax_deferred?: boolean;
  agricultural_income?: number;
}

export interface DocumentFlags {
  has_form16?: boolean;
  has_ais?: boolean;
  has_form26as?: boolean;
  has_bank_interest_cert?: boolean;
  has_home_loan_cert?: boolean;
  has_capital_gains_statement?: boolean;
}

export interface UserInput {
  age: number;
  residential_status?: ResidentialStatus;
  assessment_year?: string;
  mode?: FilingMode;
  late_filing?: boolean;
  salary?: SalaryInput;
  house_property?: HousePropertyInput;
  other_income?: OtherIncomeInput;
  capital_gains?: CapitalGainsInput;
  deductions?: DeductionsInput;
  taxes_paid?: TaxPaidInput;
  business?: BusinessInput;
  profile_flags?: ProfileFlags;
  documents?: DocumentFlags;
}

export interface IncomeHeadsResult {
  gross_salary: number;
  standard_deduction: number;
  hra_exemption: number;
  professional_tax: number;
  lta_exemption: number;
  net_salary_income: number;
  gross_annual_value: number;
  municipal_tax: number;
  net_annual_value: number;
  repair_deduction_30pct: number;
  interest_on_loan_24b: number;
  net_house_property_income: number;
  excess_interest_disallowed: number;
  fd_interest: number;
  savings_interest_gross: number;
  dividend_income: number;
  stcg_other_slab: number;
  total_other_income: number;
  stcg_111a_net: number;
  ltcg_112a_net: number;
  ltcg_other_net: number;
  gross_total_income: number;
  carry_forward_loss_set_off: number;
}

export interface DeductionsResult {
  raw_80c_pool: number;
  capped_80c: number;
  deduction_80d: number;
  deduction_80ccd_1b: number;
  deduction_80ccd_2: number;
  deduction_80e: number;
  deduction_80g: number;
  deduction_80gg: number;
  deduction_80tta_ttb: number;
  deduction_80u: number;
  total_chapter_via: number;
  new_regime_deductions: number;
}

export interface SlabTaxResult {
  regime: TaxRegime;
  taxable_income: number;
  slab_tax: number;
  special_rate_tax: number;
  gross_tax: number;
  rebate_87a: number;
  tax_after_rebate: number;
  surcharge: number;
  surcharge_rate: number;
  marginal_relief: number;
  tax_plus_surcharge: number;
  cess: number;
  total_tax: number;
  tds_and_advance_tax: number;
  net_payable: number;
  late_filing_fee?: number;
}

export interface RegimeComparisonResult {
  old: SlabTaxResult;
  new: SlabTaxResult;
  recommended_regime: TaxRegime;
  tax_saving: number;
  breakeven_deductions: number;
  deductions_lost_in_new: number;
  old_effective_rate: number;
  new_effective_rate: number;
}

export interface RiskFlag {
  code: string;
  severity: "info" | "warning" | "error";
  message: string;
}

export interface BusinessIncomeResult {
  presumptive_44ad: number;
  presumptive_44ada: number;
  books_profit: number;
  net_business_income: number;
  section_used: string;
  presumptive_eligible: boolean;
}

export interface ProfileResult {
  age_group: string;
  is_senior: boolean;
  is_super_senior: boolean;
  new_regime_eligible: boolean;
  old_regime_eligible: boolean;
  itr_form: ITRForm;
  routing_reasons: string[];
  expert_required: boolean;
  out_of_scope_reasons: string[];
}

export interface Recommendation {
  id: string;
  plain_english: string;
  gov_section: string;
  risk: RecommendationRisk;
  proof_required: string[];
  requires_user_confirmation: boolean;
  estimated_benefit: number;
  blocked: boolean;
}

export interface ConfidenceResult {
  completeness_score: number;
  filing_ready: boolean;
  missing_documents: string[];
  ca_escalation_recommended: boolean;
  ca_escalation_reasons: string[];
  is_estimate_mode: boolean;
}

export interface ITRResult {
  assessment_year: string;
  age: number;
  mode: string;
  profile: ProfileResult;
  income_heads: IncomeHeadsResult;
  business_income: BusinessIncomeResult;
  deductions: DeductionsResult;
  regime_comparison: RegimeComparisonResult;
  risk_flags: RiskFlag[];
  recommendations: Recommendation[];
  confidence: ConfidenceResult;
}

export interface ComputeResponse {
  ok: boolean;
  result?: ITRResult;
  handoff?: Record<string, unknown>;
  error?: string;
  code?: string;
  trace?: string;
}

export interface PortalStep {
  step: number;
  portalPage: string;
  fieldLabel: string;
  action: string;
  engineField: string | null;
  plainEnglish: string;
  proofRequired: string[];
  govSection: string;
  ourValue?: string | number | null;
  status?: "pending" | "done" | "mismatch";
}

export type PortalFieldAction = "enter" | "skip" | "deselect" | "select_no" | "verify";

export interface PortalScreenField {
  id?: string;
  label: string;
  ourValueKey: string;
  action: PortalFieldAction;
  copyValue: boolean;
  plainEnglishWhy: string;
  ourValue?: string | number | null;
  whyWeAsk?: string;
  validationTips?: string[];
  screenshotRef?: string;
  itrFormCrossLink?: string;
  govSection?: string;
  skipWhen?: string;
  personalizedWhy?: string;
  hidden?: boolean;
  emphasized?: boolean;
}

export interface PortalFootprintScreen {
  id: string;
  order?: number;
  title: string;
  portalScreenTitle: string;
  portalPath: string;
  fields: PortalScreenField[];
  warnings: string[];
  skipWhen?: string;
  screenTips?: string[];
  screenshotRef?: string;
  personalizedTips?: string[];
  hidden?: boolean;
}

export type PortalForm = "ITR-1" | "ITR-2" | "ITR-3" | "ITR-4";

export interface PortalGuideResponse {
  form: PortalForm;
  steps: PortalStep[];
  footprintScreens?: PortalFootprintScreen[];
  totalSteps: number;
  completedSteps: number;
  hasMismatches: boolean;
}
