"""
profiler.py
===========
Classifies the taxpayer, routes ITR form (1/2/3/4), validates scope constraints.
"""

from __future__ import annotations

from models import UserInput, ProfileResult, ITRForm

ITR1_INCOME_CAP = 50_00_000
ITR1_LTCG_112A_CAP = 125_000
ITR1_AGRI_CAP = 5_000


def classify_age_group(age: int) -> str:
    if age < 18:
        return "below_18"
    if age < 21:
        return "18_to_20"
    if age < 25:
        return "21_to_24"
    if age < 30:
        return "25_to_29"
    if age < 35:
        return "30_to_34"
    if age < 45:
        return "35_to_44"
    if age < 60:
        return "45_to_59"
    if age < 80:
        return "senior_60_to_79"
    return "super_senior_80_plus"


def age_band_code(age: int) -> str:
    """Case matrix age codes a–e."""
    if age < 18:
        return "e"
    if age < 60:
        return "a"
    if age < 65:
        return "b"
    if age < 80:
        return "c"
    return "d"


def _has_capital_gains(user: UserInput) -> bool:
    cg = user.capital_gains
    return any([
        cg.stcg_111a > 0,
        cg.ltcg_112a > 0,
        cg.stcg_other > 0,
        cg.ltcg_other > 0,
        cg.stcl_equity > 0,
        cg.ltcl > 0,
    ])


def _itr1_exclusions(user: UserInput) -> list[str]:
    """Official ITR-1 SAHAJ exclusion rules (AY 2026-27 form)."""
    reasons: list[str] = []
    pf = user.profile_flags
    if pf.is_director:
        reasons.append("Director in a company — ITR-1 not permitted")
    if pf.has_unlisted_equity:
        reasons.append("Unlisted equity share investments — ITR-1 not permitted")
    if pf.tds_deducted_194n:
        reasons.append("TDS u/s 194N (cash withdrawal) — ITR-1 not permitted")
    if pf.esop_tax_deferred:
        reasons.append("ESOP tax deferral — ITR-1 not permitted")
    if pf.has_foreign_income or pf.has_foreign_assets:
        reasons.append("Foreign income/assets — ITR-1 not permitted; use ITR-2+")
    if _has_capital_gains(user):
        cg = user.capital_gains
        # ITR-1 allows LTCG 112A up to ₹1.25L only
        if cg.stcg_111a > 0 or cg.stcg_other > 0 or cg.ltcg_other > 0:
            reasons.append("Capital gains other than LTCG 112A — ITR-2 required")
        elif cg.ltcg_112a > ITR1_LTCG_112A_CAP:
            reasons.append(f"LTCG 112A exceeds ₹{ITR1_LTCG_112A_CAP:,} — ITR-2 required")
    if pf.agricultural_income > ITR1_AGRI_CAP:
        reasons.append(f"Agricultural income exceeds ₹{ITR1_AGRI_CAP:,} — ITR-2 required")
    return reasons


def _estimate_total_income(user: UserInput) -> float:
    gross = user.salary.gross_salary
    other = (
        user.other_income.fd_interest
        + user.other_income.savings_account_interest
        + user.other_income.dividend_income
    )
    cg = (
        user.capital_gains.stcg_111a
        + user.capital_gains.ltcg_112a
        + user.capital_gains.stcg_other
        + user.capital_gains.ltcg_other
    )
    biz = 0.0
    b = user.business
    if b.business_type == "presumptive_business":
        biz = b.turnover * 0.08
    elif b.business_type == "presumptive_profession":
        biz = b.gross_professional_receipts * 0.50
    elif b.business_type == "regular_books":
        biz = max(0.0, b.actual_gross_receipts - b.actual_expenses)
    return gross + other + cg + biz


def route_itr_form(user: UserInput) -> tuple[ITRForm, list[str], bool]:
    """
    Returns (itr_form, routing_reasons, expert_required).
    Decision tree from CASE_MATRIX.md + official ITR-1 exclusions.
    """
    reasons: list[str] = []
    expert = False
    pf = user.profile_flags
    btc = pf.business_type_code
    biz = user.business

    # Business type routing (case matrix codes)
    if btc == "v" or biz.business_type == "regular_books":
        reasons.append("Business with regular books of account — ITR-3")
        expert = True
        return "ITR-3", reasons, expert

    if btc == "w" or biz.business_type in ("presumptive_business", "presumptive_profession"):
        reasons.append("Presumptive business/profession — ITR-4 (44AD/44ADA)")
        return "ITR-4", reasons, expert

    # Capital gains / foreign / director exclusions → ITR-2
    exclusions = _itr1_exclusions(user)
    total_income = _estimate_total_income(user)

    if exclusions:
        reasons.extend(exclusions)
        return "ITR-2", reasons, expert

    if total_income > ITR1_INCOME_CAP or pf.income_band >= 5:
        reasons.append(f"Total income exceeds ₹{ITR1_INCOME_CAP:,} — ITR-2 required")
        if total_income > ITR1_INCOME_CAP:
            expert = True
        return "ITR-2", reasons, expert

    if btc == "z":
        reasons.append("Salaried with capital gains — ITR-2")
        return "ITR-2", reasons, expert

    # Default: pure salaried / salaried + FD interest
    reasons.append("Resident salaried with income ≤ ₹50L — ITR-1 SAHAJ")
    return "ITR-1", reasons, expert


def build_profile(user: UserInput) -> ProfileResult:
    out_of_scope: list[str] = []

    if user.residential_status in ("nri", "rnor"):
        out_of_scope.append(
            "NRI/RNOR cases are not supported in this version. "
            "Foreign income and DTAA treatment require Layer-2 handling."
        )

    if user.age < 18:
        out_of_scope.append(
            "Minor taxpayer (age < 18): income is clubbed with parent. "
            "This scenario is out of scope for the standalone engine."
        )

    is_senior = user.age >= 60
    is_super_senior = user.age >= 80
    new_regime_eligible = user.residential_status == "resident"
    old_regime_eligible = True

    itr_form, routing_reasons, expert_required = route_itr_form(user)

    return ProfileResult(
        age_group=classify_age_group(user.age),
        is_senior=is_senior,
        is_super_senior=is_super_senior,
        new_regime_eligible=new_regime_eligible,
        old_regime_eligible=old_regime_eligible,
        itr_form=itr_form,
        routing_reasons=routing_reasons,
        expert_required=expert_required,
        out_of_scope_reasons=out_of_scope,
    )
