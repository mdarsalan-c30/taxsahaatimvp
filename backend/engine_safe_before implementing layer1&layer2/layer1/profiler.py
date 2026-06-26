"""
profiler.py
===========
Classifies the taxpayer and validates scope constraints for the salaried engine.
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Literal

from models import UserInput


@dataclass
class ProfileResult:
    age_group: str
    is_senior: bool          # age ≥ 60
    is_super_senior: bool    # age ≥ 80
    new_regime_eligible: bool
    old_regime_eligible: bool
    itr_form: Literal["ITR-1", "ITR-2"]
    out_of_scope_reasons: list[str]   # non-empty → engine should soft-block


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


def _needs_itr2(user: UserInput) -> bool:
    """ITR-2 is needed if capital gains are present; else ITR-1 suffices."""
    cg = user.capital_gains
    return any([
        cg.stcg_111a > 0,
        cg.ltcg_112a > 0,
        cg.stcg_other > 0,
        cg.ltcg_other > 0,
        cg.stcl_equity > 0,
        cg.ltcl > 0,
    ])


def build_profile(user: UserInput) -> ProfileResult:
    out_of_scope: list[str] = []

    # Hard out-of-scope checks
    if user.residential_status in ("nri", "rnor"):
        out_of_scope.append(
            "NRI/RNOR cases are not supported in this version. "
            "Foreign income and DTAA treatment require Layer-2 handling."
        )

    if user.age < 18:
        out_of_scope.append(
            "Minor taxpayer (age < 18): income is clubbed with parent. "
            "This scenario is out of scope for the standalone salaried engine."
        )

    # Senior flags
    is_senior = user.age >= 60
    is_super_senior = user.age >= 80

    # Super-senior citizens cannot opt for new regime
    # (Budget 2024: new regime is available to all residents; super-seniors included)
    new_regime_eligible = user.residential_status == "resident"
    old_regime_eligible = True  # always available unless NRI (handled above)

    # ITR form
    itr_form: Literal["ITR-1", "ITR-2"] = "ITR-2" if _needs_itr2(user) else "ITR-1"

    # ITR-1 income limit check: gross salary + other income ≤ ₹50L
    if itr_form == "ITR-1":
        gross = user.salary.gross_salary
        other = (
            user.other_income.fd_interest
            + user.other_income.savings_account_interest
            + user.other_income.dividend_income
        )
        if gross + other > 50_00_000:
            itr_form = "ITR-2"  # upgrade silently

    return ProfileResult(
        age_group=classify_age_group(user.age),
        is_senior=is_senior,
        is_super_senior=is_super_senior,
        new_regime_eligible=new_regime_eligible,
        old_regime_eligible=old_regime_eligible,
        itr_form=itr_form,
        out_of_scope_reasons=out_of_scope,
    )
