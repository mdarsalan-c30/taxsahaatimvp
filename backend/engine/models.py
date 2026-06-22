"""
models.py
=========
All dataclasses for the ITR Layer-1 engine (salaried scope).

Conventions
-----------
- All monetary amounts are in INR (₹), full rupees (no paise), as floats.
- None means "not provided / not applicable". The engine treats None as 0
  where a zero makes sense, and raises ValueError where the field is mandatory.
- AY is fixed to 2025-26 (FY 2024-25) for this version.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Literal, Optional, Union

ITRForm = Literal["ITR-1", "ITR-2", "ITR-3", "ITR-4"]
RecommendationRisk = Literal["green", "yellow", "red"]
BusinessTypeCode = Literal["x", "y", "z", "w", "v"]
IncomeBand = Literal[1, 2, 3, 4, 5]


# ─────────────────────────────────────────────
#  INPUT MODEL
# ─────────────────────────────────────────────

@dataclass
class SalaryInput:
    gross_salary: float                  # total salary from Form 16 Part-B
    basic_salary: float                  # needed for HRA calc
    hra_received: float = 0.0            # HRA component in salary
    actual_rent_paid: float = 0.0        # annual rent paid by employee
    city_tier: Literal["metro", "non_metro"] = "non_metro"
    professional_tax: float = 0.0        # usually ₹2,400 p.a.
    lta_claimed: float = 0.0             # LTA exemption claimed
    perquisites_taxable: float = 0.0     # taxable perquisites from Form 16
    multiple_employers: bool = False     # if True → flag for Form 12B reconciliation
    employer_nps_contribution: float = 0.0  # 80CCD(2): up to 10% of basic, both regimes


@dataclass
class HousePropertyInput:
    property_type: Literal["self_occupied", "let_out", "none"] = "none"
    annual_rent_received: float = 0.0
    municipal_tax: float = 0.0           # property tax paid — deductible from GAV (let-out)
    home_loan_interest: float = 0.0      # annual interest (bank certificate)
    home_loan_principal: float = 0.0     # annual principal (goes into 80C pool)
    pre_construction_interest: float = 0.0  # 1/5th per year, claimed over 5 yrs


@dataclass
class OtherIncomeInput:
    fd_interest: float = 0.0
    savings_account_interest: float = 0.0
    dividend_income: float = 0.0


@dataclass
class CapitalGainsInput:
    # Equity / equity-MF (listed)
    stcg_111a: float = 0.0               # taxed at 15% (pre Jul-2024) / 20%
    ltcg_112a: float = 0.0               # taxed at 10% (pre Jul-2024) / 12.5%
    # Debt MF / other assets
    stcg_other: float = 0.0              # taxed at slab rate
    ltcg_other: float = 0.0              # taxed at 20% with indexation
    # Losses (for set-off, positive numbers)
    stcl_equity: float = 0.0
    ltcl: float = 0.0


@dataclass
class DeductionsInput:
    # ── 80C pool (capped at ₹1,50,000 combined) ──
    epf: float = 0.0
    ppf: float = 0.0
    elss: float = 0.0
    lic_premium: float = 0.0
    nsc: float = 0.0
    home_loan_principal: float = 0.0     # pulled from HousePropertyInput automatically
    tuition_fees: float = 0.0
    other_80c: float = 0.0

    # ── Standalone deductions ──
    health_insurance_self: float = 0.0   # 80D self+spouse+kids
    health_insurance_parents: float = 0.0  # 80D parents
    parents_senior: bool = False          # True → 80D parents limit = ₹50,000

    nps_self: float = 0.0                # 80CCD(1B) additional NPS (max ₹50,000)

    education_loan_interest: float = 0.0  # 80E (no cap, only for 8 yrs)

    # 80GG — rent paid when no HRA received. Supply the annual rent paid;
    # engine applies the statutory least-of-three cap. Old regime only.
    rent_paid_no_hra: float = 0.0

    # 80G donations — engine applies 50% qualifying limit by default
    donations_100pct: float = 0.0        # donations with 100% deduction (PM Relief etc.)
    donations_50pct: float = 0.0         # donations with 50% deduction

    # 80TTA / 80TTB (savings interest) — engine picks correct one by age
    savings_interest_deduction: float = 0.0  # supply the raw amount; engine caps it

    # Disability
    self_disability: bool = False
    disability_severe: bool = False       # True → ₹1,25,000 else ₹75,000 (80U)


@dataclass
class TaxPaidInput:
    tds_salary: float = 0.0             # Form 16 Part-A
    tds_other: float = 0.0              # 26AS: FD TDS, dividend TDS, etc.
    advance_tax_paid: float = 0.0
    self_assessment_tax_paid: float = 0.0


@dataclass
class BusinessInput:
    """
    Business/profession income for ITR-3 (books) or ITR-4 (presumptive).
    business_type_code maps to CASE_MATRIX: w=presumptive, v=books.
    """
    business_type: Literal[
        "none", "presumptive_business", "presumptive_profession", "regular_books"
    ] = "none"
    turnover: float = 0.0                    # 44AD — gross receipts/turnover
    digital_turnover_pct: float = 0.0          # share eligible for 6% rate (44AD)
    gross_professional_receipts: float = 0.0   # 44ADA
    actual_gross_receipts: float = 0.0         # ITR-3 books — revenue
    actual_expenses: float = 0.0               # ITR-3 books — expenses
    profession_name: str = ""                  # e.g. doctor, lawyer
    cash_receipts_pct: float = 0.0             # >5% cash → 44AD/44ADA not allowed


@dataclass
class ProfileFlags:
    """Case-matrix dimensions and ITR-1 exclusion flags from official form."""
    income_band: IncomeBand = 2
    business_type_code: BusinessTypeCode = "x"
    is_director: bool = False
    has_unlisted_equity: bool = False
    has_foreign_income: bool = False
    has_foreign_assets: bool = False
    tds_deducted_194n: bool = False            # cash withdrawal TDS — ITR-1 excluded
    esop_tax_deferred: bool = False
    agricultural_income: float = 0.0           # ITR-1 allows up to ₹5,000


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
    # Identity
    age: int
    residential_status: Literal["resident", "nri", "rnor"] = "resident"
    assessment_year: str = "2025-26"
    mode: Literal["estimate", "exact"] = "estimate"
    late_filing: bool = False

    # Income blocks
    salary: SalaryInput = field(default_factory=lambda: SalaryInput(gross_salary=0, basic_salary=0))
    house_property: HousePropertyInput = field(default_factory=HousePropertyInput)
    other_income: OtherIncomeInput = field(default_factory=OtherIncomeInput)
    capital_gains: CapitalGainsInput = field(default_factory=CapitalGainsInput)

    # Deductions
    deductions: DeductionsInput = field(default_factory=DeductionsInput)

    # Taxes already paid
    taxes_paid: TaxPaidInput = field(default_factory=TaxPaidInput)

    # Business / profession (ITR-3 / ITR-4)
    business: BusinessInput = field(default_factory=BusinessInput)

    # Case matrix + ITR routing flags
    profile_flags: ProfileFlags = field(default_factory=ProfileFlags)

    # Documents
    documents: DocumentFlags = field(default_factory=DocumentFlags)

    def document_flags_dict(self) -> dict:
        """Returns document availability as a plain dict (used by confidence.py)."""
        d = self.documents
        return {
            "has_form16": d.has_form16,
            "has_ais": d.has_ais,
            "has_form26as": d.has_form26as,
            "has_bank_interest_cert": d.has_bank_interest_cert,
            "has_home_loan_cert": d.has_home_loan_cert,
            "has_capital_gains_statement": d.has_capital_gains_statement,
        }


# ─────────────────────────────────────────────
#  RESULT MODELS
# ─────────────────────────────────────────────

@dataclass
class IncomeHeadsResult:
    # Salary
    gross_salary: float
    standard_deduction: float
    hra_exemption: float
    professional_tax: float
    lta_exemption: float
    net_salary_income: float             # taxable salary head

    # House property
    gross_annual_value: float
    municipal_tax: float
    net_annual_value: float
    repair_deduction_30pct: float
    interest_on_loan_24b: float
    net_house_property_income: float     # can be negative (loss)
    excess_interest_disallowed: float    # amount above ₹2L SOP cap

    # Other income
    fd_interest: float
    savings_interest_gross: float
    dividend_income: float
    stcg_other_slab: float               # at slab rate
    total_other_income: float            # excluding special-rate CG

    # Capital gains (special rate)
    stcg_111a_net: float                 # after loss set-off
    ltcg_112a_net: float                 # after exemption
    ltcg_other_net: float

    # Totals
    gross_total_income: float            # before deductions
    carry_forward_loss_set_off: float


@dataclass
class DeductionsResult:
    # 80C
    raw_80c_pool: float
    capped_80c: float                    # min(pool, 1_50_000)

    # Standalone
    deduction_80d: float
    deduction_80ccd_1b: float
    deduction_80ccd_2: float             # employer NPS — allowed in both regimes
    deduction_80e: float
    deduction_80g: float
    deduction_80gg: float                # rent paid, no HRA (old regime only)
    deduction_80tta_ttb: float
    deduction_80u: float

    total_chapter_via: float             # sum used in old regime only
    new_regime_deductions: float         # std deduction + 80CCD(2) only


@dataclass
class SlabTaxResult:
    regime: Literal["old", "new"]
    taxable_income: float                # after applicable deductions
    slab_tax: float                      # tax on normal income
    special_rate_tax: float              # STCG/LTCG at flat rates
    gross_tax: float                     # slab + special
    rebate_87a: float
    tax_after_rebate: float
    surcharge: float
    surcharge_rate: float
    marginal_relief: float
    tax_plus_surcharge: float
    cess: float
    total_tax: float                     # after cess
    tds_and_advance_tax: float
    net_payable: float                   # positive = pay, negative = refund
    late_filing_fee: float = 0.0


@dataclass
class RegimeComparisonResult:
    old: SlabTaxResult
    new: SlabTaxResult
    recommended_regime: Literal["old", "new"]
    tax_saving: float                    # how much saved by choosing recommended
    breakeven_deductions: float          # old regime breakeven point
    deductions_lost_in_new: float        # chapter VI-A amount forfeited
    old_effective_rate: float            # % of GTI
    new_effective_rate: float


@dataclass
class RiskFlag:
    code: str
    severity: Literal["info", "warning", "error"]
    message: str


@dataclass
class BusinessIncomeResult:
    presumptive_44ad: float = 0.0
    presumptive_44ada: float = 0.0
    books_profit: float = 0.0
    net_business_income: float = 0.0
    section_used: str = ""                     # "44AD", "44ADA", "books", or ""
    presumptive_eligible: bool = False


@dataclass
class ProfileResult:
    age_group: str = ""
    is_senior: bool = False
    is_super_senior: bool = False
    new_regime_eligible: bool = True
    old_regime_eligible: bool = True
    itr_form: ITRForm = "ITR-1"
    routing_reasons: list[str] = field(default_factory=list)
    expert_required: bool = False
    out_of_scope_reasons: list[str] = field(default_factory=list)


@dataclass
class Recommendation:
    id: str
    plain_english: str
    gov_section: str
    risk: RecommendationRisk
    proof_required: list[str]
    requires_user_confirmation: bool
    estimated_benefit: float = 0.0             # approximate tax saving in ₹
    blocked: bool = False                      # True for red/non-compliant suggestions


@dataclass
class ConfidenceResult:
    completeness_score: float            # 0–100
    filing_ready: bool
    missing_documents: list[str]
    ca_escalation_recommended: bool
    ca_escalation_reasons: list[str]
    is_estimate_mode: bool


@dataclass
class ITRResult:
    """Top-level result returned by orchestrator.compute_itr()"""
    assessment_year: str
    age: int
    mode: str

    profile: ProfileResult
    income_heads: IncomeHeadsResult
    business_income: BusinessIncomeResult
    deductions: DeductionsResult
    regime_comparison: RegimeComparisonResult
    risk_flags: list[RiskFlag]
    recommendations: list[Recommendation]
    confidence: ConfidenceResult

    # Convenience shortcuts
    @property
    def itr_form(self) -> str:
        return self.profile.itr_form

    # Convenience shortcuts
    @property
    def recommended_regime(self) -> str:
        return self.regime_comparison.recommended_regime

    @property
    def net_payable(self) -> float:
        r = self.regime_comparison
        if r.recommended_regime == "old":
            return r.old.net_payable
        return r.new.net_payable
