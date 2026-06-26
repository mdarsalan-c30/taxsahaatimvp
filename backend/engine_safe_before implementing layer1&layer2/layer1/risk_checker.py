"""
risk_checker.py
===============
Generates risk flags and CA escalation triggers from the computed ITR data.
Returns a list of RiskFlag objects.

Flag codes
----------
INCOME_ABOVE_50L       : complex return; CA review recommended
MULTI_EMPLOYER         : multiple Form 16s — reconciliation needed
CAPITAL_GAINS_PRESENT  : ensure correct ITR form (ITR-2)
TDS_MISMATCH           : declared income vs estimated TDS doesn't reconcile
80C_OVERSHOT           : 80C pool exceeds ₹1.5L cap (user over-declared)
HOME_LOAN_INTEREST_CAP : interest > ₹2L for SOP — excess disallowed
MISSING_FORM16         : primary document absent → estimate mode forced
MISSING_AIS            : AIS not uploaded — mismatch risk
MISSING_26AS           : 26AS not uploaded — TDS verification impossible
MISSING_CG_STATEMENT   : capital gains declared but no statement uploaded
SAVINGS_INT_REMINDER   : savings interest > ₹10k — 80TTA auto-applied
ADVANCE_TAX_CHECK      : taxable income > ₹2.5L and no advance tax paid
LTCG_EXEMPTION_APPLIED : LTCG 112A > ₹1.25L — exemption used, verify grandfathering
ESTIMATE_MODE_WARNING  : result is planning estimate, not filing-ready
"""

from __future__ import annotations
from models import (
    UserInput, RiskFlag, IncomeHeadsResult,
    DeductionsResult, RegimeComparisonResult,
)


def run_risk_checks(
    user: UserInput,
    income: IncomeHeadsResult,
    deductions: DeductionsResult,
    comparison: RegimeComparisonResult,
) -> list[RiskFlag]:
    flags: list[RiskFlag] = []

    def flag(code, severity, msg):
        flags.append(RiskFlag(code=code, severity=severity, message=msg))

    # ── Mode warning ──
    if user.mode == "estimate":
        flag(
            "ESTIMATE_MODE_WARNING", "warning",
            "Result is a planning estimate only. Values are approximate and "
            "cannot be used for filing. Switch to Exact Mode and upload "
            "supporting documents before filing."
        )

    # ── High income ──
    if income.gross_total_income > 50_00_000:
        flag(
            "INCOME_ABOVE_50L", "info",
            f"Total income ₹{income.gross_total_income:,.0f} exceeds ₹50 lakh. "
            "CA review is strongly recommended for surcharge computation "
            "and regime optimisation."
        )

    # ── Multiple employers ──
    if user.salary.multiple_employers:
        flag(
            "MULTI_EMPLOYER", "warning",
            "Multiple employers detected. Ensure all Form 16s are collated "
            "and Form 12B was submitted to the current employer. "
            "Aggregate TDS may be under-deducted."
        )

    # ── Capital gains — ITR form check ──
    cg = user.capital_gains
    has_cg = any([
        cg.stcg_111a, cg.ltcg_112a, cg.stcg_other, cg.ltcg_other,
        cg.stcl_equity, cg.ltcl,
    ])
    if has_cg:
        flag(
            "CAPITAL_GAINS_PRESENT", "info",
            "Capital gains are present. ITR-2 is required (not ITR-1). "
            "Ensure broker / CAMS capital gain statement is available."
        )
        if not user.documents.has_capital_gains_statement:
            flag(
                "MISSING_CG_STATEMENT", "warning",
                "Capital gains declared but no capital gain statement uploaded. "
                "Download from CAMS, KFintech, Zerodha, or Groww before filing."
            )
        if cg.ltcg_112a > 125_000:
            flag(
                "LTCG_EXEMPTION_APPLIED", "info",
                f"LTCG 112A of ₹{cg.ltcg_112a:,.0f} exceeds the ₹1,25,000 exemption. "
                "Gains above this threshold are taxed at 12.5%. Verify "
                "acquisition dates and grandfathering (Jan 31 2018 NAV)."
            )

    # ── 80C overshot ──
    if deductions.raw_80c_pool > 150_000:
        excess = deductions.raw_80c_pool - 150_000
        flag(
            "80C_OVERSHOT", "warning",
            f"80C investments total ₹{deductions.raw_80c_pool:,.0f} but the cap is "
            f"₹1,50,000. ₹{excess:,.0f} is not deductible. "
            "Consider redirecting excess to 80CCD(1B) NPS (additional ₹50,000)."
        )

    # ── Home loan interest cap ──
    if income.excess_interest_disallowed > 0:
        flag(
            "HOME_LOAN_INTEREST_CAP", "info",
            f"Home loan interest of ₹{income.interest_on_loan_24b:,.0f} exceeds "
            f"the ₹2,00,000 SOP cap. ₹{income.excess_interest_disallowed:,.0f} "
            "is disallowed. If property is actually let-out, declare it as such "
            "to claim full interest."
        )

    # ── Missing documents ──
    if not user.documents.has_form16:
        flag(
            "MISSING_FORM16", "error",
            "Form 16 is not uploaded. This is the primary salary document "
            "and is mandatory for exact-mode filing. "
            "Obtain Part A and Part B from your employer."
        )
    if not user.documents.has_ais:
        flag(
            "MISSING_AIS", "warning",
            "Annual Information Statement (AIS) not uploaded. "
            "The income tax department cross-checks AIS against your return. "
            "Download from incometax.gov.in > Services > AIS."
        )
    if not user.documents.has_form26as:
        flag(
            "MISSING_26AS", "warning",
            "Form 26AS not uploaded. TDS credit verification is impossible "
            "without this. Download from TRACES / incometax.gov.in."
        )

    # ── TDS rough reconciliation ──
    total_tds = user.taxes_paid.tds_salary + user.taxes_paid.tds_other
    # Rough check: if net payable (recommended regime) is very high relative to TDS,
    # flag possible under-deduction
    net_pay_recommended = (
        comparison.old.net_payable
        if comparison.recommended_regime == "old"
        else comparison.new.net_payable
    )
    if net_pay_recommended > 10_000 and total_tds == 0:
        flag(
            "TDS_MISMATCH", "warning",
            f"Estimated tax payable is ₹{net_pay_recommended:,.0f} but no TDS "
            "has been recorded. Verify Form 16 / 26AS. If this is a new "
            "employer or freelance scenario, advance tax may be due."
        )

    # ── Advance tax ──
    taxable = (
        comparison.old.taxable_income
        if comparison.recommended_regime == "old"
        else comparison.new.taxable_income
    )
    if taxable > 250_000 and user.taxes_paid.advance_tax_paid == 0 and total_tds < 5_000:
        flag(
            "ADVANCE_TAX_CHECK", "info",
            "Taxable income exceeds ₹2.5 lakh but no advance tax has been "
            "recorded. If TDS does not fully cover your liability, interest "
            "u/s 234B and 234C may apply."
        )

    # ── Savings interest deduction reminder ──
    if (
        not comparison.old  # only in old regime context
        and user.other_income.savings_account_interest > 10_000
    ):
        flag(
            "SAVINGS_INT_REMINDER", "info",
            f"Savings account interest ₹{user.other_income.savings_account_interest:,.0f} "
            "exceeds ₹10,000. 80TTA deduction of ₹10,000 has been applied automatically "
            "(old regime). Ensure this matches your bank passbook."
        )

    return flags
