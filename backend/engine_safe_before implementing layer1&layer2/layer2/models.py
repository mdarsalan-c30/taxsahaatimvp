"""
models.py — ITR Engine data contracts
======================================
All input and output dataclasses for Layer 1 (deterministic tax math)
and Layer 2 (LLM-powered deduction discovery).

Rules implemented: FY 2025-26 / AY 2026-27
-------------------------------------------
This is the filing year that is "current" as of mid-2026. Key year-specific
provisions baked into this version:
  - New regime slabs: 0/5/10/15/20/25/30% at 4L/8L/12L/16L/20L/24L bands
    (Finance Act 2025 / Budget Feb-2025)
  - New regime 87A rebate: nil tax up to ₹12,00,000 total income, with
    marginal relief above that (Finance Act 2025)
  - Standard deduction ₹75,000 (new) / ₹50,000 (old) (Finance Act 2024)
  - STCG 111A 20%, LTCG 112A 12.5% with ₹1,25,000 exemption,
    LTCG (other assets) 12.5% without indexation (Finance Act 2024,
    effective for all transfers in FY2025-26)
  - 80CCD(2) employer NPS: 14% of basic under new regime (Finance Act 2024);
    10% (private) / 14% (central govt) of basic under old regime

If a different assessment_year is supplied, the engine still runs but
raises an informational risk flag noting that AY2025-26 (FY2024-25) used
different new-regime slabs (3L-15L bands, ₹7L rebate threshold) and a
15%/10% STCG/LTCG-112A split rate depending on transfer date — neither of
which is modelled here.

Conventions
-----------
- All monetary fields are in INR (₹), full rupees, as floats.
- Omitted fields default to 0 / False — only age and salary are required.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Literal, Optional


# ═══════════════════════════════════════════════════════════════
#  INPUT MODELS
# ═══════════════════════════════════════════════════════════════

@dataclass
class SalaryInput:
    gross_salary: float                                      # total from Form 16 Part-B
    basic_salary: float                                      # needed for HRA calculation
    hra_received: float = 0.0                                # HRA component in salary slip
    actual_rent_paid: float = 0.0                            # annual rent paid
    city_tier: Literal["metro", "non_metro"] = "non_metro"  # metro = Delhi/Mumbai/Chennai/Kolkata
    professional_tax: float = 0.0                            # Sec 16(iii) — OLD REGIME ONLY
    lta_claimed: float = 0.0                                 # LTA exemption (old regime only)
    perquisites_taxable: float = 0.0                         # taxable perquisites from Form 16
    multiple_employers: bool = False                         # triggers Form 12B flag
    employer_nps_contribution: float = 0.0                   # 80CCD(2) — both regimes, see cap rates
    is_central_govt_employee: bool = False                   # raises old-regime 80CCD(2) cap to 14%


@dataclass
class HousePropertyInput:
    property_type: Literal["self_occupied", "let_out", "none"] = "none"
    annual_rent_received: float = 0.0       # let-out only
    home_loan_interest: float = 0.0         # annual interest (bank certificate)
    home_loan_principal: float = 0.0        # annual principal (auto-added to 80C pool)
    pre_construction_interest: float = 0.0  # 1/5th per year from year of completion


@dataclass
class OtherIncomeInput:
    fd_interest: float = 0.0               # gross, before TDS
    savings_account_interest: float = 0.0  # all accounts combined
    dividend_income: float = 0.0


@dataclass
class CapitalGainsInput:
    stcg_111a: float = 0.0    # listed equity/eq-MF short-term → 20% flat
    ltcg_112a: float = 0.0    # listed equity/eq-MF long-term → 12.5% above ₹1.25L
    stcg_other: float = 0.0   # debt MF etc. (any holding period, post FA-2023) → slab rate
    ltcg_other: float = 0.0   # non-equity LTCG (property/gold/unlisted) → 12.5%, no indexation
    stcl_equity: float = 0.0  # short-term loss (enter as positive number)
    ltcl: float = 0.0         # long-term loss (enter as positive number)


@dataclass
class DeductionsInput:
    # 80C pool — combined cap ₹1,50,000
    epf: float = 0.0
    ppf: float = 0.0
    elss: float = 0.0
    lic_premium: float = 0.0
    nsc: float = 0.0
    home_loan_principal: float = 0.0   # if not already in HousePropertyInput
    tuition_fees: float = 0.0          # children's school fees, max 2 children
    other_80c: float = 0.0             # Sukanya, SCSS, tax-saver FD, etc.
    # Standalone deductions
    health_insurance_self: float = 0.0      # 80D: self + spouse + children
    health_insurance_parents: float = 0.0   # 80D: parents
    parents_senior: bool = False            # raises parents 80D cap to ₹50k
    nps_self: float = 0.0                   # 80CCD(1B): additional NPS, cap ₹50k
    education_loan_interest: float = 0.0    # 80E: no cap, first 8 years only
    donations_100pct: float = 0.0           # 80G: PM Relief etc.
    donations_50pct: float = 0.0            # 80G: approved charities (50% applied)
    savings_interest_deduction: float = 0.0 # raw amount; engine caps via 80TTA/TTB
    self_disability: bool = False           # 80U: enables disability deduction
    disability_severe: bool = False         # 80U: ₹75k → ₹1.25L


@dataclass
class TaxPaidInput:
    tds_salary: float = 0.0              # Form 16 Part-A
    tds_other: float = 0.0              # FD/dividend TDS from Form 26AS
    advance_tax_paid: float = 0.0
    self_assessment_tax_paid: float = 0.0


@dataclass
class DocumentFlags:
    has_form16: bool = False
    has_ais: bool = False
    has_form26as: bool = False
    has_bank_interest_cert: bool = False
    has_home_loan_cert: bool = False
    has_capital_gains_statement: bool = False


@dataclass
class UserInput:
    """Complete input for both layers. Only age and salary are required."""
    age: int
    residential_status: Literal["resident", "nri", "rnor"] = "resident"
    assessment_year: str = "2026-27"
    mode: Literal["estimate", "exact"] = "estimate"

    salary: SalaryInput = field(
        default_factory=lambda: SalaryInput(gross_salary=0, basic_salary=0)
    )
    house_property: HousePropertyInput = field(default_factory=HousePropertyInput)
    other_income: OtherIncomeInput = field(default_factory=OtherIncomeInput)
    capital_gains: CapitalGainsInput = field(default_factory=CapitalGainsInput)
    deductions: DeductionsInput = field(default_factory=DeductionsInput)
    taxes_paid: TaxPaidInput = field(default_factory=TaxPaidInput)
    documents: DocumentFlags = field(default_factory=DocumentFlags)


# ═══════════════════════════════════════════════════════════════
#  LAYER 1 RESULT MODELS
# ═══════════════════════════════════════════════════════════════

@dataclass
class IncomeHeadsResult:
    # ── Old-regime view (canonical "headline" figures) ──
    gross_salary: float
    standard_deduction: float
    hra_exemption: float
    professional_tax: float
    lta_exemption: float
    net_salary_income: float
    gross_annual_value: float
    municipal_tax: float
    net_annual_value: float
    repair_deduction_30pct: float
    interest_on_loan_24b: float
    net_house_property_income: float
    excess_interest_disallowed: float
    fd_interest: float
    savings_interest_gross: float
    dividend_income: float
    stcg_other_slab: float
    total_other_income: float
    stcg_111a_net: float
    ltcg_112a_net: float
    ltcg_other_net: float
    gross_total_income: float                    # = GTI under OLD regime
    carry_forward_loss_set_off: float

    # ── New-regime view (independent computation — NOT derived from above) ──
    net_salary_income_new_regime: float
    net_house_property_income_new_regime: float
    gross_total_income_new_regime: float          # = GTI under NEW regime


@dataclass
class DeductionsResult:
    raw_80c_pool: float
    capped_80c: float
    deduction_80d: float
    deduction_80ccd_1b: float
    deduction_80ccd_2: float
    deduction_80e: float
    deduction_80g: float
    deduction_80tta_ttb: float
    deduction_80u: float
    total_chapter_via: float
    new_regime_deductions: float                  # = 80CCD(2) under new regime


@dataclass
class SlabTaxResult:
    regime: Literal["old", "new"]
    taxable_income: float
    slab_tax: float
    special_rate_tax: float
    gross_tax: float
    rebate_87a: float
    tax_after_rebate: float
    surcharge: float
    surcharge_rate: float
    marginal_relief: float          # surcharge-threshold marginal relief applied
    tax_plus_surcharge: float
    cess: float
    total_tax: float
    tds_and_advance_tax: float
    net_payable: float              # positive = pay, negative = refund


@dataclass
class RegimeComparisonResult:
    old: SlabTaxResult
    new: SlabTaxResult
    recommended_regime: Literal["old", "new"]
    tax_saving: float
    breakeven_deductions: float
    deductions_lost_in_new: float
    old_effective_rate: float
    new_effective_rate: float


@dataclass
class RiskFlag:
    code: str
    severity: Literal["info", "warning", "error"]
    message: str


@dataclass
class ConfidenceResult:
    completeness_score: float
    filing_ready: bool
    missing_documents: list[str]
    ca_escalation_recommended: bool
    ca_escalation_reasons: list[str]
    is_estimate_mode: bool


@dataclass
class ITRResult:
    """Output of compute_itr(). Contains full Layer 1 computation."""
    assessment_year: str
    age: int
    mode: str
    income_heads: IncomeHeadsResult
    deductions: DeductionsResult
    regime_comparison: RegimeComparisonResult
    risk_flags: list[RiskFlag]
    confidence: ConfidenceResult

    @property
    def recommended_regime(self) -> str:
        return self.regime_comparison.recommended_regime

    @property
    def net_payable(self) -> float:
        r = self.regime_comparison
        return r.old.net_payable if r.recommended_regime == "old" else r.new.net_payable


# ═══════════════════════════════════════════════════════════════
#  LAYER 2 MODELS
# ═══════════════════════════════════════════════════════════════

@dataclass
class Question:
    """A targeted question generated by Stage 1 of Layer 2."""
    question_id: str
    section: str
    deduction_name: str
    question: str
    why_asking: str
    max_saving_estimate: float
    answer_type: Literal["yes_no", "amount", "yes_no_with_amount", "multiple_choice"]
    follow_up_if_yes: Optional[str] = None
    options: Optional[list[str]] = None
    regime_note: Optional[str] = None


@dataclass
class QuestionAnswer:
    """User's response to a single Layer 2 question."""
    question_id: str
    section: str
    answered: bool
    answer_yes: Optional[bool] = None
    answer_amount: Optional[float] = None
    answer_choice: Optional[str] = None


@dataclass
class ResolvedDeduction:
    """A deduction verified and computed by Stage 2 of Layer 2."""
    section: str
    deduction_name: str
    confirmed: bool
    declared_amount: float
    capped_at: Optional[float]
    final_deduction: float
    old_regime_tax_impact: float
    new_regime_tax_impact: float
    citation: str
    conditions_verified: list[str]
    conditions_unverified: list[str]
    conditions_failed: list[str]
    note: str
    regime_changes_recommendation: bool


@dataclass
class OptimisationSuggestion:
    """A missed opportunity or headroom alert from Layer 2."""
    category: str
    observation: str
    suggestion: str
    estimated_saving: float
    section: Optional[str] = None
    priority: Literal["high", "medium", "low"] = "medium"


@dataclass
class Layer2Result:
    """Full output of the Layer 2 pipeline."""
    # Stage 1
    profile_summary: str
    questions: list[Question]
    ruled_out: list[dict]
    total_potential_saving: float
    # Stage 2
    answers: list[QuestionAnswer]
    resolved_deductions: list[ResolvedDeduction]
    optimisation_suggestions: list[OptimisationSuggestion]
    revised_old_regime_tax: float
    revised_new_regime_tax: float
    revised_recommended_regime: Literal["old", "new"]
    additional_saving_found: float
    questions_asked: int
    questions_answered: int
    deductions_confirmed: int
    ca_review_still_recommended: bool
    llm_model_used: str


@dataclass
class FullITRResult:
    """Combined output of both layers. This is what the website consumes."""
    layer1: ITRResult
    layer2: Optional[Layer2Result] = None

    @property
    def recommended_regime(self) -> str:
        if self.layer2:
            return self.layer2.revised_recommended_regime
        return self.layer1.recommended_regime

    @property
    def final_tax(self) -> float:
        if self.layer2:
            r = self.layer2
            return r.revised_old_regime_tax if r.revised_recommended_regime == "old" \
                   else r.revised_new_regime_tax
        return self.layer1.regime_comparison.old.total_tax \
               if self.layer1.recommended_regime == "old" \
               else self.layer1.regime_comparison.new.total_tax

    @property
    def total_saving_found(self) -> float:
        return self.layer2.additional_saving_found if self.layer2 else 0.0
